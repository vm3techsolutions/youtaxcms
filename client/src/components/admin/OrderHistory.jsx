"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders } from "@/store/slices/adminCustomerSlice";
import { fetchAdmins } from "@/store/slices/adminSlice";
import { fetchOrderLogsByOrderId, clearOrderLogs } from "@/store/slices/orderLogsSlice";

const OrderHistory = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.adminCustomer);
  const { admins } = useSelector((state) => state.admin);
  const { logs, loading: logsLoading } = useSelector((state) => state.orderLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const ordersPerPage = 10;

  useEffect(() => {
    dispatch(fetchAllOrders());
    dispatch(fetchAdmins());
  }, [dispatch]);

  const openLogsModal = (orderId) => {
    setSelectedOrderId(orderId);
    dispatch(fetchOrderLogsByOrderId(orderId));
    setShowModal(true);
  };

  const closePopup = () => {
    setShowModal(false);
    dispatch(clearOrderLogs());
  };

  // ✅ Get assigned admin name by ID
  const getAssignedAdminName = (assignedId) => {
    const admin = admins.find((a) => a.id === assignedId);
    return admin ? admin.name : "Unassigned";
  };

  // ✅ Filter orders
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      order.service_name?.toLowerCase().includes(term) ||
      order.customer_name?.toLowerCase().includes(term) ||
      order.status?.toLowerCase().includes(term) ||
      order.id?.toString().includes(term);

    const matchesDate = selectedDate
      ? new Date(order.created_at).toISOString().slice(0, 10) === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading) return <p className="text-gray-600 text-center py-4">Loading order history...</p>;
  if (error) return <p className="text-red-500 text-center py-4">Error: {error}</p>;



  // 🔹 Hide system-generated logs
const filteredLogs = (logs || []).filter(
  (log) => log.from_role !== "system"
);

  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      {/* Header + Search + Date Filter */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Order History</h2>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by Order ID, Service, Customer, or Status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-50 border border-gray-200 rounded-lg">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Order ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Service</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total Amount</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Advance Paid</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Pending Amount</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Payment Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Assigned To</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length > 0 ? (
              currentOrders.map((order, index) => (
                <tr key={order.id} className="border-b hover:bg-gray-100 transition">
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {indexOfFirstOrder + index + 1}
                  </td>
                  {/* CLICKABLE ORDER ID → OPEN POPUP */}
                  <td
                    onClick={() => openLogsModal(order.id)}
                    className="px-4 py-2 text-sm text-blue-600 cursor-pointer hover:underline font-semibold"
                  >
                    #{order.id}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">{order.service_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{order.customer_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    ₹{Number(order.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    ₹{Number(order.advance_paid || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    ₹{Number(order.pending_amount || 0).toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm font-semibold ${order.payment_status === "paid"
                        ? "text-green-600"
                        : order.payment_status === "unpaid"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                  >
                    {order.payment_status}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {getAssignedAdminName(order.assigned_to)}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm font-semibold ${order.status === "completed"
                        ? "text-green-600"
                        : order.status === "under_review"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                  >
                    {order.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center py-6 text-gray-500 text-sm">
                  No matching orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-lg border ${currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-blue-100"
              }`}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`px-3 py-1 rounded-lg border ${currentPage === i + 1
                  ? "primaryBg text-white"
                  : "bg-white text-gray-700 hover:bg-blue-100"
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-lg border ${currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-blue-100"
              }`}
          >
            Next
          </button>
        </div>
      )}

      {/* ===========================
    MODAL (Order Logs Timeline)
============================ */}
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center px-4 z-50">
    <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 relative 
      animate-[slideIn_0.3s_ease] max-h-[85vh] overflow-y-auto">

      {/* Close Button */}
      <button
        onClick={closePopup}
        className="absolute top-2 right-0 text-gray-700 hover:text-gray-900 bg-amber-300 px-1 py-1 rounded"
      >
        ✕
      </button>

      {/* ORDER INFO — SHOW ONCE */}
      {filteredLogs.length > 0 && (
        <div className="mb-6 bg-gray-100 p-4 rounded-lg border">
          <h3 className="text-xl font-semibold mb-3">Order Details</h3>
          <p><strong>Customer:</strong> {filteredLogs[0].customer_name}</p>
          <p><strong>Service:</strong> {filteredLogs[0].service_name}</p>
          <p><strong>Date:</strong> {new Date(filteredLogs[0].created_at).toLocaleDateString()}</p>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4">Timeline</h3>

      {/* TIMELINE */}
{logsLoading ? (
  <p className="text-center py-4 text-gray-600">Loading logs...</p>
) : filteredLogs.length === 0 ? (
  <p className="text-center py-4 text-gray-500">No logs available.</p>
) : (
  <div className="space-y-6 mt-4 max-h-[70vh] pr-2">
    {filteredLogs.map((log, index) => (
      <div
        key={index}
        className="relative pl-8 border-l-2 border-yellow-500 animate-[fadeIn_0.4s_ease]"
      >
        <span className="absolute -left-2.5 top-1 w-5 h-5 bg-yellow-500 rounded-full shadow-md"></span>

        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <p>
            <strong>From ({log.from_role}):</strong>{" "}
            {log.from_user_name}
          </p>

          {log.to_role && log.to_user_name && (
            <p>
              <strong>To ({log.to_role}):</strong>{" "}
              {log.to_user_name}
            </p>
          )}

          <p><strong>Action:</strong> {log.action || "—"}</p>
          <p><strong>Remark:</strong> {log.remarks || "—"}</p>

          <p className="text-xs text-gray-500 mt-2">
            {new Date(log.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    ))}
  </div>
)}
    </div>
  </div>
)}


    </div>
  );
};

export default OrderHistory;
