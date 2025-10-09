const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../../../config/db");

// Register Admin User

/**
 * Create a new admin user. Only users with Admin role (role_id = 4) can create new admin users.
 * @param {Object} req - Express request object, expects req.user.id and req.body: name, email, password, phone, role_id
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createAdminUser = async (req, res) => {
  const { name, email, password, phone, role_id } = req.body;
  const created_by = req.user ? req.user.id : null;

  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ message: "Name, email, password, and role_id are required" });
  }

  try {
    // 🔹 Check if creator is valid and has Admin role
    const [creator] = await db.query(
      "SELECT role_id FROM admin_users WHERE id = ?",
      [created_by]
    );

    if (creator.length === 0) {
      return res.status(404).json({ message: "Creator admin not found" });
    }

    if (creator[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can create new admin users" });
    }

    // 🔹 Check if email already exists
    const [existing] = await db
      .query("SELECT id FROM admin_users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    // 🔹 Hash password & Insert
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO admin_users (name, email, password_hash, phone, role_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db
      .query(sql, [name, email, hashedPassword, phone || null, role_id, created_by || null]);

    res.status(201).json({ message: "Admin user created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};

// tempporary old code for admin add don't delete

// const createAdminUser = async (req, res) => {
//   const { name, email, password, phone, role_id } = req.body;
//   const created_by = req.user?.id || null;  // <-- FIX here

//   if (!name || !email || !password || !role_id) {
//     return res.status(400).json({ message: "Name, email, password, and role_id are required" });
//   }

//   try {
//     // 🔹 Check if email already exists
//     const [existing] = await db
//       .promise()
//       .query("SELECT id FROM admin_users WHERE email = ?", [email]);
//     if (existing.length > 0) {
//       return res.status(409).json({ message: "Admin already exists" });
//     }

//     // 🔹 Hash password & Insert
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const sql = `
//       INSERT INTO admin_users (name, email, password_hash, phone, role_id, created_by)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `;
//     const [result] = await db
//       .promise()
//       .query(sql, [name, email, hashedPassword, phone || null, role_id, created_by]);

//     res.status(201).json({ message: "Admin user created", id: result.insertId });
//   } catch (err) {
//     console.error("DB Error:", err); // <-- log actual error
//     res.status(500).json({ message: "Database error", error: err });
//   }
// };


// Login Admin

/**
 * Login an admin user and return JWT token if credentials are valid.
 * @param {Object} req - Express request object, expects req.body: email, password
 * @param {Object} res - Express response object
 * @returns {void}
 */
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const sql = `SELECT au.*, ar.name AS role_name 
               FROM admin_users au 
               JOIN admin_roles ar ON au.role_id = ar.id
               WHERE au.email = ?`;

  try {
    const [results] = await db.query(sql, [email]);
    if (results.length === 0) return res.status(401).json({ message: "Invalid email or password" });

    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role_name },
      process.env.JWT_SECRET,
      { expiresIn: "7h" }
    );

    res.json({ message: "Login successful", token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role_name } });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};

// Get All Admin Users
/**
 * Get all admin users with their roles and basic info.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const getAdminUsers = async (req, res) => {
  const sql = `SELECT au.id, au.name, au.email, au.phone, ar.name AS role, au.created_at
               FROM admin_users au
               JOIN admin_roles ar ON au.role_id = ar.id`;
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};

/**
 * Get all admin users by role
 * Example: /api/admin-users/role/:roleId
 */
const getAdminUsersByRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, r.name AS role_name, r.description
       FROM admin_users u
       JOIN admin_roles r ON u.role_id = r.id
       WHERE r.id = ?`,
      [roleId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching users by role:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Edit an admin user's name, email, password, and phone.
 * Only Admin (role_id = 4) can edit other admin users.
 * @param {Object} req - Express request object, expects req.user.id and req.body: id, name, email, password, phone
 * @param {Object} res - Express response object
 */
const editAdminUser = async (req, res) => {
  const { id, name, email, password, phone } = req.body;
  const editorId = req.user ? req.user.id : null;

  if (!id) {
    return res.status(400).json({ message: "Admin user id is required" });
  }

  try {
    // Check if editor is valid and has Admin role
    const [editor] = await db.query(
      "SELECT role_id FROM admin_users WHERE id = ?",
      [editorId]
    );
    if (editor.length === 0) {
      return res.status(404).json({ message: "Editor admin not found" });
    }
    if (editor[0].role_id !== 4) {
      return res.status(403).json({ message: "Only Admin can edit admin users" });
    }

    // Build update fields
    const fields = [];
    const values = [];
    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (email) {
      fields.push("email = ?");
      values.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password_hash = ?");
      values.push(hashedPassword);
    }
    if (phone) {
      fields.push("phone = ?");
      values.push(phone);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    const sql = `UPDATE admin_users SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    res.json({ message: "Admin user updated successfully" });
  } catch (err) {
    console.error("Error updating admin user:", err);
    res.status(500).json({ message: "Database error", error: err });
  }
};

module.exports = {
  createAdminUser,
  adminLogin,
  getAdminUsers,
  getAdminUsersByRole,
  editAdminUser
};
