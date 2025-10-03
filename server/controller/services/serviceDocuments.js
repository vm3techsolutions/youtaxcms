const db = require("../../config/db");

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
    const [admin] = await db.promise().query("SELECT role_id FROM admin_users WHERE id = ?", [created_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can create service documents" });
    }

    // Check duplicate doc_code for same service
    const [existing] = await db.promise().query(
      "SELECT id FROM service_documents WHERE service_id = ? AND doc_code = ?",
      [service_id, doc_code]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Document code already exists for this service" });
    }

    // Get max sort_order for this service
    const [maxSort] = await db.promise().query(
      "SELECT MAX(sort_order) AS max_order FROM service_documents WHERE service_id = ?",
      [service_id]
    );
    const sort_order = (maxSort[0].max_order || 0) + 1;

    const sql = `
      INSERT INTO service_documents 
      (service_id, doc_code, doc_name, doc_type, is_mandatory, allow_multiple, sort_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.promise().query(sql, [
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
    const [results] = await db.promise().query(sql, [serviceId]);
    res.json(results);
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
    const [results] = await db.promise().query("SELECT * FROM service_documents WHERE id = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }
    res.json(results[0]);
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
    const [admin] = await db.promise().query("SELECT role_id FROM admin_users WHERE id = ?", [updated_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can update service documents" });
    }

    // Get existing record
    const [currentRows] = await db.promise().query("SELECT * FROM service_documents WHERE id = ?", [id]);
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
    await db.promise().query(sql, values);

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
    const [admin] = await db.promise().query("SELECT role_id FROM admin_users WHERE id = ?", [deleted_by]);
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can delete service documents" });
    }

    const [result] = await db.promise().query("DELETE FROM service_documents WHERE id = ?", [id]);
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

// ✅ Export all
module.exports = {
  createServiceDocument,
  getDocumentsByService,
  getServiceDocumentById,
  updateServiceDocument,
  deleteServiceDocument,
};
