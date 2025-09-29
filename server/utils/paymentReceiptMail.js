// utils/paymentReceiptMail.js
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const db = require("../config/db");
const path = require("path");
const fs = require("fs");
const s3 = require("../config/aws");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

// Convert image to base64 for embedding in HTML email
function imageToBase64(imgPath) {
  if (!fs.existsSync(imgPath)) return null;
  const img = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).slice(1);
  return `data:image/${ext};base64,${img.toString("base64")}`;
}

async function sendPaymentReceiptMail(arg1, customerEmail) {
  try {
    let paymentId;
    let email;
    let overrides = {};

    if (arg1 && typeof arg1 === "object" && !Array.isArray(arg1)) {
      paymentId = arg1.paymentId || arg1.id || arg1.payment_id;
      email = arg1.email || customerEmail;
      overrides = arg1;
    } else {
      paymentId = arg1;
      email = customerEmail;
    }

    if (!paymentId) {
      console.error("❌ sendPaymentReceiptMail: missing paymentId");
      return;
    }

    // -----------------------------
    // Fetch payment + order + service + customer info
    // -----------------------------
    const query = `
      SELECT 
        p.id AS payment_id,
        p.order_id,
        p.customer_id,
        p.amount,
        p.payment_type,
        p.payment_mode,
        p.status,
        p.txn_ref,
        p.created_at AS payment_date,
        o.id AS order_id,
        s.name AS service_name,
        c.name AS customer_name,
        c.email AS customer_email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN services s ON o.service_id = s.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
      LIMIT 1
    `;
    const [results] = await db.promise().query(query, [paymentId]);
    if (!results || results.length === 0) {
      console.error("❌ No payment found with ID:", paymentId);
      return;
    }

    const payment = results[0];

    const serviceName = overrides.serviceName || payment.service_name || "N/A";
    const customerName =
      overrides.name || payment.customer_name || `Customer_${payment.customer_id}`;
    const customerEmailFinal = email || payment.customer_email;
    const amountPaid =
      overrides.amount !== undefined ? overrides.amount : payment.amount || 0;
    const paymentMode = overrides.paymentMode || payment.payment_mode || "Online";
    const paidDate =
      overrides.date || new Date(payment.payment_date).toLocaleString();
    const status = overrides.status || payment.status || "Paid";

    // -----------------------------
    // Generate PDF receipt with logo
    // -----------------------------
    const tmpDir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const fileName = `${customerName}_receipt_payment_${payment.payment_id}.pdf`;
    const filePath = path.join(tmpDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ✅ Register fonts
    const regularFontPath = path.join(__dirname, "NotoSans-Regular.ttf");
    const boldFontPath = path.join(__dirname, "NotoSans-Bold.ttf");

    if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
      console.error("⚠️ Missing font files! Please add NotoSans-Regular.ttf and NotoSans-Bold.ttf in utils/");
    }

    doc.registerFont("Noto", regularFontPath);
    doc.registerFont("Noto-Bold", boldFontPath);

    // Default font
    doc.font("Noto");

    // Logo
    const logoPath = path.resolve(__dirname, "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 120 });
    }

    // Header
    doc
      .font("Noto-Bold")
      .fontSize(16)
      .fillColor("#4CAF50")
      .text("Youtax Solutions Pvt. Ltd.", 200, 50, { align: "right" })
      .fillColor("#333")
      .font("Noto")
      .fontSize(10)
      .text("Pune, Maharashtra, India", { align: "right" })
      .text("GST Number: 27AAPFV4818G1ZQ", { align: "right" })
      .text("Email: support@youtax.in", { align: "right" })
      .moveDown(3);

    // Billing info
    doc
      .font("Noto-Bold")
      .fontSize(12)
      .fillColor("#000")
      .text("Billed To:", 50, doc.y)
      .moveDown(0.3);
    doc.font("Noto").text(`${customerName}`).text(`${customerEmailFinal}`).moveDown(1);

    // Invoice Info
    const invoiceTop = 160;
    doc.font("Noto-Bold").fontSize(12).text("Invoice", 400, invoiceTop);
    doc
      .font("Noto")
      .fontSize(10)
      .text(`Invoice #: ${payment.payment_id}`, 400, invoiceTop + 20)
      .text(`Date: ${paidDate}`, 400, invoiceTop + 35);

    doc.moveDown(3);

    // Table header
    const tableTop = doc.y + 10;
    const itemX = 50;
    const colWidths = [200, 120, 80, 100];
    doc.rect(itemX, tableTop, 500, 20).fill("#003366").stroke();
    const headers = ["Description", "Service", "Qty", "Amount"];
    doc.fillColor("#fff").font("Noto-Bold").fontSize(10);
    headers.forEach((header, i) => {
      doc.text(
        header,
        itemX + (i === 0 ? 10 : colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 10),
        tableTop + 5
      );
    });

    // Table row
    const rowY = tableTop + 25;
    doc.fillColor("#000").font("Noto").fontSize(10);
    doc.rect(itemX, rowY, 500, 20).stroke();
    doc.text("Youtax Service Subscription", itemX + 10, rowY + 5);
    doc.text(serviceName, itemX + colWidths[0] + 10, rowY + 5);
    doc.text("1", itemX + colWidths[0] + colWidths[1] + 10, rowY + 5);
    doc.text(`₹${amountPaid}`, itemX + colWidths[0] + colWidths[1] + colWidths[2] + 10, rowY + 5);

    // Total
    const totalsY = rowY + 50;
    doc.font("Noto-Bold").fontSize(12)
      .text(`Total: ₹${amountPaid}`, 400, totalsY, { align: "right" });

    // Footer
    doc.moveDown(5);
    doc.font("Noto").fontSize(10).fillColor("#777")
      .text("Thank you for your business!", { align: "center" })
      .text("Youtax.in", { align: "center", link: "https://youtax.in", underline: true });

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // -----------------------------
    // Upload PDF to S3
    // -----------------------------
    const safeCustomerName = customerName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const s3Key = `uploads/receipts/${payment.customer_id}_${safeCustomerName}_${payment.order_id}/${timestamp}_${fileName}`;

    const pdfBuffer = await fs.promises.readFile(filePath);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    const s3Url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${s3Key}`;

    // Ensure receipt_url column exists
    const [columns] = await db.promise().query("SHOW COLUMNS FROM payments LIKE 'receipt_url'");
    if (columns.length === 0) {
      await db.promise().query("ALTER TABLE payments ADD COLUMN receipt_url VARCHAR(500)");
    }

    await db.promise().query(
      "UPDATE payments SET receipt_url = ? WHERE id = ?",
      [s3Url, payment.payment_id]
    );
    console.log("✅ Receipt URL saved to payments table");

    // -----------------------------
    // Send email with logo and attachment
    // -----------------------------
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT == "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });

    const logoBase64 = imageToBase64(logoPath);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        ${logoBase64 ? `<img src="${logoBase64}" width="120" style="display:block;margin-bottom:20px;" />` : ""}
        <h2 style="color: #4CAF50;">Youtax</h2>
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>We’re confirming that your payment of 
          <strong style="color: #4CAF50;">₹${amountPaid}</strong> 
          for <strong>${serviceName}</strong> has been received successfully 🎉.
        </p>
        <table style="border-collapse: collapse; margin: 20px 0; width: 100%; max-width: 500px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice #</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${payment.payment_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Service</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #4CAF50;">${status}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Mode</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${paymentMode}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Paid</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${amountPaid}</td>
          </tr>
        </table>
        <p>You can download your official receipt attached below as a PDF.</p>
        <p>Best regards,<br/><strong>The Youtax Team</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Youtax" <${process.env.EMAIL_USER}>`,
      to: customerEmailFinal,
      subject: `✅ Payment Receipt - Payment #${payment.payment_id}`,
      html: htmlContent,
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    });
    console.log("✅ Payment receipt email sent to:", customerEmailFinal);

    // Cleanup temp PDF
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.warn("⚠️ Could not delete temp file:", err);
    }

    return { emailSent: true };
  } catch (error) {
    console.error("❌ Error sending payment receipt:", error);
    return { emailSent: false };
  }
}

module.exports = sendPaymentReceiptMail;
