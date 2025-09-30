"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingOrders,
  updateDocumentStatus,
  triggerOrderStatusCheck,
  resetSalesState,
} from "@/store/slices/salesSlice";
import { fetchAdminRoles } from "@/store/slices/adminSlice";
import { fetchAdminUsersByRole } from "@/store/slices/adminUserSlice";
import axiosInstance from "@/api/axiosInstance";

export default function SalesOrdersPage() {
  const dispatch = useDispatch();

  // Sales state  
  const { pendingOrders, loadingFetch, loadingUpdate, error, success } =
    useSelector((state) => state.sales);

  // Admin slices
  const { roles, rolesLoading } = useSelector((state) => state.admin);
  const { usersByRole: accountants, loading: loadingAdmins } = useSelector(
    (state) => state.adminUser
  );

  const [ordersWithDocs, setOrdersWithDocs] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [assignedAccountant, setAssignedAccountant] = useState({});
  const [forwardedAccountants, setForwardedAccountants] = useState({}); // actually assigned
  const [filter, setFilter] = useState("all");

  // Fetch orders + roles on mount
  useEffect(() => {
    dispatch(fetchPendingOrders());
    dispatch(fetchAdminRoles());

    return () => dispatch(resetSalesState());
  }, [dispatch]);

  // When roles are loaded → find accountant role → fetch users by roleId
  useEffect(() => {
    if (roles && roles.length > 0) {
      const accountantRole = roles.find(
        (r) => r?.name?.toLowerCase() === "accounts" // Adjust as per your DB
      );
      if (accountantRole) {
        dispatch(fetchAdminUsersByRole(accountantRole.id));
      }
    }
  }, [roles, dispatch]);

  // Fetch documents for orders
  useEffect(() => {
    const fetchDocumentsForOrders = async () => {
      if (!pendingOrders || pendingOrders.length === 0) return;

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const updatedOrders = await Promise.all(
        pendingOrders.map(async (order) => {
          try {
            const res = await axiosInstance.get(`/order-documents/${order.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { ...order, documents: res.data };
          } catch (err) {
            console.error("❌ Error fetching docs for order", order.id, err);
            return { ...order, documents: [] };
          }
        })
      );
      setOrdersWithDocs(updatedOrders);
    };

    fetchDocumentsForOrders();
  }, [pendingOrders]);

  // Handle Verify / Reject
  const handleVerifyReject = (orderId, docId, status) => {
    dispatch(
      updateDocumentStatus({
        order_id: orderId,
        order_document_id: docId,
        status,
        remarks: status === "verified" ? "Looks good" : "Not acceptable",
      })
    ).then(() => {
      setOrdersWithDocs((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                documents: order.documents.map((doc) =>
                  doc.id === docId ? { ...doc, status } : doc
                ),
              }
            : order
        )
      );
    });
  };

  // // Assign Accountant
  // const handleAssignAccountant = (orderId) => {
  //   const accountantId = assignedAccountant[orderId];
  //   if (!accountantId) return alert("Select an accountant first");

  //   console.log(`Assign order ${orderId} to accountant ${accountantId}`);
  //   // TODO: Add API call here
  // };

const handleAssignAccountant = async (orderId) => {
  const accountantId = Number(assignedAccountant[orderId]); // convert to number
  if (!accountantId) return alert("Select an accountant first");

  try {
    // Send both order_id and account_id to the backend
    await dispatch(
      triggerOrderStatusCheck({ order_id: orderId, account_id: accountantId })
    ).unwrap();

    // Find accountant name
    const accountant = accountants.find((a) => a.id === accountantId);

    // Update forwardedAccountants state
    setForwardedAccountants((prev) => ({
      ...prev,
      [orderId]: accountant?.name || "Unknown",
    }));

    alert(`Order #${orderId} forwarded to Accounts: ${accountant?.name}`);
  } catch (err) {
    console.error("Failed to forward order:", err);
    alert("Failed to forward order. Try again.");
  }
};





  // Preview documents
  const renderDocumentPreview = (doc) => {
    const fileUrl = doc.signed_url || doc.file_url;
    if (!fileUrl) return <span className="text-gray-500">No preview</span>;

    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileUrl);
    return isImage ? (
      <img
        src={fileUrl}
        alt={doc.doc_name || "Document"}
        className="h-16 w-16 object-cover rounded border"
      />
    ) : (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        View File
      </a>
    );
  };

  // Filter orders
  const filteredOrders = ordersWithDocs.filter((order) => {
    const totalDocs = order.documents?.length || 0;
    const verifiedDocs =
      order.documents?.filter((d) => d.status === "verified").length || 0;
    const allDocsUploaded = totalDocs > 0;
    const allDocsVerified = allDocsUploaded && totalDocs === verifiedDocs;

    let displayStatus = "Pending Documents";
    if (!allDocsUploaded) displayStatus = "Pending Documents";
    else if (!allDocsVerified) displayStatus = "Pending Verification";
    else displayStatus = "Completed / All Docs Verified";

    if (filter === "pending_docs" && displayStatus !== "Pending Documents")
      return false;
    if (filter === "pending_verification" && displayStatus !== "Pending Verification")
      return false;
    if (filter === "completed" && displayStatus !== "Completed / All Docs Verified")
      return false;

    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Sales Dashboard – Orders
      </h1>

      {/* Filters */}
      <div className="mb-4 flex items-center space-x-3">
        <label className="font-medium text-gray-700">Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Orders</option>
          <option value="pending_docs">Pending Documents</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loadingFetch && <p className="text-blue-600">Loading orders...</p>}
      {rolesLoading && <p className="text-blue-600">Loading roles...</p>}
      {loadingAdmins && <p className="text-blue-600">Loading accountants...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-600 mb-4">✅ Action completed successfully</p>}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Order Status</th>
              <th className="p-3 text-left">Documents</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 && !loadingFetch ? (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 p-4 italic">
                  No orders found 🎉
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const totalDocs = order.documents?.length || 0;
                const verifiedDocs =
                  order.documents?.filter((d) => d.status === "verified").length || 0;
                const allDocsUploaded = totalDocs > 0;
                const allDocsVerified = allDocsUploaded && totalDocs === verifiedDocs;

                let displayStatus = "Pending Documents";
                if (!allDocsUploaded) displayStatus = "Pending Documents";
                else if (!allDocsVerified) displayStatus = "Pending Verification";
                else displayStatus = "Completed / All Docs Verified";

                return (
                  <React.Fragment key={order.id}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-3">#{order.id}</td>
                      <td className="p-3">{order.customer_name}</td>
                      <td className="p-3">{order.service_name}</td>
                      <td className="p-3 font-semibold">{displayStatus}</td>

                      <td className="p-3">
                        {allDocsUploaded ? (
                          <button
                            onClick={() =>
                              setExpandedOrder(expandedOrder === order.id ? null : order.id)
                            }
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            {expandedOrder === order.id ? "Hide" : "View"} Documents
                          </button>
                        ) : (
                          <span className="text-gray-500">No Docs</span>
                        )}
                      </td>

                      <td className="p-3">
  {forwardedAccountants[order.id] ? (
    <span className="font-medium text-gray-700">
      Forwarded to {forwardedAccountants[order.id]}
    </span>
  ) : (
    <>
      <select
        className="border p-1 rounded mr-2"
        value={assignedAccountant[order.id] || ""}
        onChange={(e) =>
          setAssignedAccountant({
            ...assignedAccountant,
            [order.id]: e.target.value,
          })
        }
        disabled={!allDocsVerified || accountants.length === 0}
      >
        <option value="">Select Accountant</option>
        {accountants.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </select>

      <button
        onClick={() => handleAssignAccountant(order.id)}
        disabled={!allDocsVerified || accountants.length === 0}
        className={`px-3 py-1 text-sm rounded ${
          allDocsVerified && accountants.length > 0
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
      >
        Assign
      </button>
    </>
  )}
</td>


                    </tr>

                    {expandedOrder === order.id && allDocsUploaded && (
                      <tr>
                        <td colSpan="6" className="bg-gray-50 p-4">
                          <h3 className="text-lg font-semibold mb-2">Documents</h3>
                          <div className="flex flex-wrap gap-4">
                            {order.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="w-40 bg-white border p-3 rounded shadow-sm flex flex-col items-center"
                              >
                                {renderDocumentPreview(doc)}
                                <p className="font-medium text-sm mt-2 text-center">
                                  {doc.doc_name || "Unnamed Document"}
                                </p>
                                <p className="text-xs text-gray-500">{doc.doc_type}</p>
                                <p
                                  className={`text-xs ${
                                    doc.status === "verified"
                                      ? "text-green-600"
                                      : doc.status === "rejected"
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {doc.status || "Pending"}
                                </p>

                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      handleVerifyReject(order.id, doc.id, "verified")
                                    }
                                    disabled={loadingUpdate}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleVerifyReject(order.id, doc.id, "rejected")
                                    }
                                    disabled={loadingUpdate}
                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
