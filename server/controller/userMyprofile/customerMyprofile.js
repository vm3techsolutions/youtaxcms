const db = require("../../config/db");

/**
 * Create a new profile field for the logged-in user, preventing duplicates.
 * @param {import('express').Request} req Express request object. Requires req.user.id and req.body.profile_field, field_value
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const createMyProfile = async (req, res) => {
  try {
    const customerId = req.user.id; // from JWT
    const { profile_field, field_value } = req.body;

    // ✅ Validate inputs
    if (!profile_field || !field_value) {
      return res
        .status(400)
        .json({ message: "profile_field and field_value are required" });
    }
    if (profile_field.length > 100) {
      return res.status(400).json({ message: "profile_field exceeds 100 characters" });
    }
    if (field_value.length > 500) {
      return res.status(400).json({ message: "field_value exceeds 500 characters" });
    }

    // ✅ Check if profile_field already exists for this user
    const [existing] = await db
      .promise()
      .query(
        "SELECT id FROM customer_profiles WHERE customer_id = ? AND profile_field = ?",
        [customerId, profile_field]
      );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Profile field already exists for this user" });
    }

    // ✅ Insert new record
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO customer_profiles (customer_id, profile_field, field_value) VALUES (?, ?, ?)",
        [customerId, profile_field, field_value]
      );

    res.status(201).json({
      message: "Profile field created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("DB Error (createMyProfile):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get all profile fields for the logged-in user.
 * @param {import('express').Request} req Express request object. Requires req.user.id
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getMyProfiles = async (req, res) => {
  try {
    const customerId = req.user.id;

    const [results] = await db
      .promise()
      .query("SELECT * FROM customer_profiles WHERE customer_id = ?", [customerId]);

    res.json(results);
  } catch (err) {
    console.error("DB Error (getMyProfiles):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Get a profile field by its ID, only if it belongs to the logged-in user.
 * @param {import('express').Request} req Express request object. Requires req.params.id
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const getMyProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db
      .promise()
      .query("SELECT * FROM customer_profiles WHERE id = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Profile field not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("DB Error (getMyProfileById):", err);
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * Update a profile field for the logged-in user. Only allows updating fields that belong to the user.
 * @param {import('express').Request} req Express request object. Requires req.user.id and req.body.profile_field, field_value
 * @param {import('express').Response} res Express response object
 * @returns {Promise<void>}
 */
const updateMyProfile = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { profile_field, field_value } = req.body;

    // ✅ Validate inputs
    if (!profile_field || !field_value) {
      return res
        .status(400)
        .json({ message: "profile_field and field_value are required" });
    }
    if (profile_field.length > 100) {
      return res.status(400).json({ message: "profile_field exceeds 100 characters" });
    }
    if (field_value.length > 500) {
      return res.status(400).json({ message: "field_value exceeds 500 characters" });
    }

    // ✅ Check if the profile_field exists for this user
    const [existing] = await db
      .promise()
      .query(
        "SELECT id FROM customer_profiles WHERE customer_id = ? AND profile_field = ?",
        [customerId, profile_field]
      );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ message: "Profile field not found for this user" });
    }

    // ✅ Update field_value + updated_at
    await db
      .promise()
      .query(
        "UPDATE customer_profiles SET field_value = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND profile_field = ?",
        [field_value, customerId, profile_field]
      );

    res.json({ message: "Profile field updated successfully" });
  } catch (err) {
    console.error("DB Error (updateMyProfile):", err);
    res.status(500).json({ message: "Database error" });
  }
};

module.exports = {
  createMyProfile,
  getMyProfiles,
  getMyProfileById,
  updateMyProfile,
};
