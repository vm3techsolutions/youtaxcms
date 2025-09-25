"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ServicesList from "./ServicesList";
import AddService from "./AddService";

export default function AdminServices() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Services</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Add New Service
        </button>
      </div>

      {/* Services List */}
      <ServicesList />

      {/* Add Service Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30"
          >
            <motion.div
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 90 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Add New Service</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-800 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
              <AddService />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
