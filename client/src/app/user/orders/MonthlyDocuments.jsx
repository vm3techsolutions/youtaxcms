"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  fetchCustomerDocumentsByOrder, replaceCustomerDocument 
} from "@/store/slices/customerDocumentSlice";


/* ===========================
   Monthly Documents Dashboard
=========================== */

export default function MonthlyDocuments({ orderId }) {
  const dispatch = useDispatch();

  const { documents, loading } = useSelector(
    (state) => state.customerDocument
  );

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

  /* Fetch documents */
  useEffect(() => {
    if (orderId) {
      dispatch(fetchCustomerDocumentsByOrder(orderId));
    }
  }, [orderId, dispatch]);

  /* Filter + Sort */
  const filteredDocuments = useMemo(() => {
    if (!documents?.length) return [];

    return documents
      .filter((doc) => {
        if (year && String(doc.doc_year) !== year) return false;
        if (
          month &&
          String(doc.doc_month).padStart(2, "0") !== month
        )
          return false;

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      );
  }, [documents, year, month]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row border-b pb-2 md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Monthly Documents
        </h2>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All Years</option>
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : filteredDocuments.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

/* ===========================
   Document Card
=========================== */

function DocumentCard({ doc }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [fileName, setFileName] = useState(doc.file_name || "");
  const [successMsg, setSuccessMsg] = useState("");

  const handleReplace = async () => {
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    try {
      setReplacing(true);

      await dispatch(
        replaceCustomerDocument({
          id: doc.id,
          file,
          file_name: fileName?.trim() || file.name,
        })
      ).unwrap();

      setSuccessMsg("Document replaced successfully.");
    setFile(null);
    } catch (err) {
      alert(err || "Replace failed");
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="border rounded-xl p-4 bg-gray-50 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {getMonthName(doc.doc_month)} {doc.doc_year}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(doc.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* File Name */}
      <p className="text-sm font-semibold text-gray-800 truncate">
        {doc.file_name || "Untitled Document"}
      </p>

      {/* Status (optional) */}
      {doc.status && (
  <span
    className={`inline-block mt-2 text-xs px-2 py-0.5 rounded transition-all duration-300
      ${
        doc.status === "approved"
          ? "bg-green-100 text-green-700"
          : doc.status === "rejected"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
  >
    {doc.status}
  </span>
)}

{doc.status === "rejected" && doc.operation_remark && (
  <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
    <span className="font-semibold">Remark:</span> {doc.operation_remark}
  </div>
)}


      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <a
          href={doc.signed_url || doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#FFBF00] text-black hover:bg-[#e6ac00]"
        >
          View
        </a>

        {/* Replace only if rejected */}
        {doc.status === "rejected" && (
          <button
  onClick={() => setShowReplaceModal(true)}
  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
>
  Replace
</button>

        )}
      </div>

        {/* Replace rejected doc */}
      {showReplaceModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">

      {/* Header */}
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Replace Rejected Document
      </h3>

      {/* Month & Year (Read-only) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500">Month</label>
          <input
            value={getMonthName(doc.doc_month)}
            disabled
            className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Year</label>
          <input
            value={doc.doc_year}
            disabled
            className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
          />
        </div>
      </div>

      {/* File Name (full width) */}
  <div className="col-span-2">
    <label className="block text-xs text-gray-500 mb-1">
      File Name
    </label>
    <input
      type="text"
      value={fileName}
      onChange={(e) => setFileName(e.target.value)}
      className="w-full border rounded px-3 py-2 text-sm"
      placeholder="Enter file name"
    />
  </div>

      {/* File input */}
      <div className="mb-4">
        <label className="text-xs text-gray-500">Select new file</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowReplaceModal(false);
            setFile(null);
          }}
          className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>

        {successMsg && (
  <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
    {successMsg}
  </div>
)}

        <button
         onClick={async () => {
  const success = await handleReplace();
  if (success) {
    setTimeout(() => {
      setShowReplaceModal(false);
      setSuccessMsg("");
      setFileName(doc.file_name || "");
    }, 1200);
  }
}}

          disabled={replacing}
          className={`px-4 py-2 text-sm rounded text-white
            ${
              replacing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
        >
          {replacing ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

/* ===========================
   Helpers & States
=========================== */

function getMonthName(month) {
  return new Date(0, month - 1).toLocaleString("default", {
    month: "long",
  });
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-500">
      No documents found for the selected month and year.
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12 text-gray-400">
      Loading documents...
    </div>
  );
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
