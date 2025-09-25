"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminRoles, registerAdmin, resetSuccess } from "@/store/slices/adminSlice";

export default function RegisterAdminForm() {
  const dispatch = useDispatch();
  const { roles, rolesLoading, registerLoading, success, error } = useSelector((state) => state.admin);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role_id: "",
  });

  // ✅ Reset success on component mount to prevent showing message immediately
  useEffect(() => {
    dispatch(resetSuccess());
    dispatch(fetchAdminRoles());
  }, [dispatch]);

  // ✅ Clear form and reset success after successful registration
  useEffect(() => {
    if (success) {
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        role_id: "",
      });

      const timer = setTimeout(() => dispatch(resetSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role_id) {
      alert("Please fill all required fields!");
      return;
    }
    dispatch(registerAdmin(formData));
  };

  return (
    <div className="w-full bg-white shadow-md rounded-lg p-6">
      {success && <p className="text-green-500 mb-4">Admin user created successfully!</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

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
          <label className="block mb-1 font-medium">Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Password"
            required
          />
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

        {/* Role */}
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

        {/* Submit button spans full row */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={registerLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {registerLoading ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </form>
    </div>
  );
}
