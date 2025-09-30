"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createService, resetSuccess } from "@/store/slices/servicesSlice";
import {
  createServiceDocument,
  resetSuccess as resetDocSuccess,
} from "@/store/slices/serviceDocumentsSlice";
import { PlusIcon } from "@heroicons/react/24/solid";

export default function AddService() {
  const dispatch = useDispatch();

  const { loading: serviceLoading, success: serviceSuccess, error: serviceError } =
    useSelector((s) => s.services);
  const { loading: docLoading, success: docSuccess, error: docError } =
    useSelector((s) => s.serviceDocuments);

  const [form, setForm] = useState({
    name: "",
    description: "",
    base_price: "",
    advance_price: "",
    service_charges: "",
    sla_days: "",
  });

  const [documents, setDocuments] = useState([
    {
      doc_code: "",
      doc_name: "",
      doc_type: "other",
      is_mandatory: true,
      allow_multiple: false,
      sort_order: 0,
    },
  ]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDocumentChange = (index, e) => {
    const newDocs = [...documents];
    const { name, type, value, checked } = e.target;
    newDocs[index][name] = type === "checkbox" ? checked : value;
    setDocuments(newDocs);
  };

  const addDocument = () => {
    setDocuments([
      ...documents,
      {
        doc_code: "",
        doc_name: "",
        doc_type: "other",
        is_mandatory: true,
        allow_multiple: false,
        sort_order: documents.length,
      },
    ]);
  };

  const removeDocument = (index) => {
    const newDocs = documents.filter((_, i) => i !== index);
    newDocs.forEach((doc, idx) => (doc.sort_order = idx));
    setDocuments(newDocs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate documents
    for (const doc of documents) {
      if (!doc.doc_code.trim() || !doc.doc_name.trim()) {
        alert("All documents must have a code and a name");
        return;
      }
    }

    // Create Service
    const serviceRes = await dispatch(createService(form));
    if (serviceRes.meta.requestStatus === "fulfilled") {
      const serviceId = serviceRes.payload.id;

      // Create documents
      for (const doc of documents) {
        await dispatch(
          createServiceDocument({
            service_id: serviceId,
            doc_code: doc.doc_code,
            doc_name: doc.doc_name,
            doc_type: doc.doc_type || "other",
            is_mandatory: doc.is_mandatory ?? true,
            allow_multiple: doc.allow_multiple ?? false,
            sort_order: doc.sort_order ?? 0,
          })
        );
      }

      // Reset form
      setForm({
        name: "",
        description: "",
        base_price: "",
        advance_price: "",
        service_charges: "",
        sla_days: "",
      });
      setDocuments([
        {
          doc_code: "",
          doc_name: "",
          doc_type: "other",
          is_mandatory: true,
          allow_multiple: false,
          sort_order: 0,
        },
      ]);
    }
  };

  // Reset success flags after 3s
  useEffect(() => {
    if (serviceSuccess || docSuccess) {
      const timer = setTimeout(() => {
        dispatch(resetSuccess());
        dispatch(resetDocSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [serviceSuccess, docSuccess, dispatch]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      {/* Service Info */}
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
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border rounded md:col-span-2"
        />
      </div>

      {/* Documents Section */}
      <h2 className="font-semibold text-lg mt-4 flex items-center justify-between">
        Required Documents
        <button
          type="button"
          onClick={addDocument}
          className="relative group p-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          <PlusIcon className="w-5 h-5 text-gray-700" />
          <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Add Document
          </span>
        </button>
      </h2>

      {documents.map((doc, index) => (
        <div
          key={index}
          className="border p-4 rounded mb-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
        >
          <input
            type="text"
            name="doc_code"
            placeholder="Document Code"
            value={doc.doc_code}
            onChange={(e) => handleDocumentChange(index, e)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            name="doc_name"
            placeholder="Document Name"
            value={doc.doc_name}
            onChange={(e) => handleDocumentChange(index, e)}
            className="w-full p-2 border rounded"
            required
          />
          <select
            name="doc_type"
            value={doc.doc_type}
            onChange={(e) => handleDocumentChange(index, e)}
            className="w-full p-2 border rounded"
          >
            <option value="other">Others</option>
            <option value="pdf">Identity </option>
            <option value="image">Address </option>
            <option value="image">Financial </option>
            <option value="image">Legal </option>
            <option value="image">Others</option>
          </select>

          <div className="flex gap-4 items-center md:col-span-2">
            <label>
              <input
                type="checkbox"
                name="is_mandatory"
                checked={doc.is_mandatory}
                onChange={(e) => handleDocumentChange(index, e)}
              />{" "}
              Mandatory
            </label>
            <label>
              <input
                type="checkbox"
                name="allow_multiple"
                checked={doc.allow_multiple}
                onChange={(e) => handleDocumentChange(index, e)}
              />{" "}
              Allow Multiple
            </label>
            {documents.length > 1 && (
              <button
                type="button"
                onClick={() => removeDocument(index)}
                className="text-red-500"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={serviceLoading || docLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        {serviceLoading || docLoading ? "Saving..." : "Add Service"}
      </button>

      {(serviceSuccess || docSuccess) && (
        <p className="text-green-600">Service and documents created successfully!</p>
      )}
      {(serviceError || docError) && (
        <p className="text-red-600">{serviceError || docError}</p>
      )}
    </form>
  );
}
