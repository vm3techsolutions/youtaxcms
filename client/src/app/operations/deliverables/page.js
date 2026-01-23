"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDeliverablesByOperation,
  clearDeliverablesError,
  resetDeliverables,
} from "@/store/slices/operationDeliverableSlice";

export default function DeliverablesPage() {
  const dispatch = useDispatch();

  const {
    myDeliverables = [],
    loading,
    error,
  } = useSelector((state) => state.operationDeliverables);

  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchDeliverablesByOperation());
    return () => dispatch(resetDeliverables());
  }, [dispatch]);

  const filteredDeliverables = useMemo(() => {
    if (!search.trim()) return myDeliverables;

    const q = search.toLowerCase();
    return myDeliverables.filter((d) =>
      d.customer_name?.toLowerCase().includes(q) ||
      d.service_name?.toLowerCase().includes(q) ||
      String(d.order_id).includes(q) ||
      String(d.id).includes(q)
    );
  }, [search, myDeliverables]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        My Deliverables
      </h1>

      {loading && (
        <p className="text-center text-gray-500">
          Loading deliverables...
        </p>
      )}

      {error && (
        <p className="text-center text-red-500 mb-4">
          {error}
          <button
            onClick={() => dispatch(clearDeliverablesError())}
            className="underline ml-2"
          >
            Clear
          </button>
        </p>
      )}

      <div className="mb-5 max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Search by Customer, Service, Order ID, Deliverable ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-3 w-full rounded shadow-sm"
        />
      </div>

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
            {filteredDeliverables.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{d.id}</td>
                <td className="border px-4 py-2">{d.order_id}</td>
                <td className="border px-4 py-2">{d.customer_name}</td>
                <td className="border px-4 py-2">{d.service_name}</td>
                <td className="border px-4 py-2">{d.versions}</td>
                <td className="border px-4 py-2">{d.qc_status || "-"}</td>
                <td className="border px-4 py-2">
                  {d.signed_url ? (
                    <a
                      href={d.signed_url}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      View File
                    </a>
                  ) : "-"}
                </td>
                <td className="border px-4 py-2">
                  {new Date(d.created_at).toLocaleString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
