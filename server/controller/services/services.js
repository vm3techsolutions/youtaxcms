const db = require("../../config/db");

/**
 * Create a new service. Only Admin (role_id 4) can create services. Service name must be unique.
 * @param {import('express').Request} req Express request object, expects req.user.id and req.body fields
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const createService = async (req, res) => {
  try {
    const { name, description, base_price, advance_price, service_charges, sla_days } = req.body;
    const created_by = req.user ? req.user.id : null;

    if (!name || !base_price || !advance_price) {
      return res.status(400).json({ message: "Name, Base Price, and Advance Price are required" });
    }
    // Check if creator is admin with role_id 4
    const [creator] = await db.promise().query(
      "SELECT role_id FROM admin_users WHERE id = ?",
      [created_by]
    );
    if (!creator || creator.length === 0) {
      return res.status(404).json({ message: "Creator admin not found" });
    }
    if (creator[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can create services" });
    }

    // Check if service name already exists
    const [existing] = await db.promise().query(
      "SELECT id FROM services WHERE name = ?",
      [name]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Service name already exists. Please choose a unique name." });
    }

    const sql = `
      INSERT INTO services 
      (name, description, base_price, advance_price, service_charges, sla_days, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db
      .promise()
      .query(sql, [
        name,
        description || null,
        base_price,
        advance_price,
        service_charges || null,
        sla_days || null,
        created_by,
      ]);

    res.status(201).json({ message: "Service created successfully", id: result.insertId });
  } catch (err) {
    console.error("DB Error (createService):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all active services, ordered by creation date descending.
 * @param {import('express').Request} req Express request object
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getAllServices = async (req, res) => {
  try {
    const sql = "SELECT * FROM services WHERE is_active = TRUE ORDER BY created_at DESC";
    const [results] = await db.promise().query(sql);
    res.json(results);
  } catch (err) {
    console.error("DB Error (getAllServices):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get a service by its ID.
 * @param {import('express').Request} req Express request object, expects req.params.id
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM services WHERE id = ?";
    const [results] = await db.promise().query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("DB Error (getServiceById):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Update a service. Only Admin (role_id 4) can update. Only provided fields are updated; others remain unchanged.
 * Also sets updated_at and updated_by.
 * @param {import('express').Request} req Express request object, expects req.user.id and req.body fields
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user ? req.user.id : null;

    // Admin validation
    const [admin] = await db.promise().query(
      "SELECT role_id FROM admin_users WHERE id = ?",
      [updated_by]
    );
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can update services" });
    }

    // Get current service data
    const [currentRows] = await db.promise().query("SELECT * FROM services WHERE id = ?", [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    const current = currentRows[0];

    // Build update fields dynamically
    const fields = [];
    const values = [];
    const allowed = ["name", "description", "base_price", "advance_price", "service_charges", "sla_days", "is_active"];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    fields.push("updated_at = CURRENT_TIMESTAMP");
    fields.push("updated_by = ?");
    values.push(updated_by);
    if (fields.length === 2) { // Only updated_at and updated_by, no other fields
      return res.status(400).json({ message: "No valid fields provided for update" });
    }
    values.push(id);

    const sql = `UPDATE services SET ${fields.join(", ")} WHERE id = ?`;
    await db.promise().query(sql, values);

    res.json({ message: "Service updated successfully" });
  } catch (err) {
    console.error("DB Error (updateService):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Delete a service by its ID. Only Admin (role_id 4) can delete. Returns 404 if not found.
 * @param {import('express').Request} req Express request object, expects req.user.id and req.params.id
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user ? req.user.id : null;

    // Admin validation
    const [admin] = await db.promise().query(
      "SELECT role_id FROM admin_users WHERE id = ?",
      [deleted_by]
    );
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can delete services" });
    }

    const sql = "DELETE FROM services WHERE id=?";
    const [result] = await db.promise().query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("DB Error (deleteService):", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ✅ Export all functions
module.exports = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
};
