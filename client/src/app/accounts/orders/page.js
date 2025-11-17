"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingOrdersForAccounts,
  fetchOrderPayments,
  forwardToOperations,
  clearMessages,
  resetAccountsState,
} from "@/store/slices/accountsSlice";
import { fetchAdminRoles } from "@/store/slices/adminSlice";
import { fetchAdminUsersByRole } from "@/store/slices/adminUserSlice";

export default function AccountsOrdersPage() {
  const dispatch = useDispatch();
  const {
    pendingOrders,
    paymentsByOrder,
    loadingOrders,
    loadingPayments,
    loadingForward,
    error,
    success,
  } = useSelector((state) => state.accounts);

 // Admin slices
  const { roles, rolesLoading } = useSelector((state) => state.admin);
  const { usersByRole: operationsUsers, loading: loadingAdmins } = useSelector(
    (state) => state.adminUser
  );

  const [showPayments, setShowPayments] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState("");

  // Fetch pending orders on mount
  useEffect(() => {
    dispatch(fetchPendingOrdersForAccounts());
    dispatch(fetchAdminRoles());
    return () => dispatch(resetAccountsState());
  }, [dispatch]);

  // Fetch operations users after roles are loaded
  useEffect(() => {
    if (roles && roles.length > 0) {
      const operationRole = roles.find(
        (r) => r?.name?.toLowerCase() === "operation"
      );
      if (operationRole) {
        dispatch(fetchAdminUsersByRole(operationRole.id));
      }
    }
  }, [roles, dispatch]);

  const handleViewPayments = (orderId) => {
    dispatch(fetchOrderPayments(orderId));
    setSelectedOrder(orderId);
    setShowPayments(true);
  };

  const handleForwardOrder = () => {
    if (!selectedOperation) return alert("Select an Operation User");
    dispatch(
      forwardToOperations({
        order_id: selectedOrder,
        assigned_to: selectedOperation,
        remarks: "Verified and forwarded",
      })
    );
    setShowForward(false);
    setSelectedOperation("");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Accounts Dashboard</h1>

      {/* Messages */}
      {loadingOrders && <p className="text-center text-gray-500">Loading orders...</p>}
      {loadingPayments && <p className="text-center text-gray-500">Loading payments...</p>}
      {loadingForward && <p className="text-center text-gray-500">Forwarding order...</p>}
      {error && (
        <p className="text-center text-red-500 mb-4">
          {error}{" "}
          <button onClick={() => dispatch(clearMessages())} className="underline ml-2">
            Clear
          </button>
        </p>
      )}
      {success && (
        <p className="text-center text-green-500 mb-4">
          {success}{" "}
          <button onClick={() => dispatch(clearMessages())} className="underline ml-2">
            Clear
          </button>
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">Order ID</th>
              <th className="py-2 px-4 border">Customer</th>
              <th className="py-2 px-4 border">Service</th>
              <th className="py-2 px-4 border">Total</th>
              <th className="py-2 px-4 border">Paid</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingOrders.length === 0 && !loadingOrders && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No pending orders.
                </td>
              </tr>
            )}

            {pendingOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{order.id}</td>
                <td className="py-2 px-4 border">{order.customer_name || order.customer_id}</td>
                <td className="py-2 px-4 border">{order.service_name || "N/A"}</td> 
                <td className="py-2 px-4 border">₹{order.total_amount}</td>
                <td className="py-2 px-4 border">₹{order.paid_amount || 0}</td>
                <td className="py-2 px-4 border">
                  <span className="px-2 py-1 text-sm rounded bg-yellow-100 text-yellow-800">
                    {order.status}
                  </span>
                </td>
                <td className="py-2 px-4 border flex gap-2">
                  <button
                    className="px-3 py-1 primary-btn rounded"
                    onClick={() => handleViewPayments(order.id)}
                  >
                    View Payments
                  </button>
                  <button
                    className="px-3 py-1 primary-btn rounded"
                    onClick={() => {
                      setSelectedOrder(order.id);
                      setShowForward(true);
                    }}
                  >
                    Forward
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payments Modal */}
      {showPayments && selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-lg w-2/3 max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Payments for Order #{selectedOrder}</h2>
      <table className="min-w-full border rounded">
        <thead className="bg-gray-100">
  <tr>
    <th className="py-2 px-4 border">Type</th>
    <th className="py-2 px-4 border">Mode</th>
    <th className="py-2 px-4 border">Amount</th>
    <th className="py-2 px-4 border">Status</th>
    <th className="py-2 px-4 border">Txn Ref</th>
    <th className="py-2 px-4 border">Receipt</th>
    <th className="py-2 px-4 border">Date</th>
  </tr>
</thead>
<tbody>
  {paymentsByOrder[selectedOrder]?.length > 0 ? (
    paymentsByOrder[selectedOrder].map((p) => (
      <tr key={p.id} className="hover:bg-gray-50">
        <td className="py-2 px-4 border">{p.payment_type}</td>
        <td className="py-2 px-4 border">{p.payment_mode}</td>
        <td className="py-2 px-4 border">₹{Number(p.amount).toLocaleString("en-IN")}</td>
        <td className="py-2 px-4 border">
          <span
            className={`px-2 py-1 text-sm rounded ${
              p.status === "success"
                ? "bg-green-100 text-green-800"
                : p.status === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {p.status}
          </span>
        </td>
        <td className="py-2 px-4 border">{p.txn_ref || "N/A"}</td>
       <td className="py-2 px-4 border">
  {p.signed_receipt_url ? (
    <a
      href={p.signed_receipt_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      View
    </a>
  ) : (
    "N/A"
  )}
</td>

        <td className="py-2 px-4 border">
          {new Date(p.created_at).toLocaleString('en-GB')}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="7" className="text-center py-4 text-gray-500">
        No payments found.
      </td>
    </tr>
  )}
</tbody>

      </table>
      <button
        onClick={() => setShowPayments(false)}
        className="mt-4 px-3 py-1 primary-btn rounded"
      >
        Close
      </button>
    </div>
  </div>
)}


      {/* Forward Modal */}
      {showForward && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h2 className="text-lg font-bold mb-4">Forward Order #{selectedOrder}</h2>
            <select
              className="w-full border p-2 mb-4"
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
            >
              <option value="">-- Select Operation User --</option>
              {operationsUsers.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleForwardOrder}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
              <button
                onClick={() => setShowForward(false)}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
