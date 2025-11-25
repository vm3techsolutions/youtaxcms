const db = require("../../../config/db");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../../../config/aws");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const SIGNED_URL_EXPIRY = 3600;

// Generate Signed URL
const generateSignedUrl = async (fileUrl) => {
  try {
    const baseUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
    const fileKey = fileUrl.replace(baseUrl, "");
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    return await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY });
  } catch (err) {
    console.error("❌ Signed URL Error:", err);
    return null;
  }
};

// ===================================================================
// 1️⃣ Upload Operation Documents
// ===================================================================
const uploadOperationDocument = async (req, res) => {
  try {
    const operationId = req.user.id;
    const { order_id, remarks } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "A file is required" });
    }

    const file = req.file;

    const fileKey = `uploads/operation_documents/order_id_${order_id}/${Date.now()}_${file.originalname}`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

    // Get customer id from order and Insert DB record (store in sent_to_customer)
    const [orderRows] = await db.query(
      `SELECT customer_id FROM orders WHERE id = ? LIMIT 1`,
      [order_id]
    );
    const customerId = orderRows && orderRows.length ? orderRows[0].customer_id : null;

    const [insert] = await db.query(
      `INSERT INTO operation_documents
       (order_id, uploaded_by, file_url, file_name, remarks, sent_to_customer)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, operationId, fileUrl, file.originalname, remarks || null, customerId]
    );

    return res.json({
      success: true,
      message: "Operation document uploaded successfully",
      file: {
        id: insert.insertId,
        file_url: fileUrl,
        file_name: file.originalname,
        signed_url: await generateSignedUrl(fileUrl),
      },
    });

  } catch (err) {
    console.error("Error uploading operation document:", err);
    res.status(500).json({ message: "Database / S3 error" });
  }
};

// ===================================================================
// 2️⃣ Get All Operation Documents for Order
// ===================================================================
const getOperationDocumentsForOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    const [rows] = await db.query(
      `SELECT od.*, au.name AS uploaded_by_name
       FROM operation_documents od
       JOIN admin_users au ON od.uploaded_by = au.id
       WHERE od.order_id=? AND od.is_active=1
       ORDER BY od.created_at DESC`,
      [order_id]
    );

    const documents = await Promise.all(
      rows.map(async (doc) => ({
        ...doc,
        signed_url: await generateSignedUrl(doc.file_url),
      }))
    );

    res.json({ success: true, data: documents });

  } catch (err) {
    console.error("Error fetching operation documents:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ===================================================================
// 3️⃣ Get Single Operation Document
// ===================================================================
const getOperationDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM operation_documents WHERE id=? AND is_active=1 LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    const data = {
      ...rows[0],
      signed_url: await generateSignedUrl(rows[0].file_url),
    };

    res.json({ success: true, data });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ===================================================================
// 4️⃣ Soft Delete (Revoke Document)
// ===================================================================
const deleteOperationDocument = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE operation_documents SET is_active=0 WHERE id=?`,
      [id]
    );

    res.json({ success: true, message: "Document removed successfully" });

  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ===================================================================
// 5️⃣ Admin View - All Operation Documents
// ===================================================================
const getAllOperationDocuments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          od.*, 
          c.id AS customer_id,
          c.name AS customer_name,
          s.name AS service_name,
          au.name AS uploaded_by_name
       FROM operation_documents od
       JOIN orders o ON od.order_id = o.id
       JOIN customers c ON o.customer_id = c.id
       JOIN services s ON o.service_id = s.id
       JOIN admin_users au ON od.uploaded_by = au.id
       WHERE od.is_active=1
       ORDER BY od.created_at DESC`
    );

    const documents = await Promise.all(
      rows.map(async (doc) => ({
        ...doc,
        signed_url: await generateSignedUrl(doc.file_url),
      }))
    );

    res.json({ success: true, data: documents });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

module.exports = {
  uploadOperationDocument,
  getOperationDocumentsForOrder,
  getOperationDocumentById,
  deleteOperationDocument,
  getAllOperationDocuments,
};
