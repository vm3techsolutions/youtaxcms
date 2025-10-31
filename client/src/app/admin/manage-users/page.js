// app/admin/manage-admins/page.js
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AdminsList from "./AdminsList";
import RegisterAdminForm from "@/components/admin/RegisterAdminForm";

export default function ManageAdminsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="flex flex-col w-full bg-gray-50 p-6 space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold primaryText">Manage Admins</h2>
        <button
          onClick={() => setShowForm(true)}
          className="primary-btn px-4 py-2 rounded shadow"
        >
          Add New User
        </button>
      </div>

      {/* Admins List */}
      <AdminsList />

      {/* Add Admin Modal */}
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
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Register New User</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-800 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
              <RegisterAdminForm />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
