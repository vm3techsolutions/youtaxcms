// controller/salesController/sales.js
const db = require("../../../config/db"); // MySQL connection (mysql2)

// ========================
// Get Pending Orders for Sales (awaiting_docs)
// ========================
const getPendingOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, c.name AS customer_name, s.name AS service_name
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       JOIN services s ON o.service_id = s.id
       WHERE (o.status = 'awaiting_docs' OR o.status = 'pending')`
    );
    res.json(rows);
  } catch (err) {
    console.error(" Error fetching pending sales orders:", err);
    res.status(500).json({ message: "Database error" });
  }
};


// ========================
// Update ONE Document Status (by order_id + service_doc_id)
// ========================
const updateDocumentStatusByOrderDId = async (req, res) => {
  try {
    const salesId = req.user.id; // Sales role user ID
    const { order_id, order_document_id, status, remarks } = req.body;

    if (!order_id || !order_document_id || !status) {
      return res.status(400).json({ message: "order_id, order_document_id and status are required" });
    }

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update exactly one document row
    const [result] = await db.query(
      `UPDATE order_documents 
       SET status=?, remarks=?, verified_by=?, verified_at=NOW() 
       WHERE id=? AND order_id=?`,
      [status, remarks || null, salesId, order_document_id, order_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Document not found for given order_id and order_document_id" });
    }

    // If rejected → keep order "awaiting_docs" and log
    if (status === "rejected") {
      // Keep order as awaiting_docs
      await db.query(
        `UPDATE orders SET status='awaiting_docs' WHERE id=?`,
        [order_id]
      );

      await db.query(
        `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at)
         VALUES (?, ?, NULL, 'sale', NULL, 'document_rejected', ?, NOW())`,
        [order_id, salesId, remarks || "Document rejected"]
      );

      return res.json({ success: true, message: "Document rejected, order kept in awaiting_docs" });
    }

    // After verification, trigger order status check
    // await triggerOrderStatusCheckInternal(order_id,salesId);

    res.json({ success: true, message: `Document ${status}` });
  } catch (err) {
    console.error("Error updating document status:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ========================
// Trigger Order Status Check (internal helper)
// ========================
// const triggerOrderStatusCheckInternal = async (order_id) => {
//   try {
//     // Check all documents for this order
//     const [docs] = await db.promise().query(
//       `SELECT COUNT(*) AS total,
//               SUM(CASE WHEN status='verified' THEN 1 ELSE 0 END) AS verified_count
//        FROM order_documents WHERE order_id=?`,
//       [order_id]
//     );

//     console.log("Document counts for order", order_id, docs[0]);
    

//     if (docs[0].total > 0 && docs[0].total === docs[0].verified_count) {
//       // All docs verified → move order → under_review
//       await db.promise().query(
//         `UPDATE orders SET status='under_review' WHERE id=?`,
//         [order_id]
//       );

//       await db.promise().query(
//         `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at)
//          VALUES (?, NULL, NULL, 'sale', 'accounts', 'all_docs_verified', 'All documents verified, sent to Accounts', NOW())`,
//         [order_id]
//       );
//     }
//   } catch (err) {
//     console.error("Error in triggerOrderStatusCheckInternal:", err);
//   }
// };

// After verification, trigger order status check
const triggerOrderStatusCheckInternal = async (order_id,salesId,account_id) => {
  try {
    // Check all documents for this order
    const [docs] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='verified' THEN 1 ELSE 0 END) AS verified_count
       FROM order_documents WHERE order_id=?`,
      [order_id]
    );

    if (docs[0].total > 0 && docs[0].total === Number(docs[0].verified_count)) {
      // Check current order status to avoid repeated update
      const [orderStatus] = await db.query(
        `SELECT status FROM orders WHERE id=?`,
        [order_id]
      );

      if (orderStatus[0].status !== 'under_review') {
        // All docs verified → move order → under_review
        await db.query(
          `UPDATE orders SET status='under_review', assigned_to=? WHERE id=?`,
          [account_id,order_id]
        );

        await db.query(
          `INSERT INTO order_logs (order_id, from_user, to_user, from_role, to_role, action, remarks, created_at)
           VALUES (?, ?, ?, 'sale', 'accounts', 'all_docs_verified', 'All documents verified, sent to Accounts', NOW())`,
          [order_id,salesId,account_id]
        );
      }
    }
  } catch (err) {
    console.error("Error in triggerOrderStatusCheckInternal:", err);
  }
};

// ========================
// Trigger Order Status Check API (manual trigger if needed)
// ========================
const triggerOrderStatusCheck = async (req, res) => {
  try {
    const { order_id, account_id } = req.body;
    const salesId = req.user.id; // Sales role user ID

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    await triggerOrderStatusCheckInternal(order_id,salesId,account_id);

    res.json({ success: true, message: "Order status check triggered" });
  } catch (err) {
    console.error("Error in triggerOrderStatusCheck API:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ========================
// Verify Document (Approve / Reject)
// ========================
// const verifyDocument = async (req, res) => {
//   try {
//     const salesId = req.user.id; // Sales user ID
//     const { document_id, status, remarks } = req.body;

//     if (!document_id || !status) {
//       return res.status(400).json({ message: "document_id and status are required" });
//     }
//     if (!["verified", "rejected"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     // Update document
//     await db.promise().query(
//       `UPDATE order_documents 
//        SET status=?, remarks=?, verified_by=?, verified_at=NOW() 
//        WHERE id=?`,
//       [status, remarks || null, salesId, document_id]
//     );

//     res.json({ success: true, message: `Document ${status}` });
//   } catch (err) {
//     console.error(" Error verifying document:", err);
//     res.status(500).json({ message: "Database error" });
//   }
// };

// // ========================
// // Forward Order to Accounts (after all docs verified)
// // ========================
// const forwardToAccounts = async (req, res) => {
//   try {
//     const salesId = req.user.id;
//     const { order_id } = req.body;

//     if (!order_id) {
//       return res.status(400).json({ message: "order_id is required" });
//     }

//     // Check if all documents are verified
//     const [docs] = await db.promise().query(
//       `SELECT COUNT(*) AS total,
//               SUM(CASE WHEN status='verified' THEN 1 ELSE 0 END) AS verified_count
//        FROM order_documents WHERE order_id=?`,
//       [order_id]
//     );

//     if (docs[0].total === 0 || docs[0].total !== docs[0].verified_count) {
//       return res.status(400).json({ message: "All documents must be verified before forwarding" });
//     }

//     // Update order status → under_review (accounts stage)
//     await db.promise().query(
//       `UPDATE orders SET status='under_review' WHERE id=?`,
//       [order_id]
//     );

//     // Log transition
//     await db.promise().query(
//       `INSERT INTO order_logs (order_id, action, performed_by, role, remarks, created_at)
//        VALUES (?, 'forward_to_accounts', ?, 'sales', 'All documents verified, sent to Accounts', NOW())`,
//       [order_id, salesId]
//     );

//     res.json({ success: true, message: "Order forwarded to Accounts" });
//   } catch (err) {
//     console.error(" Error forwarding to accounts:", err);
//     res.status(500).json({ message: "Database error" });
//   }
// };

module.exports = { getPendingOrders,updateDocumentStatusByOrderDId,triggerOrderStatusCheck , triggerOrderStatusCheck };
