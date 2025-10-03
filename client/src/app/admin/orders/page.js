"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAssignedOrders,
  fetchDeliverables,
  qcDeliverable,
  approveOrderCompletion,
} from "@/store/slices/adminOrdersSlice";

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const { orders, deliverables, loading, error, successMessage } = useSelector(
    (state) => state.adminOrders
  );

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAssignedOrders());
  }, [dispatch]);

  const handleFetchDeliverables = (orderId) => {
    setSelectedOrder(orderId);
    dispatch(fetchDeliverables(orderId));
    setShowModal(true); // open popup
  };

  const handleQC = (deliverableId, status) => {
    dispatch(qcDeliverable({ deliverable_id: deliverableId, qc_status: status }));
  };

  const handleApproveCompletion = (orderId) => {
    dispatch(approveOrderCompletion({ order_id: orderId }));
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Orders</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

      {/* Orders List */}
      <table className="w-full border border-gray-300 rounded mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Order ID</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Payment</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="text-center">
              <td className="p-2 border">{order.id}</td>
              <td className="p-2 border">{order.status}</td>
              <td className="p-2 border">{order.payment_status}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleFetchDeliverables(order.id)}
                  className="px-3 py-1 primary-btn text-white rounded mr-2"
                >
                  View Deliverables
                </button>
                {order.status === "in_progress" &&
                  order.payment_status === "paid" && (
                    <button
                      onClick={() => handleApproveCompletion(order.id)}
                      className="px-3 py-1 primary-btn text-white rounded"
                    >
                      Approve Completion
                    </button>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Deliverables Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-4 py-2">
              <h3 className="text-xl font-semibold">
                Deliverables for Order #{selectedOrder}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-gray-900 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {deliverables[selectedOrder] ? (
                <table className="w-full border border-gray-300 rounded">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Version</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">File</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables[selectedOrder].map((d) => (
                      <tr key={d.id} className="text-center">
                        <td className="p-2 border">{d.versions}</td>
                        <td className="p-2 border">{d.qc_status || "pending"}</td>
                        <td className="p-2 border">
                          {d.signed_url ? (
                            <a
                              href={d.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              View
                            </a>
                          ) : (
                            "No File"
                          )}
                        </td>
                        <td className="p-2 border">
                          <button
                            onClick={() => handleQC(d.id, "approved")}
                            className="px-2 py-1 bg-green-500 text-white rounded mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleQC(d.id, "rejected")}
                            className="px-2 py-1 bg-red-500 text-white rounded"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No deliverables found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
