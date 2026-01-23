const db = require("../../../config/db");

/**
 * ✅ Create Service Bundle
 * Only Admin (role_id = 4)
 */
const createServiceBundle = async (req, res) => {
    try {
        const { primary_service_id, bundled_service_id, discount_type, discount_value } = req.body;
        const admin_id = req.user?.id;

        if (!primary_service_id || !bundled_service_id) {
            return res.status(400).json({ message: "primary_service_id & bundled_service_id required" });
        }

        // Admin validation
        const [admin] = await db.query(
            "SELECT role_id FROM admin_users WHERE id=?",
            [admin_id]
        );
        if (!admin.length || admin[0].role_id !== 4) {
            return res.status(403).json({ message: "Only Admin can create bundles" });
        }

        // Prevent duplicate bundle
        const [exists] = await db.query(
            `SELECT id FROM service_bundles 
       WHERE primary_service_id=? AND bundled_service_id=?`,
            [primary_service_id, bundled_service_id]
        );
        if (exists.length) {
            return res.status(409).json({ message: "Bundle already exists" });
        }

        await db.query(
            `INSERT INTO service_bundles 
      (primary_service_id, bundled_service_id, discount_type, discount_value)
      VALUES (?, ?, ?, ?)`,
            [
                primary_service_id,
                bundled_service_id,
                discount_type || "free",
                discount_value || 0,
            ]
        );

        res.status(201).json({ message: "Service bundle created successfully" });
    } catch (err) {
        console.error("DB Error (createServiceBundle):", err);
        res.status(500).json({ message: "Database error" });
    }
};

/**
 * ✅ Get All Service Bundles (Admin View)
 */
const getAllServiceBundles = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT sb.*, 
             ps.name AS primary_service_name,
             bs.name AS bundled_service_name
      FROM service_bundles sb
      JOIN services ps ON sb.primary_service_id = ps.id
      JOIN services bs ON sb.bundled_service_id = bs.id
      ORDER BY sb.created_at DESC
    `);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("DB Error (getAllServiceBundles):", err);
        res.status(500).json({ message: "Database error" });
    }
};

/**
 * ✅ Get Service Bundle by Primary Service ID (Only Active Bundles)
 */
const getServiceBundleByPrimaryId = async (req, res) => {
    try {
        const { primary_service_id } = req.params;

        if (!primary_service_id) {
            return res.status(400).json({ message: "primary_service_id required" });
        }

        const [rows] = await db.query(`
            SELECT sb.*, 
                   ps.name AS primary_service_name,
                   bs.name AS bundled_service_name
            FROM service_bundles sb
            JOIN services ps ON sb.primary_service_id = ps.id
            JOIN services bs ON sb.bundled_service_id = bs.id
            WHERE sb.primary_service_id = ? AND sb.is_active = 1
            ORDER BY sb.created_at DESC
        `, [primary_service_id]);

        if (!rows.length) {
            return res.status(404).json({ message: "No active bundles found for this service" });
        }

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("DB Error (getServiceBundleByPrimaryId):", err);
        res.status(500).json({ message: "Database error" });
    }
};

/**
 * ✅ Toggle Bundle Status
 */
const toggleServiceBundleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const admin_id = req.user?.id;

        const [admin] = await db.query(
            "SELECT role_id FROM admin_users WHERE id=?",
            [admin_id]
        );
        if (!admin.length || admin[0].role_id !== 4) {
            return res.status(403).json({ message: "Only Admin allowed" });
        }

        await db.query(
            "UPDATE service_bundles SET is_active=? WHERE id=?",
            [is_active ? 1 : 0, id]
        );

        res.json({ message: "Bundle status updated" });
    } catch (err) {
        console.error("DB Error (toggleServiceBundleStatus):", err);
        res.status(500).json({ message: "Database error" });
    }
};



module.exports = {
    createServiceBundle,
    getAllServiceBundles,
    getServiceBundleByPrimaryId,
    toggleServiceBundleStatus
};
