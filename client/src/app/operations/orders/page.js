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

export default function OperationsOrdersPage() {
  const dispatch = useDispatch();
  const {
    assignedOrders = [],
    loadingOrders,
    uploading,
    error,
    success,
  } = useSelector((state) => state.operationOrders || {}); // ✅ fallback to {}

   // Roles & Users state (reusing admin slices)
  const { roles, rolesLoading } = useSelector((state) => state.admin);
  const { usersByRole: roleUsers, loading: loadingRoleUsers } = useSelector(
    (state) => state.adminUserSecond || { usersByRole: {} } // ✅ fallback to {}
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
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


  console.log("roleUsers =>", roleUsers);
  console.log("roles =>", roles);
  
  
  

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = (orderId) => {
    if (!adminId || !accountId) {
      return alert("Admin ID and Account ID are required.");
    }
    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("admin_id", adminId);
    formData.append("account_id", accountId);
    formData.append("forward_without_changes", forwardWithoutChanges);

    if (!forwardWithoutChanges && files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
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
      {loadingOrders && (
        <p className="text-center text-gray-500">Loading assigned orders...</p>
      )}
      {uploading && (
        <p className="text-center text-gray-500">Uploading deliverable...</p>
      )}
      {error && (
        <p className="text-center text-red-500 mb-4">
          {error}{" "}
          <button
            onClick={() => dispatch(clearMessages())}
            className="underline ml-2"
          >
            Clear
          </button>
        </p>
      )}
      {success && (
        <p className="text-center text-green-500 mb-4">
          {success}{" "}
          <button
            onClick={() => dispatch(clearMessages())}
            className="underline ml-2"
          >
            Clear
          </button>
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
    {selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-lg w-1/3">
      <h2 className="text-lg font-bold mb-4">
        Upload Deliverable for Order #{selectedOrder}
      </h2>

      {/* Helper function to render role dropdown */}
      {["admin", "accounts"].map((roleName) => {
        const role = roles?.find((r) => r.name.toLowerCase() === roleName);
        const users = role ? roleUsers[role.id] || [] : [];
        const selectedValue =
          roleName === "admin" ? adminId : accountId;
        const setSelected =
          roleName === "admin" ? setAdminId : setAccountId;

        return (
          <label
            key={roleName}
            className="block mb-2 text-sm font-medium"
          >
            Select {roleName.charAt(0).toUpperCase() + roleName.slice(1)}:
            <select
              value={selectedValue}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full border p-2 mt-1"
            >
              <option value="">-- Select {roleName} --</option>
              {users.length === 0 && (
                <option disabled>No {roleName} users</option>
              )}
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} (ID: {user.id})
                </option>
              ))}
            </select>
          </label>
        );
      })}

      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={forwardWithoutChanges}
          onChange={(e) => setForwardWithoutChanges(e.target.checked)}
        />
        <span>Forward without changes</span>
      </div>

      {!forwardWithoutChanges && (
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="mb-4"
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleUpload(selectedOrder)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
)}

    </div>
  );
}