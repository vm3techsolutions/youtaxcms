const nodemailer = require("nodemailer");

const sendEmailOtp = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true if port = 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const subject = "Your OTP Code - Youtax";
  const message = `Your OTP is <b>${otp}</b>. It will expire in 5 minutes.`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #003366;">Youtax</h2>
      <p style="font-size: 16px; color: #333;">${message}</p>
      <p style="margin-top: 30px; font-size: 14px; color: #777;">If you did not request this, please ignore this email.</p>
      <hr style="margin-top: 30px;" />
      <p style="font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} youtax. All rights reserved.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `Youtax <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};

module.exports = { sendEmailOtp };
