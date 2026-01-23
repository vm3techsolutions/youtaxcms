"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchAllDeliverables } from "@/store/slices/operationDeliverableSlice";
import { fetchAdmins } from "@/store/slices/adminSlice";
import { fetchOrderDocuments } from "@/store/slices/orderDocumentsSlice";

export default function DeliverablesPage() {
  const dispatch = useDispatch();

  const { allDeliverables, loading, error } = useSelector(
    (state) => state.operationDeliverables
  );

  const admins = useSelector((state) => state.admin.admins);
  const { documents, loadingFetch } = useSelector(
    (state) => state.orderDocuments
  );

  // 🔹 Modal state
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isDeliverablesModalOpen, setIsDeliverablesModalOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);

  // 🔹 Search + Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ROWS_LIMIT = 10;

  useEffect(() => {
    dispatch(fetchAllDeliverables());
    dispatch(fetchAdmins());
  }, [dispatch]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getUserNameById = (id) => {
    if (!id || !Array.isArray(admins)) return "";
    const user = admins.find((u) => u.id === id);
    return user?.name || "";
  };

  // 🔹 Filter logic
  const filteredDeliverables = Array.isArray(allDeliverables)
    ? allDeliverables.filter((item) => {
        const search = searchTerm.toLowerCase();
        return (
          item.service_name?.toLowerCase().includes(search) ||
          getUserNameById(item.sales_id).toLowerCase().includes(search) ||
          getUserNameById(item.generated_by).toLowerCase().includes(search) ||
          getUserNameById(item.account_id).toLowerCase().includes(search)
        );
      })
    : [];

  const totalPages = Math.ceil(filteredDeliverables.length / ROWS_LIMIT);

  const visibleRows = filteredDeliverables.slice(
    (currentPage - 1) * ROWS_LIMIT,
    currentPage * ROWS_LIMIT
  );

  // Uploaded docs modal
  const handleViewDocuments = (orderId) => {
    setActiveOrderId(orderId);
    setIsDocsModalOpen(true);
    dispatch(fetchOrderDocuments(orderId));
  };

  // Deliverables modal
  const handleViewDeliverables = (orderId) => {
    setActiveOrderId(orderId);
    setIsDeliverablesModalOpen(true);
  };

  const closeModal = () => {
    setIsDocsModalOpen(false);
    setIsDeliverablesModalOpen(false);
    setActiveOrderId(null);
  };

  if (loading) return <p>Loading deliverables...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      {/* Header + Search */}
      <div className="mb-6 flex flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">All Deliverables</h1>

        <input
          type="text"
          placeholder="Search by Sales / Operation / Account / Service"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr className="text-center">
              <th className="p-3 border">S.No</th>
              <th className="p-3 border">Order ID</th>
              <th className="p-3 border">Customer</th>
              <th className="p-3 border">Service</th>
              <th className="p-3 border">Uploaded Docs</th>
              <th className="p-3 border">Deliverables</th>
              <th className="p-3 border">Sales</th>
              <th className="p-3 border">Operation</th>
              <th className="p-3 border">Account</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-4 text-center text-gray-500">
                  No matching records found
                </td>
              </tr>
            ) : (
              visibleRows.map((item, index) => (
                <tr key={item.id} className="text-sm text-center">
                  <td className="p-3 border">
                    {(currentPage - 1) * ROWS_LIMIT + index + 1}
                  </td>
                  <td className="p-3 border">{item.order_id}</td>
                  <td className="p-3 border">{item.customer_name}</td>
                  <td className="p-3 border">{item.service_name}</td>

                  <td className="p-3 border">
                    <button
                      onClick={() => handleViewDocuments(item.order_id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>

                  <td className="p-3 border">
                    <button
                      onClick={() => handleViewDeliverables(item.order_id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      View
                    </button>
                  </td>

                  <td className="p-3 border">
                    {getUserNameById(item.sales_id) || "—"}
                  </td>
                  <td className="p-3 border">
                    {getUserNameById(item.generated_by) || "—"}
                  </td>
                  <td className="p-3 border">
                    {getUserNameById(item.account_id) || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {/* Pagination */}
{totalPages > 1 && (
  <div className="flex justify-center items-center mt-6 gap-2 flex-wrap">

    {/* ⬅ PREV */}
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className={`px-3 py-1 rounded border text-sm ${
        currentPage === 1
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      Prev
    </button>

    {/* PAGE NUMBERS */}
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
      if (
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 2 && page <= currentPage + 2)
      ) {
        return (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded border text-sm ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        );
      }

      if (page === currentPage - 3 || page === currentPage + 3) {
        return (
          <span key={page} className="px-2 text-gray-500">
            ...
          </span>
        );
      }

      return null;
    })}

    {/* NEXT ➡ */}
    <button
      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
      disabled={currentPage === totalPages}
      className={`px-3 py-1 rounded border text-sm ${
        currentPage === totalPages
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      Next
    </button>
  </div>
)}


      {/* ================= UPLOADED DOCS MODAL ================= */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Uploaded Documents (Order #{activeOrderId})
            </h2>

            {loadingFetch ? (
              <p>Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-gray-500">No documents found.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <span className="text-sm">
                      {doc.doc_name || "Document"}
                    </span>
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      className="text-blue-600 underline text-sm"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ================= DELIVERABLES MODAL ================= */}
      {isDeliverablesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Deliverables (Order #{activeOrderId})
            </h2>

            {allDeliverables.filter((d) => d.order_id === activeOrderId)
              .length === 0 ? (
              <p className="text-gray-500">No deliverables found.</p>
            ) : (
              <ul className="space-y-2">
                {allDeliverables
                  .filter((d) => d.order_id === activeOrderId)
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <span className="text-sm">
                        Version {d.versions}
                      </span>
                      <a
                        href={d.signed_url}
                        target="_blank"
                        className="text-green-600 underline text-sm"
                      >
                        View
                      </a>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
