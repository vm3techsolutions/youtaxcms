"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingOrdersForAccounts,
  fetchOrderPayments,
  forwardToOperations,
  clearMessages,
  resetAccountsState,
  getOperationUsersForDropdown,
} from "@/store/slices/accountsSlice";
import { fetchAdminRoles } from "@/store/slices/adminSlice";
import { fetchAdminUsersByRole } from "@/store/slices/adminUserSlice";

export default function AccountsOrdersPage() {
  const dispatch = useDispatch();
  const {
    pendingOrders,
    paymentsByOrder,
    loadingOrders,
    loadingPayments,
    loadingForward,
    lastOperationUserId,
    error,
    success,
  } = useSelector((state) => state.accounts);

  // Admin slices
  const { roles, rolesLoading } = useSelector((state) => state.admin);
  const { usersByRole: operationsUsers, loading: loadingAdmins } = useSelector(
    (state) => state.adminUser
  );

  const [showPayments, setShowPayments] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState("");
    const [filter, setFilter] = useState("all");

  //Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);


  //18-12-25
  // NEW TAG – Accounts
const [accountsViewedOrders, setAccountsViewedOrders] = useState([]);

  // Fetch pending orders on mount
  useEffect(() => {
    dispatch(fetchPendingOrdersForAccounts()).then((res) => {
      console.log("Pending Orders:", res?.payload);
    });

    dispatch(fetchAdminRoles());
    return () => dispatch(resetAccountsState());
  }, [dispatch]);

  // Fetch operations users after roles are loaded
  useEffect(() => {
    if (roles && roles.length > 0) {
      const operationRole = roles.find(
        (r) => r?.name?.toLowerCase() === "operation"
      );
      if (operationRole) {
        dispatch(fetchAdminUsersByRole(operationRole.id));
      }
    }
  }, [roles, dispatch]);

  // ⭐ NEW: Fetch last operation user for the selected order
  useEffect(() => {
    if (showForward && selectedOrder) {
      dispatch(getOperationUsersForDropdown(selectedOrder));
    }
  }, [showForward, selectedOrder, dispatch]);

  //18-12-25
  useEffect(() => {
  const stored =
    JSON.parse(localStorage.getItem("accounts_viewed_orders")) || [];

  setAccountsViewedOrders(stored);
}, []);

const markOrderAsViewedByAccounts = (orderId) => {
  setAccountsViewedOrders((prev) => {
    if (prev.includes(orderId)) return prev;

    const updated = [...prev, orderId];
    localStorage.setItem(
      "accounts_viewed_orders",
      JSON.stringify(updated)
    );

    return updated;
  });
};

//17-12-25
  // 🔁 Poll new orders every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    dispatch(fetchPendingOrdersForAccounts());
  }, 30000); // 30 sec

  return () => clearInterval(interval);
}, [dispatch]);

//-----------------------------------------------------

  // const handleViewPayments = (orderId) => {
  //   dispatch(fetchOrderPayments(orderId));
  //   setSelectedOrder(orderId);
  //   setShowPayments(true);
    
  // };
  const handleViewPayments = (orderId) => {
  dispatch(fetchOrderPayments(orderId));
  setSelectedOrder(orderId);
  setShowPayments(true);

  // 👇 REMOVE NEW TAG ONLY HERE
  if (!accountsViewedOrders.includes(orderId)) {
    markOrderAsViewedByAccounts(orderId);
  }
};

  const handleForwardOrder = () => {
    if (!selectedOperation) return alert("Select an Operation User");
    dispatch(
      forwardToOperations({
        order_id: selectedOrder,
        assigned_to: selectedOperation,
        remarks: "Verified and forwarded",
      })
    ).then(() => {
    dispatch(fetchPendingOrdersForAccounts()); // 🔥 Refresh list instantly
  });
    setShowForward(false);
    setSelectedOperation("");
  };

  const isForwardDisabled = (order) => {
    if (order.status !== "awaiting_final_payment") return false;

    const payments = paymentsByOrder[order.id];

    // If payments not loaded yet → allow button
    if (!payments || payments.length === 0) return false;

    // Disable only when:
    // 1. only one payment
    // 2. that one payment is advance
    if (payments.length === 1 && payments[0].payment_type === "advance") {
      return true;
    }

    return false;
  };

  // ⭐ NEW: Filter users — show last used first
//  const sortedOperationsUsers = operationsUsers.filter(
//   (u) => u.id === lastOperationUserId
// );

let sortedOperationsUsers = operationsUsers;

// If API tells you the order came from OPERATION
if (lastOperationUserId) {
  // Show only that operation user
  sortedOperationsUsers = operationsUsers.filter(
    (u) => u.id === lastOperationUserId
  );
}

const sortedPendingOrders = [...pendingOrders].sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);
  // ===============================
// STEP 4: Pagination calculation
// ===============================
const totalPages = Math.ceil(sortedPendingOrders.length / ordersPerPage);

const indexOfLastOrder = currentPage * ordersPerPage;
const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;

