"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAssignedOrders,
  fetchDeliverables,
  qcDeliverable,
  approveOrderCompletion,
} from "@/store/slices/adminOrdersSlice";
import { fetchAllCustomers } from "@/store/slices/customersSlice";
import { fetchServices } from "@/store/slices/servicesSlice";

//18-12-25
const STORAGE_KEY = "admin_viewed_orders";

const getViewedOrders = () => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
};

const markOrderViewed = (orderId) => {
  const viewed = getViewedOrders();
  if (!viewed.includes(orderId)) {
    viewed.push(orderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed));
  }
};

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const { orders, deliverables, loading, error, successMessage } = useSelector(
    (state) => state.adminOrders
  );
  const { customers } = useSelector((state) => state.customers);
  const { services } = useSelector((state) => state.services);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  //18-12-25
  const [viewedOrders, setViewedOrders] = useState([]);

  useEffect(() => {
  setViewedOrders(getViewedOrders());
}, []);

  // Fetch orders and customers
  useEffect(() => {
    dispatch(fetchAssignedOrders());
    dispatch(fetchAllCustomers());
    dispatch(fetchServices());
  }, [dispatch]);

  // Map customer IDs to names for easy lookup
  const customerMap = {};
  customers.forEach((c) => (customerMap[c.id] = c.name));

  const serviceMap = {};
  services.forEach((s) => (serviceMap[s.id] = s.name));

  // const handleFetchDeliverables = (orderId) => {
  //   setSelectedOrder(orderId);
  //   dispatch(fetchDeliverables(orderId));
  //   setShowModal(true);
  // };

  const handleFetchDeliverables = (orderId) => {
  markOrderViewed(orderId);
  setViewedOrders(getViewedOrders());

  setSelectedOrder(orderId);
  dispatch(fetchDeliverables(orderId));
  setShowModal(true);
};

  const handleQC = (deliverableId, status) => {
    dispatch(
      qcDeliverable({ deliverable_id: deliverableId, qc_status: status })
    );
  };

  const handleApproveCompletion = (orderId) => {
    dispatch(approveOrderCompletion({ order_id: orderId }));
  };


  //Pagination 
  const [currentPage, setCurrentPage] = useState(1);
const ordersPerPage = 10;
   
      // 🔁 Poll new orders every 30 seconds
    useEffect(() => {
      const interval = setInterval(() => {
        dispatch(fetchAssignedOrders());
      }, 30000); // 30 sec
    
      return () => clearInterval(interval);
    }, [dispatch]);

    const sortedOrders = [...orders].sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);

useEffect(() => {
  setCurrentPage(1);
}, [sortedOrders.length]);


//pagination- Logic 

const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

const indexOfLastOrder = currentPage * ordersPerPage;
const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;

const currentOrders = sortedOrders.slice(
  indexOfFirstOrder,
  indexOfLastOrder
);

    

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Orders</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

      {/* Orders List */}
      <table className="w-full border border-gray-300 rounded mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">S.No</th>
            <th className="p-2 border">Order ID</th>
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Service</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Payment</th>
            <th className="p-2 border">Actions</th>
            <th className="py-2 px-4 border">Created At</th>
          </tr>
        </thead>
        <tbody>
          {/* {orders.map((order, index) => { */}
          {/* {sortedOrders.map((order, index) => { */}
          {currentOrders.map((order, index) => {

            const isNew =
    !viewedOrders.includes(order.id);
    return (
            <tr key={order.id} className="text-center">
              {/* <td className="p-2 border">{index + 1}</td> */}
              <td className="p-2 border relative">


  {isNew && (
    <span className="mb-1 inline-block px-2 py-0.5 text-[10px] font-bold text-black bg-[#FFBF00] rounded-full -rotate-6 ">
      NEW
    </span> 

  )}

    {/* {index + 1} */}
     {indexOfFirstOrder + index + 1}
</td>
              <td className="p-2 border">{order.id}</td>
              <td className="p-2 border">
                {customerMap[order.customer_id] || "N/A"}
              </td>
              <td className="p-2 border">
                {serviceMap[order.service_id] || "N/A"}
              </td>
              <td className="p-2 border">{order.status}</td>
              <td className="p-2 border">{order.payment_status}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleFetchDeliverables(order.id)}
                  className="px-3 py-1 primary-btn text-white rounded mr-2"
                >
                  View Deliverables
                </button>
                {order.status === "in_progress" &&
                  order.payment_status === "paid" && (
                    <button
                      onClick={() => handleApproveCompletion(order.id)}
                      className="px-3 py-1 primary-btn text-white rounded"
                    >
                      Approve Completion
                    </button>
                  )}
              </td>

              <td className="py-2 px-4 border">
                {order.created_at
                  ? new Date(order.created_at).toLocaleString("en-GB")
                  : "—"}
              </td>
            </tr>
            )}
          )}
        </tbody>
      </table>
      {/* //Pagination UI */}
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


      {/* Deliverables Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-4 py-2">
              <h3 className="text-xl font-semibold">
                Deliverables for Order #{selectedOrder}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-gray-900 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {deliverables[selectedOrder] ? (
                <table className="w-full border border-gray-300 rounded">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Version</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">File</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables[selectedOrder].map((d) => (
                      <tr key={d.id} className="text-center">
                        <td className="p-2 border">{d.versions}</td>
                        <td className="p-2 border">
                          {d.qc_status || "pending"}
                        </td>
                        <td className="p-2 border">
                          {d.signed_url ? (
                            <a
                              href={d.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              View
                            </a>
                          ) : (
                            "No File"
                          )}
                        </td>
                        <td className="p-2 border">
                          {d.qc_status === "approved" ? (
                            <span className="px-2 py-1 bg-green-500 text-white rounded">
                              Approved
                            </span>
                          ) : d.qc_status === "rejected" ? (
                            <span className="px-2 py-1 bg-red-500 text-white rounded">
                              Rejected
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleQC(d.id, "approved")}
                                className="px-2 py-1 bg-green-500 text-white rounded mr-2"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleQC(d.id, "rejected")}
                                className="px-2 py-1 bg-red-500 text-white rounded"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No deliverables found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
