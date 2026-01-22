"use client";
import { useSelector } from "react-redux";

export default function BundledServices({ serviceId }) {
  const bundles = useSelector(
    (state) => state.serviceBundles.primaryBundles[serviceId]
  );

  const services = useSelector((state) => state.services.services);

  if (!bundles || bundles.length === 0) return null;

  const getServiceName = (id) => {
    if (!id || !services?.length) return "—";
    const service = services.find(
      (s) => Number(s.id) === Number(id)
    );
    return service?.name || "Service not found";
  };

  return (
    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-semibold text-green-800 mb-1">
        Included Free Services
      </h4>

      <p className="text-xs text-green-700 mb-3">
        Complimentary with this service
      </p>

      <ul className="space-y-2">
        {bundles.map((bundle) => (
          <li
            key={bundle.id}
            className="flex justify-between items-center text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✔</span>
              {getServiceName(bundle.bundled_service_id)}
            </span>

            <span className="font-medium text-green-700">₹0</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
