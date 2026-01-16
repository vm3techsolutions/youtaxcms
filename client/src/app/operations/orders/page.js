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
import { fetchDeliverablesForOrder } from "@/store/slices/operationDeliverableSlice";
import {
  uploadOperationDocument,
  getDocumentsByOrderId,
} from "@/store/slices/operationDocumentsSlice";
import OperationDocumentsPopup from "./OperationDocumentsPopup";
import MonthlyCustomerDocuments from "./MonthlyCustomerDocuments";

//18-12-25
const STORAGE_KEY = "operations_viewed_docs_orders";

const getViewedDocOrders = () => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
};

const markOrderDocsViewed = (orderId) => {
  const viewed = getViewedDocOrders();
  if (!viewed.includes(orderId)) {
    viewed.push(orderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed));
  }
};
//-------------------------------------------------

export default function OperationsOrdersPage() {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const dispatch = useDispatch();
  const {
    assignedOrders = [],
    loadingOrders,
    uploading,
    error,
    success,
  } = useSelector((state) => state.operationOrders || {});
  useEffect(() => {
    setCurrentPage(1);
  }, [assignedOrders]);

  const { roles } = useSelector((state) => state.admin);
  const { usersByRole: roleUsers } = useSelector(
    (state) => state.adminUserSecond || { usersByRole: {} }
  );

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDeliverables, setOrderDeliverables] = useState([]);
  const [files, setFiles] = useState([]);
  const [forwardWithoutChanges, setForwardWithoutChanges] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [viewDocumentsOrder, setViewDocumentsOrder] = useState(null); // new popup state
  // const { documents: operationDocuments } = useSelector(
  //   (state) => state.operationDocuments
  // );
  const operationDocuments =
    useSelector((state) => state.operationDocuments?.documents) || [];
  const [uploadCustomerDocOrder, setUploadCustomerDocOrder] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [customerDocFile, setCustomerDocFile] = useState(null);
  const [showDocsTable, setShowDocsTable] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [viewedDocOrders, setViewedDocOrders] = useState([]);
  useEffect(() => {
    setViewedDocOrders(getViewedDocOrders());
  }, []);

  // Fetch assigned orders and roles on mount
  useEffect(() => {
    dispatch(fetchAssignedOrdersForOperations());
    dispatch(fetchAdminRoles());
    return () => dispatch(resetOperationsState());
  }, [dispatch]);

  // Fetch users for Admin + Accounts roles when roles are available
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

  // Fetch deliverables for selected order
  useEffect(() => {
    if (selectedOrder) {
      dispatch(fetchDeliverablesForOrder(selectedOrder))
        .unwrap()
        .then((data) => setOrderDeliverables(data))
        .catch(() => setOrderDeliverables([]));
    } else {
      setOrderDeliverables([]);
    }
  }, [selectedOrder, dispatch]);

  //18-12-2025
  //17-12-25
  // 🔁 Poll new orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchAssignedOrdersForOperations());
    }, 30000); // 30 sec

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const handleUpload = (orderId) => {
    if (uploading) return; // 🔥 prevents double-trigger

    const order = assignedOrders.find((o) => o.id === orderId);
    // if (
    //   (order?.payment_status === "partially_paid" && !accountId) ||
    //   (order?.payment_status === "paid" && !adminId)
    // ) {
    //   return alert(
    //     order?.payment_status === "partially_paid"
    //       ? "Account ID is required."
    //       : "Admin ID is required."
    //   );
    // }
    if (order?.payment_status === "paid" && !adminId) {
      return alert("Admin ID is required.");
    }

    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("admin_id", adminId);
    // formData.append("account_id", accountId);
    formData.append("forward_without_changes", forwardWithoutChanges);

    if (!forwardWithoutChanges && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }
    setSelectedOrder(null); // for prevent double document
    dispatch(uploadDeliverable(formData))
      .unwrap()
      .then(() => {
        //  setSelectedOrder(null);
        setFiles([]);
        setForwardWithoutChanges(false);

        // 🔥 REFETCH ORDERS TO UPDATE PAGE AUTOMATICALLY
        dispatch(fetchAssignedOrdersForOperations());
      })
      .catch(() => {});
  };

  //18-12-25
  const sortedAssignedOrders = [...assignedOrders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  //Pagination-calculations
  const totalPages = Math.ceil(sortedAssignedOrders.length / ordersPerPage);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;

  const currentOrders = sortedAssignedOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

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
              <th className="p-2 border">S.No</th>
              <th className="py-2 px-4 border">Order ID</th>
              <th className="py-2 px-4 border">Customer Name</th>
              <th className="py-2 px-4 border">Service</th>
              <th className="py-2 px-4 border">Total Amount</th>
              {/* <th className="py-2 px-4 border">Advance Required</th> */}
              <th className="py-2 px-4 border">Amount Paid</th>
              <th className="py-2 px-4 border">Pending Amount</th>
              <th className="py-2 px-4 border">Payment Status</th>
              <th className="py-2 px-4 border">Deliverable Status</th>
              <th className="py-2 px-4 border">Actions</th>
              <th className="py-2 px-4 border">View Documents</th>{" "}
              <th className="py-2 px-4 border">Reciepts </th>
              <th className="py-2 px-4 border">Created At</th>
              {/* New column */}
            </tr>
          </thead>
          <tbody>
            {/* {assignedOrders.length === 0 && !loadingOrders && ( */}
            {currentOrders.length === 0 && !loadingOrders && (
              <tr>
                <td colSpan="11" className="text-center py-4 text-gray-500">
                  No assigned orders.
                </td>
              </tr>
            )}
            {/* //  {assignedOrders.map((order, index) => { */}
            {/* {sortedAssignedOrders.map((order, index) => { */}
            {currentOrders.map((order, index) => {
              const hasDocuments =
                order.order_documents && order.order_documents.length > 0;

              const isNewDoc =
                hasDocuments && !viewedDocOrders.includes(order.id);
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  {/* <td className="p-2 border">{index + 1}</td> */}

                  <td className="p-2 border relative">
                    {isNewDoc && (
                      <span className="mb-1 inline-block px-2 py-0.5 text-[10px] font-bold text-black bg-[#FFBF00] rounded-full -rotate-6 ">
                        NEW
                      </span>
                    )}
                    {/* {index + 1} */}
                    {indexOfFirstOrder + index + 1}
                  </td>
                  <td className="py-2 px-4 border">{order.id}</td>
                  <td className="py-2 px-4 border">{order.customer_name}</td>
                  <td className="py-2 px-4 border">{order.service_name}</td>
                  <td className="py-2 px-2 border">₹{order.total_amount}</td>
                  {/* <td className="py-2 px-2 border">₹{order.advance_required}</td> */}
                  <td className="py-2 px-2 border">₹{order.advance_paid}</td>
                  <td className="py-2 px-2 border">₹{order.pending_amount}</td>
                  <td className="py-2 px-2 border">{order.payment_status}</td>
                  <td className="py-2 px-4 border">
                    <span
                      className={`px-2 py-1 text-sm rounded 
      ${order.qc_status === "rejected" ? "bg-red-100 text-red-800" : ""}
      ${
        order.qc_status === "pending" || !order.qc_status
          ? "bg-yellow-100 text-yellow-800"
          : ""
      }`}
                    >
                      {order.qc_status ? order.qc_status : "pending"}
                    </span>
                  </td>

                  <td className="py-2 px-4 border">
                    <button
                      className="px-3 py-1 rounded primary-btn"
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      Upload / Forward
                    </button>
                  </td>
                  {/* <td className="py-2 px-4 border">
                  <button
                    className="px-3 py-1 rounded primary-btn"
                    onClick={() => setViewDocumentsOrder(order)}
                  >
                    View Documents
                  </button>
                </td> */}
                  <td className="py-2 px-4 border">
                    <button
                      className="relative px-3 py-1 rounded primary-btn"
                      onClick={() => {
                        markOrderDocsViewed(order.id);
                        setViewedDocOrders(getViewedDocOrders());
                        setViewDocumentsOrder(order);
                      }}
                    >
                      View Documents
                    </button>
                  </td>
                  {/* <td className="py-2 px-4 border">
                  <button
                    className="px-3 py-1 rounded primary-btn"
                    onClick={() => {
                      setUploadCustomerDocOrder(order);
                      dispatch(getDocumentsByOrderId(order.id)); // Fetch existing docs
                    }}
                  >
                    Upload
                  </button>
                </td> */}

                  <td className="py-2 px-4 border">
                    {order.operation_documents &&
                    order.operation_documents.length > 0 ? (
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                        onClick={() => {
                          setUploadCustomerDocOrder(order);
                          dispatch(getOperationDocuments(order.id));
                        }}
                      >
                        View Documents
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 rounded bg-green-600 text-white"
                        onClick={() => {
                          setUploadCustomerDocOrder(order);
                          dispatch(getDocumentsByOrderId(order.id));
                        }}
                      >
                        Upload Documents
                      </button>
                    )}
                  </td>

                  <td className="py-2 px-4 ">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString("en-GB")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginations UI */}
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
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

      {/* Upload / Forward Modal */}
      {selectedOrder &&
        (() => {
          const order = assignedOrders.find((o) => o.id === selectedOrder);
          const hasDeliverables = orderDeliverables.length > 0;
          const canSubmit =
            forwardWithoutChanges || hasDeliverables || files.length > 0;

          return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white p-6 rounded shadow-lg w-1/3">
                <h2 className="text-lg font-bold mb-4">
                  Upload / View Deliverable for Order #{selectedOrder}
                </h2>

                {hasDeliverables ? (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-green-600">
                      Existing Deliverables:
                    </h3>
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
                    {/* Select Account: */}
                    Pending Payament Send Back To Account
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

                {/* <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={forwardWithoutChanges}
                  onChange={(e) => setForwardWithoutChanges(e.target.checked)}
                />
                <span>Forward without changes</span>
              </div> */}

                {orderDeliverables.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={forwardWithoutChanges}
                      onChange={(e) =>
                        setForwardWithoutChanges(e.target.checked)
                      }
                    />
                    <span>Forward without changes</span>
                  </div>
                )}

                {(!hasDeliverables || !forwardWithoutChanges) && (
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mb-4 w-full border-2 border-gray-500 rounded p-2 cursor-pointer bg-blue-50 hover:bg-blue-100 transition"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!canSubmit) {
                        alert(
                          "Please upload a deliverable or select 'Forward without changes'."
                        );
                        return;
                      }
                      if (uploading) return; // prevent double click
                      handleUpload(selectedOrder);
                    }}
                    className={`px-3 py-1 rounded primary-btn ${
                      !canSubmit ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={!canSubmit}
                  >
                    {uploading ? "Processing..." : "Submit"}
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

      {/* View Documents Popup */}
      {viewDocumentsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl h-[80vh] rounded-xl shadow-xl flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
              <div>
                <h2 className="text-xl font-semibold">Customer Documents</h2>
                <p className="text-sm text-gray-500">
                  Order #{viewDocumentsOrder.id}
                </p>
              </div>

              <button
                onClick={() => setViewDocumentsOrder(null)}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ✕
              </button>
            </div>

            {/* TABS */}
            <div className="flex border-b shrink-0">
              <button
                className={`flex-1 py-3 text-sm font-medium ${
                  showDocsTable
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
                onClick={() => setShowDocsTable(true)}
              >
                General Documents
              </button>

              <button
                className={`flex-1 py-3 text-sm font-medium ${
                  !showDocsTable
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
                onClick={() => setShowDocsTable(false)}
              >
                Monthly Documents
              </button>
            </div>

            {/* CONTENT (SCROLLABLE ONLY) */}
            <div className="flex-1 p-6 overflow-y-auto">
              {showDocsTable ? (
                <>
                  {viewDocumentsOrder.order_documents?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewDocumentsOrder.order_documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="border rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">
                                {doc.doc_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Type: {doc.doc_type}
                              </p>
                            </div>

                            <a
                              href={doc.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm font-medium hover:underline"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">
                      No general documents uploaded.
                    </p>
                  )}
                </>
              ) : (
                <MonthlyCustomerDocuments orderId={viewDocumentsOrder.id} />
              )}
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t bg-gray-50 shrink-0 flex justify-end">
              <button
                onClick={() => setViewDocumentsOrder(null)}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadCustomerDocOrder && (
        <OperationDocumentsPopup
          orderId={uploadCustomerDocOrder.id}
          onClose={() => setUploadCustomerDocOrder(null)}
        />
      )}
    </div>
  );
}
