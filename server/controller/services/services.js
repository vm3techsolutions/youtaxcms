const db = require("../../config/db");

/**
 * Create a new service. Only Admin (role_id 4) can create services. Service name must be unique.
 * @param {import('express').Request} req Express request object, expects req.user.id and req.body fields
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const createService = async (req, res) => {
  try {
    const { name, description, base_price, advance_price, service_charges, sla_days, requires_advance, category_id } = req.body;
    const created_by = req.user ? req.user.id : null;

    if (!name || !base_price ) {
      return res.status(400).json({ message: "Name, Base Price are required" });
    }
    // Check if creator is admin with role_id 4
    const [creator] = await db.query(
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
    const [existing] = await db.query(
      "SELECT id FROM services WHERE name = ?",
      [name]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Service name already exists. Please choose a unique name." });
    }

    const sql = `
      INSERT INTO services 
      (name, category_id, description, base_price, advance_price, service_charges, sla_days, requires_advance, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      name,
      category_id || null,
      description || null,
      base_price,
      advance_price || null,
      service_charges || null,
      sla_days || null,
      requires_advance ? 1 : 0,
      created_by,
    ]);

    res.status(201).json({ message: "Service created successfully", id: result.insertId });
  } catch (err) {
    console.error("DB Error (createService):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all active services with their category names, ordered by creation date descending.
 * @param {import('express').Request} req Express request object
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getAllServices = async (req, res) => {
  try {
    const sql = `
      SELECT s.*, c.name AS category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `;
    const [results] = await db.query(sql);
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
    const [results] = await db.query(sql, [id]);

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
    const [admin] = await db.query(
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
    const [currentRows] = await db.query("SELECT * FROM services WHERE id = ?", [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Validate category if provided
    if (req.body.category_id) {
      const [cat] = await db.query("SELECT id FROM categories WHERE id = ? AND is_active = 1", [req.body.category_id]);
      if (cat.length === 0) {
        return res.status(400).json({ message: "Invalid or inactive category" });
      }
    }

    const allowed = ["name", "description", "base_price", "advance_price", "service_charges", "sla_days", "is_active", "category_id"];
    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    fields.push("updated_at = CURRENT_TIMESTAMP", "updated_by = ?");
    values.push(updated_by, id);

    const sql = `UPDATE services SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

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
    const [admin] = await db.query(
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
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("DB Error (deleteService):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all services by category ID with category name.
 * @param {import('express').Request} req Express request object, expects req.params.category_id
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getServiceByCategoryId = async (req, res) => {
  try {
    const { category_id } = req.params;

    if (!category_id) {
      return res.status(400).json({ message: "category_id is required" });
    }

    // Validate category exists and is active
    const [categoryRows] = await db.query(
      "SELECT id FROM categories WHERE id = ? AND is_active = 1",
      [category_id]
    );
    if (categoryRows.length === 0) {
      return res.status(404).json({ message: "Category not found or inactive" });
    }

    const sql = `
      SELECT s.*, c.name AS category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.category_id = ? AND s.is_active = TRUE
      ORDER BY s.created_at DESC
    `;
    const [results] = await db.query(sql, [category_id]);

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error("DB Error (getServiceByCategoryId):", err);
    res.status(500).json({ message: "Database error" });
  }
};
/**
 * Toggle service is_active status (true/false)
 * @param {import('express').Request} req Express request object
 * @param {import('express').Response} res Express response object
 */
const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const updated_by = req.user ? req.user.id : null;

    // Validate input
    if (typeof is_active !== "boolean") {
      return res.status(400).json({ message: "is_active must be true or false" });
    }

    // Validate admin
    const [admin] = await db.query(
      "SELECT role_id FROM admin_users WHERE id = ?", 
      [updated_by]
    );
    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    if (admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can update status" });
    }

    // Check if service exists
    const [service] = await db.query(
      "SELECT id, is_active FROM services WHERE id = ?",
      [id]
    );
    if (service.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Update status
    await db.query(
      `UPDATE services 
       SET is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [is_active ? 1 : 0, updated_by, id]
    );

    const msg = is_active ? "Service activated successfully" : "Service deactivated successfully";

    return res.json({ 
      message: msg,
      id 
    });

  } catch (error) {
    console.error("DB Error (toggleServiceStatus):", error);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all  services with their category names, ordered by creation date descending.
 * @param {import('express').Request} req Express request object
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getAllServicesWithInactive = async (req, res) => {
  try {
    const sql = `
      SELECT s.*, c.name AS category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = TRUE
      ORDER BY s.created_at DESC
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error("DB Error (getAllServices):", err);
    res.status(500).json({ message: "Database error" });
  }
};
// ✅ Export all functions
module.exports = {
  createService,
  getAllServices,
  getServiceById,
  getServiceByCategoryId,
  updateService,
  toggleServiceStatus,
  getAllServicesWithInactive,
  deleteService,
};
