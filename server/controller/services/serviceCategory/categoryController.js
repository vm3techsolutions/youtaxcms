const db = require("../../../config/db");

/**
 * Create a new category. Only Admin (role_id 4) can create categories.
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const created_by = req.user ? req.user.id : null;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Admin validation
    const [creator] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [created_by]);
    if (!creator?.length || creator[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can create categories" });
    }

    // Check for duplicate name
    const [existing] = await db.query("SELECT id FROM categories WHERE name = ?", [name]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Category name already exists" });
    }

    const sql = `
      INSERT INTO categories (name, description, created_by)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [name, description || null, created_by]);

    res.status(201).json({ message: "Category created successfully", id: result.insertId });
  } catch (err) {
    console.error("DB Error (createCategory):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all active categories
 */
const getAllCategories = async (req, res) => {
  try {
    const sql = "SELECT * FROM categories WHERE is_active = TRUE ORDER BY created_at DESC";
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("DB Error (getAllCategories):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get category by ID
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error (getCategoryById):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Update a category (only Admin)
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const updated_by = req.user ? req.user.id : null;

    // Admin validation
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [updated_by]);
    if (!admin?.length || admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can update categories" });
    }

    // Ensure category exists
    const [existing] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const fields = [];
    const values = [];

    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    fields.push("updated_by = ?", "updated_at = CURRENT_TIMESTAMP");
    values.push(updated_by, id);

    const sql = `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    res.json({ message: "Category updated successfully" });
  } catch (err) {
    console.error("DB Error (updateCategory):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Delete a category (only Admin)
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user ? req.user.id : null;

    // Admin validation
    const [admin] = await db.query("SELECT role_id FROM admin_users WHERE id = ?", [deleted_by]);
    if (!admin?.length || admin[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can delete categories" });
    }

    const sql = "DELETE FROM categories WHERE id = ?";
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("DB Error (deleteCategory):", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ✅ Export all functions
module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
