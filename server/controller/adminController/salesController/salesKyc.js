const db = require("../../../config/db"); // MySQL connection (mysql2)
const s3 = require("../../../config/aws");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const SIGNED_URL_EXPIRY = 3600;

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
// Get All Pending KYC Documents (For Sales Review)
// ========================
const getPendingKycDocuments = async (req, res) => {
    try {
        const [rows] = await db
            .promise()
            .query(
                `SELECT k.*, c.name AS customer_name, c.email AS customer_email
         FROM kyc_documents k
         JOIN customers c ON k.customer_id = c.id
         WHERE k.status = 'submitted'`
            );

        // Add signed URLs
        const docsWithSigned = await Promise.all(
            rows.map(async (doc) => ({
                ...doc,
                signed_url: await generateSignedUrl(doc.file_url),
            }))
        );

        res.status(200).json(docsWithSigned);
    } catch (error) {
        console.error("❌ Error fetching pending KYC documents:", error);
        res.status(500).json({ message: "Error fetching pending documents" });
    }
};

// ========================
// Verify / Reject a KYC Document
// ========================
const verifyKycDocument = async (req, res) => {
    try {
        const salesId = req.user.id; // sales user id (from JWT/session)
        const { kyc_id } = req.params;
        const { status, remarks } = req.body;

        if (!["verified", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Update KYC document status
        const [result] = await db
            .promise()
            .query(
                `UPDATE kyc_documents 
         SET status = ?, remarks = ?, verified_by = ?, uploaded_at = uploaded_at 
         WHERE id = ?`,
                [status, remarks || null, salesId, kyc_id]
            );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "KYC document not found" });
        }

        // Get customer_id for this KYC document
        const [[kycDoc]] = await db
            .promise()
            .query(`SELECT customer_id FROM kyc_documents WHERE id = ?`, [kyc_id]);

        if (kycDoc && kycDoc.customer_id) {
            // Update kyc_status in customers table
            await db
                .promise()
                .query(
                    `UPDATE customers SET kyc_status = ? WHERE id = ?`,
                    [status, kycDoc.customer_id]
                );
        }

        res.status(200).json({ message: `KYC document ${status} successfully` });
    } catch (error) {
        console.error("❌ Error verifying KYC document:", error);
        res.status(500).json({ message: "Error verifying document" });
    }
};

// ========================
// Get Verified/Rejected Documents (History)
// ========================
const getReviewedKycDocuments = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT k.*, 
          c.name AS customer_name, 
          c.email AS customer_email, 
          a.name AS sales_name, 
          r.name AS sales_role
   FROM kyc_documents k
   JOIN customers c ON k.customer_id = c.id
   LEFT JOIN admin_users a ON k.verified_by = a.id
   LEFT JOIN admin_roles r ON a.role_id = r.id
   WHERE k.status IN ('verified','rejected')
   ORDER BY k.uploaded_at DESC`
        );

        const docsWithSigned = await Promise.all(
            rows.map(async (doc) => ({
                ...doc,
                signed_url: await generateSignedUrl(doc.file_url),
            }))
        );

        res.status(200).json(docsWithSigned);
    } catch (error) {
        console.error("❌ Error fetching reviewed KYC documents:", error);
        res.status(500).json({ message: "Error fetching reviewed documents" });
    }
};

module.exports = {
    getPendingKycDocuments,
    verifyKycDocument,
    getReviewedKycDocuments,
};