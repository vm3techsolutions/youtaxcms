const db = require('../../config/db');
const crypto = require('crypto');
const twilio = require("twilio");
const { sendEmailOtp } = require('../../config/sendEmailOtp'); // adjust path


// Send OTP for email/phone
/**
 * Sends a 6-digit OTP to the user's email or phone based on the request type.
 * 
 * @async
 * @function sendOtp
 * @param {Object} req - Express request object containing user info and body with type ('email' or 'phone').
 * @param {Object} res - Express response object used to send status and JSON responses.
 * @returns {Promise<void>} Sends a JSON response indicating success or failure.
 *
 * @throws {400} If the request is invalid (missing customerId or invalid type).
 * @throws {404} If the user is not found in the database.
 * @throws {500} If OTP generation or sending fails.
 */

const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

async function sendSmsOtp(to, otp) {
  await client.messages.create({
    body: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    from: process.env.TWILIO_PHONE, // must be a valid Twilio number
    to: `+91${to}` // recipient number
  });
}


const sendOtp = async (req, res) => {
    const { type } = req.body; // only email/phone from body
    const customerId = req.user.id;
    if (!customerId || !['email', 'phone'].includes(type)) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 min validity

    const insertOtpSql = `INSERT INTO otps (customer_id, type, otp_code, expires_at) VALUES (?, ?, ?, ?)`;
    db.query(insertOtpSql, [customerId, type, otp, expiresAt], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to generate OTP', error: err });

        // TODO: send via email (Nodemailer) or SMS (Twilio/MSG91)

        try {
            if (type === "email") {
                // Fetch user email from DB
                db.query("SELECT email FROM customers WHERE id = ?", [customerId], async (e, r) => {
                    if (e || r.length === 0) return res.status(404).json({ message: "User not found" });
                    await sendEmailOtp(r[0].email, otp);
                });
            } else if (type === "phone") {
                // Fetch user phone
                db.query("SELECT phone FROM customers WHERE id = ?", [customerId], async (e, r) => {
                    if (e || r.length === 0) return res.status(404).json({ message: "User not found" });
                    await sendSmsOtp(r[0].phone, otp); // Or sendMsg91Otp
                });
            }
            console.log(`OTP for ${type}: ${otp}`);

            return res.status(200).json({ message: `OTP sent to ${type}` });
        } catch (sendErr) {
            return res.status(500).json({ message: "Failed to send OTP", error: sendErr });
        }
    });
};


/**
 * Verifies the OTP (One-Time Password) for email or phone verification.
 *
 * @async
 * @function verifyOtp
 * @param {Object} req - Express request object containing user and OTP data.
 * @param {Object} req.body - Request body containing 'type' and 'otp'.
 * @param {string} req.body.type - The type of verification ('email' or 'phone').
 * @param {string} req.body.otp - The OTP code to verify.
 * @param {Object} req.user - Authenticated user object.
 * @param {number} req.user.id - The ID of the customer.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with appropriate status and message based on OTP verification result.
 */

const verifyOtp = async (req, res) => {
    const { type, otp } = req.body;
    const customerId = req.user.id;
    if (!customerId || !otp || !['email', 'phone'].includes(type)) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const checkOtpSql = `SELECT * FROM otps WHERE customer_id = ? AND type = ? AND otp_code = ? AND verified = false ORDER BY created_at DESC LIMIT 1`;

    db.query(checkOtpSql, [customerId, type, otp], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(400).json({ message: 'Invalid OTP' });

        const record = results[0];
        if (new Date(record.expires_at) < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Mark OTP as used
        db.query(`UPDATE otps SET verified = true WHERE id = ?`, [record.id]);

        // Update customer verification field
        const field = type === 'email' ? 'email_verified' : 'phone_verified';
        db.query(`UPDATE customers SET ${field} = true WHERE id = ?`, [customerId]);

        return res.status(200).json({ message: `${type} verified successfully` });
    });
};

/**
 * Get customer's phone and email verification status.
 * @param {import('express').Request} req Express request object (expects req.user.id)
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getVerificationStatus = async (req, res) => {
  try {
    const customerId = req.user.id;
    if (!customerId) {
      return res.status(400).json({ message: "Invalid request" });
    }
    const [rows] = await db.promise().query(
      "SELECT email_verified, phone_verified FROM customers WHERE id = ?",
      [customerId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({
      email_verified: !!rows[0].email_verified,
      phone_verified: !!rows[0].phone_verified,
    });
  } catch (err) {
    console.error("Error fetching verification status:", err);
    res.status(500).json({ message: "Database error" });
  }
};

module.exports = { sendOtp, verifyOtp, getVerificationStatus };