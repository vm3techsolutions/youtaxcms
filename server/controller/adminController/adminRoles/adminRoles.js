/**
 * Retrieves all admin roles from the database.
 *
 * @function getAdminRoles
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with a JSON array of admin roles or an error message.
 */
const db = require("../../../config/db");

// Get all roles

const getAdminRoles = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM admin_roles");
    res.json(results);
  } catch (err) {
    console.error("DB Error (getAdminRoles):", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

module.exports = { getAdminRoles };
