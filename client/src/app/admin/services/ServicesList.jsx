// "use client";

// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchServices } from "@/store/slices/servicesSlice";
// import {
//   fetchDocumentsByService,
//   createServiceDocument,
//   deleteServiceDocument
// } from "@/store/slices/serviceDocumentsSlice";
// import { Plus, X, Trash2, Save } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// export default function ServiceCardsBookPopup() {
//   const dispatch = useDispatch();
//   const { services, loading: servicesLoading, error: servicesError } = useSelector((s) => s.services);
//   const { serviceDocuments, loading: docsLoading, error: docsError } = useSelector((s) => s.serviceDocuments);

//   const [selectedService, setSelectedService] = useState(null);
//   const [documents, setDocuments] = useState([]);
//   const [newDoc, setNewDoc] = useState(null);

//   useEffect(() => {
//     dispatch(fetchServices());
//   }, [dispatch]);

//   useEffect(() => {
//     if (selectedService) {
//       dispatch(fetchDocumentsByService(selectedService.id));
//     }
//   }, [selectedService, dispatch]);

//   useEffect(() => {
//     if (selectedService && serviceDocuments[selectedService.id]) {
//       setDocuments(serviceDocuments[selectedService.id]);
//     }
//   }, [serviceDocuments, selectedService]);

//   const handleServiceClick = (service) => {
//     setSelectedService(service);
//     setNewDoc(null);
//   };

//   const handleAddDocument = () => {
//     setNewDoc({
//       doc_code: "",
//       doc_name: "",
//       doc_type: "other",
//       is_mandatory: true,
//       allow_multiple: false,
//       sort_order: documents.length,
//     });
//   };

//   const handleDeleteDocument = async (doc) => {
//     await dispatch(deleteServiceDocument({ id: doc.id, serviceId: selectedService.id }));
//   };

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setNewDoc({ ...newDoc, [name]: type === "checkbox" ? checked : value });
//   };

//   const handleSaveDocument = async () => {
//     if (!newDoc.doc_code.trim() || !newDoc.doc_name.trim()) {
//       alert("Document code and name are required");
//       return;
//     }

//     await dispatch(createServiceDocument({
//       service_id: selectedService.id,
//       doc_code: newDoc.doc_code,
//       doc_name: newDoc.doc_name,
//       doc_type: newDoc.doc_type,
//       is_mandatory: newDoc.is_mandatory,
//       allow_multiple: newDoc.allow_multiple,
//       sort_order: newDoc.sort_order,
//     }));

//     setNewDoc(null);
//     dispatch(fetchDocumentsByService(selectedService.id));
//   };

//   if (servicesLoading) return <p>Loading services...</p>;
//   if (servicesError) return <p className="text-red-600">{servicesError}</p>;

