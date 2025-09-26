/**
 * Get a single customer (user) by ID from customers table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const db = require("../../../config/db");

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `SELECT id, name, email, phone, pancard, location, options, 
                        email_verified, phone_verified, kyc_status, created_at
                 FROM customers WHERE id = ?`;

    db.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Error fetching user by ID:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        success: true,
        user: results[0],
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected error",
      error: err.message,
    });
  }
};

/**
 * Get all customers (users) with their basic info.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
  try {
    const sql = `SELECT id, name, email, phone, pancard, location, options, 
                        email_verified, phone_verified, kyc_status, created_at 
                 FROM customers`;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.status(200).json({
        success: true,
        count: results.length,
        users: results,
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected error",
      error: err.message,
    });
  }
};

module.exports = { getUserById, getAllUsers };