const db = require("../../../config/db");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../../../config/aws");

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
// Get Assigned Orders for Operation (with customer name and service name)
// ========================
const getAssignedOrdersForOperations = async (req, res) => {
  try {
    const operationId = req.user.id; // logged-in operations user

    // Get assigned orders with customer and service name
    const [orders] = await db.query(
      `SELECT o.*, c.name AS customer_name, s.name AS service_name
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       JOIN services s ON o.service_id = s.id
       WHERE o.assigned_to=? 
         AND o.advance_paid >= o.advance_required
         AND o.status='in_progress'`,
      [operationId]
    );

    // For each order, fetch its documents
    const ordersWithDocuments = await Promise.all(
      orders.map(async (order) => {
        const [docs] = await db.query(
          `SELECT od.*, sd.doc_name, sd.doc_type
           FROM order_documents od
           JOIN service_documents sd ON od.service_doc_id = sd.id
           WHERE od.order_id = ?`,
          [order.id]
        );

        // Attach signed_url for each document
        const documents = await Promise.all(
          docs.map(async (doc) => ({
            ...doc,
            signed_url: await generateSignedUrl(doc.file_url),
          }))
        );

        return {
          ...order,
          order_documents: documents,
        };
      })
    );

    res.json({ success: true, data: ordersWithDocuments });
  } catch (err) {
    console.error("Error fetching assigned orders for operations:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ========================
// Upload Deliverable (multiple files)
// ========================
// const uploadDeliverable = async (req, res) => {
//   try {
//     const operationId = req.user.id;
//     const { order_id, admin_id } = req.body;

//     if (!order_id || !req.files || req.files.length === 0) {
//       return res.status(400).json({ message: "order_id and files are required" });
//     }

//     // Check latest deliverable for versioning
//     const [existing] = await db.promise().query(
//       `SELECT * FROM deliverables WHERE order_id=? ORDER BY created_at DESC LIMIT 1`,
//       [order_id]
//     );

//     let newVersion = 1;
//     if (existing.length > 0) {
//       newVersion = existing[0].versions + 1;
//     }

//     const uploadedFiles = [];

//     for (const file of req.files) {
//       const fileKey = `uploads/deliverables/${order_id}/${Date.now()}_${file.originalname}`;

//       // Upload to S3
//       await s3.send(new PutObjectCommand({
//         Bucket: BUCKET_NAME,
//         Key: fileKey,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       }));

//       const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

//       // Insert new version
//       const [result] = await db.promise().query(
//         `INSERT INTO deliverables (order_id, generated_by, file_url, versions) 
//          VALUES (?, ?, ?, ?)`,
//         [order_id, operationId, fileUrl, newVersion]
//       );

//       uploadedFiles.push({
//         id: result.insertId,
//         file_url: fileUrl,
//         version: newVersion,
//         signed_url: await generateSignedUrl(fileUrl),
//       });

//       // Fetch order payment status
//       const [order] = await db.promise().query(
//         `SELECT payment_status FROM orders WHERE id=?`,
//         [order_id]
//       );

//       if (order.length > 0 && order[0].payment_status === "paid") {
//         // Fully paid → forward to Admin
//         await db.promise().query(
//           `UPDATE orders SET assigned_to=? WHERE id=?`,
//           [admin_id, order_id]
//         );
//         await db.promise().query(
//           `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
//            VALUES (?, ?, ?, 'operation', 'admin', 'deliverable_uploaded', 'Deliverable uploaded and forwarded to Admin', NOW())`,
//           [order_id, operationId, admin_id]
//         );
//       } else {
//         // Partial/advance paid → just log upload
//         await db.promise().query(
//           `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
//            VALUES (?, ?, NULL, 'operation', NULL, 'deliverable_uploaded', 'Draft deliverable uploaded', NOW())`,
//           [order_id, operationId]
//         );
//       }
//     }

//     res.json({ success: true, message: "Deliverable uploaded/replaced", files: uploadedFiles });
//   } catch (err) {
//     console.error("Error uploading/replacing deliverable:", err);
//     res.status(500).json({ message: "Database/S3 error" });
//   }
// };

// updated upload deliverable by operation

// ========================
// Upload Deliverable (multiple files)
// ========================
const uploadDeliverable = async (req, res) => {
  try {
    const operationId = req.user.id;
    const { order_id, admin_id, account_id,forward_without_changes } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    // Versioning
    const [existing] = await db.query(
      `SELECT * FROM deliverables WHERE order_id=? ORDER BY created_at DESC LIMIT 1`,
      [order_id]
    );

    let newVersion = existing.length > 0 ? existing[0].versions + 1 : 1;
    const uploadedFiles = [];

    // Upload new deliverables if provided
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileKey = `uploads/deliverables/${order_id}/${Date.now()}_${file.originalname}`;

        await s3.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }));

        const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

        const [result] = await db.query(
          `INSERT INTO deliverables (order_id, generated_by, file_url, versions) 
           VALUES (?, ?, ?, ?)`,
          [order_id, operationId, fileUrl, newVersion]
        );

        uploadedFiles.push({
          id: result.insertId,
          file_url: fileUrl,
          version: newVersion,
          signed_url: await generateSignedUrl(fileUrl),
        });
      }
    }

    // Fetch order status
    const [order] = await db.query(
      `SELECT payment_status FROM orders WHERE id=?`,
      [order_id]
    );
    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const paymentStatus = order[0].payment_status;

    if (paymentStatus === "paid") {
      // ✅ Fully paid → Operation forwards to Admin
      if (forward_without_changes && (!req.files || req.files.length === 0)) {
        // No new files → just forward
        await db.query(
          `UPDATE orders SET assigned_to=? WHERE id=?`,
          [admin_id, order_id]
        );
        await db.query(
          `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
           VALUES (?, ?, ?, 'operation', 'admin', 'forward_without_changes', 'Forwarded to Admin without new deliverables', NOW())`,
          [order_id, operationId, admin_id]
        );
      } else {
        // With new files
        await db.query(
          `UPDATE orders SET assigned_to=? WHERE id=?`,
          [admin_id, order_id]
        );
        await db.query(
          `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
           VALUES (?, ?, ?, 'operation', 'admin', 'deliverable_uploaded', 'Deliverable uploaded and forwarded to Admin', NOW())`,
          [order_id, operationId, admin_id]
        );
      }
    } 
    else if (paymentStatus === "partially_paid") {
       // 🔍 Auto detect account user who originally sent this order
    const [lastAccount] = await db.query(
      `SELECT from_user 
         FROM order_logs 
        WHERE order_id=? AND from_role='accounts'
        ORDER BY id DESC 
        LIMIT 1`,
      [order_id]
    );

    const autoAccountId = lastAccount.length > 0 ? lastAccount[0].from_user : null;

    if (!autoAccountId) {
      return res.status(400).json({
        message: "Account user not found for this order."
      });
    }
    //---end auto detect

      // ✅ Partial payment → forward to Accounts for final payment
      await db.query(
        `UPDATE orders SET assigned_to=?, status='awaiting_final_payment' WHERE id=?`,
        [autoAccountId, order_id]
      );
      await db.query(
        `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at) 
         VALUES (?, ?, ?, 'operation', 'accounts', 'deliverable_uploaded', 'Deliverable uploaded and sent to Accounts for final payment', NOW())`,
        [order_id, operationId, autoAccountId]
      );

      // 🔔 Fetch customer details from customers table
      const [customer] = await db.query(
        `SELECT c.email, c.name 
           FROM customers c 
           JOIN orders o ON c.id = o.customer_id 
          WHERE o.id=?`,
        [order_id]
      );

      if (customer.length > 0) {
        const sendFinalPaymentMail = require("../../../utils/finalPaymentMail");
        await sendFinalPaymentMail(customer[0].email, customer[0].name, order_id);
      }
    } 
    else {
      // unpaid → keep with operation as draft
      await db.query(
        `INSERT INTO order_logs (order_id, from_user, from_role, action, remarks, created_at) 
         VALUES (?, ?, 'operation', 'draft_uploaded', 'Draft deliverable uploaded (unpaid)', NOW())`,
        [order_id, operationId]
      );
    }

    res.json({ 
      success: true, 
      message: "Deliverable processed successfully", 
      files: uploadedFiles 
    });
  } catch (err) {
    console.error("Error uploading/replacing deliverable:", err);
    res.status(500).json({ message: "Database/S3 error" });
  }
};

const getDeliverablesForOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    const [rows] = await db.query(
      `SELECT d.*, c.name AS customer_name, s.name AS service_name
         FROM deliverables d
         JOIN orders o ON d.order_id = o.id
         JOIN customers c ON o.customer_id = c.id
         JOIN services s ON o.service_id = s.id
        WHERE d.order_id=?
        ORDER BY d.versions ASC`,
      [order_id]
    );

    const deliverables = await Promise.all(
      rows.map(async (d) => ({
        ...d,
        signed_url: await generateSignedUrl(d.file_url),
      }))
    );

    res.json({ success: true, data: deliverables });
  } catch (err) {
    console.error("Error fetching deliverables:", err);
    res.status(500).json({ message: "Database error" });
  }
};
const getDeliverableById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "deliverable id is required" });
    }

    const [rows] = await db.query(
      `SELECT * FROM deliverables WHERE id=? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Deliverable not found" });
    }

    const deliverable = {
      ...rows[0],
      signed_url: await generateSignedUrl(rows[0].file_url),
    };

    res.json({ success: true, data: deliverable });
  } catch (err) {
    console.error("Error fetching deliverable by id:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ========================
// Get All Deliverables with Customer ID, Name, and Service Name
// ========================
const getAllDeliverablesWithCustomerAndService = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          d.*, 
          c.id AS customer_id, 
          c.name AS customer_name, 
          s.id AS service_id, 
          s.name AS service_name
        FROM deliverables d
        JOIN orders o ON d.order_id = o.id
        JOIN customers c ON o.customer_id = c.id
        JOIN services s ON o.service_id = s.id
        ORDER BY d.created_at DESC`
    );

    // Add signed_url for each deliverable
    const deliverables = await Promise.all(
      rows.map(async (d) => ({
        ...d,
        signed_url: await generateSignedUrl(d.file_url),
      }))
    );

    res.json({ success: true, data: deliverables });
  } catch (err) {
    console.error("Error fetching deliverables with customer and service:", err);
    res.status(500).json({ message: "Database error" });
  }
};


