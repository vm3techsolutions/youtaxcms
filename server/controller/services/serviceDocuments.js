const db = require("../../config/db");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../../config/aws");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const SIGNED_URL_EXPIRY = 3600;

// Helper → Generate Signed URL
const generateSignedUrl = async (fileUrl) => {
  try {
    const baseUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
    const fileKey = fileUrl.replace(baseUrl, "");

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    return await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY });
  } catch (err) {
    console.error("❌ Error generating signed URL:", err);
    return null;
  }
};

/**
 * Create a new service document. Only Admin (role_id 4) can create.
 */
/**
 * Create a new service document. Only Admin (role_id 4) can create. Document code must be unique per service.
 * @param {import('express').Request} req Express request object, expects req.user.id and req.body fields
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const createServiceDocument = async (req, res) => {
  try {
    const { service_id, doc_code, doc_name, doc_type, is_mandatory, allow_multiple } = req.body;
    const created_by = req.user ? req.user.id : null;

    if (!service_id || !doc_code || !doc_name) {
      return res.status(400).json({ message: "Service ID, Document Code, and Document Name are required" });
    }

    // Admin validation
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [created_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can create service documents" });
    }

    // Check duplicate doc_code for same service
    const [existing] = await db.query(
      "SELECT id FROM service_documents WHERE service_id = ? AND doc_code = ?",
      [service_id, doc_code]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Document code already exists for this service" });
    }

    // Get max sort_order for this service
    const [maxSort] = await db.query(
      "SELECT MAX(sort_order) AS max_order FROM service_documents WHERE service_id = ?",
      [service_id]
    );
    const sort_order = (maxSort[0].max_order || 0) + 1;

    const sql = `
      INSERT INTO service_documents 
      (service_id, doc_code, doc_name, doc_type, is_mandatory, allow_multiple, sort_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      service_id,
      doc_code,
      doc_name,
      doc_type || "other",
      is_mandatory ?? true,
      allow_multiple ?? false,
      sort_order,
    ]);

    res.status(201).json({ message: "Service document created successfully", id: result.insertId });
  } catch (err) {
    console.error("DB Error (createServiceDocument):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all documents for a service_id
 */
/**
 * Get all documents for a specific service, ordered by sort order and creation date.
 * @param {import('express').Request} req Express request object, expects req.params.serviceId
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getDocumentsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    console.log("Fetching documents for serviceId:", serviceId);
    
    const sql = "SELECT * FROM service_documents WHERE service_id = ? ORDER BY sort_order ASC, created_at ASC";
    const [results] = await db.query(sql, [serviceId]);

       const documents = await Promise.all(
      results.map(async (doc) => {
        let sampleSignedUrl = null;

        if (doc.sample_pdf_url) {
          sampleSignedUrl = await generateSignedUrl(doc.sample_pdf_url);
        }

        return {
          ...doc,
          sample_pdf_signed_url: sampleSignedUrl, // <-- NEW FIELD
        };
      })
    );

    res.json(documents);
  } catch (err) {
    console.error("DB Error (getDocumentsByService):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get a single document by ID
 */
/**
 * Get a service document by its ID.
 * @param {import('express').Request} req Express request object, expects req.params.id
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getServiceDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query("SELECT * FROM service_documents WHERE id = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }
    // res.json(results[0]);
    const doc = results[0];

    let sampleSignedUrl = null;

    if (doc.sample_pdf_url) {
      sampleSignedUrl = await generateSignedUrl(doc.sample_pdf_url);
    }

    res.json({
      ...doc,
      sample_pdf_signed_url: sampleSignedUrl, // <-- ADDED
    });
  } catch (err) {
    console.error("DB Error (getServiceDocumentById):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Update a service document. Only Admin (role_id 4).
 */
