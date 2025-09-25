"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, deleteService } from "@/store/slices/servicesSlice";
import { Edit, Trash2 } from "lucide-react";

export default function ServicesList() {
  const dispatch = useDispatch();
  const { services, loading, error } = useSelector((s) => s.services);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  if (loading) return <p>Loading services...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">#</th>
            <th className="border p-2 text-left">Service Name</th>
            <th className="border p-2 text-left">Description</th>
            <th className="border p-2 text-left">Base Price</th>
            <th className="border p-2 text-left">Advance Price</th>
            <th className="border p-2 text-left">Service Charges</th>
            <th className="border p-2 text-left">SLA Days</th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s, index) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{s.name}</td>
              <td className="border p-2">{s.description}</td>
              <td className="border p-2">{s.base_price}</td>
              <td className="border p-2">{s.advance_price}</td>
              <td className="border p-2">{s.service_charges}</td>
              <td className="border p-2">{s.sla_days}</td>
              <td className="border p-2 text-center space-x-3">
                <button
                  onClick={() => alert(`Edit service ${s.id}`)} // 🔹 replace with modal/edit form
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => dispatch(deleteService(s.id))}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
