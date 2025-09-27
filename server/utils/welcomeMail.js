// utils/welcomeMail.js
const sendEmail = require("../config/forgotMail");

/**
 * Sends a formatted welcome email to the user after successful signup.
 * 
 * @param {string} email - User's email address
 * @param {string} name - User's name
 */
const sendWelcomeMail = async (email, name) => {
  const subject = "🎉 Welcome to Our Platform!";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #4CAF50;">Welcome, ${name} 👋</h2>
      <p>We’re thrilled to have you join <strong>Our Platform</strong>.</p>
      <p>You can now log in and start exploring our services.</p>
      <br/>
      <a href="${process.env.FRONT_END_URL}/user/login" 
         style="display: inline-block; background: #4CAF50; color: #fff; 
                padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Login Now
      </a>
      <br/><br/>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <br/>
      <p>Best regards,<br/><strong>The Team</strong></p>
      <br/>
    </div>
  `;

  try {
    await sendEmail(email, subject, htmlContent);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (err) {
    console.error("❌ Error sending welcome email:", err);
  }
};

module.exports = sendWelcomeMail;