/**
 * Update a service document. Only Admin (role_id 4) can update. Only provided fields are updated; others remain unchanged.
 * Also sets updated_at and updated_by.
 * @param {import('express').Request} req Express request object, expects req.user.id and req.body fields
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const updateServiceDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user ? req.user.id : null;

    // Admin validation
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [updated_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can update service documents" });
    }

    // Get existing record
    const [currentRows] = await db.query("SELECT * FROM service_documents WHERE id = ?", [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    const allowed = ["doc_code", "doc_name", "doc_type", "is_mandatory", "allow_multiple", "sort_order"];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    values.push(id);
    const sql = `UPDATE service_documents SET ${fields.join(", ")}, created_at = created_at WHERE id = ?`;
    await db.query(sql, values);

    res.json({ message: "Service document updated successfully" });
  } catch (err) {
    console.error("DB Error (updateServiceDocument):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Delete a service document. Only Admin (role_id 4).
 */
const deleteServiceDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user ? req.user.id : null;

    // Admin validation
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [deleted_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can delete service documents" });
    }

    const [result] = await db.query("DELETE FROM service_documents WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }

    res.json({ message: "Service document deleted successfully" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        success: false,
        message: "This document is linked to existing orders and cannot be deleted."
      });
    }
    console.error("DB Error (deleteServiceDocument):", err);

    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Upload Sample PDF for service_document
 * Admin Only (role_id = 4)
 */
const uploadSamplePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user ? req.user.id : null;

    // Validate admin
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [updated_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can upload sample PDF" });
    }

    // Validate existing document
    const [doc] = await db.query("SELECT * FROM service_documents WHERE id = ?", [id]);
    if (doc.length === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }

    // Validate file
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    // S3 Key Formatting
    const serviceId = doc[0].service_id;
    const fileKey = `uploads/sample-pdfs/service${serviceId}/serviceDoc${id}/${Date.now()}_${req.file.originalname}`;

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || "application/pdf",
    });

    await s3.send(putCommand);

    const pdfUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

    // Update DB
    await db.query(
      "UPDATE service_documents SET sample_pdf_url = ? WHERE id = ?",
      [pdfUrl, id]
    );

    res.json({
      message: "Sample PDF uploaded successfully",
      sample_pdf_url: pdfUrl,
      signed_url: await generateSignedUrl(pdfUrl),
    });

  } catch (err) {
    console.error("❌ DB Error (uploadSamplePDF):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Delete Sample PDF for service_document
 * Admin Only (role_id = )
 */
const deleteSamplePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user ? req.user.id : null;

    // Validate admin
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [deleted_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can delete sample PDF" });
    }

    // Get document to verify it exists
    const [doc] = await db.query("SELECT sample_pdf_url FROM service_documents WHERE id = ?", [id]);
    if (doc.length === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }

    // Clear sample_pdf_url from DB only (keep S3 file intact)
    await db.query(
      "UPDATE service_documents SET sample_pdf_url = NULL WHERE id = ?",
      [id]
    );

    res.json({
      message: "Sample PDF removed from document successfully",
      sample_pdf_url: null,
    });

  } catch (err) {
    console.error("❌ DB Error (deleteSamplePDF):", err);
    res.status(500).json({ message: "Database error" });
  }
};


/**
 * Activate / Deactivate a service document
 */
const toggleDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body; // 1 = active, 0 = inactive

    // Check admin user (using logged-in user ID)
    const adminId = req.user ? req.user.id : null;

    const [admin] = await db.query(
      "SELECT role_id FROM admin_users WHERE id = ?",
      [adminId]
    );

    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can change document status" });
    }

    // Validate document exists
    const [doc] = await db.query(
      "SELECT id FROM service_documents WHERE id = ?",
      [id]
    );

    if (doc.length === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }

    // Update ONLY is_active
    await db.query(
      "UPDATE service_documents SET is_active = ? WHERE id = ?",
      [is_active, id]
    );

    res.json({
      message: `Document ${is_active ? "activated" : "deactivated"} successfully`,
      id,
      is_active
    });

  } catch (err) {
    console.error("DB Error (toggleDocumentStatus):", err);
    res.status(500).json({ message: "Database error" });
  }
};


// ✅ Export all
module.exports = {
  createServiceDocument,
  getDocumentsByService,
  getServiceDocumentById,
  updateServiceDocument,
  deleteServiceDocument,
  uploadSamplePDF,
  deleteSamplePDF,
  toggleDocumentStatus,
};
