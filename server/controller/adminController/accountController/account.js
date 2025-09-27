
const db = require("../../../config/db");

// Get orders pending payment check
const getPendingOrdersForAccounts = async (req, res) => {
  try {
    const [orders] = await db.promise().query(
      `SELECT o.id, o.customer_id, o.status, o.total_amount,
              SUM(p.amount) AS paid_amount
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id AND p.status='success'
       WHERE o.status='under_review'
       GROUP BY o.id`
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

    const [payments] = await db.promise().query(
      `SELECT id, payment_type, payment_mode, amount, status, created_at
       FROM payments WHERE order_id=?`,
      [id]
    );

    res.json({ success: true, data: payments });
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
    const [orderRows] = await db.promise().query(
      `SELECT status FROM orders WHERE id=?`,
      [order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderRows[0].status !== "under_review") {
      return res.status(400).json({ message: "Order is not in under_review status, cannot forward" });
    }

    // Update order status + assign to operations user
    await db.promise().query(
      `UPDATE orders 
       SET status='in_progress', assigned_to=?, updated_at=NOW() 
       WHERE id=?`,
      [assigned_to, order_id]
    );

    // Insert into logs
    await db.promise().query(
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


// =============================

module.exports = { getPendingOrdersForAccounts, getOrderPayments,forwardToOperations };