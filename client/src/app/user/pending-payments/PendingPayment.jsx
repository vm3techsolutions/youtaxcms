"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPendingPaymentLink, fetchPendingPayments } from "../../../store/slices/orderSlice";

const PendingPayments = () => {
  const dispatch = useDispatch();
  const pendingPayments = useSelector((state) => state.order.pendingPayments || []);
  const loading = useSelector((state) => state.order.loading);

  useEffect(() => {
    dispatch(fetchPendingPayments());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pending Payments</h2>
      {pendingPayments.length === 0 ? (
        <div>No pending payments</div>
      ) : (
        pendingPayments.map((order) => (
          <div key={order.id} className="border p-4 mb-2">
            <div>
              <strong>Order #{order.id}</strong> - Pending: ₹{order.pending_amount}
            </div>
            <div>
              <span className="font-medium">Service:</span> {order.service_name}
            </div>
            <button
              onClick={() =>
                dispatch(createPendingPaymentLink(order.id)).then((res) => {
                  if (res.payload?.payment_link) {
                    window.location.href = res.payload.payment_link;
                  }
                })
              }
              className="bg-green-500 text-white px-4 py-2 rounded mt-2"
            >
              Pay Now
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default PendingPayments;
