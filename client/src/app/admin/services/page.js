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
          {showForm ? "Add New Service" : "Services"}
        </h2>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="primary-btn text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          {showForm ? "Back to List" : "Add New Service"}
        </button>
      </div>

      {/* Conditionally render List or Form */}
      <div className="mt-4">
        {showForm ? <AddService /> : <ServicesList />}
      </div>
    </div>
  );
}
