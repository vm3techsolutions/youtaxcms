"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingOrdersForAccounts,
  fetchOrderPayments,
  forwardToOperations,
  clearMessages,
} from "@/store/slices/accountsSlice";

export default function AccountsDashboard() {
  const dispatch = useDispatch();
  const { pendingOrders, paymentsByOrder, loading, error, success } = useSelector(
    (state) => state.accounts
  );

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [assignedTo, setAssignedTo] = useState(""); // operations user ID

  useEffect(() => {
    dispatch(fetchPendingOrdersForAccounts());
  }, [dispatch]);

  const handleViewPayments = (orderId) => {
    dispatch(fetchOrderPayments(orderId));
    setSelectedOrder(orderId);
  };

  const handleForward = (orderId) => {
    if (!assignedTo) return alert("Please select Operations user!");
    dispatch(forwardToOperations({ order_id: orderId, remarks, assigned_to: assignedTo }));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Accounts Dashboard</h1>

      {loading && <p className="text-gray-500 text-center">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {success && (
        <p className="text-green-600 text-center">
          {success}
          <button className="ml-2 text-sm underline" onClick={() => dispatch(clearMessages())}>
            x
          </button>
        </p>
      )}

      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">Order ID</th>
            <th className="py-2 px-4 border">Customer</th>
            <th className="py-2 px-4 border">Total</th>
            <th className="py-2 px-4 border">Paid</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">
                No pending orders.
              </td>
            </tr>
          ) : (
            pendingOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{order.id}</td>
                <td className="py-2 px-4 border">{order.customer_id}</td>
                <td className="py-2 px-4 border">{order.total_amount}</td>
                <td className="py-2 px-4 border">{order.paid_amount || 0}</td>
                <td className="py-2 px-4 border flex space-x-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={() => handleViewPayments(order.id)}
                  >
                    View Payments
                  </button>
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => handleForward(order.id)}
                  >
                    Forward
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Payments Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Payments for Order #{selectedOrder}</h2>

            {paymentsByOrder[selectedOrder] ? (
              <ul className="space-y-2">
                {paymentsByOrder[selectedOrder].map((p) => (
                  <li key={p.id} className="border p-2 rounded">
                    {p.payment_type} - {p.amount} ({p.status})
                  </li>
                ))}
              </ul>
            ) : (
              <p>Loading...</p>
            )}

            <div className="mt-4">
              <label className="block mb-1">Remarks</label>
              <textarea
                className="w-full border rounded p-2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label className="block mb-1">Assign to (Ops User ID)</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                className="px-4 py-2 bg-gray-400 rounded text-white"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-green-600 rounded text-white"
                onClick={() => handleForward(selectedOrder)}
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
