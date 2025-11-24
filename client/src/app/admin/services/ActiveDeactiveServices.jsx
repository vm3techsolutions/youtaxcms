"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchServices,
  toggleServiceStatus
} from "@/store/slices/servicesSlice";

export default function ActiveDeactivateServices() {
  const dispatch = useDispatch();
  const { services, loading } = useSelector((s) => s.services);

  // Load all services including inactive
  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const handleActivate = (service) => {
    dispatch(toggleServiceStatus({ id: service.id, is_active: true }));
  };

  const handleDeactivate = (service) => {
    dispatch(toggleServiceStatus({ id: service.id, is_active: false }));
  };

  if (loading) return <p className="p-4">Loading services...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Service Activation Settings
      </h2>

      <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 font-medium">Service No.</th>
            <th className="p-3 font-medium">Service Name</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Enable / Disable</th>
          </tr>
        </thead>

        <tbody>
          {services.map((service, index) => (
            <tr key={service.id} className=" hover:bg-gray-50">

              <td className="pl-10">{index + 1}</td>
              <td className="p-3 secondaryText">{service.name}</td>

              <td className="p-3">
                <span
                  className={`px-3 py-1 rounded text-white ${service.is_active ? "bg-green-600 primary-btn" : "bg-red-600"
                    }`}
                >
                  {service.is_active ? "Active" : "Inactive"}
                </span>
              </td>

              {/* <td className="p-3 flex gap-3">
                <button onClick={() => handleActivate(service)}>Enable</button>
                <button onClick={() => handleDeactivate(service)}>Disable</button>
              </td> */}
              <td className="p-3 flex gap-3">

                {/* ENABLE */}
                <button
                  onClick={() => handleActivate(service)}
                  disabled={service.is_active === true}
                  className={`
      px-4 py-1 rounded text-white transition
      ${service.is_active === 1
                      ? "bg-gray-400 cursor-not-allowed opacity-50 "
                      : "bg-green-600 hover:bg-green-700 "
                    }
    `}
                >
                  Enable
                </button>


                {/* DISABLE */}
                <button
                  onClick={() => handleDeactivate(service)}
                  disabled={service.is_active === false}
                  className={`
      px-4 py-1 rounded text-white transition
      ${service.is_active === 0
                      ? "bg-gray-400 cursor-not-allowed opacity-50 "
                      : "bg-red-600 hover:bg-red-700  "
                    }
    `}
                >
                  Disable
                </button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
