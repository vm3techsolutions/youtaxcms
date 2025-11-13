const db = require("../../../config/db");

// ============================================================
// Submit or Update Multiple Order Inputs (Bulk)
// ============================================================
const submitOrderInput = async (req, res) => {
  try {
    const { order_id, inputs } = req.body;

    if (!order_id || !inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({ message: "order_id and inputs array are required" });
    }

    // Loop through each input field
    for (const input of inputs) {
      const { service_input_id, text_value, selected_option } = input;

      if (!service_input_id) continue; // skip invalid entries

      // Check if record exists
      const [existing] = await db.query(
        `SELECT id FROM order_input WHERE order_id = ? AND service_input_id = ?`,
        [order_id, service_input_id]
      );

      if (existing.length > 0) {
        // Update
        await db.query(
          `UPDATE order_input 
           SET text_value = ?, selected_option = ?, updated_at = NOW() 
           WHERE order_id = ? AND service_input_id = ?`,
          [text_value || null, selected_option || null, order_id, service_input_id]
        );
      } else {
        // Insert
        await db.query(
          `INSERT INTO order_input 
           (order_id, service_input_id, text_value, selected_option, status, created_at)
           VALUES (?, ?, ?, ?, 'submitted', NOW())`,
          [order_id, service_input_id, text_value || null, selected_option || null]
        );
      }
    }

    res.json({ message: "Order inputs saved successfully" });
  } catch (err) {
    console.error("DB Error (submitOrderInput):", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ============================================================
// Get all Inputs (and their values) for an Order
// ============================================================
const getOrderInputs = async (req, res) => {
  try {
    const { order_id } = req.params;
    if (!order_id) return res.status(400).json({ message: "order_id required" });

    const [rows] = await db.query(
      `SELECT oi.*, si.label_name, si.input_type, si.options, si.is_mandatory
       FROM order_input oi
       JOIN service_input si ON oi.service_input_id = si.id
       WHERE oi.order_id = ?
       `,
      [order_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("DB Error (getOrderInputs):", err);
    res.status(500).json({ message: "Database error" });
  }
};

module.exports = {
  submitOrderInput,
  getOrderInputs
};
