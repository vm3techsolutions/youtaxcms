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
  const { orders, orderDocuments, loadingOrders, error } = useSelector(
    (state) => state.userOrders
  );
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
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "awaiting_docs":
        return "Pending Documents";
      case "awaiting_payment":
        return "Pending Payment";
      case "awaiting_final_payment":
        return "Pending Final Payment";
      case "assigned":
        return "Assigned";
      case "under_review":
        return "Under Review";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown Status";
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
    return mandatoryDocs.every((doc) =>
      uploaded.some((f) => f.service_doc_id === doc.id)
    );
  };

  if (loadingOrders) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!orders || orders.length === 0) return <p>No orders found.</p>;

  return (
    <div className="container bg-white px-6 py-6 max-w-6xl rounded-lg shadow-md">
      <table className="w-full border border-gray-300 rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border text-center">Order ID</th>
            <th className="p-2 border text-center">Service</th>
            <th className="p-2 border text-center">Status</th>
            <th className="p-2 border text-center">Date</th>
            <th className="p-2 border text-center">Documents</th>
            <th className="p-2 border text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const docsUploaded = orderDocuments[order.id] || [];
            const allUploaded = isAllDocsUploaded(order);

            let docButtonText = "";
            let docButtonClass = "";
            let disabled = false;

            if (order.status === "awaiting_docs") {
              docButtonText = "Upload Documents";
              docButtonClass = "primary-btn";
            } else if (order.status === "under_review" || order.status === "in_progress" || order.status === "completed") {
              docButtonText = "View Documents";
              docButtonClass = "primary-btn";
            } else if (order.status === "awaiting_payment") {
              docButtonText = "Upload Documents";
              docButtonClass = "bg-gray-400 cursor-not-allowed";
              disabled = true;
            } else {
              docButtonText = "Documents";
              docButtonClass = "bg-gray-400 cursor-not-allowed";
              disabled = true;
            }

            return (
              <tr key={order.id} className="text-center border-b">
                <td className="p-2 border">{order.id}</td>
                <td className="p-2 border">{getServiceName(order.service_id)}</td>
                <td className="p-2 border">
                  <span className="secondaryBg px-4 py-1 text-white rounded-md">
                    {getStatusName(order.status)}
                  </span>
                </td>
                <td className="p-2 border">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-2 border">
                  {docsUploaded.length > 0 && (
                    <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                      {docsUploaded.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.signed_url || doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {doc.file_url.split("/").pop()}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    className={`px-3 py-1 mt-2 rounded text-white ${docButtonClass} transition`}
                    disabled={disabled}
                    onClick={() =>
                      !disabled &&
                      router.push(
                        `/user/documents?orderId=${order.id}&serviceId=${order.service_id}&serviceName=${getServiceName(
                          order.service_id
                        )}`
                      )
                    }
                  >
                    {docButtonText}
                  </button>
                </td>
                <td className="p-2 border">
                  <button
                    className="px-2 py-1 rounded primary-btn text-white"
                    onClick={() => router.push(`/user/orders/${order.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
