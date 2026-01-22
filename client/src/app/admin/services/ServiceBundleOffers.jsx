"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllServiceBundles } from "@/store/slices/serviceBundleSlice";

const ServiceBundleOffers = () => {
  const dispatch = useDispatch();

  const { bundles, loading, error } = useSelector(
    (state) => state.serviceBundles
  );

  useEffect(() => {
    dispatch(fetchAllServiceBundles());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!bundles.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No service bundles created yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bundles.map((bundle) => (
        <div
          key={bundle.id}
          className="rounded-xl border bg-white shadow-sm hover:shadow-md transition p-5"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-lg">
              {bundle.primary_service?.name}
            </h4>

            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                bundle.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {bundle.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Arrow */}
          <div className="text-sm text-gray-400 mb-2">Bundled with</div>

          {/* Bundled Service */}
          <div className="text-base font-medium mb-4">
            {bundle.bundled_service?.name}
          </div>

          {/* Discount */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Offer</span>

            <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 font-semibold">
              {bundle.discount_type === "free"
                ? "FREE"
                : bundle.discount_type === "percentage"
                ? `${bundle.discount_value}% OFF`
                : `₹${bundle.discount_value} OFF`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceBundleOffers;
