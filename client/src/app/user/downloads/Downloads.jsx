"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDeliverablesByCustomer } from "@/store/slices/deliverableSlice";

const DeliverablesList = ({ customerId }) => {
  const dispatch = useDispatch();
  const { deliverables, loading, error } = useSelector((state) => state.deliverables);

  useEffect(() => {
    dispatch(fetchDeliverablesByCustomer(customerId));
  }, [customerId, dispatch]);

  if (loading) return <p>Loading deliverables...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!deliverables.length) return <p>No deliverables found</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Deliverables for Customer {customerId}</h2>
      <ul className="space-y-2">
        {deliverables.map((d) => {
          const isLocked = d.order_status === "awaiting_final_payment";
          return (
            <li
              key={d.id}
              className={`p-2 border rounded flex justify-between items-center ${
                isLocked ? "opacity-80 blur-[1px] pointer-events-none" : ""
              }`}
            >
              <div>
                <strong>Order #{d.order_id} - {d.service_name}</strong>
                <div className="text-sm text-gray-600">Status: {d.order_status}</div>
              </div>
              {isLocked ? (
                <span className="text-gray-400">Locked - Pending Payment</span>
              ) : (
                <a
                  href={d.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View / Download
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DeliverablesList;
