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
    const [creator] = await db.promise().query(
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
      .promise()
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
      .promise()
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
const adminLogin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const sql = `SELECT au.*, ar.name AS role_name 
               FROM admin_users au 
               JOIN admin_roles ar ON au.role_id = ar.id
               WHERE au.email = ?`;

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
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
  });
};

// Get All Admin Users
/**
 * Get all admin users with their roles and basic info.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const getAdminUsers = (req, res) => {
  const sql = `SELECT au.id, au.name, au.email, au.phone, ar.name AS role, au.created_at
               FROM admin_users au
               JOIN admin_roles ar ON au.role_id = ar.id`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
};

module.exports = { createAdminUser, adminLogin, getAdminUsers };
