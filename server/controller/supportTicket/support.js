// server/controller/supportTicket/support.js
const db = require("../../config/db");
const sendSupportTicketMail = require("../../utils/sendSupportTicketMail");


// ---------------- Create Ticket ----------------
const createTicket = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { order_id, subject, description } = req.body;

    if (!subject || !description)
      return res.status(400).json({ message: "subject and description are required" });

    // Get customer details (name, email, phone)
    const [[customer]] = await db.promise().query(
      "SELECT name, email, phone FROM customers WHERE id=? LIMIT 1",
      [customer_id]
    );

    const [result] = await db.promise().query(
      `INSERT INTO support_tickets (customer_id, order_id, subject, description)
       VALUES (?, ?, ?, ?)`,
      [customer_id, order_id || null, subject, description]
    );

    // ✅ Send support email (to company/support team)
     sendSupportTicketMail({
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      orderId: order_id,
      subject,
      description,
      ticketId: result.insertId,
    });

    res.status(201).json({
      message: "Support ticket created",
      ticket_id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Create Ticket Error:", err);
    res.status(500).json({ message: "Error creating support ticket" });
  }
};

// ---------------- Get Ticket By ID ----------------
// const getTicketById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await db.promise().query(
//       `SELECT st.*, c.name AS customer_name, o.id AS order_id
//        FROM support_tickets st
//        JOIN customers c ON st.customer_id = c.id
//        LEFT JOIN orders o ON st.order_id = o.id
//        WHERE st.id=? LIMIT 1`,
//       [id]
//     );

//     if (!rows.length) return res.status(404).json({ message: "Ticket not found" });

//     res.json(rows[0]);
//   } catch (err) {
//     console.error("❌ Get Ticket Error:", err);
//     res.status(500).json({ message: "Error fetching ticket" });
//   }
// };

// ---------------- List Tickets (Filterable) ----------------
const listTickets = async (req, res) => {
  try {
    const { customer_id, status, order_id } = req.query;
    let sql = `SELECT st.*, c.name AS customer_name FROM support_tickets st
               JOIN customers c ON st.customer_id = c.id WHERE 1=1`;
    const params = [];

    if (customer_id) {
      sql += " AND st.customer_id=?";
      params.push(customer_id);
    }
    if (status) {
      sql += " AND st.status=?";
      params.push(status);
    }
    if (order_id) {
      sql += " AND st.order_id=?";
      params.push(order_id);
    }

    sql += " ORDER BY st.created_at DESC";

    const [rows] = await db.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ List Tickets Error:", err);
    res.status(500).json({ message: "Error fetching tickets" });
  }
};

// // ---------------- Update Ticket ----------------
// const updateTicket = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { subject, description } = req.body;

//     const [[ticket]] = await db.promise().query(
//       "SELECT id FROM support_tickets WHERE id=? LIMIT 1",
//       [id]
//     );

//     if (!ticket) return res.status(404).json({ message: "Ticket not found" });

//     await db.promise().query(
//       `UPDATE support_tickets
//        SET subject=COALESCE(?, subject), description=COALESCE(?, description)
//        WHERE id=?`,
//       [subject, description, id]
//     );

//     res.json({ message: "Ticket updated" });
//   } catch (err) {
//     console.error("❌ Update Ticket Error:", err);
//     res.status(500).json({ message: "Error updating ticket" });
//   }
// };

// // ---------------- Update Ticket Status ----------------
// const updateStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!["open", "in_progress", "resolved", "closed"].includes(status))
//       return res.status(400).json({ message: "Invalid status" });

//     const [[ticket]] = await db.promise().query(
//       "SELECT id FROM support_tickets WHERE id=? LIMIT 1",
//       [id]
//     );

//     if (!ticket) return res.status(404).json({ message: "Ticket not found" });

//     await db.promise().query(
//       "UPDATE support_tickets SET status=? WHERE id=?",
//       [status, id]
//     );

//     res.json({ message: `Ticket status updated to ${status}` });
//   } catch (err) {
//     console.error("❌ Update Status Error:", err);
//     res.status(500).json({ message: "Error updating ticket status" });
//   }
// };

// // ---------------- Delete Ticket ----------------
// const deleteTicket = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [[ticket]] = await db.promise().query(
//       "SELECT id FROM support_tickets WHERE id=? LIMIT 1",
//       [id]
//     );

//     if (!ticket) return res.status(404).json({ message: "Ticket not found" });

//     await db.promise().query("DELETE FROM support_tickets WHERE id=?", [id]);

//     res.json({ message: "Ticket deleted" });
//   } catch (err) {
//     console.error("❌ Delete Ticket Error:", err);
//     res.status(500).json({ message: "Error deleting ticket" });
//   }
// };

module.exports = {
  createTicket,
  listTickets
};