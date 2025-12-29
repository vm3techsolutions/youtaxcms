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
   console.log("🚀 sendPaymentReceiptMail() triggered");
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
    // Fetch payment + order + service + customer info (with GST fields)
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
        o.taxable_amount,
        o.gst_rate,
        o.gst_amount,
        o.total_amount,
        o.advance_paid,
        s.name AS service_name,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.location AS customer_location
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN services s ON o.service_id = s.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
      LIMIT 1
    `;
    const [results] = await db.query(query, [paymentId]);
    if (!results || results.length === 0) {
      console.error("❌ No payment found with ID:", paymentId);
      return;
    }

    const payment = results[0];

    const serviceName = overrides.serviceName || payment.service_name || "N/A";
    const customerName =
      overrides.name || payment.customer_name || `Customer_${payment.customer_id}`;
    const customerEmailFinal = email || payment.customer_email;
    const customerPhone = payment.customer_phone || "N/A";
    const customerLocation = payment.customer_location || "N/A";
    const paymentType = overrides.paymentType || payment.payment_type || "N/A";

    const amountPaid =
      overrides.amount !== undefined ? overrides.amount : payment.amount || 0;
    const paymentMode = overrides.paymentMode || payment.payment_mode || "Online";
    const paidDate =
      overrides.date || new Date(payment.payment_date).toLocaleString();
    const status = overrides.status || payment.status || "Paid";

    // Store GST values safely (avoid undefined)
    const taxableAmount = Number(payment.taxable_amount || 0);
    const gstRate = Number(payment.gst_rate || 0);
    const gstAmount = Number(payment.gst_amount || 0);
    const totalAmount = Number(payment.total_amount || 0);
    const advancePaid = Number(payment.advance_paid || 0);
    const finalPaid = Number(amountPaid || 0);

    // Calculate pending amount (for advance invoices)
    const pendingAmount = Math.max(totalAmount - advancePaid, 0);

    // -----------------------------
    // Generate PDF receipt (only for final payments)
    // -----------------------------
    let fileName, filePath, s3Url;
    // Resolve logo path: prefer utils/logo.png, fallback to client public assets
    const logoCandidates = [
      path.resolve(__dirname, "logo.png"),
      path.resolve(__dirname, "..", "..", "client", "public", "assets", "logo", "logo.png"),
      path.resolve(__dirname, "..", "..", "client", "public", "assets", "logo", "youtax.png"),
      path.resolve(__dirname, "..", "..", "client", "public", "assets", "logo", "youtax-logo.png"),
    ];
    const logoPath = logoCandidates.find((p) => fs.existsSync(p)) || logoCandidates[0];
    // Prepare base64 for embedding (used in HTML and PDF)
    const logoBase64ForPdf = imageToBase64(logoPath);
    if (paymentType !== "advance") {
      const tmpDir = path.join(__dirname, "../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      fileName = `${customerName}_receipt_payment_${payment.payment_id}.pdf`;
      filePath = path.join(tmpDir, fileName);

      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const regularFontPath = path.join(__dirname, "NotoSans-Regular.ttf");
      const boldFontPath = path.join(__dirname, "NotoSans-Bold.ttf");

      if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
        console.error(
          "⚠️ Missing font files! Please add NotoSans-Regular.ttf and NotoSans-Bold.ttf in utils/"
        );
      }

      doc.registerFont("Noto", regularFontPath);
      doc.registerFont("Noto-Bold", boldFontPath);

      doc.font("Noto");

      // Embed logo image in PDF (if available) so it's visible in PDF only
      try {
        if (logoBase64ForPdf) {
          const base64Data = logoBase64ForPdf.split(",")[1];
          const imgBuf = Buffer.from(base64Data, "base64");
          doc.image(imgBuf, 50, 45, { width: 100 });
        }
      } catch (e) {
        // ignore image embedding errors
        console.error("⚠️ Could not embed logo into PDF:", e.message || e);
      }

      doc
      .font("Noto-Bold")
      .fontSize(16)
      .fillColor("#003366")
      .text("Youtax India Consulting Pvt. Ltd.", 200, 50, { align: "right" })
      .fillColor("#333")
      .font("Noto")
      .fontSize(10)
      .text("Pune, Maharashtra, India", { align: "right" })
      .text("Email: support@youtax.in", { align: "right" })
      .text("GST: 27AABCY0470A2ZQ", { align: "right" })
      .moveDown(3);

    doc.font("Noto-Bold").fontSize(12).fillColor("#000").text("Billed To:", 50, doc.y);

      doc
        .font("Noto")
        .text(`${customerName}`)
        .text(`${customerEmailFinal}`)
        .text(`Phone: ${customerPhone}`)
        .text(`Location: ${customerLocation}`)
        .moveDown(1);

      const invoiceTop = 180;
      doc.font("Noto-Bold").fontSize(12).text("Invoice", 400, invoiceTop);
      doc
        .font("Noto")
        .fontSize(10)
        .text(`Invoice : ${payment.payment_id}`, 400, invoiceTop + 20)
        .text(`Date: ${paidDate}`, 400, invoiceTop + 35)
        .text(`Payment Type: ${paymentType}`, 400, invoiceTop + 50); 

      if (payment.txn_ref) {
        doc.text(`Txn Ref: ${payment.txn_ref}`, 400, invoiceTop + 65);
      }

      doc.moveDown(3);

      const tableTop = doc.y + 10;
      const itemX = 50;
      const colWidths = [180, 120, 60, 80, 60];
      doc.rect(itemX, tableTop, 500, 20).fill("#003366").stroke();
      const headers = ["Description", "Service", "Qty", "Amount", "Payment Type"];
      doc.fillColor("#fff").font("Noto-Bold").fontSize(10);

      headers.forEach((header, i) => {
        doc.text(
          header,
          itemX + (i === 0 ? 10 : colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 10),
          tableTop + 5
        );
      });

      const rowY = tableTop + 25;
      doc.fillColor("#000").font("Noto").fontSize(10);
      doc.rect(itemX, rowY, 500, 20).stroke();
      doc.text("Youtax Service Subscription", itemX + 10, rowY + 5);
      doc.text(serviceName, itemX + colWidths[0] + 10, rowY + 5);
      doc.text("1", itemX + colWidths[0] + colWidths[1] + 10, rowY + 5);
      doc.text(`₹${Number(amountPaid).toFixed(2)}`, itemX + colWidths[0] + colWidths[1] + colWidths[2] + 10, rowY + 5);
      doc.text(`${String(paymentType).charAt(0).toUpperCase() + String(paymentType).slice(1)}`, itemX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 10, rowY + 5);

      let summaryY = rowY + 40;

      doc.font("Noto").fontSize(10);

      doc.text(`Taxable Amount: ₹${taxableAmount.toFixed(2)}`, 350, summaryY, { align: "right" });
      summaryY += 15;

      doc.text(`GST @ ${gstRate}%: ₹${gstAmount.toFixed(2)}`, 350, summaryY, { align: "right" });
      summaryY += 15;

      doc.font("Noto-Bold");
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 350, summaryY, { align: "right" });
      summaryY += 20;

      doc.font("Noto");

      // Advance Invoice
      if (paymentType === "advance") {
        doc.text(`Advance Paid: ₹${finalPaid.toFixed(2)}`, 350, summaryY, { align: "right" });
        summaryY += 15;

        doc.font("Noto-Bold").fillColor("red");
        doc.text(`Pending Amount: ₹${pendingAmount.toFixed(2)}`, 350, summaryY, { align: "right" });
        doc.fillColor("black");
      }

      // Final Invoice
      if (paymentType === "final") {
        doc.font("Noto-Bold").fontSize(12);
        doc.text(`Final Amount Paid: ₹${totalAmount.toFixed(2)}`, 350, summaryY, { align: "right" });
      }

      doc.moveDown(5);
      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc
        .font("Noto")
        .fontSize(10)
        .fillColor("#777")
        .text("Thank you for your business!", doc.page.margins.left, doc.y, {
          width: pageWidth,
          align: "center",
        })
        .moveDown(0.3)
        .text("Youtax.in", doc.page.margins.left, doc.y, {
          width: pageWidth,
          align: "center",
          link: "https://youtax.in",
          underline: true,
        });

      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
      console.log("📄 PDF generated:", fileName);
      // -----------------------------
      // Upload PDF to S3
      // -----------------------------
      const safeCustomerName = customerName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");
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

      s3Url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${s3Key}`;

      const [columns] = await db.query(
        "SHOW COLUMNS FROM payments LIKE 'receipt_url'"
      );
      if (columns.length === 0) {
        await db.query("ALTER TABLE payments ADD COLUMN receipt_url VARCHAR(500)");
      }

      await db.query(
        "UPDATE payments SET receipt_url = ? WHERE id = ?",
        [s3Url, payment.payment_id]
      );
    }

    // -----------------------------
    // Send EMAIL (UPDATED DESIGN)
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

    // Logo identifiers: we'll use CID in email HTML and attach the same image as an inline buffer (no filename) so it's displayed but not downloadable
    const logoCid = "youtaxlogo@cid";
    // logoBase64ForPdf contains the data URI used to embed into the PDF; we'll convert it to a buffer and attach inline for email clients

    // Fetch any advance payment rows for this order to display history
    let advancePayments = [];
    try {
      const [advRows] = await db.query(
        `SELECT id, amount, payment_type, status, created_at FROM payments WHERE order_id = ? AND payment_type = 'advance' ORDER BY created_at ASC`,
        [payment.order_id]
      );
      advancePayments = advRows || [];
    } catch (e) {
      console.error("❌ Error fetching advance payments:", e);
      advancePayments = [];
    }

    // Build HTML for advance payments section
    let advancePaymentsHtml = "";
    if (advancePayments && advancePayments.length) {
      advancePaymentsHtml += `
        <h3 style="color:#003366; margin-top:20px;">Advance Payments</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
          <thead>
            <tr style="background:#f0f0f0; color:#333;">
              <th style="padding:8px; border:1px solid #ddd; text-align:left;">Date</th>
              <th style="padding:8px; border:1px solid #ddd; text-align:right;">Amount</th>
              <th style="padding:8px; border:1px solid #ddd; text-align:left;">Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      advancePayments.forEach((p) => {
        const dateStr = p.created_at ? new Date(p.created_at).toLocaleString() : "-";
        advancePaymentsHtml += `
            <tr>
              <td style="padding:8px; border:1px solid #ddd;">${dateStr}</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:right;">₹${Number(p.amount).toFixed(2)}</td>
              <td style="padding:8px; border:1px solid #ddd;">${String(p.status || p.payment_type).charAt(0).toUpperCase() + String(p.status || p.payment_type).slice(1)}</td>
            </tr>
        `;
      });

      advancePaymentsHtml += `</tbody></table>`;
    }

    // logoImgSrc already set above

    // Build payment summary HTML based on payment type
    let paymentSummaryHtml = "";

    if (paymentType === "advance") {
      paymentSummaryHtml = `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Advance Paid</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${finalPaid.toFixed(2)}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Pending Amount</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: red;"><strong>₹${pendingAmount.toFixed(2)}</strong></td>
            </tr>
      `;
    } else {
      paymentSummaryHtml = `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount Paid</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>₹${totalAmount.toFixed(2)}</strong></td>
            </tr>
      `;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; padding: 30px;">
          
          <div style="font-size: 22px; font-weight: bold; color: #003366;">
            Youtax
          </div>

          <div style="text-align: center; margin-top: 20px;">
              <img src="cid:${logoCid}" width="180" style="margin-bottom: 20px;" alt="Youtax Logo" />
            <h2 style="color: #003366; margin-top: 10px;">
              Payment Receipt
            </h2>
          </div>

          <p style="font-size: 15px; color: #333;">
            Hi <strong>${customerName}</strong>,<br/><br/>
            Your payment has been successfully received. Please find the details below:
          </p>

          <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background:#003366; color:#fff;">
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Description</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Service</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:center;">Qty</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:right;">Amount</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Payment Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:10px; border:1px solid #ddd;">Youtax Service Subscription</td>
                <td style="padding:10px; border:1px solid #ddd;">${serviceName}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:center;">1</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;">₹${Number(amountPaid).toFixed(2)}</td>
                <td style="padding:10px; border:1px solid #ddd;">${String(paymentType).charAt(0).toUpperCase() + String(paymentType).slice(1)}</td>
              </tr>
            </tbody>
          </table>

          ${advancePaymentsHtml}

          <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Invoice #</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${payment.payment_id}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Service</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${serviceName}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${customerEmailFinal}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Phone</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${customerPhone}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Location</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${customerLocation}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Mode</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${paymentMode}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Type</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${paymentType}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Taxable Amount</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${taxableAmount.toFixed(2)}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>GST (${gstRate}%)</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${gstAmount.toFixed(2)}</td>
            </tr>

            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${totalAmount.toFixed(2)}</td>
            </tr>

            ${paymentSummaryHtml}

            ${
              payment.txn_ref
                ? `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Txn Ref</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${payment.txn_ref}</td>
            </tr>
            `
                : ""
            }
          </table>

          <p style="font-size: 15px; color: #333;">
            ${paymentType === "advance" ? "Your payment confirmation details are below." : "Your official receipt is attached to this email."}<br/><br/>
            Thank you for choosing Youtax.<br/><br/>
            Warm regards,<br/>
            <strong>Team Youtax</strong>
          </p>

          <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
            © 2025 Youtax. All rights reserved.
          </p>

        </div>
      </div>
    `;

    // Send mail with inline logo (cid) and PDF attachment (only for final payments)
    const attachments = [];

    if (paymentType !== "advance" && fileName && filePath) {
      attachments.push({
        filename: fileName,
        path: filePath,
      });
    }

    // Attach logo inline: prefer using the same base64 image as a buffer (no filename) so it renders via CID and is not a downloadable file.
    if (logoBase64ForPdf) {
      try {
        const base64Data = logoBase64ForPdf.split(",")[1];
        const imgBuf = Buffer.from(base64Data, "base64");
        const mimeMatch = logoBase64ForPdf.match(/^data:(image\/[^;]+);base64,/i);
        const contentType = mimeMatch ? mimeMatch[1] : "image/png";
        attachments.push({
          content: imgBuf,
          cid: logoCid,
          contentType,
          contentDisposition: "inline",
        });
      } catch (e) {
        console.error("⚠️ Failed to attach inline logo buffer:", e);
        // fallback to attaching file path inline if available
        if (fs.existsSync(logoPath)) {
          attachments.push({ path: logoPath, cid: logoCid, contentDisposition: "inline" });
        }
      }
    } else if (fs.existsSync(logoPath)) {
      attachments.push({ path: logoPath, cid: logoCid, contentDisposition: "inline" });
    }
    console.log("📤 Sending email to:", customerEmailFinal);

    await transporter.sendMail({
      from: `"Youtax" <${process.env.EMAIL_USER}>`,
      to: customerEmailFinal,
      subject: `Payment Receipt - ${payment.payment_id}`,
      html: htmlContent,
      attachments,
    });
    console.log("✅ Email sent successfully!");
    if (paymentType !== "advance" && filePath) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        // ignore cleanup errors
      }
    }
    

    return { emailSent: true };
  } catch (error) {
    console.error("❌ Error sending payment receipt:", error);
    return { emailSent: false };
  }
}

module.exports = sendPaymentReceiptMail;
