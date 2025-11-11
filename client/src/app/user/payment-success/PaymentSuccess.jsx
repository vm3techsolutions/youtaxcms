
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { verifyPaymentLink } from "@/store/slices/orderSlice"; // adjust import path if needed

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verifying payment...");
  const alreadyCalled = useRef(false);

  useEffect(() => {
    const payment_id = searchParams.get("razorpay_payment_id");
    const payment_link_id = searchParams.get("razorpay_payment_link_id");
    const signature = searchParams.get("razorpay_signature");

    if (!payment_id || !payment_link_id || !signature) {
      setMessage("Invalid payment details ❌");
      return;
    }

    const verify = async () => {
      if (alreadyCalled.current) return; // ✅ Prevent duplicate verification
      alreadyCalled.current = true;

      try {
        const resultAction = await dispatch(
          verifyPaymentLink({ payment_id, payment_link_id, signature })
        );

        if (verifyPaymentLink.fulfilled.match(resultAction)) {
          if (resultAction.payload.success) {
            setMessage("Payment verified successfully ✅ Redirecting...");
            setTimeout(() => router.push("/user/orders"), 2000);
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
