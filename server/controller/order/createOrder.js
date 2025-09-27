const db = require("../../config/db");
const razorpay = require("../../config/razorpay");
// const crypto = require("crypto");


/**
 * Create a new order and Razorpay Payment Link (supports advance/full payment option)
 */
const createOrder = async (req, res) => {
  try {
    const { service_id, customer_name, customer_email, customer_contact, payment_option } = req.body;
    const customer_id = req.user ? req.user.id : null;

    if (!customer_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!service_id || !customer_name || !customer_email || !customer_contact || !payment_option) {
      return res.status(400).json({ message: "service_id, customer_name, customer_email, customer_contact and payment_option are required" });
    }

    // 1. fetch service pricing
    const [services] = await db.promise().query(
      "SELECT base_price, advance_price, service_charges, requires_advance FROM services WHERE id=?",
      [service_id]
    );
    if (!services || services.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const service = services[0];

    const basePrice = service.base_price ? parseFloat(service.base_price) : 0;
    const serviceCharges = service.service_charges ? parseFloat(service.service_charges) : 0;
    const advancePrice = service.advance_price ? parseFloat(service.advance_price) : 0;

    const totalAmount = basePrice + serviceCharges;

    let amountToPay = totalAmount; // default full payment
    let paymentType = "final";     // default payment type


    if (!advancePrice || advancePrice <= 0) {
      // No advance → full payment mandatory
      amountToPay = totalAmount;
      paymentType = "final";
      if (payment_option === "advance") {
        return res.status(400).json({
          message: "Advance payment not available for this service. Please pay full.",
        });
      }
    } else {
      // Advance available → customer choice
      if (payment_option === "advance") {
        amountToPay = advancePrice;
        paymentType = "advance";
      } else {
        amountToPay = totalAmount;
        paymentType = "final";
      }
    }

    // 🚨 validate before Razorpay call
    if (!amountToPay || amountToPay <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    // 2. insert order
    const [ins] = await db.promise().query(
      `INSERT INTO orders 
        (customer_id, service_id, status, total_amount, advance_required, advance_paid) 
       VALUES (?, ?, 'awaiting_payment', ?, ?, 0)`,
      [customer_id, service_id, totalAmount, service.advance_price || 0]
    );
    const orderId = ins.insertId;

    // 3. create Razorpay Payment Link
    // const paymentLink = await razorpay.paymentLink.create({
    //   amount: Math.round(amountToPay * 100), // paise
    //   currency: "INR",
    //   description: `Payment for service ${service_id}`,
    //   customer: {
    //     name: customer_name,
    //     email: customer_email,
    //     contact: customer_contact,
    //   },
    //   notify: { sms: true, email: true },
    //   reminder_enable: true,
    //   notes: {
    //     order_id: String(orderId),
    //     customer_id: String(customer_id),
    //     service_id: String(service_id),
    //     payment_option: payment_option || "full",
    //   },
    //   callback_url: "https://yourdomain.com/api/orders/verifyPaymentLink",
    //   callback_method: "get",
    // });

    let paymentLink;
try {
  paymentLink = await razorpay.paymentLink.create({
    amount: Math.round(amountToPay * 100),
    currency: "INR",
    description: `Payment for service ${service_id}`,
    customer: { name: customer_name, email: customer_email, contact: customer_contact },
    notify: { sms: true, email: true },
    reminder_enable: true,
    notes: {
      order_id: String(orderId),
      customer_id: String(customer_id),
      service_id: String(service_id),
      payment_option: paymentType,
    },
    callback_url: "http://localhost:3000/user/payment-success",
    callback_method: "get",
  });
} catch (err) {
  console.error("Razorpay Error (paymentLink.create):", err.error || err.message || err);
  return res.status(500).json({
    message: "Failed to create Razorpay Payment Link",
    error: err.error || err.message,
  });
}

    // insert payment record
    await db.promise().query(
      `INSERT INTO payments 
       (order_id, customer_id, amount, payment_type, payment_mode, status, txn_ref) 
       VALUES (?, ?, ?, ?, 'razorpay', 'initiated', ?)`,
      [
        orderId,
        customer_id,
        amountToPay,
        paymentType,
        paymentLink.id,
      ]
    );

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        status: "awaiting_payment",
        total_amount: totalAmount,
        service_charges: service.service_charges,
        advance_required: service.advance_price || 0,
      },
      razorpay: {
        payment_link: paymentLink.short_url,
        id: paymentLink.id,
        status: paymentLink.status,
      },
    });
  } catch (err) {
    console.error("DB Error (createOrder):", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const verifyPaymentLink = async (req, res) => {
  try {
    const { payment_link_id } = req.body;

    const paymentLink = await razorpay.paymentLink.fetch(payment_link_id);

    if (paymentLink.status !== "paid") {
      return res.json({ success: false, status: paymentLink.status });
    }

    // Fetch actual payment details from Razorpay
    let paymentId = null;
    let paymentMethod = null;

    if (paymentLink.payments && paymentLink.payments.length > 0) {
      // paymentId = paymentLink.payments[0].id;          // pay_xxx
      paymentMethod = paymentLink.payments[0].method;  // upi, card, etc.
    }

    // ✅ Update payments table
    await db.promise().query(
      `UPDATE payments 
       SET status='success', 
           payment_mode=? 
       WHERE txn_ref=?`,
      [paymentMethod || 'razorpay', payment_link_id]
    );

    // // ✅ Update orders table
    // await db.promise().query(
    //   `UPDATE orders 
    //    SET advance_paid=advance_required, status='in_progress'
    //    WHERE id=?`,
    //   [paymentLink.notes.order_id]
    // );


    // Fetch order
    const [orderRows] = await db.promise().query(
      `SELECT total_amount, advance_paid FROM orders WHERE id=?`,
      [paymentLink.notes.order_id]
    );
    const order = orderRows[0];

    // Calculate new advance_paid
    // const amountPaid = order.advance_paid + (paymentLink.amount / 100); // Razorpay returns paise
    const amountPaid = parseFloat(order.advance_paid || 0) + (paymentLink.amount / 100); // Razorpay amount is in paise

    // Determine payment status
    let newPaymentStatus = "unpaid";
    if (amountPaid >= order.total_amount) {
      newPaymentStatus = "paid";
    } else if (amountPaid > 0) {
      newPaymentStatus = "partially_paid";
    }




    // Update orders table with actual amountPaid
    const [orderResult] = await db.promise().query(
      `UPDATE orders 
       SET advance_paid=?, payment_status=?, status='awaiting_docs' 
       WHERE id=?`,
      [amountPaid, newPaymentStatus, paymentLink.notes.order_id]
    );
    console.log("Orders update affectedRows:", orderResult.affectedRows);

    res.json({
      success: true,
      message: "Payment verified",
      status: newPaymentStatus,
      payment_id: paymentId,
      method: paymentMethod,
      advance_paid: amountPaid,
    });
  } catch (err) {
    console.error("DB Error (verifyPaymentLink):", err);
    res.status(500).json({ message: "Database error" });
  }
};


const createPendingPaymentLink = async (req, res) => {
  try {
    const { order_id } = req.body;

    const [orderRows] = await db.promise().query(
      `SELECT total_amount, advance_paid, pending_amount, customer_id FROM orders WHERE id=?`,
      [order_id]
    );
    const order = orderRows[0];
    if (!order || order.pending_amount <= 0) {
      return res.status(400).json({ message: "No pending payment" });
    }

    const [customerRows] = await db.promise().query(
      `SELECT name, email, phone FROM customers WHERE id=?`,
      [order.customer_id]
    );
    const customer = customerRows[0];

    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(order.pending_amount * 100),
      currency: "INR",
      description: `Balance payment for order ${order_id}`,
      customer: { name: customer.name, email: customer.email, contact: customer.contact },
      notify: { sms: true, email: true },
      notes: { order_id: String(order_id) },
      callback_url: "http://localhost:3000/user/payment-success",
      callback_method: "get",
    });

    await db.promise().query(
      `INSERT INTO payments 
       (order_id, customer_id, amount, payment_type, payment_mode, status, txn_ref) 
       VALUES (?, ?, ?, 'final', 'razorpay', 'initiated', ?)`,
      [order_id, order.customer_id, order.pending_amount, paymentLink.id]
    );

    res.json({ success: true, payment_link: paymentLink.short_url, id: paymentLink.id });
  } catch (err) {
    console.error("DB Error (createPendingPaymentLink):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all orders for a customer by customer_id
 */
const getMyOrders = async (req, res) => {
  try {
 
    const customer_id = req.user ? req.user.id : null;

    if (!customer_id) {
      return res.status(400).json({ message: "customer_id is required" });
    }

    const [orders] = await db.promise().query(
      `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
      [customer_id]
    );

    res.json({ success: true, orders });
  } catch (err) {
    console.error("DB Error (getOrdersByCustomerId):", err);
    res.status(500).json({ message: "Database error" });
  }
};
const getOrdersByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id || (req.user && req.user.id);
    if (!customer_id) {
      return res.status(400).json({ message: "customer_id is required" });
    }

    const [orders] = await db.promise().query(
      `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
      [customer_id]
    );

    res.json({ success: true, orders });
  } catch (err) {
    console.error("DB Error (getOrdersByCustomerId):", err);
    res.status(500).json({ message: "Database error" });
  }
};

const getOrderPayments = async (req, res) => {
  try {
    const { order_id } = req.params;
    const customer_id = req.user ? req.user.id : null;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }
    if (!customer_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [payments] = await db.promise().query(
      `SELECT * FROM payments WHERE order_id = ? AND customer_id = ? ORDER BY created_at DESC`,
      [order_id, customer_id]
    );

    res.json({ success: true, payments });
  } catch (err) {
    console.error("DB Error (getOrderPayments):", err);
    res.status(500).json({ message: "Database error" });
  }
};


module.exports = { createOrder, verifyPaymentLink, createPendingPaymentLink, getMyOrders, getOrdersByCustomerId, getOrderPayments };
