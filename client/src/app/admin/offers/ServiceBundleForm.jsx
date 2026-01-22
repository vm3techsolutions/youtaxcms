// src/components/admin/ServiceBundleForm.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createServiceBundle,
  clearServiceBundleState,
} from "@/store/slices/serviceBundleSlice";
import {fetchAllServicesWithActive} from "@/store/slices/servicesSlice";

const ServiceBundleForm = ({ onClose  }) => {
  const dispatch = useDispatch();

  const { services = [], loading: servicesLoading } = useSelector(
  (state) => state.services || {}
);

  const { loading, error, successMessage } = useSelector(
    (state) => state.serviceBundles
  );

  const [formData, setFormData] = useState({
    primary_service_id: "",
    bundled_service_ids: [],
    discount_type: "free",
    discount_value: 0,
  });

  /* =======================
     Fetch Services on Load
  ======================= */
 useEffect(() => {
  dispatch(fetchAllServicesWithActive());
}, [dispatch]);

  /* =======================
     Reset on Success
  ======================= */
  useEffect(() => {
    if (successMessage) {
      setFormData({
        primary_service_id: "",
        bundled_service_ids: [],
        discount_type: "free",
        discount_value: 0,
      });

     const timer = setTimeout(() => {
      dispatch(clearServiceBundleState());
      onClose(); // 👈 CLOSE MODAL
    }, 1200);

    return () => clearTimeout(timer);
  }
    
  }, [successMessage, dispatch, onClose]);

  /* ============================
     Handlers
  ============================ */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "discount_value" ? Number(value) : value,
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.primary_service_id) {
    alert("Primary service is required");
    return;
  }

  if (formData.bundled_service_ids.length === 0) {
    alert("At least one bundled service is required");
    return;
  }

  if (
    formData.bundled_service_ids.includes(
      Number(formData.primary_service_id)
    )
  ) {
    alert("Primary service cannot be included as free");
    return;
  }

  for (const bundledId of formData.bundled_service_ids) {
    await dispatch(
      createServiceBundle({
        primary_service_id: Number(formData.primary_service_id),
        bundled_service_id: bundledId, // ✅ SINGLE ID
        discount_type: "free",
        discount_value: 0,
      })
    );
  }
};


  /* ============================
     Reset on success
  ============================ */

  // useEffect(() => {
  //   if (successMessage) {
  //     setFormData({
  //       primary_service_id: "",
  //       bundled_service_ids: [],
  //       discount_type: "free",
  //       discount_value: 0,
  //     });

  //     const timer = setTimeout(() => {
  //       dispatch(clearServiceBundleState());
  //     }, 2000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [successMessage, dispatch]);

  /* ============================
     UI
  ============================ */

  return (
     <div>
      <h3 className="text-xl font-semibold mb-4">
        Create Service Bundle
      </h3>

      {error && <p className="text-red-500">{error}</p>}
      {successMessage && (
        <p className="text-green-600">{successMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Primary Service */}
        <div>
          <label className="block mb-1">Primary Service</label>
          <select
            name="primary_service_id"
            value={formData.primary_service_id}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            disabled={servicesLoading}
          >
            <option value="">Select Primary Service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bundled Service */}
        {/* Bundled Services */}
<div>
  <label className="block mb-1 font-medium">
    Included FREE Services
  </label>

  <select
    onChange={(e) => {
      const id = Number(e.target.value);
      if (!id) return;

      if (!formData.bundled_service_ids.includes(id)) {
        setFormData((prev) => ({
          ...prev,
          bundled_service_ids: [...prev.bundled_service_ids, id],
        }));
      }
    }}
    className="w-full border p-2 rounded"
    disabled={servicesLoading}
  >
    <option value="">Add free service</option>

    {services
      .filter(
        (s) =>
          Number(s.id) !== Number(formData.primary_service_id)
      )
      .map((service) => (
        <option key={service.id} value={service.id}>
          {service.name}
        </option>
      ))}
  </select>

  {/* Selected Services */}
  {formData.bundled_service_ids.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-3">
      {formData.bundled_service_ids.map((id) => {
        const service = services.find(
          (s) => Number(s.id) === Number(id)
        );

        return (
          <span
            key={id}
            className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
          >
            ✓ {service?.name}

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  bundled_service_ids: prev.bundled_service_ids.filter(
                    (sid) => sid !== id
                  ),
                }))
              }
              className="text-green-700 hover:text-red-600 font-bold"
            >
              ×
            </button>
          </span>
        );
      })}
    </div>
  )}
</div>


        {/* Discount Type */}
        <div>
          <label className="block mb-1">Discount Type</label>
          <select
            name="discount_type"
            value={formData.discount_type}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="free">Free</option>
            {/* <option value="percentage">Percentage</option>
            <option value="flat">Flat</option> */}
          </select>
        </div>

        {/* Discount Value */}
        {formData.discount_type !== "free" && (
          <div>
            <label className="block mb-1">
              Discount Value
            </label>
            <input
              type="number"
              name="discount_value"
              value={formData.discount_value}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              min="0"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="primary-btn text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Creating..." : "Create Bundle"}
        </button>
      </form>
    </div>
  );
};

export default ServiceBundleForm;
