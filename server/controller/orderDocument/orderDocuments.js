const s3 = require("../../config/aws");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const db = require("../../config/db"); // MySQL connection

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// ========================
// Helper: Generate Signed URL
// ========================
const generateSignedUrl = async (fileUrl) => {
  try {
    const baseUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
    const fileKey = fileUrl.replace(baseUrl, "");
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    return await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY });
  } catch (err) {
    console.error("❌ Error generating signed URL:", err);
    return null;
  }
};

// ========================
// Upload Order Document
// ========================
const uploadOrderDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, service_doc_id } = req.body;

    if (!order_id || !service_doc_id) {
      return res.status(400).json({ message: "order_id and service_doc_id are required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Fetch service document info
    const [serviceDocRows] = await db.query("SELECT * FROM service_documents WHERE id = ? LIMIT 1", [service_doc_id]);

    if (serviceDocRows.length === 0) {
      return res.status(404).json({ message: "Service document not found" });
    }

    const serviceDoc = serviceDocRows[0];
    const allowMultiple = serviceDoc.allow_multiple === 1;

    const uploadedFiles = [];

    // Loop over files
    for (const file of req.files) {
      // S3 key
      const fileKey = `uploads/order-documents/orderId${order_id}/${order_id}_${serviceDoc.doc_code}_${service_doc_id}/${Date.now()}_${file.originalname}`;

      // Upload to S3
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await s3.send(putCommand);

      const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

      // If only single allowed, delete existing before inserting
      if (!allowMultiple) {
        await db.query(
          "DELETE FROM order_documents WHERE order_id = ? AND service_doc_id = ?",
          [order_id, service_doc_id]
        );
      }

      // Insert record
      const [inserted] = await db.query(
        `INSERT INTO order_documents 
        (order_id, service_doc_id, file_url, uploaded_by, status, remarks, uploaded_at) 
        VALUES (?, ?, ?, ?, 'submitted', ?, NOW())`,
        [order_id, service_doc_id, fileUrl, userId, null]
      );

      uploadedFiles.push({
        id: inserted.insertId,
        file_url: fileUrl,
        signed_url: await generateSignedUrl(fileUrl),
      });
    }

    res.status(201).json({
      message: "Order document uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("❌ Error uploading order document:", err);
    res.status(500).json({ message: "Error uploading order document" });
  }
};

// ========================
// Get Order Documents
// ========================
const getOrderDocuments = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    const [rows] = await db.query(
      `SELECT od.*, sd.doc_name, sd.doc_type 
       FROM order_documents od
       JOIN service_documents sd ON od.service_doc_id = sd.id
       WHERE od.order_id = ?`,
      [order_id]
    );

    const documents = await Promise.all(
      rows.map(async (doc) => ({
        ...doc,
        signed_url: await generateSignedUrl(doc.file_url),
      }))
    );

    res.status(200).json(documents);
  } catch (err) {
    console.error("❌ Error fetching order documents:", err);
    res.status(500).json({ message: "Error fetching order documents" });
  }
};

module.exports = {
  uploadOrderDocument,
  getOrderDocuments,
};