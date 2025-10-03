"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAssignedOrdersForOperations,
  uploadDeliverable,
  clearMessages,
  resetOperationsState,
} from "@/store/slices/operationsSlice";
import { fetchAdminRoles } from "@/store/slices/adminSlice";
import { fetchAdminUsersByRole } from "@/store/slices/adminUserSliceSecond";
import { fetchDeliverablesForOrder } from "@/store/slices/operationDeliverableSlice"; // ✅ import deliverables thunk

export default function OperationsOrdersPage() {
  const dispatch = useDispatch();
  const {
    assignedOrders = [],
    loadingOrders,
    uploading,
    error,
    success,
  } = useSelector((state) => state.operationOrders || {});

  const { roles } = useSelector((state) => state.admin);
  const { usersByRole: roleUsers } = useSelector(
    (state) => state.adminUserSecond || { usersByRole: {} }
  );

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDeliverables, setOrderDeliverables] = useState([]); // ✅ store deliverables for selected order
  const [files, setFiles] = useState([]);
  const [forwardWithoutChanges, setForwardWithoutChanges] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [accountId, setAccountId] = useState("");

  // Fetch assigned orders on mount
  useEffect(() => {
    dispatch(fetchAssignedOrdersForOperations());
    dispatch(fetchAdminRoles());

    return () => dispatch(resetOperationsState());
  }, [dispatch]);

  // When roles are available, fetch users for Admin + Accounts roles
  useEffect(() => {
    if (roles && roles.length > 0) {
      const adminRole = roles.find((r) => r?.name?.toLowerCase() === "admin");
      const accountRole = roles.find(
        (r) => r?.name?.toLowerCase() === "accounts"
      );

      if (adminRole) dispatch(fetchAdminUsersByRole(adminRole.id));
      if (accountRole) dispatch(fetchAdminUsersByRole(accountRole.id));
    }
  }, [roles, dispatch]);

  // ✅ Fetch deliverables when an order is selected
  useEffect(() => {
    if (selectedOrder) {
      dispatch(fetchDeliverablesForOrder(selectedOrder))
        .unwrap()
        .then((data) => setOrderDeliverables(data))
        .catch((err) => setOrderDeliverables([]));
    } else {
      setOrderDeliverables([]);
    }
  }, [selectedOrder, dispatch]);

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const handleUpload = (orderId) => {
    const order = assignedOrders.find((o) => o.id === orderId);
    if (
      (order?.payment_status === "partially_paid" && !accountId) ||
      (order?.payment_status === "paid" && !adminId)
    ) {
      return alert(
        order?.payment_status === "partially_paid"
          ? "Account ID is required."
          : "Admin ID is required."
      );
    }

    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("admin_id", adminId);
    formData.append("account_id", accountId);
    formData.append("forward_without_changes", forwardWithoutChanges);

    if (!forwardWithoutChanges && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    dispatch(uploadDeliverable(formData));
    setSelectedOrder(null);
    setFiles([]);
    setForwardWithoutChanges(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Operations Dashboard
      </h1>

      {/* Messages */}
      {loadingOrders && <p className="text-center text-gray-500">Loading assigned orders...</p>}
      {uploading && <p className="text-center text-gray-500">Uploading deliverable...</p>}
      {error && (
        <p className="text-center text-red-500 mb-4">
          {error}{" "}
          <button onClick={() => dispatch(clearMessages())} className="underline ml-2">Clear</button>
        </p>
      )}
      {success && (
        <p className="text-center text-green-500 mb-4">
          {success}{" "}
          <button onClick={() => dispatch(clearMessages())} className="underline ml-2">Clear</button>
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">Order ID</th>
              <th className="py-2 px-4 border">Customer Name</th>
              <th className="py-2 px-4 border">Service</th>
              <th className="py-2 px-4 border">Total Amount</th>
              <th className="py-2 px-4 border">Advance Required</th>
              <th className="py-2 px-4 border">Advance Paid</th>
              <th className="py-2 px-4 border">Pending Amount</th>
              <th className="py-2 px-4 border">Payment Status</th>
              <th className="py-2 px-4 border">Order Status</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedOrders.length === 0 && !loadingOrders && (
              <tr>
                <td colSpan="10" className="text-center py-4 text-gray-500">
                  No assigned orders.
                </td>
              </tr>
            )}
            {assignedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{order.id}</td>
                <td className="py-2 px-4 border">{order.customer_name}</td>
                <td className="py-2 px-4 border">{order.service_name}</td>
                <td className="py-2 px-4 border">₹{order.total_amount}</td>
                <td className="py-2 px-4 border">₹{order.advance_required}</td>
                <td className="py-2 px-4 border">₹{order.advance_paid}</td>
                <td className="py-2 px-4 border">₹{order.pending_amount}</td>
                <td className="py-2 px-4 border">{order.payment_status}</td>
                <td className="py-2 px-4 border">
                  <span className="px-2 py-1 text-sm rounded bg-yellow-100 text-yellow-800">
                    {order.status}
                  </span>
                </td>
                <td className="py-2 px-4 border">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    Upload / Forward
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {selectedOrder && (() => {
        const order = assignedOrders.find((o) => o.id === selectedOrder);
        const hasDeliverables = orderDeliverables.length > 0;

        // Prevent submit if no deliverable and not forwarding without changes
        const canSubmit =
          forwardWithoutChanges || hasDeliverables || files.length > 0;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg w-1/3">
              <h2 className="text-lg font-bold mb-4">
                Upload / View Deliverable for Order #{selectedOrder}
              </h2>

              {hasDeliverables ? (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Existing Deliverables:</h3>
                  <ul className="list-disc pl-5">
                    {orderDeliverables.map((d) => (
                      <li key={d.id} className="mb-1">
                        Version {d.versions} -{" "}
                        <a
                          href={d.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View Document
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mb-4 text-red-600 font-medium">
                  No deliverable uploaded yet. Please upload a deliverable.
                </div>
              )}

              {/* Role selects */}
              {order?.payment_status === "partially_paid" && (
                <label className="block mb-2 text-sm font-medium">
                  Select Account:
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full border p-2 mt-1"
                  >
                    <option value="">-- Select Account --</option>
                    {roles
                      ?.filter((r) => r?.name?.toLowerCase() === "accounts")
                      .flatMap((role) =>
                        (roleUsers[role.id] || []).map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} (ID: {user.id})
                          </option>
                        ))
                      )}
                  </select>
                </label>
              )}

              {order?.payment_status === "paid" && (
                <label className="block mb-2 text-sm font-medium">
                  Select Admin:
                  <select
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full border p-2 mt-1"
                  >
                    <option value="">-- Select Admin --</option>
                    {roles
                      ?.filter((r) => r?.name?.toLowerCase() === "admin")
                      .flatMap((role) =>
                        (roleUsers[role.id] || []).map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} (ID: {user.id})
                          </option>
                        ))
                      )}
                  </select>
                </label>
              )}

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={forwardWithoutChanges}
                  onChange={(e) => setForwardWithoutChanges(e.target.checked)}
                />
                <span>Forward without changes</span>
              </div>

              {(!hasDeliverables || !forwardWithoutChanges) && (
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mb-4"
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!canSubmit) {
                      alert("Please upload a deliverable or select 'Forward without changes'.");
                      return;
                    }
                    handleUpload(selectedOrder);
                  }}
                  className={`px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                    !canSubmit ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!canSubmit}
                >
                  Submit
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}