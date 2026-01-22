"use client";
import { useState } from "react";
import ServiceComboOfferCards from "./ServiceComboOfferCards";
import ServiceBundleForm from "./ServiceBundleForm";

export default function Offers() {
    
      const [showBundleModal, setShowBundleModal] = useState(false);
    return (
       
<div className="mt-12">
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-2xl font-semibold text-gray-800">
      🎁 Combo Offers
    </h2>

    {/* Create Service Bundle */}
              <button
                onClick={() => setShowBundleModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700"
              >
                Create Service Bundle
              </button>
    
  </div>

  <ServiceComboOfferCards />

  {/* =========================
            Service Bundle Modal
        ========================= */}
       {showBundleModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black/20 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
        <button
          onClick={() => setShowBundleModal(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
  
        <ServiceBundleForm onClose={() => setShowBundleModal(false)} />
      </div>
    </div>
  )}
  
</div>

    );
}