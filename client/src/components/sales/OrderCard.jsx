"use client";

import { useState } from "react";

export default function OrderCard({ order, loadingUpdate, loadingCheck, onUpdateDocument, onTriggerCheck }) {
  const [remarks, setRemarks] = useState("");

  return (
    <div className="border rounded-xl shadow-md p-6 bg-white">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">{order.service_name}</h2>
          <p className="text-gray-600">Customer: {order.customer_name}</p>
          <p className="text-gray-600">Order Status: {order.status}</p>
        </div>
        <button
          onClick={onTriggerCheck}
          disabled={loadingCheck}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {loadingCheck ? "Checking..." : "Check Order Status"}
        </button>
      </div>

      {/* Documents */}
      <div className="space-y-4">
        {order.documents?.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between border p-3 rounded-lg bg-gray-50"
          >
            <div>
              <p className="font-medium">{doc.doc_name}</p>
              <p className="text-sm text-gray-500">Status: {doc.status || "pending"}</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="border rounded px-2 py-1 w-32 text-sm"
              />

              <button
                onClick={() => onUpdateDocument(doc.id, "verified", remarks)}
                disabled={loadingUpdate}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                {loadingUpdate ? "..." : "Approve"}
              </button>

              <button
                onClick={() => onUpdateDocument(doc.id, "rejected", remarks)}
                disabled={loadingUpdate}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                {loadingUpdate ? "..." : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
