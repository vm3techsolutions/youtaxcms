const sendEmail = require("../config/forgotMail");

/**
 * Sends a formatted support ticket email to the company and confirmation to customer.
 * 
 * @param {Object} params
 * @param {string} params.customerName - Customer's name
 * @param {string} params.customerEmail - Customer's email
 * @param {string|number} params.orderId - Order ID (optional)
 * @param {string} params.subject - Ticket subject
 * @param {string} params.description - Ticket description
 * @param {string|number} params.ticketId - Ticket ID
 */
const sendSupportTicketMail = async ({
  customerName,
  customerEmail,
  customerPhone,
  orderId,
  subject,
  description,
  ticketId,
}) => {
  // Mail to company
  const mailSubject = `New Support Ticket: ${subject}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #4CAF50;">New Support Ticket Created</h2>
      <p><strong>Customer Name:</strong> ${customerName || "N/A"}</p>
      <p><strong>Customer Email:</strong> ${customerEmail || "N/A"}</p>
    <p><strong>Customer Contact:</strong> ${customerPhone || "N/A"}</p>
      <p><strong>Order ID:</strong> ${orderId || "N/A"}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Description:</strong><br/>${description}</p>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
    </div>
  `;

  // Confirmation mail to customer
  const confirmSubject = `Your Support Ticket #${ticketId} has been created`;
  const confirmHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #4CAF50;">Hi ${customerName},</h2>
      <p>We’ve received your support request and our team will review it soon.</p>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Description:</strong><br/>${description}</p>
      <br/>
      <p>We'll get back to you shortly.</p>
      <p>Thank you for contacting support.</p>
      <br/>
      <p>Best regards,<br/><strong>The Support Team</strong></p>
    </div>
  `;

  try {
    // Send to company
    await sendEmail(process.env.EMAIL_USER, mailSubject, htmlContent);
    console.log(`✅ Support ticket email sent to company`);

    // Send confirmation to customer
    await sendEmail(customerEmail, confirmSubject, confirmHtml);
    console.log(`✅ Confirmation mail sent to customer ${customerEmail}`);
  } catch (err) {
    console.error("❌ Error sending support ticket email:", err);
  }
};

module.exports = sendSupportTicketMail;