const db = require("../../config/db");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../../config/aws");


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
const getDeliverablesByCustomerId = async (req, res) => {
  try {
    // take logged-in customerId from JWT (verifyToken middleware)
    const customerId = req.user.id;  

    if (!customerId) {
      return res.status(400).json({ message: "customer_id is required" });
    }

    const [rows] = await db.promise().query(
      `SELECT 
          d.*, 
          o.id AS order_id, 
          o.status AS order_status, 
          c.name AS customer_name, 
          s.name AS service_name
        FROM deliverables d
        JOIN orders o ON d.order_id = o.id
        JOIN customers c ON o.customer_id = c.id
        JOIN services s ON o.service_id = s.id
        WHERE o.customer_id=?
          AND (o.status = 'completed' OR o.status = 'awaiting_final_payment')
        ORDER BY d.created_at DESC`,
      [customerId]
    );

    const deliverables = await Promise.all(
      rows.map(async (d) => {
        let signedUrl = null;

        if (d.order_status === "completed" && d.file_url) {
          signedUrl = await generateSignedUrl(d.file_url);
        }

        return { ...d, signed_url: signedUrl };
      })
    );

    res.json({ success: true, data: deliverables });
  } catch (err) {
    console.error("❌ Error fetching deliverables by customer:", err);
    res.status(500).json({ message: "Database error" });
  }
};



module.exports = { getDeliverablesByCustomerId };