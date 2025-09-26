"use client";
import { ShieldCheck, AlertCircle, Clock } from "lucide-react";

export default function KycStatus({ status, remarks }) {
  let color = "text-gray-500";
  let icon = <Clock className="w-6 h-6" />;
  let label = "Not Submitted";

  if (status === "submitted") {
    color = "text-yellow-600";
    icon = <Clock className="w-6 h-6" />;
    label = "Pending Verification";
  } else if (status === "verified") {
    color = "text-green-600";
    icon = <ShieldCheck className="w-6 h-6" />;
    label = "Verified";
  } else if (status === "rejected") {
    color = "text-red-600";
    icon = <AlertCircle className="w-6 h-6" />;
    label = "Rejected";
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex items-center space-x-3 border">
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className={`font-semibold ${color}`}>{label}</p>
        {remarks && <p className="text-sm text-gray-500">Reason: {remarks}</p>}
      </div>
    </div>
  );
}
