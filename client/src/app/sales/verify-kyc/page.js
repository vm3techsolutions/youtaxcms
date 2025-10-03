"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingKyc,
  verifyKyc,
  fetchReviewedKyc,
  resetKycState,
} from "@/store/slices/salesKycSlice";
import { fetchAllCustomers } from "@/store/slices/customersSlice";

export default function SalesKycDashboard() {
  const dispatch = useDispatch();
  const { pending, reviewed, loading, error } = useSelector(
    (state) => state.salesKyc
  );
  const { customers } = useSelector((state) => state.customers);

  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "reviewed"

  useEffect(() => {
    dispatch(fetchAllCustomers());
    dispatch(fetchPendingKyc());
    dispatch(fetchReviewedKyc());

    return () => {
      dispatch(resetKycState());
    };
  }, [dispatch]);

  const getCustomer = (id) =>
    customers.find((c) => c.id === id) || { name: "NA", email: "NA" };

  const handleVerify = (kycId, status) => {
    dispatch(verifyKyc({ kyc_id: kycId, status }));
  };

  const renderTable = (docs, isPending = true) => (
    <table className="w-full border-collapse border">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1">Customer Name</th>
          <th className="border px-2 py-1">Email</th>
          {isPending && <th className="border px-2 py-1">Document</th>}
          <th className="border px-2 py-1">{isPending ? "Actions" : "Status"}</th>
          {!isPending && <th className="border px-2 py-1">Remarks</th>}
        </tr>
      </thead>
      <tbody>
        {docs.length === 0 && (
          <tr>
            <td
              colSpan={isPending ? 4 : 4}
              className="border px-2 py-1 text-center"
            >
              {isPending ? "No pending documents" : "No reviewed documents"}
            </td>
          </tr>
        )}
        {docs.map((doc) => {
          const customer = getCustomer(doc.customer_id);
          return (
            <tr key={doc.id}>
              <td className="border px-2 py-1">{customer.name}</td>
              <td className="border px-2 py-1">{customer.email}</td>
              {isPending && (
                <td className="border px-2 py-1">
                  <a
                    href={doc.signed_url}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    View Document
                  </a>
                </td>
              )}
              <td className="border px-2 py-1">
                {isPending ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(doc.id, "verified")}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleVerify(doc.id, "rejected")}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span
                    className={
                      doc.status === "verified"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {doc.status.toUpperCase()}
                  </span>
                )}
              </td>
              {!isPending && (
                <td className="border px-2 py-1">{doc.remarks || "-"}</td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">KYC Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          className={`px-4 py-2 font-semibold ${
            activeTab === "pending"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending KYC
        </button>
        <button
          className={`px-4 py-2 font-semibold ${
            activeTab === "reviewed"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("reviewed")}
        >
          Reviewed KYC
        </button>
      </div>

      {/* Tab Content */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {activeTab === "pending" && renderTable(pending, true)}
      {activeTab === "reviewed" && renderTable(reviewed, false)}
    </div>
  );
}
