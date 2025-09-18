const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../../config/db");
const sendEmail = require("../../config/forgotMail");

// Signup
/**
 * Handles user signup by validating input, checking for existing users,
 * hashing the password, and inserting a new customer record into the database.
 * Responds with appropriate status codes and messages based on the outcome.
 *
 * @async
 * @function userSignUp
 * @param {Object} req - Express request object containing user signup data in req.body.
 * @param {Object} res - Express response object used to send responses.
 * @returns {void}
 */

const userSignUp = async (req, res) => {
  const { name, email, password, phone, pancard, location, options } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const checkSql = 'SELECT * FROM customers WHERE email = ?';
    db.query(checkSql, [email], async (checkErr, results) => {
      if (checkErr) return res.status(500).json({ message: 'Database error' });
      if (results.length > 0) return res.status(409).json({ message: 'Customer already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = `INSERT INTO customers (name, email, password_hash, phone, pancard, location, options, email_verified, phone_verified, kyc_status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(
        insertSql,
        [
          name,
          email,
          hashedPassword,
          phone || null,
          pancard || null,
          location || null,
          options || null,
          false, // email_verified
          false, // phone_verified
          'pending' // kyc_status
        ],
        (err) => {
          if (err) return res.status(500).json({ message: 'Insert failed', error: err });
          return res.status(200).json({ message: 'Signup successful' });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ message: 'Unexpected error', error: err });
  }
};

// Login

/**
 * Handles user login by validating credentials, checking for existing users,
 * comparing password hashes, and generating a JWT token for authenticated sessions.
 * Responds with appropriate status codes and messages based on the outcome.
 *
 * @function userLogin
 * @param {Object} req - Express request object containing login data in req.body.
 * @param {Object} res - Express response object used to send responses.
 * @returns {void}
 */

const userLogin = (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt with email:", email);

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const sql = "SELECT * FROM customers WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const customer = results[0];
    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: customer.id, name: customer.name, email: customer.email }, process.env.JWT_SECRET, { expiresIn: '7h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "Not provided",
    pancard: customer.pancard || "Not provided",
    location: customer.location || "Not provided",
    options: customer.options || "Not provided",
    email_verified: customer.email_verified,
    phone_verified: customer.phone_verified,
    kyc_status: customer.kyc_status
      }
    });
  });
};


/**
 * Handles forgot password requests by verifying the user's email,
 * generating a password reset token, and sending a reset link via email.
 * Responds with appropriate status codes and messages based on the outcome.
 *
 * @async
 * @function forgotPassword
 * @param {Object} req - Express request object containing the user's email in req.body.
 * @param {Object} res - Express response object used to send responses.
 * @returns {void}
 */

// Forgot Password
const forgotPassword = async (req, res) => {
  console.log("Forgot Password endpoint hit");
  const { email } = req.body;

  try {
    db.query("SELECT * FROM customers WHERE email = ?", [email], async (err, customers) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!customers || customers.length === 0) return res.status(400).json({ error: "Customer not found" });

      const customer = customers[0];
      const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
      const resetLink = `${process.env.FRONT_END_URL}/reset-password?token=${token}`;

      await sendEmail(email, "Password Reset", `Reset your password here: <a href='${resetLink}'>${resetLink}</a>`);

      res.json({ success: true, message: "Password reset link sent to email" });
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Handles password reset requests by verifying the reset token,
 * hashing the new password, and updating the user's password in the database.
 * Responds with appropriate status codes and messages based on the outcome.
 *
 * @async
 * @function resetPassword
 * @param {Object} req - Express request object containing the reset token and new password in req.body.
 * @param {Object} res - Express response object used to send responses.
 * @returns {void}
 */

// Reset Password
const resetPassword = async (req, res) => {
  console.log("Reset Password endpoint hit");
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    db.query("SELECT * FROM customers WHERE id = ?", [decoded.id], async (err, customers) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!customers || customers.length === 0) return res.status(400).json({ error: "Customer not found" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query("UPDATE customers SET password_hash = ? WHERE id = ?", [hashedPassword, decoded.id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true, message: "Password reset successful" });
      });
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  userSignUp,
  userLogin,
  forgotPassword,
  resetPassword,
};
