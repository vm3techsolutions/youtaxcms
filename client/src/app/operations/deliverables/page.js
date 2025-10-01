"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllDeliverables,
  fetchDeliverablesForOrder,
  clearDeliverablesError,
  resetDeliverables,
} from "@/store/slices/operationDeliverableSlice";

export default function DeliverablesPage() {
  const dispatch = useDispatch();
  const { allDeliverables, orderDeliverables, loading, error } = useSelector(
    (state) => state.operationDeliverables || {}
  );
  const [selectedOrder, setSelectedOrder] = useState("");

  useEffect(() => {
    dispatch(fetchAllDeliverables());
    return () => dispatch(resetDeliverables());
  }, [dispatch]);

  const handleOrderChange = (e) => {
    const orderId = e.target.value;
    setSelectedOrder(orderId);
    if (orderId) dispatch(fetchDeliverablesForOrder(orderId));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Deliverables Dashboard</h1>

      {loading && <p className="text-center text-gray-500">Loading deliverables...</p>}
      {error && (
        <p className="text-center text-red-500 mb-4">
          {error}{" "}
          <button onClick={() => dispatch(clearDeliverablesError())} className="underline ml-2">
            Clear
          </button>
        </p>
      )}

      {/* Order filter */}
      <div className="mb-4">
        <label className="block mb-2">Select Order:</label>
        <select
          value={selectedOrder}
          onChange={handleOrderChange}
          className="border p-2 w-full max-w-sm"
        >
          <option value="">-- All Orders --</option>
          {[...new Set(allDeliverables.map((d) => d.order_id))].map((orderId) => (
            <option key={orderId} value={orderId}>
              Order #{orderId}
            </option>
          ))}
        </select>
      </div>

      {/* Deliverables Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">Deliverable ID</th>
              <th className="py-2 px-4 border">Order ID</th>
              <th className="py-2 px-4 border">Customer</th>
              <th className="py-2 px-4 border">Service</th>
              <th className="py-2 px-4 border">Version</th>
              <th className="py-2 px-4 border">QC Status</th>
              <th className="py-2 px-4 border">File</th>
              <th className="py-2 px-4 border">Uploaded At</th>
            </tr>
          </thead>
          <tbody>
            {(selectedOrder ? orderDeliverables : allDeliverables).map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{d.id}</td>
                <td className="py-2 px-4 border">{d.order_id}</td>
                <td className="py-2 px-4 border">{d.customer_name || "-"}</td>
                <td className="py-2 px-4 border">{d.service_name || "-"}</td>
                <td className="py-2 px-4 border">{d.versions}</td>
                <td className="py-2 px-4 border">{d.qc_status || "-"}</td>
                <td className="py-2 px-4 border">
                  {d.signed_url ? (
                    <a
                      href={d.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View File
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-2 px-4 border">{new Date(d.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
