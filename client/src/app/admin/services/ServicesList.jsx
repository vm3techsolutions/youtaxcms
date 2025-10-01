"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices } from "@/store/slices/servicesSlice";
import {
  fetchDocumentsByService,
  createServiceDocument,
  updateServiceDocument,
  deleteServiceDocument
} from "@/store/slices/serviceDocumentsSlice";
import { Plus, X, Trash2, Edit, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ServiceCardsBookPopup() {
  const dispatch = useDispatch();
  const { services, loading: servicesLoading, error: servicesError } = useSelector((s) => s.services);
  const { serviceDocuments, loading: docsLoading, error: docsError } = useSelector((s) => s.serviceDocuments);

  const [selectedService, setSelectedService] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  useEffect(() => {
    if (selectedService) {
      dispatch(fetchDocumentsByService(selectedService.id));
    }
  }, [selectedService, dispatch]);

  useEffect(() => {
    if (selectedService && serviceDocuments[selectedService.id]) {
      setDocuments(serviceDocuments[selectedService.id]);
    }
  }, [serviceDocuments, selectedService]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setEditingDoc(null);
  };

  const handleAddDocument = () => {
    setEditingDoc({
      id: `new-${Date.now()}`,
      doc_code: "",
      doc_name: "",
      doc_type: "other",
      is_mandatory: true,
      allow_multiple: false,
      sort_order: documents.length,
      isNew: true
    });
  };

  const handleEditDocument = (doc) => setEditingDoc(doc);

  const handleDeleteDocument = async (doc) => {
    if (doc.isNew) {
      setEditingDoc(null);
    } else {
      await dispatch(deleteServiceDocument({ id: doc.id, serviceId: selectedService.id }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingDoc({ ...editingDoc, [name]: type === "checkbox" ? checked : value });
  };

  const handleSaveDocument = async () => {
    if (!editingDoc.doc_code.trim() || !editingDoc.doc_name.trim()) {
      alert("Document code and name are required");
      return;
    }

    if (editingDoc.isNew) {
      await dispatch(createServiceDocument({
        service_id: selectedService.id,
        doc_code: editingDoc.doc_code,
        doc_name: editingDoc.doc_name,
        doc_type: editingDoc.doc_type,
        is_mandatory: editingDoc.is_mandatory,
        allow_multiple: editingDoc.allow_multiple,
        sort_order: editingDoc.sort_order,
      }));
    } else {
      await dispatch(updateServiceDocument({
        id: editingDoc.id,
        data: {
          doc_code: editingDoc.doc_code,
          doc_name: editingDoc.doc_name,
          doc_type: editingDoc.doc_type,
          is_mandatory: editingDoc.is_mandatory,
          allow_multiple: editingDoc.allow_multiple,
          sort_order: editingDoc.sort_order
        },
        serviceId: selectedService.id
      }));
    }

    setEditingDoc(null);
    dispatch(fetchDocumentsByService(selectedService.id));
  };

  if (servicesLoading) return <p>Loading services...</p>;
  if (servicesError) return <p className="text-red-600">{servicesError}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-xl transition-shadow transform hover:-translate-y-1 hover:scale-105"
            onClick={() => handleServiceClick(service)}
          >
            <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
            <p className="text-gray-500 truncate">{service.description || "No description"}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedService && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative origin-left"
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 90 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                onClick={() => setSelectedService(null)}
              >
                <X size={24} />
              </button>

              {/* Service Info */}
              <h3 className="text-2xl font-bold mb-2">{selectedService.name}</h3>
              <p className="text-gray-700 mb-4">{selectedService.description || "No description available"}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><span className="font-semibold">Base Price:</span> {selectedService.base_price}</div>
                <div><span className="font-semibold">Advance Price:</span> {selectedService.advance_price || "-"}</div>
                <div><span className="font-semibold">Service Charges:</span> {selectedService.service_charges || "-"}</div>
                <div><span className="font-semibold">SLA Days:</span> {selectedService.sla_days || "-"}</div>
              </div>

              {/* Documents Section */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Required Documents</h4>

                {docsLoading ? (
                  <p className="text-gray-400">Loading documents...</p>
                ) : (
                  <>
                    {editingDoc === null && (
                      <>
                        {documents.length === 0 && <p className="text-gray-500">No documents added yet.</p>}
                        {documents.map(doc => (
                          <div key={doc.id} className="flex justify-between items-center border rounded p-2">
                            <span>{doc.doc_name}</span>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditDocument(doc)} className="text-blue-600">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => handleDeleteDocument(doc)} className="text-red-600">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={handleAddDocument}
                          className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 mt-2"
                        >
                          <Plus size={16} /> Add Document
                        </button>
                      </>
                    )}

                    {editingDoc !== null && (
                      <div className="flex flex-col gap-2 border rounded p-4 mt-2">
                        <input
                          type="text"
                          name="doc_code"
                          value={editingDoc.doc_code}
                          onChange={handleChange}
                          placeholder="Document Code"
                          className="border rounded p-2"
                        />
                        <input
                          type="text"
                          name="doc_name"
                          value={editingDoc.doc_name}
                          onChange={handleChange}
                          placeholder="Document Name"
                          className="border rounded p-2"
                        />
                        <select
                          name="doc_type"
                          value={editingDoc.doc_type}
                          onChange={handleChange}
                          className="border rounded p-2"
                        >
                          <option value="identity">Identity</option>
                          <option value="address">Address</option>
                          <option value="financial">Financial</option>
                          <option value="legal">Legal</option>
                          <option value="other">Other</option>
                        </select>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="is_mandatory"
                            checked={editingDoc.is_mandatory}
                            onChange={handleChange}
                          /> Mandatory
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="allow_multiple"
                            checked={editingDoc.allow_multiple}
                            onChange={handleChange}
                          /> Multiple
                        </label>
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleSaveDocument} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 flex items-center gap-1">
                            <Save size={16} /> Save
                          </button>
                          <button onClick={() => setEditingDoc(null)} className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300 flex items-center gap-1">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {docsError && <p className="text-red-600 mt-2">{docsError}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
