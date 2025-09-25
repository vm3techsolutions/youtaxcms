// components/admin/AdminsList.jsx
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdmins, deleteAdmin } from "@/store/slices/adminSlice"; // Ensure this slice exists
import { Edit } from "lucide-react";

export default function AdminsList() {
  const dispatch = useDispatch();
  const { admins, loading, error } = useSelector((s) => s.admin); // Corrected: admins array

  useEffect(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  if (loading) return <p>Loading admins...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">#</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-left">Role</th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins && admins.map((admin, index) => (
            <tr key={admin.id} className="hover:bg-gray-50">
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{admin.name}</td>
              <td className="border p-2">{admin.email}</td>
              <td className="border p-2">{admin.role}</td>
              <td className="border p-2 text-center space-x-3">
                <button
                  onClick={() => alert(`Edit admin ${admin.id}`)} // Replace with actual edit modal
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
