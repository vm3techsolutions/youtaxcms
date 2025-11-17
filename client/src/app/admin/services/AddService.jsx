"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createService, resetSuccess } from "@/store/slices/servicesSlice";
import { fetchCategories } from "@/store/slices/categorySlice";

export default function AddService() {
  const dispatch = useDispatch();
  const { loading, success, error } = useSelector((s) => s.services);
  const { categories } = useSelector((s) => s.category);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    base_price: "",
    advance_price: "",
    service_charges: "",
    sla_days: "",
    requires_advance: false,
  });


  /* =====================================================
     FETCH ALL CATEGORIES ON LOAD
  =====================================================*/
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  /* =====================================================
   HANDLE INPUT CHANGES
=====================================================*/

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await dispatch(createService(form));
    if (res.meta.requestStatus === "fulfilled") {
      
      setForm({
        name: "",
        description: "",
        category_id: "",
        base_price: "",
        advance_price: "",
        service_charges: "",
        sla_days: "",
        requires_advance: false,
      });
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(resetSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="font-semibold text-lg">Service Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          placeholder="Service Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Category</option>

          {categories.length === 0 ? (
            <option disabled>Loading...</option>
          ) : (
            categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))
          )}
        </select>

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
        
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border rounded md:col-span-2"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="requires_advance"
            checked={form.requires_advance}
            onChange={handleChange}
            className="w-4 h-4"
          />
          Requires Advance Payment
        </label>
      </div>

      

        

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        {loading ? "Saving..." : "Add Service"}
      </button>

      {success && <p className="text-green-600">Service created successfully!</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
