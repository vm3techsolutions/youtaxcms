const db = require("../../config/db");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../../config/aws");
const path = require("path");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const SIGNED_URL_EXPIRY = 3600;


/**
 * Generate a pre-signed S3 URL for a stored file.
 * @param {string} fileUrl - Full S3 file URL stored in DB.
 * @returns {Promise<string|null>} Signed URL or null on failure.
 */
const generateSignedUrl = async (fileUrl) => {
    try {
        const baseUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
        const fileKey = fileUrl.replace(baseUrl, "");
        const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
        return await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY });
    } catch (err) {
        console.error("Signed URL error:", err);
        return null;
    }
};



/**
 * Upload a customer document to S3 and insert a DB record.
 * Expects `req.user.id`, `req.file`, and body: { order_id, doc_month, doc_year, file_name }.
 * Responds with inserted file id and a signed URL.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const uploadCustomerDocument = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { order_id, doc_month, doc_year, file_name } = req.body;

        if (!order_id || !doc_month || !doc_year || !file_name) {
            return res.status(400).json({ message: "order_id, doc_month, doc_year, file_name required" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "File is required" });
        }

        const file = req.file;

        // allow customer to provide a preferred file name (e.g., "gstjanuary")
        const providedName = (req.body.file_name || req.body.filename || "").toString().trim();

        const sanitizeFileName = (name) => {
            return name.replace(/[^a-zA-Z0-9._-]/g, "_");
        };

        let finalName = file.originalname;
        if (providedName) {
            const sanitized = sanitizeFileName(providedName);
            const ext = path.extname(file.originalname) || "";
            finalName = sanitized.endsWith(ext) || ext === "" ? sanitized : `${sanitized}${ext}`;
        }

        const fileKey = `uploads/customer_documents/order_id_${order_id}/${doc_year}/${doc_month}/${Date.now()}_${finalName}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );

        const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

        const [insert] = await db.query(
            `INSERT INTO customer_documents
       (order_id, customer_id, doc_month, doc_year, file_url, file_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [order_id, customerId, doc_month, doc_year, fileUrl, finalName]
        );

        res.json({
            success: true,
            message: "Document uploaded successfully",
            file: {
                id: insert.insertId,
                file_name: finalName,
                signed_url: await generateSignedUrl(fileUrl),
            },
        });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ message: "Upload failed" });
    }
};



/**
 * Retrieve all customer documents for a given order id.
 * Adds a short-lived `signed_url` for each document.
 * Expects `req.params.order_id`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCustomerDocumentsForOrder = async (req, res) => {
    try {
        const { order_id } = req.params;

        if (!order_id) {
            return res.status(400).json({ message: "order_id required" });
        }

        const [rows] = await db.query(
            `SELECT cd.*, au.name AS verified_by_name
       FROM customer_documents cd
       LEFT JOIN admin_users au ON cd.verified_by = au.id
       WHERE cd.order_id=?
       ORDER BY cd.doc_year DESC, cd.doc_month ASC, cd.created_at DESC`,
            [order_id]
        );

        const data = await Promise.all(
            rows.map(async (doc) => ({
                ...doc,
                signed_url: await generateSignedUrl(doc.file_url),
            }))
        );

        res.json({ success: true, data });

    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ message: "Database error" });
    }
};


/**
 * Fetch a single customer document by its DB id and attach a signed URL.
 * Expects `req.params.id`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCustomerDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT * FROM customer_documents WHERE id=? LIMIT 1`,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Document not found" });
        }

        const data = {
            ...rows[0],
            signed_url: await generateSignedUrl(rows[0].file_url),
        };

        res.json({ success: true, data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
};


/**
 * Update document review status (approved|rejected).
 * Only users with the Operation role should be permitted to call this.
 * Expects `req.user.id` (verifier), `req.params.id`, and body: { status, operation_remark }.
 * On success sets `verified_by` and `verified_at`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateCustomerDocumentStatus = async (req, res) => {
    try {
        const operationId = req.user.id;
        // allow only operation role (role id 3) to update document status
        // adjust the property name if your auth middleware uses a different key (e.g., role_id)
        const userRole = req.user.role;
        if (userRole !== "Operation") {
            return res.status(403).json({ message: "Forbidden: insufficient permissions" });
        }
        const { id } = req.params;
        const { status, operation_remark } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        await db.query(
            `UPDATE customer_documents
       SET status=?, operation_remark=?, verified_by=?, verified_at=NOW()
       WHERE id=?`,
            [status, operation_remark || null, operationId, id]
        );

        res.json({
            success: true,
            message: `Document ${status} successfully`,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed" });
    }
};


/**
 * Replace an existing customer document (by document id) with a new uploaded file.
 * Only the document owner (customer) may replace their document.
 * Resets status to 'pending' and clears verification metadata.
 * Expects `req.params.id` and `req.file`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const replaceCustomerDocument = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "File is required" });
        }

        const [rows] = await db.query(
            `SELECT * FROM customer_documents WHERE id=? LIMIT 1`,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Document not found" });
        }

        const doc = rows[0];

        // Allow only document owner to replace
        const userId = req.user.id;
        if (doc.customer_id !== userId) {
            return res.status(403).json({ message: "Forbidden: only owner can replace document" });
        }

        const file = req.file;
        const providedName = (req.body.file_name || req.body.filename || "").toString().trim();
        const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");
        let finalName = file.originalname;
        if (providedName) {
            const sanitized = sanitizeFileName(providedName);
            const ext = path.extname(file.originalname) || "";
            finalName = sanitized.endsWith(ext) || ext === "" ? sanitized : `${sanitized}${ext}`;
        }

        const fileKey = `uploads/customer_documents/order_id_${doc.order_id}/${doc.doc_year}/${doc.doc_month}/${Date.now()}_${finalName}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );

        const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

        await db.query(
            `UPDATE customer_documents
             SET file_url=?, file_name=?, status='pending', verified_by=NULL, verified_at=NULL, operation_remark=NULL
             WHERE id=?`,
            [fileUrl, finalName, id]
        );

        res.json({
            success: true,
            message: 'Document replaced successfully',
            file: {
                id: id,
                file_name: finalName,
                signed_url: await generateSignedUrl(fileUrl),
            },
        });

    } catch (err) {
        console.error('Replace error:', err);
        res.status(500).json({ message: 'Replace failed' });
    }
};

/**
 * Admin listing of all customer documents with related customer and service info.
 * Each returned item includes a short-lived `signed_url` for download.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllCustomerDocuments = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
          cd.*,
          c.name AS customer_name,
          s.name AS service_name,
          au.name AS verified_by_name
       FROM customer_documents cd
       JOIN orders o ON cd.order_id = o.id
       JOIN customers c ON cd.customer_id = c.id
       JOIN services s ON o.service_id = s.id
       LEFT JOIN admin_users au ON cd.verified_by = au.id
       ORDER BY cd.created_at DESC`
        );

        const data = await Promise.all(
            rows.map(async (doc) => ({
                ...doc,
                signed_url: await generateSignedUrl(doc.file_url),
            }))
        );

        res.json({ success: true, data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
};


module.exports = {
    uploadCustomerDocument,
    getCustomerDocumentsForOrder,
    getCustomerDocumentById,
    updateCustomerDocumentStatus,
    replaceCustomerDocument,
    getAllCustomerDocuments,
};
