"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPendingOrders, updateDocumentStatus, triggerOrderStatusCheck } from "@/store/slices/salesSlice";

export default function SalesDashboard() {
  const dispatch = useDispatch();
  const { pendingOrders, loadingFetch, error, success } = useSelector((state) => state.sales);

 useEffect(() => {
  dispatch(fetchPendingOrders()).then((res) => {
    if (res.payload && Array.isArray(res.payload)) {
      res.payload.forEach((order) => {
        dispatch(fetchOrderPaymentStatus(order.id));
      });
    }
  });
}, [dispatch]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Sales Dashboard</h1>

      {loadingFetch && <p className="text-center text-gray-500">Loading orders...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {success && <p className="text-center text-green-500">Action completed successfully!</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">Order ID</th>
              <th className="py-2 px-4 border">Customer</th>
              <th className="py-2 px-4 border">Service</th>
              <th className="py-2 px-4 border">Payment Status</th>
              <th className="py-2 px-4 border">Documents</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingOrders.length === 0 && !loadingFetch && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No pending orders.
                </td>
              </tr>
            )}

            {pendingOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{order.id}</td>
                <td className="py-2 px-4 border">{order.customer_name}</td>
                <td className="py-2 px-4 border">{order.service_name}</td>
                <td className="py-2 px-4 border">
  {order.payment_status === "success" ? (
    <span className="text-green-600 font-semibold">Paid</span>
  ) : order.payment_status === "initiated" ? (
    <span className="text-yellow-600 font-semibold">Pending</span>
  ) : order.payment_status === "failed" ? (
    <span className="text-red-600 font-semibold">Failed</span>
  ) : (
    <span className="text-gray-600 font-semibold">In-Progress</span>
  )}
</td>
                <td className="py-2 px-4 border">
                  {order.documents?.length > 0 ? (
                    <ul className="space-y-1">
                      {order.documents.map((doc) => (
                        <li key={doc.id} className="flex justify-between items-center">
                          <span className="truncate">{doc.file_url.split("/").pop()}</span>
                          <span
                            className={`ml-2 text-sm font-semibold ${
                              doc.status === "verified"
                                ? "text-green-600"
                                : doc.status === "rejected"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {doc.status || "Pending"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No docs</span>
                  )}
                </td>
                <td className="py-2 px-4 border flex space-x-2">
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded"
                    onClick={() =>
                      order.documents?.forEach((doc) =>
                        dispatch(updateDocumentStatus({ order_id: order.id, order_document_id: doc.id, status: "verified" }))
                      )
                    }
                  >
                    Verify All
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded"
                    onClick={() =>
                      order.documents?.forEach((doc) =>
                        dispatch(updateDocumentStatus({ order_id: order.id, order_document_id: doc.id, status: "rejected" }))
                      )
                    }
                  >
                    Reject All
                  </button>
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded"
                    onClick={() => dispatch(triggerOrderStatusCheck({ order_id: order.id }))}
                  >
                    Check Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
