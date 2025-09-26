"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, deleteService, updateService } from "@/store/slices/servicesSlice";
import {
  fetchDocumentsByService,
  deleteServiceDocument,
  updateServiceDocument,
} from "@/store/slices/serviceDocumentsSlice";
import { Edit, Trash2, Save, X } from "lucide-react";

export default function ServicesList() {
  const dispatch = useDispatch();
  const { services, loading: servicesLoading, error: servicesError } = useSelector((s) => s.services);
  const { serviceDocuments, loading: docsLoading, error: docsError } = useSelector((s) => s.serviceDocuments);

  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", base_price: 0, advance_price: 0, service_charges: 0, sla_days: 0 });

  const [editingDocId, setEditingDocId] = useState(null);
  const [docForm, setDocForm] = useState({ doc_name: "", doc_type: "", is_mandatory: false });

  // Fetch all services
  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Fetch documents for each service
  useEffect(() => {
    if (services.length > 0) {
      services.forEach((service) => {
        dispatch(fetchDocumentsByService(service.id));
      });
    }
  }, [services, dispatch]);

  if (servicesLoading) return <p>Loading services...</p>;
  if (servicesError) return <p className="text-red-600">{servicesError}</p>;

  const handleServiceEdit = (service) => {
    setEditingServiceId(service.id);
    setServiceForm({ ...service });
  };

  const handleServiceUpdate = (id) => {
    dispatch(updateService({ id, updates: serviceForm }));
    setEditingServiceId(null);
  };

  const handleServiceCancel = () => {
    setEditingServiceId(null);
  };

  const handleDocEdit = (serviceId, doc) => {
    setEditingDocId(doc.id);
    setDocForm({ ...doc, service_id: serviceId });
  };

  const handleDocUpdate = () => {
    const { id, service_id } = docForm;
    dispatch(updateServiceDocument({ id, data: docForm, serviceId: service_id }));
    setEditingDocId(null);
  };

  const handleDocCancel = () => {
    setEditingDocId(null);
  };

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
            <th className="border p-2 text-left">Documents</th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s, index) => (
            <tr key={s.id} className="hover:bg-gray-50 align-top">
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">
                {editingServiceId === s.id ? (
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                ) : (
                  s.name
                )}
              </td>
              <td className="border p-2">
                {editingServiceId === s.id ? (
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  />
                ) : (
                  s.description
                )}
              </td>
              <td className="border p-2">
                {editingServiceId === s.id ? (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
                    value={serviceForm.base_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, base_price: e.target.value })}
                  />
                ) : (
                  s.base_price
                )}
              </td>
              <td className="border p-2">
                {editingServiceId === s.id ? (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
                    value={serviceForm.advance_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, advance_price: e.target.value })}
                  />
                ) : (
                  s.advance_price
                )}
              </td>
              <td className="border p-2">
                {editingServiceId === s.id ? (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
                    value={serviceForm.service_charges}
                    onChange={(e) => setServiceForm({ ...serviceForm, service_charges: e.target.value })}
                  />
                ) : (
                  s.service_charges
                )}
              </td>
              <td className="border p-2">
                {editingServiceId === s.id ? (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
                    value={serviceForm.sla_days}
                    onChange={(e) => setServiceForm({ ...serviceForm, sla_days: e.target.value })}
                  />
                ) : (
                  s.sla_days
                )}
              </td>
              <td className="border p-2">
                {docsLoading ? (
                  <span className="text-gray-400">Loading documents...</span>
                ) : serviceDocuments[s.id]?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {serviceDocuments[s.id].map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between">
                        {editingDocId === doc.id ? (
                          <div className="flex flex-col gap-1">
                            <input
                              value={docForm.doc_name}
                              onChange={(e) => setDocForm({ ...docForm, doc_name: e.target.value })}
                              className="border rounded px-1 py-0.5"
                            />
                            <input
                              value={docForm.doc_type}
                              onChange={(e) => setDocForm({ ...docForm, doc_type: e.target.value })}
                              className="border rounded px-1 py-0.5"
                            />
                            <label>
                              <input
                                type="checkbox"
                                checked={docForm.is_mandatory}
                                onChange={(e) => setDocForm({ ...docForm, is_mandatory: e.target.checked })}
                              /> Mandatory
                            </label>
                            <div className="flex gap-2 mt-1">
                              <button onClick={handleDocUpdate} className="text-green-600"><Save size={16} /></button>
                              <button onClick={handleDocCancel} className="text-red-600"><X size={16} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="font-semibold">{doc.doc_name}</span> ({doc.doc_type}) {doc.is_mandatory ? "[Mandatory]" : ""}
                            <button onClick={() => handleDocEdit(s.id, doc)} className="text-blue-600 hover:text-blue-800"><Edit size={14} /></button>
                            <button onClick={() => dispatch(deleteServiceDocument({ id: doc.id, serviceId: s.id }))} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No documents</span>
                )}
              </td>
              <td className="border p-2 text-center space-x-2">
                {editingServiceId === s.id ? (
                  <>
                    <button onClick={() => handleServiceUpdate(s.id)} className="text-green-600"><Save size={18} /></button>
                    <button onClick={handleServiceCancel} className="text-red-600"><X size={18} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleServiceEdit(s)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                    <button onClick={() => dispatch(deleteService(s.id))} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {docsError && <p className="text-red-600 mt-2">{docsError}</p>}
    </div>
  );
}
