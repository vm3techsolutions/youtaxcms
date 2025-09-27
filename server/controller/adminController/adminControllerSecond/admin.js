const db = require("../../../config/db");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../../../config/aws");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// ========================
// Helper: Generate Signed URL
// ========================
const generateSignedUrl = async (fileUrl) => {
  try {
    const baseUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
    const fileKey = fileUrl.replace(baseUrl, "");
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    return await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY });
  } catch (err) {
    console.error("❌ Error generating signed URL:", err);
    return null;
  }
};


// ========================
// 3. Get Assigned Orders for Admin
// ========================
const getAssignedOrdersForAdmin = async (req, res) => {
  try {
    const adminId = req.user.id; // logged-in admin

    const [orders] = await db.promise().query(
      `SELECT o.* 
       FROM orders o
       WHERE o.assigned_to=? 
         AND o.status IN ('in_progress', 'under_review', 'assigned')`,
      [adminId]
    );

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Error fetching assigned orders for admin:", err);
    res.status(500).json({ message: "Database error" });
  }
};


const getDeliverablesForAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    // Ensure this order is assigned to logged-in admin
    const [orders] = await db.promise().query(
      `SELECT * FROM orders WHERE id=? AND assigned_to=?`,
      [order_id, adminId]
    );

    if (orders.length === 0) {
      return res.status(403).json({ message: "Not authorized to view deliverables for this order" });
    }

    // Fetch deliverables for the order
    const [rows] = await db.promise().query(
      `SELECT * FROM deliverables WHERE order_id=? ORDER BY versions ASC`,
      [order_id]
    );

    const deliverables = await Promise.all(
      rows.map(async (d) => ({
        ...d,
        signed_url: await generateSignedUrl(d.file_url),
      }))
    );

    res.json({ success: true, data: deliverables });
  } catch (err) {
    console.error("Error fetching deliverables for admin:", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all approved deliverables for a given order_id (for admin)
 */
const getApprovedDeliverablesForOrder = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    // Ensure this order is assigned to logged-in admin
    const [orders] = await db.promise().query(
      `SELECT * FROM orders WHERE id=? AND assigned_to=?`,
      [order_id, adminId]
    );

    if (orders.length === 0) {
      return res.status(403).json({ message: "Not authorized to view deliverables for this order" });
    }

    // Fetch only approved deliverables for the order
    const [rows] = await db.promise().query(
      `SELECT * FROM deliverables WHERE order_id=? AND qc_status='approved' ORDER BY versions ASC`,
      [order_id]
    );

    const deliverables = await Promise.all(
      rows.map(async (d) => ({
        ...d,
        signed_url: await generateSignedUrl(d.file_url),
      }))
    );

    res.json({ success: true, data: deliverables });
  } catch (err) {
    console.error("Error fetching approved deliverables for admin:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ========================
// 1. QC on Deliverables (approve / reject)
// ========================
const qcDeliverable = async (req, res) => {
  try {
    const adminId = req.user.id; // logged-in admin
    const { deliverable_id, qc_status, remarks } = req.body;

    if (!deliverable_id || !["approved", "rejected"].includes(qc_status)) {
      return res.status(400).json({ message: "deliverable_id and valid qc_status required" });
    }

    // ✅ Update deliverable QC status
    await db.promise().query(
      `UPDATE deliverables 
       SET qc_status=?, approved_by=?, approved_at=NOW() 
       WHERE id=?`,
      [qc_status, adminId, deliverable_id]
    );

    // ✅ Fetch deliverable info (order_id + generated_by)
    const [deliverable] = await db.promise().query(
      `SELECT order_id, generated_by FROM deliverables WHERE id=?`,
      [deliverable_id]
    );

    if (deliverable.length > 0) {
      const { order_id, generated_by } = deliverable[0];

      if (qc_status === "approved") {
        // 🔹 If approved → log approval
        await db.promise().query(
          `INSERT INTO order_logs 
            (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
           VALUES (?, ?, NULL, 'admin', NULL, 'qc_approved', ?, NOW())`,
          [order_id, adminId, remarks || "Deliverable approved"]
        );
      } else if (qc_status === "rejected") {
        // 🔹 If rejected → log rejection & send back to operation
        await db.promise().query(
          `INSERT INTO order_logs 
            (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
           VALUES (?, ?, ?, 'admin', 'operation', 'qc_rejected', ?, NOW())`,
          [order_id, adminId, generated_by, remarks || "Deliverable rejected & sent back to Operation"]
        );
      }
    }

    res.json({ success: true, message: `Deliverable ${qc_status}` });
  } catch (err) {
    console.error("❌ Error in QC deliverable:", err);
    res.status(500).json({ message: "Database error" });
  }
};


// ========================
// 2. Approve Order Closure
// ========================
const approveOrderCompleted = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { order_id, remarks } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

      // ✅ Check order status & payment_status
    const [order] = await db.promise().query(
      `SELECT status, payment_status FROM orders WHERE id=?`,
      [order_id]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order[0].status !== "in_progress") {
      return res.status(400).json({ message: "Order must be 'in_progress' to mark completed" });
    }

    if (order[0].payment_status !== "paid") {
      return res.status(400).json({ message: "Order must be fully paid before completion" });
    }

    await db.promise().query(
      `UPDATE orders SET status='completed', updated_at=NOW() WHERE id=?`,
      [order_id]
    );

    await db.promise().query(
      `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
       VALUES (?, ?, NULL, 'admin', NULL, 'completed_order_closed', ?, NOW())`,
      [order_id, adminId, remarks || "Order closed by Admin"]
    );

    res.json({ success: true, message: "Order successfully closed" });
  } catch (err) {
    console.error("Error approving order closure:", err);
    res.status(500).json({ message: "Database error" });
  }
};



module.exports = {
  qcDeliverable,
  approveOrderCompleted,
  getAssignedOrdersForAdmin,
  getDeliverablesForAdmin,
  getApprovedDeliverablesForOrder
};
