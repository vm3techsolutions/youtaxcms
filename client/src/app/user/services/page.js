"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchDocumentsByService } from "@/store/slices/serviceDocumentsSlice";
import { resetOrderState, createOrder } from "@/store/slices/orderSlice";
import { useRouter } from "next/navigation";

export default function ServicesFlex() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { services, loading: servicesLoading, error: servicesError } = useSelector(
    (state) => state.services
  );
  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);
  const { userInfo } = useSelector((state) => state.user);
  const { order, loading: orderLoading, error: orderError, success } = useSelector(
    (state) => state.order
  );

  const [expanded, setExpanded] = useState(null);
  const [modalService, setModalService] = useState(null);
  const [paymentOption, setPaymentOption] = useState("full");

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const handleToggle = (serviceId) => {
    setExpanded(expanded === serviceId ? null : serviceId);
    if (!serviceDocuments[serviceId]) {
      dispatch(fetchDocumentsByService(serviceId));
    }
  };

  const handleApplyNow = (service) => {
    setModalService(service);
    dispatch(resetOrderState());
    setPaymentOption("full");
  };

  const handleBackToList = () => {
    setModalService(null);
    dispatch(resetOrderState());
  };

  const handleConfirmPayment = async () => {
    if (!userInfo?.id) return alert("Please login first!");
    if (!modalService) return;

    const paymentData = {
      service_id: modalService.id,
      customer_name: userInfo.name,
      customer_email: userInfo.email,
      customer_contact: userInfo.phone,
      payment_option: paymentOption,
      callback_url: `${window.location.origin}/user/payment-success`, // Razorpay will redirect here
    };

    const resultAction = await dispatch(createOrder(paymentData));

    if (createOrder.fulfilled.match(resultAction)) {
      const url = resultAction.payload.razorpay?.payment_link;
      if (url) {
        // Open Razorpay payment page
        window.location.href = url;
      } else {
        alert("Payment link not available");
      }
    } else {
      alert(resultAction.payload || "Failed to create order");
    }
  };

  if (servicesLoading) return <p className="text-center mt-8">Loading services...</p>;
  if (servicesError) return <p className="text-center text-red-500 mt-8">{servicesError}</p>;

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex flex-wrap justify-center gap-6 items-start">
        {services.map((service) => {
          const isExpanded = expanded === service.id;
          const documents = serviceDocuments[service.id] || [];

          return (
            <div
              key={service.id}
              className="bg-white shadow-md rounded-xl cursor-pointer overflow-hidden flex flex-col transition-all duration-300 w-[300px]"
            >
              <div
                className="p-6 text-center font-semibold text-xl secondaryText"
                onClick={() => handleToggle(service.id)}
              >
                {service.name}
              </div>

              {isExpanded && (
                <div className="px-8 py-2">
                  <h3 className="font-semibold mb-2 text-gray-800">Documents Required</h3>
                  {documents.length === 0 ? (
                    <p>Not Uploaded</p>
                  ) : (
                    <ol className="list-decimal list-inside text-gray-700 mb-4">
                      {documents.map((doc) => (
                        <li key={doc.id}>{doc.doc_name}</li>
                      ))}
                    </ol>
                  )}
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={() => handleApplyNow(service)}
                      className="px-4 py-2 primary-btn text-white rounded-lg"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {modalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-11/12 max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleBackToList}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">{modalService.name}</h2>
            <p className="text-gray-600 mb-4">
              {modalService.description || "No description available"}
            </p>

            <div className="flex justify-center gap-4 mb-4">
              {modalService.advance_price > 0 && (
                <>
                  <button
                    onClick={() => setPaymentOption("full")}
                    className={`px-4 py-2 rounded-lg ${
                      paymentOption === "full" ? "bg-green-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    Full Payment
                  </button>
                  <button
                    onClick={() => setPaymentOption("advance")}
                    className={`px-4 py-2 rounded-lg ${
                      paymentOption === "advance" ? "bg-green-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    Advance Payment
                  </button>
                </>
              )}
            </div>

            <div className="text-center mt-4">
              <button
                onClick={handleConfirmPayment}
                disabled={orderLoading}
                className="px-6 py-2 primary-btn text-white rounded-lg"
              >
                {orderLoading ? "Processing..." : "Confirm & Pay"}
              </button>
              {orderError && <p className="text-red-500 mt-2">{orderError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
