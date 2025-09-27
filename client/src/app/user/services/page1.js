"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchDocumentsByService } from "@/store/slices/serviceDocumentsSlice";
import {
  createOrder,
  resetOrderState,
  verifyPaymentLink,
} from "@/store/slices/orderSlice";
import { useRouter } from "next/navigation";

export default function ServicesFlex() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const {
    services,
    loading: servicesLoading,
    error: servicesError,
  } = useSelector((state) => state.services);
  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);

  // Logged-in user info
  const { userInfo } = useSelector((state) => state.user);

  const {
    order,
    loading: orderLoading,
    error: orderError,
    success,
  } = useSelector((state) => state.order);

  const [expanded, setExpanded] = useState(null);
  const [modalService, setModalService] = useState(null);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Redirect to documents page after order creation
  // useEffect(() => {
  //   if (success && order?.id && modalService) {
  //     alert("Order created! Redirecting to document upload page.");
  //     router.push(
  //       `/user/documents?serviceId=${modalService.id}&serviceName=${encodeURIComponent(
  //         modalService.name
  //       )}&orderId=${order.id}`
  //     );
  //   }
  // }, [success, order, modalService, router]);

  useEffect(() => {
    if (success && order?.razorpayLink) {
      const verifyPayment = async () => {
        setVerifyingPayment(true);
        setPaymentMessage("Verifying payment...");
        try {
          const resultAction = await dispatch(
            verifyPaymentLink(order.razorpayLink.id)
          );
          if (verifyPaymentLink.fulfilled.match(resultAction)) {
            if (resultAction.payload.success) {
              setPaymentMessage(
                "Payment verified successfully ✅ Redirecting..."
              );
              router.push(
                `/user/documents?serviceId=${
                  modalService.id
                }&serviceName=${encodeURIComponent(
                  modalService.name
                )}&orderId=${order.id}`
              );
            } else {
              setPaymentMessage("Payment verification failed ❌");
            }
          } else {
            setPaymentMessage(resultAction.payload || "Verification failed");
          }
        } catch (err) {
          setPaymentMessage("Error verifying payment");
          console.error(err);
        } finally {
          setVerifyingPayment(false);
        }
      };

      verifyPayment();
    }
  }, [success, order, modalService, router, dispatch]);

  const handleToggle = (serviceId) => {
    setExpanded(expanded === serviceId ? null : serviceId);
    if (!serviceDocuments[serviceId]) {
      dispatch(fetchDocumentsByService(serviceId));
    }
  };

  const handleApplyNow = (service) => {
    setModalService(service);
    dispatch(resetOrderState());
  };

  const handleBackToList = () => {
    setModalService(null);
    dispatch(resetOrderState());
  };

  const handleConfirmPayment = () => {
    if (!modalService) return;

    if (!userInfo?.id) {
      alert("Please login first!");
      return;
    }

    // ✅ Updated payload according to backend requirements
    dispatch(
      createOrder({
        service_id: modalService.id,
        customer_name: userInfo.name,
        customer_email: userInfo.email,
        customer_contact: userInfo.phone, // make sure contact exists in userInfo
        payment_option: "full", // or "advance"
      })
    );
  };

  if (servicesLoading)
    return <p className="text-center">Loading services...</p>;
  if (servicesError)
    return <p className="text-center text-red-500">{servicesError}</p>;

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
                      className="px-4 py-2 primary-btn text-white rounded-lg transition"
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

      {/* Modal */}
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

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="p-2 border rounded bg-gray-50">
                Base Price: ₹{modalService.base_price}
              </div>
              <div className="p-2 border rounded bg-gray-50">
                Advance Price: ₹{modalService.advance_price || "N/A"}
              </div>
              <div className="p-2 border rounded bg-gray-50">
                Service Charges: ₹{modalService.service_charges || "N/A"}
              </div>
              <div className="p-2 border rounded bg-gray-50">
                SLA Days: {modalService.sla_days || "N/A"}
              </div>
              <div className="p-2 border rounded bg-gray-50 col-span-2">
                Requires Advance:{" "}
                {modalService.requires_advance ? "✅ Yes" : "❌ No"}
              </div>
            </div>

            <div className="text-center mt-4">
              {/* <button
                onClick={handleConfirmPayment}
                disabled={orderLoading}
                className="px-6 py-2 primary-btn text-white rounded-lg"
              >
                {orderLoading ? "Processing..." : "Confirm Payment & Proceed"}
              </button>

              {orderError && (
                <p className="text-red-500 mt-2 text-sm">{orderError}</p>
              )} */}

              <button
                onClick={handleConfirmPayment}
                disabled={orderLoading || verifyingPayment}
                className="px-6 py-2 primary-btn text-white rounded-lg"
              >
                {orderLoading
                  ? "Processing..."
                  : verifyingPayment
                  ? "Verifying Payment..."
                  : "Confirm Payment & Proceed"}
              </button>

              {paymentMessage && (
                <p className="mt-2 text-gray-700">{paymentMessage}</p>
              )}
              {orderError && <p className="text-red-500 mt-2">{orderError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
