const db = require("../../config/db");
const razorpay = require("../../config/razorpay");
// const crypto = require("crypto");


/**
 * Create a new order and Razorpay Payment Link
 */
const createOrder = async (req, res) => {
  try {
    const { service_id, customer_name, customer_email, customer_contact } = req.body;
    const customer_id = req.user ? req.user.id : null;

    if (!customer_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. fetch service pricing
    const [services] = await db.promise().query(
      "SELECT base_price, advance_price, requires_advance FROM services WHERE id=?",
      [service_id]
    );
    if (!services || services.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const service = services[0];
    const totalAmount = parseFloat(service.base_price) || 0;
    const advanceRequired = service.requires_advance
      ? parseFloat(service.advance_price) || 0
      : 0;
      

    // 2. insert order
    const [ins] = await db.promise().query(
      `INSERT INTO orders (customer_id, service_id, status, total_amount, advance_required, advance_paid) 
       VALUES (?, ?, 'awaiting_payment', ?, ?, 0)`,
      [customer_id, service_id, totalAmount, advanceRequired]
    );
    const orderId = ins.insertId;

    // 3. create Razorpay Payment Link (instead of Checkout order)
    let paymentLink = null;
    if (advanceRequired > 0) {
      paymentLink = await razorpay.paymentLink.create({
        amount: Math.round(advanceRequired * 100), // paise
        currency: "INR",
        description: `Advance payment for service ${service_id}`,
        customer: {
          name: customer_name,
          email: customer_email,
          contact: customer_contact,
        },
        notify: { sms: true, email: true },
        reminder_enable: true,
        notes: {
          order_id: String(orderId),
          customer_id: String(customer_id),
          service_id: String(service_id),
        },
        callback_url: "https://yourdomain.com/api/orders/verifyPaymentLink",
        callback_method: "get",
      });

      // insert payment record
      await db.promise().query(
        `INSERT INTO payments (order_id, customer_id, amount, payment_type, payment_mode, status, txn_ref) 
         VALUES (?, ?, ?, 'advance', 'razorpay', 'initiated', ?)`,
        [orderId, customer_id, advanceRequired, paymentLink.id]
      );
    }

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        status: "awaiting_payment",
        total_amount: totalAmount,
        advance_required: advanceRequired,
      },
      razorpay: paymentLink
        ? {
            payment_link: paymentLink.short_url, // 🔗 open this in browser
            id: paymentLink.id,
            status: paymentLink.status,
          }
        : null,
    });
  } catch (err) {
    console.error("DB Error (createOrder):", err);
    res.status(500).json({ message: "Database error" });
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
      [ paymentMethod || 'razorpay', payment_link_id]
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
       SET advance_paid=?, payment_status=?, status='in_progress' 
       WHERE id=?`,
      [ amountPaid,newPaymentStatus, paymentLink.notes.order_id]
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
      callback_url: "https://yourdomain.com/api/orders/verifyPaymentLink",
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

module.exports = { createOrder, verifyPaymentLink, createPendingPaymentLink };
