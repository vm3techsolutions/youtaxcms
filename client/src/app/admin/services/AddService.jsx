"use client";
import { useState, useEffect  } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createService, resetSuccess } from "@/store/slices/servicesSlice";

export default function AddService() {
  const dispatch = useDispatch();
  const { loading, success, error } = useSelector((s) => s.services);

  const [form, setForm] = useState({
    name: "",
    description: "",
    base_price: "",
    advance_price: "",
    service_charges: "",
    sla_days: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createService(form));
  };

  useEffect(() => {
  if (success) {
    setForm({
      name: "",
      description: "",
      base_price: "",
      advance_price: "",
      service_charges: "",
      sla_days: "",
    });

    // reset success after a short delay
    const timer = setTimeout(() => dispatch(resetSuccess()), 2000);
    return () => clearTimeout(timer);
  }
}, [success, dispatch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <input
        type="text"
        name="name"
        placeholder="Service Name"
        value={form.name}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        name="base_price"
        placeholder="Base Price"
        value={form.base_price}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        name="advance_price"
        placeholder="Advance Price"
        value={form.advance_price}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        name="service_charges"
        placeholder="Service Charges"
        value={form.service_charges}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        name="sla_days"
        placeholder="SLA Days"
        value={form.sla_days}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Add Service"}
      </button>

      {success && <p className="text-green-600">Service created successfully!</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
