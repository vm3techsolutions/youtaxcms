"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, fetchServiceById } from "@/store/slices/servicesSlice";
import { fetchDocumentsByService } from "@/store/slices/serviceDocumentsSlice";
import { resetOrderState, createOrder } from "@/store/slices/orderSlice";

// Reusable Price Info Component
function ServicePriceInfo({ service, paymentOption }) {
  const basePrice = Number(service.base_price || 0);
  const serviceCharges = Number(service.service_charges || 0);
  const totalPrice = basePrice + serviceCharges;
  const advancePrice = Number(service.advance_price || 0);
  const remainingAmount = totalPrice - advancePrice;

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="flex justify-between mb-2">
        <span className="font-medium">Service Price:</span>
        <span>₹{totalPrice.toLocaleString()}</span>
      </div>

      {paymentOption === "advance" && advancePrice > 0 && (
        <>
          <div className="flex justify-between mb-2 text-blue-600">
            <span className="font-medium">Advance Amount:</span>
            <span>₹{advancePrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-medium text-red-600 mt-1">
            <span>Remaining Amount to Pay on Completion:</span>
            <span>₹{remainingAmount.toLocaleString()}</span>
          </div>
        </>
      )}

      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
        <span>Total {paymentOption === "advance" ? "to Pay Now" : ""}</span>
        <span>
          ₹{paymentOption === "advance" && advancePrice > 0 ? advancePrice.toLocaleString() : totalPrice.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function ServicesFlex() {
  const dispatch = useDispatch();

  const { services, loading: servicesLoading, error: servicesError } = useSelector(
    (state) => state.services
  );
  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);
  const { userInfo } = useSelector((state) => state.user);
  const { loading: orderLoading } = useSelector((state) => state.order);

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

    dispatch(fetchServiceById(service.id)).then((resultAction) => {
      if (fetchServiceById.fulfilled.match(resultAction)) {
        setModalService(resultAction.payload);
      }
    });
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
      payment_option: paymentOption, // 'full' or 'advance'
      callback_url: `${window.location.origin}/user/payment-success`,
    };

    const resultAction = await dispatch(createOrder(paymentData));

    if (createOrder.fulfilled.match(resultAction)) {
      const url = resultAction.payload.razorpay?.payment_link;
      if (url) {
        window.location.href = url;
      } else {
        alert("Payment link not available");
      }
    } else {
      alert(resultAction.payload || "Failed to create order");
    }
  };

  if (servicesLoading)
    return <p className="text-center mt-8">Loading services...</p>;
  if (servicesError)
    return <p className="text-center text-red-500 mt-8">{servicesError}</p>;

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Services List */}
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
                  <h3 className="font-semibold mb-2 text-gray-800">
                    Documents Required
                  </h3>
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

      {/* Payment Side Panel */}
      {modalService && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={handleBackToList}></div>

          <div
            className={`bg-white h-screen w-[30%] shadow-xl fixed right-0 top-0 transform transition-transform duration-500 ease-in-out ${
              modalService ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex justify-between items-center px-4 py-8 border-b">
              <h2 className="text-xl font-bold">Payment</h2>
              <button
                onClick={handleBackToList}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 mb-18 overflow-y-auto">
              <div>
                <h3 className="text-lg font-semibold">{modalService.name}</h3>
                <p className="text-gray-600">
                  {modalService.description || "No description available"}
                </p>
              </div>

              <ServicePriceInfo service={modalService} paymentOption={paymentOption} />

              {/* Payment Options */}
              <div className="flex gap-4 mt-3">
                <button
                  onClick={() => setPaymentOption("full")}
                  className={`px-4 py-2 rounded-lg flex-1 ${
                    paymentOption === "full" ? "bg-green-500 text-white" : "bg-gray-200"
                  }`}
                >
                  Full Payment
                </button>
                <button
                  onClick={() => setPaymentOption("advance")}
                  disabled={!modalService.advance_price || modalService.advance_price <= 0}
                  className={`px-4 py-2 rounded-lg flex-1 ${
                    paymentOption === "advance" ? "bg-green-500 text-white" : "bg-gray-200"
                  } disabled:opacity-50`}
                >
                  Advance Payment
                </button>
              </div>
            </div>

            <div className="px-4 flex justify-center">
              <button
                onClick={handleConfirmPayment}
                disabled={orderLoading}
                className="px-6 py-2 primary-btn text-white rounded-lg w-full"
              >
                {orderLoading ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
