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
