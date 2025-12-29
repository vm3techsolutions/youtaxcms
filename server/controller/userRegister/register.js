const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../../config/db");
const sendEmail = require("../../config/forgotMail");
const sendWelcomeMail = require("../../utils/welcomeMail");

// ✅ SIGNUP
const userSignUp = async (req, res) => {
  const { name, email, password, phone, pancard, location, state, gst_number, options } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  try {
    // 1️⃣ Check if user already exists
    const [existing] = await db.query("SELECT id FROM customers WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Customer already exists" });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Insert new customer
    const insertSql = `
      INSERT INTO customers 
      (name, email, password_hash, phone, pancard, location, state, gst_number, options, email_verified, phone_verified, kyc_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(insertSql, [
      name,
      email,
      hashedPassword,
      phone || null,
      pancard || null,
      location || null,
      state || null,
      gst_number || null,
      options || null,
      false,
      false,
      "pending",
    ]);

    // 4️⃣ Send welcome mail
    await sendWelcomeMail(email, name);

    return res.status(200).json({ message: "Signup successful" });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    return res.status(500).json({ message: "Unexpected error", error: err.message });
  }
};

// ✅ LOGIN
const userLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt with email:", email);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    // 1️⃣ Fetch customer
    const [rows] = await db.query("SELECT * FROM customers WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const customer = rows[0];

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Generate JWT
    const token = jwt.sign(
      { id: customer.id, name: customer.name, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: "7h" }
    );

    // 4️⃣ Respond
    return res.status(200).json({
      message: "Login successful",
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "Not provided",
        pancard: customer.pancard || "Not provided",
        location: customer.location || "Not provided",
        state: customer.state || "Not provided",
        gst_number: customer.gst_number || "Not provided",
        options: customer.options || "Not provided",
        email_verified: customer.email_verified,
        phone_verified: customer.phone_verified,
        kyc_status: customer.kyc_status,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ message: "Database or server error", error: err.message });
  }
};

// ✅ FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [customers] = await db.query("SELECT * FROM customers WHERE email = ?", [email]);
    if (customers.length === 0) {
      return res.status(400).json({ error: "Customer not found" });
    }

    const customer = customers[0];
    const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${process.env.FRONT_END_URL}/reset-password?token=${token}`;

    await sendEmail(email, "Password Reset", `Reset your password here: <a href='${resetLink}'>${resetLink}</a>`);

    return res.json({ success: true, message: "Password reset link sent to email" });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ RESET PASSWORD
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [customers] = await db.query("SELECT * FROM customers WHERE id = ?", [decoded.id]);
    if (customers.length === 0) {
      return res.status(400).json({ error: "Customer not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE customers SET password_hash = ? WHERE id = ?", [hashedPassword, decoded.id]);

    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    return res.status(400).json({ error: "Invalid or expired token" });
  }
};

// ✅  customer stats

const getCustomerStats = async (req, res) => {
  try {
    const customerId = req.user && req.user.id;
    if (!customerId) return res.status(401).json({ message: "Unauthorized" });

    const [[totalRows]] = await db.query(
      "SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?  AND status !='awaiting_payment'",
      [customerId]
    );
    const [[completedRows]] = await db.query(
      "SELECT COUNT(*) AS count FROM orders WHERE customer_id = ? AND status = 'completed'",
      [customerId]
    );
    const [[inProgressRows]] = await db.query(
      "SELECT COUNT(*) AS count FROM orders WHERE customer_id = ? AND status != 'completed' AND status !='awaiting_payment'",
      [customerId]
    );
    const [[pendingPaymentRows]] = await db.query(
      "SELECT COUNT(*) AS count FROM orders WHERE customer_id = ? AND payment_status = 'partially_paid'",
      [customerId]
    );

    res.status(200).json({
      success: true,
      data: {
        totalOrders: totalRows.count || 0,
        completedOrders: completedRows.count || 0,
        inProgressOrders: inProgressRows.count || 0,
        pendingPayments: pendingPaymentRows.count || 0,
      },
    });
  } catch (err) {
    console.error("DB Error (getCustomerStats):", err);
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

module.exports = {
  userSignUp,
  userLogin,
  forgotPassword,
  resetPassword,
  getCustomerStats,
};
