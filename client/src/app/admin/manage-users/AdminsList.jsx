"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { fetchAdmins } from "@/store/slices/adminSlice";
import { Edit } from "lucide-react";
import RegisterAdminForm from "@/components/admin/RegisterAdminForm";

export default function AdminsList() {
  const dispatch = useDispatch();
  const { admins, loading, error } = useSelector((s) => s.admin);
  const { updateSuccess } = useSelector((s) => s.adminUser); // get updateSuccess from slice

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  // ✅ Auto-close modal 3 seconds after successful update
  useEffect(() => {
    if (updateSuccess && showForm) {
      const timer = setTimeout(() => {
        setShowForm(false);
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [updateSuccess, showForm]);

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
          {admins?.map((admin, index) => (
            <tr key={admin.id} className="hover:bg-gray-50">
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{admin.name}</td>
              <td className="border p-2">{admin.email}</td>
              <td className="border p-2">{admin.role}</td>
              <td className="border p-2 text-center space-x-3">
                <button
                  onClick={() => {
                    setSelectedAdmin(admin);
                    setShowForm(true);
                  }}
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

      {/* Animated Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30"
          >
            <motion.div
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 90 }}
              transition={{ duration: 0.6 }}
              className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative"
            >
              {/* Close button */}
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>

              <RegisterAdminForm
                mode="edit"
                initialValues={selectedAdmin}
                onCancel={() => setShowForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
