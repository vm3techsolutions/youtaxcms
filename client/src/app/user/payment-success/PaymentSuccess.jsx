// "use client";

// import { useEffect, useState } from "react";
// import { useDispatch } from "react-redux";
// import { useRouter, useSearchParams } from "next/navigation";
// import { verifyPaymentLink } from "@/store/slices/orderSlice";

// export default function PaymentSuccessPage() {
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const [message, setMessage] = useState("Verifying payment...");

//   useEffect(() => {
//     const payment_id = searchParams.get("razorpay_payment_id");
//     const payment_link_id = searchParams.get("razorpay_payment_link_id");
//     const signature = searchParams.get("razorpay_signature");

//     if (!payment_id || !payment_link_id || !signature) {
//       setMessage("Invalid payment details ❌");
//       return;
//     }

//     const verify = async () => {
//       try {
//         // Pass object as required by your slice
//         const resultAction = await dispatch(
//           verifyPaymentLink({ payment_id, payment_link_id, signature })
//         );

//         if (verifyPaymentLink.fulfilled.match(resultAction)) {
//           if (resultAction.payload.success) {
//             setMessage("Payment verified ✅ Redirecting...");
//             router.push(`/user/documents?orderId=${resultAction.payload.order_id}`);
//           } else {
//             setMessage("Payment verification failed ❌");
//           }
//         } else {
//           setMessage(resultAction.payload || "Payment verification failed ❌");
//         }
//       } catch (err) {
//         console.error(err);
//         setMessage("Error verifying payment ❌");
//       }
//     };

//     verify();
//   }, [dispatch, router, searchParams]);

//   return (
//     <div className="flex justify-center items-center h-screen">
//       <p className="text-lg">{message}</p>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPaymentLink } from "@/store/slices/orderSlice";

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const payment_id = searchParams.get("razorpay_payment_id");
    const payment_link_id = searchParams.get("razorpay_payment_link_id");
    const signature = searchParams.get("razorpay_signature");

    if (!payment_id || !payment_link_id || !signature) {
      setMessage("Invalid payment details ❌");
      return;
    }

    const verify = async () => {
      try {
        const resultAction = await dispatch(
          verifyPaymentLink({ payment_id, payment_link_id, signature })
        );

        if (verifyPaymentLink.fulfilled.match(resultAction)) {
          if (resultAction.payload.success) {
            setMessage("Payment verified ✅ Redirecting to orders page...");
            // Redirect to the general orders page
            router.push(`/user/orders`);
          } else {
            setMessage("Payment verification failed ❌");
          }
        } else {
          setMessage(resultAction.payload || "Payment verification failed ❌");
        }
      } catch (err) {
        console.error(err);
        setMessage("Error verifying payment ❌");
      }
    };

    verify();
  }, [dispatch, router, searchParams]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-lg">{message}</p>
    </div>
  );
}
