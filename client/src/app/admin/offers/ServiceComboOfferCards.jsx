"use client";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllServiceBundles,
  toggleServiceBundleStatus,
} from "@/store/slices/serviceBundleSlice";
import { fetchAllServicesWithActive } from "@/store/slices/servicesSlice";

export default function ServiceComboOfferCards() {
  const dispatch = useDispatch();

  const { bundles, loading } = useSelector((s) => s.serviceBundles);
  const { services } = useSelector((s) => s.services);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    dispatch(fetchAllServiceBundles());
    dispatch(fetchAllServicesWithActive());
  }, [dispatch]);

  /* =========================
     ID → NAME RESOLVER
  ========================= */
  const getServiceName = (id) => {
    if (!id || !services?.length) return "—";
    const service = services.find((s) => Number(s.id) === Number(id));
    return service?.name || "Service not found";
  };

  /* =========================
     GROUP BUNDLES BY PRIMARY
  ========================= */
  const groupedBundles = useMemo(() => {
    if (!bundles?.length) return [];

    const map = {};

    bundles.forEach((b) => {
      const key = b.primary_service_id;

      if (!map[key]) {
        map[key] = {
          primary_service_id: b.primary_service_id,
          items: [],
        };
      }

      map[key].items.push(b);
    });

    return Object.values(map);
  }, [bundles]);

  /* =========================
     STATES
  ========================= */
  if (loading) {
    return <p className="text-gray-500">Loading combo offers...</p>;
  }

  if (!groupedBundles.length) {
    return (
      <p className="text-gray-500 text-center py-6">
        No combo offers created yet.
      </p>
    );
  }

  const handleToggle = (bundleRow) => {
    dispatch(
      toggleServiceBundleStatus({
        id: bundleRow.id, // ✅ bundle row ID
        is_active: bundleRow.is_active ? 0 : 1,
      }),
    );
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {groupedBundles.map((group) => (
        <div
          key={group.primary_service_id}
          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-5 flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-wide text-gray-400">
              Primary Service
            </span>

            {/* <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                group.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {group.is_active ? "Active" : "Inactive"}
            </span> */}
          </div>

          {/* Primary Service */}
          <div className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
            <p className="text-base font-semibold text-indigo-700">
              {getServiceName(group.primary_service_id)}
            </p>
          </div>

          {/* Included Services */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
              Included Free Services
            </p>

            <ul className="space-y-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-2
                 border-green-100 bg-green-50"
                >
                  <span className="text-sm font-medium text-green-700">
                    {getServiceName(item.bundled_service_id)}
                  </span>

                  <button
                    onClick={() => handleToggle(item)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                      item.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {item.is_active ? "Deactivate" : "Activate"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
