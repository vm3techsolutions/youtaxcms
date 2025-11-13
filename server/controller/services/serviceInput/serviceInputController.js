const db = require("../../../config/db");

// ============================================================
// Create a new Service Input (Admin only)
// ============================================================
const createServiceInput = async (req, res) => {
  try {
    const { service_id, fields } = req.body;
    const created_by = req.user?.id;

    if (!service_id || !fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ message: "service_id and fields array are required" });
    }

    // Admin validation
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [created_by]);
    if (!admin.length || admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can create service inputs" });
    }

    // Check for duplicate label_name for this service
    const labelNames = fields.map(f => f.label_name);
    const [existingLabels] = await db.query(
      `SELECT label_name FROM service_input WHERE service_id = ? AND label_name IN (?)`,
      [service_id, labelNames]
    );

    if (existingLabels.length > 0) {
      const duplicates = existingLabels.map(e => e.label_name).join(", ");
      return res.status(409).json({ 
        message: `Label name(s) already exist for this service: ${duplicates}` 
      });
    }

    // Prepare bulk insert values
    const values = fields.map((f) => [
      service_id,
      f.label_name,
      f.input_type,
      f.options || null,
      f.is_mandatory ?? false,
      f.placeholder || null,
    ]);

    const sql = `
      INSERT INTO service_input 
      (service_id, label_name, input_type, options, is_mandatory, placeholder)
      VALUES ?
    `;

    const [result] = await db.query(sql, [values]);

    res.status(201).json({
      message: "Service input fields created successfully",
      inserted_count: result.affectedRows
    });
  } catch (err) {
    console.error("DB Error (createServiceInput):", err);
    res.status(500).json({ message: "Database error" });
  }
};


// ============================================================
// Get all Service Inputs by Service ID
// ============================================================
const getServiceInputsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM service_input WHERE service_id = ? ORDER BY  created_at ASC`,
      [serviceId]
    );
    res.json(rows);
  } catch (err) {
    console.error("DB Error (getServiceInputsByService):", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ============================================================
// Get Single Service Input by ID
// ============================================================
const getServiceInputById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM service_input WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Service input not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error (getServiceInputById):", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ============================================================
// Update Service Input (Admin only)
// ============================================================
const updateServiceInput = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user?.id;

    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [updated_by]);
    if (!admin.length || admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can update service inputs" });
    }

    const allowedFields = [
      "label_name",
      "input_type",
      "options",
      "is_mandatory",
      "placeholder"
    
    ];

    const updates = [];
    const values = [];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    values.push(id);

    await db.query(
      `UPDATE service_input SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ message: "Service input updated successfully" });
  } catch (err) {
    console.error("DB Error (updateServiceInput):", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ============================================================
// Delete Service Input (Admin only)
// ============================================================
const deleteServiceInput = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user?.id;

    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [deleted_by]);
    if (!admin.length || admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can delete service inputs" });
    }

    const [result] = await db.query("DELETE FROM service_input WHERE id = ?", [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Service input not found" });
    }

    res.json({ message: "Service input deleted successfully" });
  } catch (err) {
    console.error("DB Error (deleteServiceInput):", err);
    res.status(500).json({ message: "Database error" });
  }
};

module.exports = {
  createServiceInput,
  getServiceInputsByService,
  getServiceInputById,
  updateServiceInput,
  deleteServiceInput
};