//   return (
//     <div className="p-6">
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {services.map((service) => (
//           <div
//             key={service.id}
//             className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-xl transition-shadow transform hover:-translate-y-1 hover:scale-105"
//             onClick={() => handleServiceClick(service)}
//           >
//             <h3 className="text-lg font-semibold mb-2 secondaryText">{service.name}</h3>
//             <p className="text-gray-500 truncate">{service.description || "No description"}</p>
//           </div>
//         ))}
//       </div>

//       <AnimatePresence>
//         {selectedService && (
//           <motion.div
//             className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <motion.div
//               className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative origin-left"
//               initial={{ rotateY: -90 }}
//               animate={{ rotateY: 0 }}
//               exit={{ rotateY: 90 }}
//               transition={{ duration: 0.6, ease: "easeInOut" }}
//             >
//               <button
//                 className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
//                 onClick={() => setSelectedService(null)}
//               >
//                 <X size={24} />
//               </button>

//               {/* Service Info */}
//               <h3 className="text-2xl font-bold mb-2">{selectedService.name}</h3>
//               <p className="text-gray-700 mb-4">{selectedService.description || "No description available"}</p>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div><span className="font-semibold">Base Price:</span> {selectedService.base_price}</div>
//                 <div><span className="font-semibold">Advance Price:</span> {selectedService.advance_price || "-"}</div>
//                 <div><span className="font-semibold">Service Charges:</span> {selectedService.service_charges || "-"}</div>
//                 <div><span className="font-semibold">SLA Days:</span> {selectedService.sla_days || "-"}</div>
//               </div>

//               {/* Documents Section */}
//               <div className="mb-4">
//                 <h4 className="font-semibold mb-2">Required Documents</h4>

//                 {docsLoading ? (
//                   <p className="text-gray-400">Loading documents...</p>
//                 ) : (
//                   <>
//                     {newDoc === null && (
//                       <>
//                         {documents.length === 0 && <p className="text-gray-500">No documents added yet.</p>}
//                         {documents.map(doc => (
//                           <div key={doc.id} className="flex justify-between items-center border rounded p-2">
//                             <span>{doc.doc_name}</span>
//                             <button onClick={() => handleDeleteDocument(doc)} className="text-red-600">
//                               <Trash2 size={18} />
//                             </button>
//                           </div>
//                         ))}
//                         <button
//                           onClick={handleAddDocument}
//                           className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 mt-2"
//                         >
//                           <Plus size={16} /> Add Document
//                         </button>
//                       </>
//                     )}

//                     {newDoc !== null && (
//                       <div className="flex flex-col gap-2 border rounded p-4 mt-2">
//                         <input
//                           type="text"
//                           name="doc_code"
//                           value={newDoc.doc_code}
//                           onChange={handleChange}
//                           placeholder="Document Code"
//                           className="border rounded p-2"
//                         />
//                         <input
//                           type="text"
//                           name="doc_name"
//                           value={newDoc.doc_name}
//                           onChange={handleChange}
//                           placeholder="Document Name"
//                           className="border rounded p-2"
//                         />
//                         <select
//                           name="doc_type"
//                           value={newDoc.doc_type}
//                           onChange={handleChange}
//                           className="border rounded p-2"
//                         >
//                           <option value="identity">Identity</option>
//                           <option value="address">Address</option>
//                           <option value="financial">Financial</option>
//                           <option value="legal">Legal</option>
//                           <option value="other">Other</option>
//                         </select>
//                         <label className="flex items-center gap-2">
//                           <input
//                             type="checkbox"
//                             name="is_mandatory"
//                             checked={newDoc.is_mandatory}
//                             onChange={handleChange}
//                           /> Mandatory
//                         </label>
//                         <label className="flex items-center gap-2">
//                           <input
//                             type="checkbox"
//                             name="allow_multiple"
//                             checked={newDoc.allow_multiple}
//                             onChange={handleChange}
//                           /> Multiple
//                         </label>
//                         <div className="flex gap-2 mt-2">
//                           <button onClick={handleSaveDocument} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 flex items-center gap-1">
//                             <Save size={16} /> Save
//                           </button>
//                           <button onClick={() => setNewDoc(null)} className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300 flex items-center gap-1">
//                             Cancel
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </>
//                 )}

//                 {docsError && <p className="text-red-600 mt-2">{docsError}</p>}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices, updateService, resetSuccess } from "@/store/slices/servicesSlice";
import {
  fetchDocumentsByService,
  createServiceDocument,
  deleteServiceDocument
} from "@/store/slices/serviceDocumentsSlice";
import { Plus, X, Trash2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ServiceCardsBookPopup() {
  const dispatch = useDispatch();
  const { services, loading: servicesLoading, error: servicesError, success } = useSelector((s) => s.services);
  const { serviceDocuments, loading: docsLoading, error: docsError } = useSelector((s) => s.serviceDocuments);

  const [selectedService, setSelectedService] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDoc, setNewDoc] = useState(null);
  const [serviceUpdates, setServiceUpdates] = useState({});

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

  useEffect(() => {
    if (success) {
      dispatch(fetchServices());
      dispatch(resetSuccess());
    }
  }, [success, dispatch]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setNewDoc(null);
    setServiceUpdates({ name: service.name, description: service.description });
  };

  const handleAddDocument = () => {
    setNewDoc({
      doc_code: "",
      doc_name: "",
      doc_type: "other",
      is_mandatory: true,
      allow_multiple: false,
      sort_order: documents.length,
    });
  };

  const handleDeleteDocument = async (doc) => {
    await dispatch(deleteServiceDocument({ id: doc.id, serviceId: selectedService.id }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewDoc({ ...newDoc, [name]: type === "checkbox" ? checked : value });
  };

  const handleSaveDocument = async () => {
    if (!newDoc.doc_code.trim() || !newDoc.doc_name.trim()) {
      alert("Document code and name are required");
      return;
    }

    await dispatch(createServiceDocument({
      service_id: selectedService.id,
      doc_code: newDoc.doc_code,
      doc_name: newDoc.doc_name,
      doc_type: newDoc.doc_type,
      is_mandatory: newDoc.is_mandatory,
      allow_multiple: newDoc.allow_multiple,
      sort_order: newDoc.sort_order,
    }));

    setNewDoc(null);
    dispatch(fetchDocumentsByService(selectedService.id));
  };

  const handleServiceUpdate = async () => {
    await dispatch(updateService({ id: selectedService.id, updates: serviceUpdates }));
    alert("Service updated successfully!");
  };

  if (servicesLoading) return <p>Loading services...</p>;
  if (servicesError) return <p className="text-red-600">{servicesError}</p>;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-xl transition-shadow transform hover:-translate-y-1 hover:scale-105"
            onClick={() => handleServiceClick(service)}
          >
            <h3 className="text-lg font-semibold mb-2 secondaryText">{service.name}</h3>
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

              {/* Service Info Editable */}
              <h3 className="text-2xl font-bold mb-2">
                <input
                  type="text"
                  value={serviceUpdates.name}
                  onChange={(e) => setServiceUpdates({ ...serviceUpdates, name: e.target.value })}
                  className="border rounded p-2 w-full text-xl font-bold"
                />
              </h3>
              <textarea
                value={serviceUpdates.description}
                onChange={(e) => setServiceUpdates({ ...serviceUpdates, description: e.target.value })}
                className="border rounded p-2 w-full mb-4"
                placeholder="Service description"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><span className="font-semibold">Base Price:</span> {selectedService.base_price}</div>
                <div><span className="font-semibold">Advance Price:</span> {selectedService.advance_price || "-"}</div>
                <div><span className="font-semibold">Service Charges:</span> {selectedService.service_charges || "-"}</div>
                <div><span className="font-semibold">SLA Days:</span> {selectedService.sla_days || "-"}</div>
              </div>

              <button
                onClick={handleServiceUpdate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
              >
                Update Service
              </button>

              {/* Documents Section */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Required Documents</h4>

                {docsLoading ? (
                  <p className="text-gray-400">Loading documents...</p>
                ) : (
                  <>
                    {newDoc === null && (
                      <>
                        {documents.length === 0 && <p className="text-gray-500">No documents added yet.</p>}
                        {documents.map(doc => (
                          <div key={doc.id} className="flex justify-between items-center border rounded p-2">
                            <span>{doc.doc_name}</span>
                            <button onClick={() => handleDeleteDocument(doc)} className="text-red-600">
                              <Trash2 size={18} />
                            </button>
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

                    {newDoc !== null && (
                      <div className="flex flex-col gap-2 border rounded p-4 mt-2">
                        <input
                          type="text"
                          name="doc_code"
                          value={newDoc.doc_code}
                          onChange={handleChange}
                          placeholder="Document Code"
                          className="border rounded p-2"
                        />
                        <input
                          type="text"
                          name="doc_name"
                          value={newDoc.doc_name}
                          onChange={handleChange}
                          placeholder="Document Name"
                          className="border rounded p-2"
                        />
                        <select
                          name="doc_type"
                          value={newDoc.doc_type}
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
                            checked={newDoc.is_mandatory}
                            onChange={handleChange}
                          /> Mandatory
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="allow_multiple"
                            checked={newDoc.allow_multiple}
                            onChange={handleChange}
                          /> Multiple
                        </label>
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleSaveDocument} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 flex items-center gap-1">
                            <Save size={16} /> Save
                          </button>
                          <button onClick={() => setNewDoc(null)} className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300 flex items-center gap-1">
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
