"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createProfile, updateProfile } from "@/store/slices/profileSlice";

export default function ProfileForm() {
  const dispatch = useDispatch();
  const { loading, message, error } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    profile_field: "",
    field_value: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createProfile(formData));
  };

  const handleUpdate = () => {
    dispatch(updateProfile(formData));
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="font-semibold mb-2">Add / Update Profile Field</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          name="profile_field"
          value={formData.profile_field}
          onChange={handleChange}
          placeholder="Profile Field (e.g. Education)"
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          name="field_value"
          value={formData.field_value}
          onChange={handleChange}
          placeholder="Field Value (e.g. BSc Computer Science)"
          className="border p-2 rounded w-full"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Create"}
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Update
          </button>
        </div>
      </form>
      {message && <p className="text-green-600 mt-2">{message}</p>}
      {error && <p className="text-red-600 mt-2">{JSON.stringify(error)}</p>}
    </div>
  );
}
