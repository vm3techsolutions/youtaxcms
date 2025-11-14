"use client";
import { useState } from "react";
import ServicesList from "./ServicesList";
import AddService from "./AddService";

export default function AdminServices() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header with toggle button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold secondaryText">
          {showForm
            ? "Add New Service"
            : "Services"}
        </h2>

        <div className="flex space-x-3">
          
          {/* Add New Service button */}
          <button
            onClick={() => {
              setShowForm(true);
            }}
            className="primary-btn text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Add New Service
          </button>

          {/* Back to List button */}
          {(showForm ) && (
            <button
              onClick={() => {
                setShowForm(false);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700"
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      {/* Conditionally render forms or list */}
      <div className="mt-4">
        {showForm ? (
          <AddService />
        ) : (
          <ServicesList />
        )}
      </div>
    </div>
  );
}
