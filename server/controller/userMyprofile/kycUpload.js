// --------------------------------------------------------------------------------------
// controller/kycController/kyc.js

const s3 = require("../../config/aws");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const db = require("../../config/db"); // MySQL connection (mysql2)

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
// Upload or Update KYC Document (One row per customer)
// ========================
exports.uploadKycDocument = async (req, res) => {
  try {
    const customerId = req.user.id;
    const customerName = req.user.name || "Unknown_User";
    let { doc_type, remarks } = req.body;

    // ✅ Validation
    if (!doc_type) {
      return res.status(400).json({ message: "doc_type is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Normalize doc_type
    doc_type = doc_type.trim().toLowerCase();

    // Sanitize customer name for S3 key
    const [firstName, lastName = ""] = customerName.split(" ");
    const safeFirstName = firstName.replace(/\s+/g, "_");
    const safeLastName = lastName.replace(/\s+/g, "_");

    // Unique S3 key
    const fileKey = `uploads/kyc-documents/${customerId}_${safeFirstName}_${safeLastName}/${Date.now()}_${doc_type}_${req.file.originalname}`;

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });
    await s3.send(putCommand);

    // Full S3 URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

    // ✅ Upsert logic (1 row per customer)
    const [rows] = await db.promise().query(
      "SELECT id FROM kyc_documents WHERE customer_id = ? LIMIT 1",
      [customerId]
    );

    if (rows.length > 0) {
      await db.promise().query(
        `UPDATE kyc_documents 
         SET doc_type = ?, file_url = ?, status = 'submitted', remarks = ?, uploaded_at = NOW()
         WHERE customer_id = ?`,
        [doc_type, fileUrl, remarks || null, customerId]
      );
    } else {
      await db.promise().query(
        `INSERT INTO kyc_documents (customer_id, doc_type, file_url, status, remarks, uploaded_at)
         VALUES (?, ?, ?, 'submitted', ?, NOW())`,
        [customerId, doc_type, fileUrl, remarks || null]
      );
    }

    const signedUrl = await generateSignedUrl(fileUrl);

    res.status(201).json({
      message: "KYC document uploaded/updated successfully",
      doc_type,
      file_url: fileUrl,
      signed_url: signedUrl,
    });
  } catch (error) {
    console.error("❌ Error uploading KYC document:", error);
    res.status(500).json({ message: "Error uploading document" });
  }
};

// ========================
// Get KYC Document (Customer - one row only)
// ========================
exports.getMyKycDocuments = async (req, res) => {
  try {
    const customerId = req.user.id;

    const [rows] = await db
      .promise()
      .query("SELECT * FROM kyc_documents WHERE customer_id = ? LIMIT 1", [
        customerId,
      ]);

    if (rows.length === 0) {
      return res.status(200).json(null);
    }

    const doc = rows[0];
    const signedUrl = await generateSignedUrl(doc.file_url);

    res.status(200).json({
      ...doc,
      signed_url: signedUrl,
    });
  } catch (error) {
    console.error("❌ Error fetching customer KYC document:", error);
    res.status(500).json({ message: "Error fetching document" });
  }
};

// ========================
// Get ALL KYC Documents (Admin/Sales only)
// ========================
// exports.getAllKycDocuments = async (req, res) => {
//   try {
//     if (!["admin", "sales"].includes(req.user.role)) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     let sql = `
//       SELECT 
//         k.id, k.customer_id, u.name AS customer_name, 
//         k.doc_type, k.file_url, k.status, k.remarks, k.uploaded_at
//       FROM kyc_documents k
//       JOIN users u ON k.customer_id = u.id
//     `;
//     const params = [];

//     if (req.query.customer_id) {
//       sql += " WHERE k.customer_id = ?";
//       params.push(req.query.customer_id);
//     }

//     const [rows] = await db.promise().query(sql, params);

//     const documents = await Promise.all(
//       rows.map(async (doc) => ({
//         ...doc,
//         signed_url: await generateSignedUrl(doc.file_url),
//       }))
//     );

//     res.status(200).json(documents);
//   } catch (error) {
//     console.error("❌ Error fetching all KYC documents:", error);
//     res.status(500).json({ message: "Error fetching documents" });
//   }
// };
