"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomerDocumentsByOrder,
  updateCustomerDocumentStatus,
} from "@/store/slices/customerDocumentSlice";

/* ===========================
   Monthly Customer Documents
=========================== */

export default function MonthlyCustomerDocuments({ orderId }) {
  const dispatch = useDispatch();

  const { documents, loading } = useSelector(
    (state) => state.customerDocument
  );

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [remark, setRemark] = useState({});
  const [actionDocId, setActionDocId] = useState(null);

  /* Fetch documents */
  useEffect(() => {
    if (orderId) {
      dispatch(fetchCustomerDocumentsByOrder(orderId));
    }
  }, [orderId, dispatch]);

  /* Normalize month/year */
  const normalizedDocs = useMemo(() => {
    return (documents || []).map((doc) => ({
      ...doc,
      doc_year: String(doc.doc_year),
      doc_month: String(doc.doc_month).padStart(2, "0"),
    }));
  }, [documents]);

  /* Year list */
  const years = [...new Set(normalizedDocs.map((d) => d.doc_year))];

  /* Month list based on year */
  const months = [
    ...new Set(
      normalizedDocs
        .filter((d) => d.doc_year === year)
        .map((d) => d.doc_month)
    ),
  ];

  /* Filter */
  const filteredDocs = normalizedDocs.filter((doc) => {
    if (year && doc.doc_year !== year) return false;
    if (month && doc.doc_month !== month) return false;
    return true;
  });

  /* Group by Year → Month */
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    acc[doc.doc_year] ??= {};
    acc[doc.doc_year][doc.doc_month] ??= [];
    acc[doc.doc_year][doc.doc_month].push(doc);
    return acc;
  }, {});

  /* Status update */
  const handleStatusUpdate = async (id, status) => {
    try {
      setActionDocId(id); // lock buttons

      await dispatch(
        updateCustomerDocumentStatus({
          id,
          status,
          operation_remark: remark[id] || "",
        })
      ).unwrap();

    } catch (error) {
      alert(error || "Failed to update status");
    } finally {
      setActionDocId(null);
    }
  };


  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setMonth("");
            }}
            className="border px-3 py-2 rounded text-sm"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={!year}
            className="border px-3 py-2 rounded text-sm"
          >
            <option value="">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("default", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">
          Loading documents...
        </p>
      ) : Object.keys(groupedDocs).length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          No documents found.
        </p>
      ) : (
        Object.entries(groupedDocs).map(([yr, months]) => (
          <div key={yr} className="mb-8">
            <h3 className="text-lg font-bold mb-3">{yr}</h3>

            {Object.entries(months).map(([mn, docs]) => (
              <div key={mn} className="mb-6">
                <h4 className="font-semibold mb-3">
                  {new Date(0, mn - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between mb-2">
                        <p className="font-medium truncate">
                          {doc.file_name || "Document"}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded transition-all duration-300
    ${doc.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {doc.status || "pending"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mb-3">
                        Uploaded:{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>

                      {doc.operation_remark && (
                        <p className="text-sm text-gray-600 mb-2">
                          Remark: {doc.operation_remark}
                        </p>
                      )}

                      <div className="flex gap-2 mb-3">
                        <a
                          href={doc.signed_url || doc.file_url}
                          target="_blank"
                          className="text-sm text-blue-600 underline"
                        >
                          View
                        </a>
                      </div>

                      {/* Action */}
                      {doc.status !== "approved" && (
                        <>
                          <textarea
                            placeholder="Add remark (optional)"
                            className="w-full border rounded p-2 text-sm mb-2"
                            value={remark[doc.id] || ""}
                            onChange={(e) =>
                              setRemark({
                                ...remark,
                                [doc.id]: e.target.value,
                              })
                            }
                          />

                          <div className="flex gap-2">
                            <button
                              disabled={actionDocId === doc.id}
                              onClick={() => handleStatusUpdate(doc.id, "approved")}
                              className={`px-3 py-1 text-sm rounded text-white
          ${actionDocId === doc.id
                                  ? "bg-green-300 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                              {actionDocId === doc.id ? "Processing..." : "Approve"}
                            </button>

                            <button
                              disabled={actionDocId === doc.id}
                              onClick={() => handleStatusUpdate(doc.id, "rejected")}
                              className={`px-3 py-1 text-sm rounded text-white
          ${actionDocId === doc.id
                                  ? "bg-red-300 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                              Reject
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
