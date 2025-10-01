"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchOrdersByCustomerId } from "@/store/slices/userOrdersSlice";
import { fetchServices } from "@/store/slices/servicesSlice";

export default function UserOrdersClient() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { token, userInfo } = useSelector((state) => state.user);
  const { orders, orderDocuments, loadingOrders, error } = useSelector((state) => state.userOrders);
  const { services } = useSelector((state) => state.services);
  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);

  useEffect(() => {
    if (!token) return router.push("/user/login");

    if (userInfo?.id) {
      dispatch(fetchOrdersByCustomerId(userInfo.id));
      dispatch(fetchServices());
    }
  }, [token, userInfo, router, dispatch]);

  const getStatusName = (status) => {
    switch (status) {
      case "awaiting_docs": return "Payment Done";
      case "awaiting_payment": return "Pending Payment";
      case "under_review": return "In-Process";
      case "completed": return "Completed";
      case "failed": return "Payment Failed";
      default: return "Unknown Status";
    }
  };

  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  const isAllDocsUploaded = (order) => {
    const docsForService = serviceDocuments[order.service_id] || [];
    const mandatoryDocs = docsForService.filter((doc) => doc.is_mandatory);
    const uploaded = orderDocuments[order.id] || [];
    return mandatoryDocs.every((doc) => uploaded.some((f) => f.service_doc_id === doc.id));
  };

  const orderSteps = [
    { key: "awaiting_payment", label: "Payment" },
    { key: "awaiting_docs", label: "Upload Documents" },
    { key: "under_review", label: "Verification" },
    { key: "completed", label: "Completed" },
  ];

  const renderSteps = (order) => {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center w-full">
          {orderSteps.map((step, index) => {
            let statusClass = "bg-gray-300"; // pending
            let textClass = "text-gray-500";
            if (
              (step.key === "awaiting_payment" && order.status !== "awaiting_payment") ||
              (step.key === "awaiting_docs" && ["under_review", "completed"].includes(order.status)) ||
              (step.key === "under_review" && order.status === "completed")
            ) {
              statusClass = "bg-green-500"; // completed
              textClass = "text-green-600 font-semibold";
            } else if (step.key === order.status) {
              statusClass = "bg-blue-500"; // current
              textClass = "text-blue-600 font-semibold";
            }

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full ${statusClass} border-2 border-gray-300 flex items-center justify-center`}>
                    {statusClass === "bg-green-500" && <span className="text-white text-xs font-bold">&#10003;</span>}
                  </div>
                  <span className={`text-xs mt-1 ${textClass}`}>{step.label}</span>
                </div>
                {index < orderSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${statusClass}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loadingOrders) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!orders || orders.length === 0) return <p>No orders found.</p>;

  return (
    <div className="container bg-white px-6 py-6 max-w-6xl">
      <table className="w-full border border-gray-300 rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border text-center">Order ID</th>
            <th className="p-2 border text-center">Service</th>
            <th className="p-2 border text-center">Status</th>
            <th className="p-2 border text-center">Date</th>
            <th className="p-2 border text-center">Documents</th>
            <th className="p-2 border text-center">Action</th>
            <th className="p-2 border text-center">Steps</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const docsUploaded = orderDocuments[order.id] || [];
            const allUploaded = isAllDocsUploaded(order);

            return (
              <tr key={order.id} className="text-center">
                <td className="p-2 border">{order.id}</td>
                <td className="p-2 border">{getServiceName(order.service_id)}</td>
                <td className="p-2 border">
                  <span className="secondaryBg px-4 py-1 text-white rounded-md">
                    {getStatusName(order.status)}
                  </span>
                </td>
                <td className="p-2 border">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  {docsUploaded.length > 0 && (
                    <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                      {docsUploaded.map((doc) => (
                        <li key={doc.id}>
                          <a href={doc.signed_url || doc.file_url} target="_blank" rel="noopener noreferrer">
                            {doc.file_url.split("/").pop()}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    className={`px-2 py-1 mt-2 rounded text-white ${allUploaded ? "primaryBg" : "bg-green-600"}`}
                    onClick={() =>
                      router.push(`/user/documents?orderId=${order.id}&serviceId=${order.service_id}&serviceName=${getServiceName(order.service_id)}`)
                    }
                  >
                    {allUploaded ? "View Documents" : "Upload Documents"}
                  </button>
                </td>
                <td className="p-2 border">
  <button
    className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
    onClick={() =>
      router.push(`/user/orders/${order.id}`)
    }
  >
    View
  </button>
</td>

                <td className="p-2 border">{renderSteps(order)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
