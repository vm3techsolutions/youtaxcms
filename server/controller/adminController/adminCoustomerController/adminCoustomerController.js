const db = require("../../../config/db");

/**
 * Get a single customer (user) by ID from customers table
 */
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      SELECT id, name, email, phone, pancard, location, options, 
             email_verified, phone_verified, kyc_status, created_at
      FROM customers WHERE id = ?
    `;
    const [results] = await db.query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user: results[0] });
  } catch (err) {
    console.error("❌ Error fetching user by ID:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

/**
 * Get all customers (users) with their basic info.
 */
const getAllUsers = async (req, res) => {
  try {
    const sql = `
      SELECT id, name, email, phone, pancard, location, options, 
             email_verified, phone_verified, kyc_status, created_at 
      FROM customers
    `;
    const [results] = await db.query(sql);
    res.status(200).json({
      success: true,
      count: results.length,
      users: results,
    });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

/**
 * Get all orders with customer info
 */
const getAllOrders = async (req, res) => {
  try {
    const sql = `
      SELECT 
        o.*, 
        c.name AS customer_name, 
        c.email AS customer_email, 
        c.phone AS customer_phone, 
        s.name AS service_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN services s ON o.service_id = s.id
      ORDER BY o.created_at DESC
    `;
    const [results] = await db.query(sql);
    res.status(200).json({
      success: true,
      count: results.length,
      orders: results,
    });
  } catch (err) {
    console.error("❌ Error fetching all orders:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

/**
 * Get all orders by service id
 */
const getOrdersByServiceId = async (req, res) => {
  const { service_id } = req.params;
  try {
    const sql = `
      SELECT 
        o.*, 
        c.name AS customer_name, 
        c.email AS customer_email, 
        c.phone AS customer_phone, 
        s.name AS service_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN services s ON o.service_id = s.id
      WHERE o.service_id = ?
      ORDER BY o.created_at DESC
    `;
    const [results] = await db.query(sql, [service_id]);
    res.status(200).json({
      success: true,
      count: results.length,
      orders: results,
    });
  } catch (err) {
    console.error("❌ Error fetching orders by service id:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

/**
 * Get all order logs with customer and user names
 */
const getAllOrderLogs = async (req, res) => {
  try {
    const sql = `
      SELECT 
        ol.*, 
        c.name AS customer_name,
        fu.name AS from_user_name,
        tu.name AS to_user_name,
        s.name AS service_name
      FROM order_logs ol
      LEFT JOIN orders o ON ol.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN admin_users fu ON ol.from_user = fu.id
      LEFT JOIN admin_users tu ON ol.to_user = tu.id
      LEFT JOIN services s ON o.service_id = s.id
      ORDER BY ol.created_at DESC
    `;
    const [results] = await db.query(sql);
    res.status(200).json({
      success: true,
      count: results.length,
      logs: results,
    });
  } catch (err) {
    console.error("❌ Error fetching order logs:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

/**
 * Get all order logs by order id
 */
const getOrderLogsByOrderId = async (req, res) => {
  const { order_id } = req.params;
  try {
    const sql = `
      SELECT 
        ol.*, 
        c.name AS customer_name,
        fu.name AS from_user_name,
        tu.name AS to_user_name,
        s.name AS service_name
      FROM order_logs ol
      LEFT JOIN orders o ON ol.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN admin_users fu ON ol.from_user = fu.id
      LEFT JOIN admin_users tu ON ol.to_user = tu.id
      LEFT JOIN services s ON o.service_id = s.id
      WHERE ol.order_id = ?
      ORDER BY ol.created_at DESC
    `;
    const [results] = await db.query(sql, [order_id]);
    res.status(200).json({
      success: true,
      count: results.length,
      logs: results,
    });
  } catch (err) {
    console.error("❌ Error fetching order logs by order id:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

module.exports = { 
  getUserById, 
  getAllUsers, 
  getAllOrders, 
  getOrdersByServiceId,
  getAllOrderLogs,
  getOrderLogsByOrderId
};