const currentOrders = sortedPendingOrders.slice(
  indexOfFirstOrder,
  indexOfLastOrder
);


  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Accounts Dashboard
      </h1>

      {/* Messages */}
      {loadingOrders && (
        <p className="text-center text-gray-500">Loading orders...</p>
      )}
      {loadingPayments && (
        <p className="text-center text-gray-500">Loading payments...</p>
      )}
      {loadingForward && (
        <p className="text-center text-gray-500">Forwarding order...</p>
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
              <th className="p-2 border">S.No</th>
              <th className="py-2 px-4 border">Order ID</th>
              <th className="py-2 px-4 border">Customer</th>
              <th className="py-2 px-4 border">Service</th>
              <th className="py-2 px-4 border">Total</th>
              <th className="py-2 px-4 border">Paid</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Actions</th>
              <th className="py-2 px-4 border">Created At</th>
            </tr>
          </thead>
          <tbody>
            {pendingOrders.length === 0 && !loadingOrders && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No pending orders.
                </td>
              </tr>
            )}

            {/* {pendingOrders.map((order, index) => ( */}
            {currentOrders.map((order, index) => (
              <tr key={order.id} className="hover:bg-gray-50">
                {/* <td className="p-2 border">{index + 1}</td> */}
                
                <td className="p-2 border text-center">
  <div className="flex flex-col items-center">
    {!accountsViewedOrders.includes(order.id) && (
      <span className="mb-1 inline-block px-2 py-0.5 text-[10px] font-bold text-black bg-[#FFBF00] rounded-full -rotate-6 ">
        NEW
      </span>
    )}
    {/* <span>{index + 1}</span> */}
    <span>{indexOfFirstOrder + index + 1}</span>
  </div>
</td>


                <td className="py-2 px-4 border">{order.id}</td>
                <td className="py-2 px-4 border">
                  {order.customer_name || order.customer_id}
                </td>
                <td className="py-2 px-4 border">
                  {order.service_name || "N/A"}
                </td>
                <td className="py-2 px-4 border">₹{order.total_amount}</td>
                <td className="py-2 px-4 border">₹{order.paid_amount || 0}</td>
                <td className="py-2 px-4 border">
                  <span className="px-2 py-1 text-sm rounded bg-yellow-100 text-yellow-800">
                    {order.status}
                  </span>
                </td>
                <td className="py-2 px-4 border flex gap-2">
                  <button
                    className="px-3 py-1 primary-btn rounded"
                    onClick={() => handleViewPayments(order.id)}
                  >
                    View Payments
                  </button>
                  <button
                    className={`px-3 py-1 primary-btn rounded ${
                      isForwardDisabled(order)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={isForwardDisabled(order)}
                    onClick={() => {
                      if (isForwardDisabled(order)) return;
                      setSelectedOrder(order.id);
                      setShowForward(true);
                    }}
                  >
                    Forward
                  </button>
                </td>
                <td className="py-2 px-4 border">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString("en-GB")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {/* //17-12-25 - Pagination Logic*/}
{totalPages > 1 && (
  <div className="flex justify-center items-center mt-6 space-x-2">
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className={`px-3 py-1 rounded border ${
        currentPage === 1
          ? "bg-gray-200 cursor-not-allowed"
          : "bg-white hover:bg-blue-100"
      }`}
    >
      Prev
    </button>

    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1 rounded border ${
          currentPage === i + 1
            ? "primaryBg text-white"
            : "bg-white hover:bg-blue-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() =>
        setCurrentPage((p) => Math.min(p + 1, totalPages))
      }
      disabled={currentPage === totalPages}
      className={`px-3 py-1 rounded border ${
        currentPage === totalPages
          ? "bg-gray-200 cursor-not-allowed"
          : "bg-white hover:bg-blue-100"
      }`}
    >
      Next
    </button>
  </div>
)}
 {/* //  --------------------------------------------*/}


      {/* Payments Modal */}
      {showPayments && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-2/3 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              Payments for Order #{selectedOrder}
            </h2>
   <div>
            <table className="min-w-full border rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border">Type</th>
                  <th className="py-2 px-4 border">Mode</th>
                  <th className="py-2 px-4 border">Amount</th>
                  <th className="py-2 px-4 border">Status</th>
                  <th className="py-2 px-4 border">Txn Ref</th>
                  <th className="py-2 px-4 border">Receipt</th>
                  <th className="py-2 px-4 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {paymentsByOrder[selectedOrder]?.length > 0 ? (
                  paymentsByOrder[selectedOrder].map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border">{p.payment_type}</td>
                      <td className="py-2 px-4 border">{p.payment_mode}</td>
                      <td className="py-2 px-4 border">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-4 border">
                        <span
                          className={`px-2 py-1 text-sm rounded ${
                            p.status === "success"
                              ? "bg-green-100 text-green-800"
                              : p.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border">{p.txn_ref || "N/A"}</td>
                      <td className="py-2 px-4 border">
                        {p.signed_receipt_url ? (
                          <a
                            href={p.signed_receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td className="py-2 px-4 border">
                        {new Date(p.created_at).toLocaleString("en-GB")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
                
            <button
              onClick={() => setShowPayments(false)}
              className="mt-4 px-3 py-1 primary-btn rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForward && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h2 className="text-lg font-bold mb-4">
              Forward Order #{selectedOrder}
            </h2>
            <select
              className="w-full border p-2 mb-4"
              value={selectedOperation }
              onChange={(e) => setSelectedOperation(e.target.value)}
            >
              <option value="">-- Select Operation User --</option>
              {sortedOperationsUsers.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleForwardOrder}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
              <button
                onClick={() => setShowForward(false)}
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
