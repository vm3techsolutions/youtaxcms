// "use client";

// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { createOrder, resetOrderState, verifyPaymentLink } from "@/store/slices/orderSlice";
// import { useRouter, useSearchParams } from "next/navigation";

// export default function PaymentPage() {
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const serviceId = searchParams.get("serviceId");
//   const serviceName = searchParams.get("serviceName");
//   const totalAmount = parseFloat(searchParams.get("totalAmount") || 0);

//   const { userInfo } = useSelector((state) => state.user);
//   const { order, loading: orderLoading, error: orderError, success } = useSelector((state) => state.order);

//   const [advanceAmount, setAdvanceAmount] = useState(500);
//   const [paymentMessage, setPaymentMessage] = useState("");

//   const MIN_ADVANCE = 500;

//   useEffect(() => {
//     dispatch(resetOrderState());
//   }, [dispatch]);

//   const handleAdvanceChange = (e) => {
//     const value = parseFloat(e.target.value);
//     if (!isNaN(value)) setAdvanceAmount(value);
//   };

//   const handleConfirmPayment = () => {
//     if (!userInfo?.id) {
//       alert("Please login first!");
//       return;
//     }
//     if (advanceAmount < MIN_ADVANCE) {
//       alert(`Minimum advance is ₹${MIN_ADVANCE}`);
//       return;
//     }

//     dispatch(
//       createOrder({
//         service_id: serviceId,
//         customer_name: userInfo.name,
//         customer_email: userInfo.email,
//         customer_contact: userInfo.phone,
//         payment_option: "advance",
//       })
//     );
//   };

//   // Verify payment after order created
//   useEffect(() => {
//     const verifyPayment = async () => {
//       if (!order?.razorpay?.id) return;

//       setPaymentMessage("Verifying payment...");

//       try {
//         const resultAction = await dispatch(verifyPaymentLink(order.razorpay.id));
//         if (verifyPaymentLink.fulfilled.match(resultAction)) {
//           if (resultAction.payload.success) {
//             setPaymentMessage("Payment verified ✅ Redirecting...");
//             setTimeout(() => {
//               router.push(`/user/documents?serviceId=${serviceId}&serviceName=${encodeURIComponent(serviceName)}&orderId=${order.id}`);
//             }, 1000);
//           } else {
//             setPaymentMessage("Payment verification failed ❌");
//           }
//         } else {
//           setPaymentMessage(resultAction.payload || "Payment verification failed ❌");
//         }
//       } catch (err) {
//         console.error(err);
//         setPaymentMessage("Error verifying payment ❌");
//       }
//     };

//     if (success && order?.razorpay?.id) verifyPayment();
//   }, [success, order, router, serviceId, serviceName, dispatch]);

//   return (
//     <div className="container mx-auto py-8 px-4 max-w-md">
//       <h1 className="text-2xl font-bold mb-4">Payment for {serviceName}</h1>
//       <p className="mb-2">Total Price: ₹{totalAmount}</p>
//       <p className="mb-2">Minimum Advance: ₹{MIN_ADVANCE}</p>

//       <input
//         type="number"
//         min={MIN_ADVANCE}
//         value={advanceAmount}
//         onChange={handleAdvanceChange}
//         className="w-full border px-3 py-2 mb-4 rounded"
//       />

//       <button
//         onClick={handleConfirmPayment}
//         disabled={orderLoading}
//         className="w-full bg-green-600 text-white py-2 rounded-lg"
//       >
//         {orderLoading ? "Creating Payment..." : "Pay Advance"}
//       </button>

//       {paymentMessage && <p className="mt-2">{paymentMessage}</p>}
//       {orderError && <p className="mt-2 text-red-500">{orderError}</p>}
//     </div>
//   );
// }



// "use client";

// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { createOrder } from "@/store/slices/orderSlice";
// import { useRouter, useSearchParams } from "next/navigation";

// export default function PaymentPage() {
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const serviceId = searchParams.get("serviceId"); // get serviceId from URL

//   const { userInfo } = useSelector((state) => state.user);
//   const { order, loading: orderLoading, error: orderError } = useSelector(
//     (state) => state.order
//   );

//   const [service, setService] = useState(null);
//   const [paymentOption, setPaymentOption] = useState("full"); // full or advance
//   const [advanceAmount, setAdvanceAmount] = useState(500);

//   // Fetch service details based on serviceId
//   useEffect(() => {
//     if (!serviceId) return;

//     const fetchService = async () => {
//       try {
//         const res = await fetch(`/api/services/${serviceId}`);
//         const data = await res.json();
//         setService(data);
//         setAdvanceAmount(data.advance_price || 500);
//       } catch (err) {
//         console.error("Failed to fetch service", err);
//       }
//     };

//     fetchService();
//   }, [serviceId]);

//   if (!service) return <p className="text-center mt-8">Loading service...</p>;

//   const totalAmount = service.base_price + (service.service_charges || 0);

//   const handleConfirmPayment = async () => {
//     if (!userInfo?.id) return alert("Please login first!");

//     const option = paymentOption === "advance" ? "advance" : "full";

//     if (option === "advance" && advanceAmount < 500) {
//       return alert("Minimum advance payment is ₹500");
//     }

//     const paymentData = {
//       service_id: service.id,
//       customer_name: userInfo.name,
//       customer_email: userInfo.email,
//       customer_contact: userInfo.phone,
//       payment_option: option,
//     };

//     const resultAction = await dispatch(createOrder(paymentData));

//     if (createOrder.fulfilled.match(resultAction)) {
//       const url = resultAction.payload.razorpay?.payment_link;
//       if (url) {
//         // Open payment link in the same window or new tab
//         window.location.href = url;
//       } else {
//         alert("Payment link not available. Try again.");
//       }
//     } else {
//       alert(resultAction.payload || "Failed to create order");
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md mt-8">
//       <h2 className="text-2xl font-bold mb-4">{service.name}</h2>
//       <p className="mb-4">{service.description || "No description available"}</p>

//       <div className="mb-4">
//         <p>Total Price: ₹{totalAmount}</p>
//         {service.advance_price > 0 && <p>Advance Price: ₹{service.advance_price}</p>}
//       </div>

//       {service.advance_price > 0 && (
//         <div className="mb-4">
//           <label className="mr-2">
//             <input
//               type="radio"
//               name="paymentOption"
//               value="full"
//               checked={paymentOption === "full"}
//               onChange={() => setPaymentOption("full")}
//             />{" "}
//             Full Payment
//           </label>
//           <label className="ml-4">
//             <input
//               type="radio"
//               name="paymentOption"
//               value="advance"
//               checked={paymentOption === "advance"}
//               onChange={() => setPaymentOption("advance")}
//             />{" "}
//             Advance Payment
//           </label>

//           {paymentOption === "advance" && (
//             <div className="mt-2">
//               <input
//                 type="number"
//                 value={advanceAmount}
//                 min={500}
//                 max={totalAmount}
//                 onChange={(e) => setAdvanceAmount(Number(e.target.value))}
//                 className="border p-1 rounded w-32"
//               />
//               <p className="text-sm text-gray-500">
//                 Minimum ₹500, max ₹{totalAmount}
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       <button
//         onClick={handleConfirmPayment}
//         disabled={orderLoading}
//         className="px-6 py-2 bg-green-500 text-white rounded-lg"
//       >
//         {orderLoading ? "Processing..." : "Proceed to Payment"}
//       </button>

//       {orderError && <p className="text-red-500 mt-2">{orderError}</p>}
//     </div>
//   );
// }
