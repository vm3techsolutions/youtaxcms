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
const getAdminRoles = (req, res) => {
  const sql = "SELECT * FROM admin_roles";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
};

module.exports = { getAdminRoles };
