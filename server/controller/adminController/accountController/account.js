const db = require("../../../config/db");

const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
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

// Get orders pending payment check (assigned to this account user), with customer and service name
const getPendingOrdersForAccounts = async (req, res) => {
  try {
    const accountsId = req.user.id; // logged-in accounts user

    const [orders] = await db.query(
      `SELECT 
        o.*,
        c.name AS customer_name,
        s.name AS service_name,
        SUM(p.amount) AS paid_amount
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN services s ON o.service_id = s.id
       LEFT JOIN payments p ON o.id = p.order_id AND p.status='success'
       WHERE (o.status='under_review' OR o.status='awaiting_final_payment')
       AND o.assigned_to=?
       GROUP BY o.id
       ORDER BY o.id DESC`,
      [accountsId]
    );

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Error fetching pending orders:", err);
    res.status(500).json({ message: "Database error" });
  }
};


// Get payments for a specific order
const getOrderPayments = async (req, res) => {
  try {
    const { id } = req.params;

    const [payments] = await db.query(
      `SELECT id, payment_type, payment_mode, amount, status, txn_ref, created_at, receipt_url
       FROM payments WHERE order_id=?`,
      [id]
    );

    // Add signed receipt_url if present
    const paymentsWithSignedReceipt = await Promise.all(
      payments.map(async (p) => ({
        ...p,
        signed_receipt_url: p.receipt_url
          ? await generateSignedUrl(p.receipt_url)
          : null,
      }))
    );

    res.json({ success: true, data: paymentsWithSignedReceipt });
  } catch (err) {
    console.error("Error fetching order payments:", err);
    res.status(500).json({ message: "Database error" });
  }
};


// Accounts forwards order to Operations (status -> in_progress + assign_to)
const forwardToOperations = async (req, res) => {
  try {
    const accountsId = req.user.id; // logged-in accounts user
    const { order_id, remarks, assigned_to } = req.body; // assigned_to = operations user ID

    if (!order_id || !assigned_to) {
      return res.status(400).json({ message: "order_id and assigned_to are required" });
    }

    // Check if order is under_review
    const [orderRows] = await db.query(
      `SELECT status FROM orders WHERE id=?`,
      [order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      orderRows[0].status !== "under_review" &&
      orderRows[0].status !== "awaiting_final_payment"
    ) {
      return res.status(400).json({ message: "Order is not in under_review or awaiting_final_payment status, cannot forward" });
    }

    // Update order status + assign to operations user
    await db.query(
      `UPDATE orders 
       SET status='in_progress', assigned_to=?, updated_at=NOW() 
       WHERE id=?`,
      [assigned_to, order_id]
    );

    // Insert into logs
    await db.query(
      `INSERT INTO order_logs 
        (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
       VALUES (?, ?, ?, 'accounts', 'operation', 'forwarded_to_operations', ?, NOW())`,
      [order_id, accountsId, assigned_to, remarks || "Order verified, assigned to Operations"]
    );

    res.json({
      success: true,
      message: `Order moved to in_progress and assigned to Operations user ${assigned_to}`
    });
  } catch (err) {
    console.error("Error forwarding to operations:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// Get filtered operation users for dropdown when accounts sends again
getOperationUsersForDropdown = async (req, res) => {
  try {
    const { order_id } = req.body;

    // 1️⃣ Fetch last operation user in the same query block
    const [logRows] = await db.query(
      `SELECT from_user 
       FROM order_logs
       WHERE order_id = ?
         AND from_role = 'operation'
       ORDER BY id DESC
       LIMIT 1`,
      [order_id]
    );

    return res.json({
      success: true,
      data: logRows.length > 0 ? logRows[0].from_user : null,
    });

  } catch (error) {
    console.error("Error fetching operation dropdown:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching operation users",
    });
  }
};

const getAccountDashboardStats = async (req, res) => {
  try {
    const accountId = req.user.id;

    // Latest log join (to get current assignment)
    const latestLogJoin = `
      JOIN (
        SELECT order_id, MAX(id) AS latest_log_id
        FROM order_logs
        GROUP BY order_id
      ) AS ll ON o.id = ll.order_id
      JOIN order_logs ol ON ol.id = ll.latest_log_id
    `;

    // -----------------------------------------
    // Assigned Orders (current)
    // -----------------------------------------
    const [[assignedOrders]] = await db.query(`
      SELECT COUNT(*) AS count
      FROM orders o
      ${latestLogJoin}
      WHERE ol.to_role = 'accounts' AND ol.to_user = ?
    `, [accountId]);

    // -----------------------------------------
    //  Account Worked Orders (at ANY time)
    // -----------------------------------------
    const [[workedOrders]] = await db.query(`
      SELECT COUNT(DISTINCT o.id) AS count
      FROM orders o
      JOIN order_logs ol ON ol.order_id = o.id
      WHERE ol.to_role = 'accounts' AND ol.to_user = ?
    `, [accountId]);

    
    // -----------------------------------------
    // Pending Payment Count (latest assigned)
    // -----------------------------------------
    const [[pendingPaymentOrders]] = await db.query(`
      SELECT COUNT(*) AS count
      FROM orders o
      ${latestLogJoin}
      WHERE ol.to_role = 'accounts' 
        AND ol.to_user = ?
        AND o.payment_status IN ('unpaid', 'partially_paid')
    `, [accountId]);

    // -----------------------------------------
    // Full Payment Count (latest assigned)
    // -----------------------------------------
    const [[fullPaymentOrders]] = await db.query(`
      SELECT COUNT(*) AS count
      FROM orders o
      ${latestLogJoin}
      WHERE ol.to_role = 'accounts' 
        AND ol.to_user = ?
        AND o.payment_status = 'paid'
    `, [accountId]);

    res.json({
      success: true,
      data: {
        assignedOrders: assignedOrders.count || 0,
        workedOrders: workedOrders.count || 0,
        pendingPaymentOrders: pendingPaymentOrders.count || 0,
        fullPaymentOrders: fullPaymentOrders.count || 0
      }
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};



// =============================

module.exports = { getPendingOrdersForAccounts, getOrderPayments,forwardToOperations, getOperationUsersForDropdown,getAccountDashboardStats };