const getOperationDashboardStats = async (req, res) => {
  try {
    const operationId = req.user.id;

    // Latest log join (to get current assignment)
    const latestLogJoin = `
      JOIN (
        SELECT order_id, MAX(id) AS latest_log_id
        FROM order_logs
        GROUP BY order_id
      ) AS ll ON o.id = ll.order_id
      JOIN order_logs ol ON ol.id = ll.latest_log_id
    `;

    // -----------------------------------------
    // Assigned Orders (current assignment)
    // -----------------------------------------
    const [[assignedOrders]] = await db.query(`
          SELECT COUNT(*) AS count
          FROM orders o
          ${latestLogJoin}
          WHERE ol.to_role = 'operation' AND ol.to_user = ?
        `, [operationId]);

    // -----------------------------------------
    //  Worked Orders (ANY time operation handled order)
    // -----------------------------------------
    const [[workedOrders]] = await db.query(`
      SELECT COUNT(DISTINCT o.id) AS count
      FROM orders o
      JOIN order_logs ol ON ol.order_id = o.id
      WHERE ol.to_role = 'operation' AND ol.to_user = ?
    `, [operationId]);

    // -----------------------------------------
    // Response
    // -----------------------------------------
    res.json({
      success: true,
      data: {
        assignedOrders: assignedOrders.count || 0,
        workedOrders: workedOrders.count || 0,
    
      }
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

module.exports = { 
  getAssignedOrdersForOperations, 
  uploadDeliverable, 
  getDeliverablesForOrder, 
  getDeliverableById,
  getAllDeliverablesWithCustomerAndService, // <-- export the new function
  getOperationDashboardStats
};