"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchOrdersByCustomerId,
  fetchUserOrderDocuments,
} from "@/store/slices/userOrdersSlice";
import { fetchServices } from "@/store/slices/servicesSlice";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { orders, orderDocuments, loadingOrders, loadingDocuments } =
    useSelector((state) => state.userOrders);
  const { services } = useSelector((state) => state.services);

  const [order, setOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // For popup

  // Load orders if not already loaded
  useEffect(() => {
    if (orders.length === 0) {
      const userId = localStorage.getItem("userId") || 1;
      dispatch(fetchOrdersByCustomerId(userId));
    }
  }, [orders.length, dispatch]);

  // Set current order and fetch documents + services
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const o = orders.find((o) => o.id === parseInt(orderId));
    setOrder(o);

    if (o) {
      dispatch(fetchUserOrderDocuments(o.id));
      dispatch(fetchServices());
    }
  }, [orders, orderId, dispatch]);

  if (loadingOrders || !order) return <p>Loading order details...</p>;
  if (loadingDocuments) return <p>Loading documents...</p>;

  const service = services.find((s) => s.id === order.service_id);
  const documents = orderDocuments[order.id] || [];

  return (
    <div className="container mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Order #{order.id}</h2>
      <p>
        <strong>Service:</strong> {service?.name || "Unknown"}
      </p>
      <p>
        <strong>Status:</strong> {order.status}
      </p>
      <p>
        <strong>Created At:</strong>{" "}
        {new Date(order.created_at).toLocaleString()}
      </p>

      <h3 className="mt-6 font-semibold">Documents</h3>
      {documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <table className="w-full border border-gray-300 rounded mt-2">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Document Name</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Preview</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="text-center">
                <td className="p-2 border">{doc.doc_name}</td>
                <td className="p-2 border">{doc.doc_type}</td>
                <td className="p-2 border">
                  {doc.status === "verified" ? (
                    <span className="text-green-600 font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">
                      {doc.status === "submitted" ? "Submitted" : "Pending"}
                    </span>
                  )}
                </td>
                <td className="p-2 border">
                  {doc.signed_url ? (
                    <img
                      src={doc.signed_url}
                      alt={doc.doc_name}
                      className="w-32 h-32 object-cover mx-auto rounded-md cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewImage(doc.signed_url)} // open popup
                    />
                  ) : (
                    <span className="text-red-500">No Preview</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ===================== Popup Modal ===================== */}
      {previewImage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 backdrop-blur-sm">
          <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-4xl w-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold text-lg"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Document Preview"
              className="max-h-[80vh] w-auto mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
