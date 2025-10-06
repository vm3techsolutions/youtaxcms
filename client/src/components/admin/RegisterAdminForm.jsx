"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminRoles,
  registerAdmin,
  resetSuccess,
} from "@/store/slices/adminSlice";
import { updateAdminUser, resetAdminUsersState } from "@/store/slices/adminUserSlice";
import { Eye, EyeOff } from "lucide-react";

export default function AdminForm({ mode = "add", initialValues = {}, onCancel }) {
  const dispatch = useDispatch();
  const { roles, rolesLoading, registerLoading, success, error } = useSelector(
    (state) => state.admin
  );

  const { updateLoading, updateSuccess, error: updateError } = useSelector(
    (state) => state.adminUser
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role_id: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [localSuccess, setLocalSuccess] = useState("");

  // ✅ Reset success and fetch roles (only for add)
  useEffect(() => {
    dispatch(resetSuccess());
    if (mode === "add") dispatch(fetchAdminRoles());
  }, [dispatch, mode]);

  // ✅ Prefill values if editing
  useEffect(() => {
    if (mode === "edit" && initialValues) {
      setFormData({
        name: initialValues.name || "",
        email: initialValues.email || "",
        password: "",
        phone: initialValues.phone || "",
        role_id: initialValues.role_id || "",
      });
    }
  }, [mode, initialValues]);

  // ✅ Show success for add
  useEffect(() => {
    if (success && mode === "add") {
      setLocalSuccess("Admin user created successfully!");
      setFormData({ name: "", email: "", password: "", phone: "", role_id: "" });
      const timer = setTimeout(() => setLocalSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, mode]);

  // ✅ Show success for edit
  useEffect(() => {
  if (updateSuccess && mode === "edit") {
    setLocalSuccess("Admin updated successfully!");

    const timer = setTimeout(() => {
      setLocalSuccess("");            // Clear local message
      dispatch(resetAdminUsersState()); // Reset Redux state AFTER showing message
    }, 5000);

    return () => clearTimeout(timer);
  }
}, [updateSuccess, mode, dispatch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please fill all required fields!");
      return;
    }

    if (mode === "add") {
      if (!formData.password || !formData.role_id) {
        alert("Password and Role are required!");
        return;
      }
      dispatch(registerAdmin(formData));
    } else {
      dispatch(updateAdminUser({ id: initialValues.id, ...formData }))
        .unwrap()
        .catch((err) => console.error(err)); 
    }
  };

  return (
    <div className="w-full bg-white shadow-md rounded-lg p-6">
      {localSuccess && <p className="text-green-500 mb-4">{localSuccess}</p>}
      {(error || updateError) && <p className="text-red-500 mb-4">{error || updateError}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block mb-1 font-medium">Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter Name"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 font-medium">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter Email"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 font-medium">
            Password {mode === "add" ? "*" : "(leave blank to keep existing)"}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Password"
              required={mode === "add"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1 font-medium">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter Phone Number"
          />
        </div>

        {/* Role - only for add */}
        {mode === "add" && (
          <div>
            <label className="block mb-1 font-medium">Role *</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Role</option>
              {rolesLoading ? (
                <option disabled>Loading roles...</option>
              ) : (
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Buttons */}
        <div className="md:col-span-2 flex justify-end gap-3">
          {mode === "edit" && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={registerLoading || updateLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {registerLoading || updateLoading
              ? mode === "add"
                ? "Creating..."
                : "Updating..."
              : mode === "add"
              ? "Create Admin"
              : "Update Admin"}
          </button>
        </div>
      </form>
    </div>
  );
}
