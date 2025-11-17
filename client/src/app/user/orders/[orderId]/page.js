"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchOrdersByCustomerId,
  fetchUserOrderDocuments,
  fetchOrderPayments,
} from "@/store/slices/userOrdersSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import {
  fetchOrderInputs,
  submitOrderInputs,
  resetOrderInputsState,
} from "@/store/slices/orderInputsSlice";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const dispatch = useDispatch();

  const {
    orders = [],
    orderDocuments = {},
    orderPayments = {},
    loadingOrders,
    loadingDocuments,
    loadingPayments,
  } = useSelector((state) => state.userOrders);
  const { services = [], serviceDocuments = {} } = useSelector(
    (state) => state.services
  );

  const { items: orderInputs, loading: loadingInputs } = useSelector(
    (state) => state.orderInputs
  );

  const [order, setOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editableInputs, setEditableInputs] = useState({});

  // Load orders if not loaded
  useEffect(() => {
    if (orders.length === 0) {
      const userId = localStorage.getItem("userId") || 1;
      dispatch(fetchOrdersByCustomerId(userId));
    }
  }, [orders.length, dispatch]);

  // Set current order & fetch docs/services/payments
  useEffect(() => {
    if (!orders.length || !orderId) return;
    const o = orders.find((o) => o.id === Number(orderId));
    if (!o) return;

    setOrder(o);
    dispatch(fetchUserOrderDocuments(o.id));
    dispatch(fetchServices());
    dispatch(fetchOrderPayments(o.id));
    dispatch(fetchOrderInputs(o.id));
  }, [orders, orderId, dispatch]);

  // Pre-fill editableInputs when orderInputs are loaded
  useEffect(() => {
    if (orderInputs.length) {
      const initialValues = {};
      orderInputs.forEach((input) => {
        const key = `field_${input.service_input_id}`;
        initialValues[key] =
          input.text_value || input.selected_option || "";
      });
      setEditableInputs(initialValues);
    }
  }, [orderInputs]);

  const handleInputChange = (fieldKey, value) => {
    setEditableInputs((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSaveInputs = async () => {
    try {
      const inputsPayload = Object.entries(editableInputs).map(
        ([key, value]) => ({
          service_input_id: Number(key.replace("field_", "")),
          text_value: typeof value === "string" ? value : null,
          selected_option: typeof value === "string" || Array.isArray(value)
            ? value
            : null,
        })
      );

      await dispatch(
        submitOrderInputs({ order_id: order.id, inputs: inputsPayload })
      ).unwrap();

      alert("Order inputs updated successfully!");
      dispatch(fetchOrderInputs(order.id)); // Refresh
    } catch (err) {
      console.error(err);
      alert("Failed to update inputs");
    }
  };

  if (loadingOrders || !order) return <p>Loading order details...</p>;
  if (loadingDocuments) return <p>Loading documents...</p>;

  const service = services.find((s) => s.id === order.service_id);
  const documents = orderDocuments[order?.id] || [];
  const payments = orderPayments[order?.id] || [];

  // ================= Steps Logic =================
  const orderSteps = [
    { key: "awaiting_payment", label: "Payment" },
    { key: "awaiting_docs", label: "Upload Documents" },
    { key: "under_review", label: "Verification" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];

  if (order.payment_status === "partial") {
    orderSteps.splice(4, 0, {
      key: "awaiting_final_payment",
      label: "Final Payment",
    });
  }

  const renderSteps = (order) => {
    const completedSteps = [];

    const payments = orderPayments[order.id] || [];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const serviceCost = order.total_amount || 0;

    if (totalPaid > 0) completedSteps.push("awaiting_payment");

    const docsForService = serviceDocuments?.[order.service_id] || [];
    const mandatoryDocs = docsForService.filter((doc) => doc.is_mandatory);
    const uploaded = orderDocuments[order.id] || [];
    if (
      mandatoryDocs.every((doc) =>
        uploaded.some((f) => f.service_doc_id === doc.id)
      )
    ) {
      completedSteps.push("awaiting_docs");
    }

    if (
      ["under_review", "in_progress", "awaiting_final_payment", "completed"].includes(order.status)
    ) completedSteps.push("under_review");

    if (["in_progress", "awaiting_final_payment", "completed"].includes(order.status))
      completedSteps.push("in_progress");

    if (totalPaid > 0 && totalPaid < serviceCost) completedSteps.push("awaiting_final_payment");

    if (order.status === "completed") completedSteps.push("completed");

    return (
      <div className="flex flex-col items-center mt-4">
        <h3 className="font-semibold mb-2">Order Steps</h3>
        <div className="flex items-center w-full">
          {orderSteps.map((step, index) => {
            let statusClass = "bg-gray-300";
            let textClass = "text-gray-500";
            let label = step.label;

            if (step.key === "awaiting_payment" && completedSteps.includes(step.key)) {
              if (totalPaid > 0 && totalPaid < serviceCost) {
                label = "Partially Paid";
                statusClass = "bg-yellow-500";
                textClass = "text-yellow-600 font-semibold";
              } else if (totalPaid >= serviceCost) {
                label = "Final Payment Done";
                statusClass = "bg-green-500";
                textClass = "text-green-600 font-semibold";
              }
            }

            if (step.key === "awaiting_final_payment" && completedSteps.includes(step.key)) {
              label = "Final Payment Pending";
              statusClass = "bg-yellow-500";
              textClass = "text-yellow-600 font-semibold";
            }

            if (
              completedSteps.includes(step.key) &&
              !["awaiting_payment", "awaiting_final_payment"].includes(step.key)
            ) {
              statusClass = "bg-green-500";
              textClass = "text-green-600 font-semibold";
            } else if (step.key === order.status) {
              statusClass = "bg-blue-500";
              textClass = "text-blue-600 font-semibold";
            }

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full ${statusClass} border-2 border-gray-300 flex items-center justify-center`}
                  >
                    {statusClass === "bg-green-500" && (
                      <span className="text-white text-xs font-bold">&#10003;</span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${textClass}`}>{label}</span>
                </div>
                {index < orderSteps.length - 1 && <div className={`flex-1 h-1 mx-2 ${statusClass}`}></div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Order #{order.id}</h2>
      <p><strong>Service:</strong> {service?.name || "Unknown"}</p>
      <p>
        <strong>Status:</strong>{" "}
        <span className="px-2 py-1 rounded text-white bg-blue-600">{order.status}</span>
      </p>
      <p><strong>Created At:</strong> {new Date(order.created_at).toLocaleString("en-GB")}</p>

      {renderSteps(order)}

      {/* ================= Documents ================= */}
      <h3 className="mt-6 font-semibold text-lg border-b pb-2">Documents</h3>
      {documents.length === 0 ? (
        <p className="text-gray-500 mt-2">No documents uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full border border-gray-300 rounded text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th className="p-2 border">Document Name</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Preview</th>
                <th className="p-2 border">Re-upload</th> {/* NEW COLUMN */}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="text-center hover:bg-gray-50">
                  <td className="p-2 border">{doc.doc_name}</td>
                  <td className="p-2 border">{doc.doc_type}</td>
                  <td className="p-2 border">
                    {doc.status === "verified" ? (
                      <span className="text-green-600 font-semibold">Verified</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">
                        {doc.status === "submitted" ? "Submitted" : "Pending"}
                      </span>
                    )}
                  </td>
                  <td className="p-2 border text-center">
                    {doc.signed_url ? (
                      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(doc.signed_url.split("?")[0]) ? (
                        <div
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => setPreviewImage(doc.signed_url)}
                        >
                          <Image
                            src={doc.signed_url}
                            alt={doc.doc_name}
                            width={100}
                            height={100}
                            className="object-cover mx-auto rounded-md shadow"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 flex flex-col items-center justify-center bg-gray-100 border rounded-md shadow mx-auto cursor-pointer hover:bg-gray-200"
                          onClick={() => window.open(doc.signed_url, "_blank")}
                        >
                          <span className="text-sm font-bold text-gray-700">
                            {doc.signed_url.split(".").pop()?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                      )
                    ) : (
                      <span className="text-red-500">No Preview</span>
                    )}
                  </td>
                  <td className="p-2 border">
                    {doc.status === "rejected" ? (
                      <button
                        onClick={() => alert(`Upload functionality for ${doc.doc_name} coming soon`)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-semibold"
                      >
                        Upload
                      </button>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= Other Sections (Inputs, Payments, Preview Modal) ================= */}
      {/* Keep the existing Custom Fields, Payments, and Preview Modal code unchanged */}

      {/* Custom Fields */}
      <h3 className="mt-6 font-semibold text-lg border-b pb-2">Custom Fields</h3>
      {loadingInputs ? (
        <p>Loading inputs...</p>
      ) : orderInputs.length === 0 ? (
        <p className="text-gray-500 mt-2">No custom fields defined for this order.</p>
      ) : (
        <div className="mt-2 space-y-4">
          {orderInputs.map((input) => {
            const fieldKey = `field_${input.service_input_id}`;
            const value = editableInputs[fieldKey] || "";

            return (
              <div key={input.id} className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <label className="w-full md:w-1/3 font-medium">{input.label_name}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                  className="border p-2 rounded w-full md:w-2/3"
                />
              </div>
            );
          })}
          <div className="text-right mt-2">
            <button
              onClick={handleSaveInputs}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Payments / Invoices */}
      <h3 className="mt-6 font-semibold text-lg border-b pb-2">Invoices / Payments</h3>
      {loadingPayments ? (
        <p>Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-500 mt-2">No payments found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {payments.map((p) => (
            <div
              key={p.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Payment ID:</span>
                <span>{p.txn_ref}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Type:</span>
                <span>{p.payment_type}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Amount:</span>
                <span className="font-semibold text-green-600">₹{Number(p.amount)?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Mode:</span>
                <span>{p.payment_mode}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Status:</span>
                <span
                  className={`px-2 py-1 rounded text-white ${
                    p.status === "success"
                      ? "bg-green-500"
                      : p.status === "initiated"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Date:</span>
                <span>{new Date(p.created_at).toLocaleString()}</span>
              </div>
              {p.signed_url && (
                <div className="mt-3 text-right">
                  <a
                    href={p.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    View Invoice
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-opacity-70">
          <div className="relative bg-white p-4 rounded-lg shadow-xl max-w-5xl w-auto">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold text-lg"
            >
              ✕
            </button>
            <Image
              src={previewImage}
              alt="Document Preview"
              width={1000}
              height={800}
              className="w-auto max-h-[80vh] mx-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
