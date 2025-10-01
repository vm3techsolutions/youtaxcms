const sendEmail = require("../config/forgotMail");

/**
 * Sends final payment request email when deliverable is available.
 * 
 * @param {string} email - Customer's email
 * @param {string} name - Customer's name
 * @param {number} orderId - Related order ID
 */
const sendFinalPaymentMail = async (email, name, orderId) => {
  const subject = "⚡ Pending Payment – Your Deliverable is Ready";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; padding:20px;">
      <h2 style="color:#FF5722;">Hello ${name},</h2>
      <p>Your deliverable for <strong>Order #${orderId}</strong> is now available.</p>
      <p>To access it, please complete your <strong>pending payment</strong>.</p>
      <br/>
      <a href="${process.env.FRONT_END_URL}/user/login" 
         style="display:inline-block;background:#FF5722;color:#fff;
                padding:12px 20px;text-decoration:none;border-radius:5px;">
        Pay Pending Amount
      </a>
      <br/><br/>
      <p>If you have any questions, our support team is here to help.</p>
      <br/>
      <p>Best Regards,<br/><strong>The Team</strong></p>
    </div>
  `;

  try {
    await sendEmail(email, subject, htmlContent);
    console.log(`✅ Final payment email sent to ${email}`);
  } catch (err) {
    console.error("❌ Error sending final payment email:", err);
  }
};

module.exports = sendFinalPaymentMail;

