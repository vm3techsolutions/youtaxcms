"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useRouter } from "next/navigation";
import {
  uploadOrderDocuments,
  fetchOrderDocuments,
  resetOrderDocumentsState,
} from "@/store/slices/orderDocumentsSlice";
// import { fetchDocumentsByService } from "@/store/slices/serviceDocumentsSlice";
import { fetchActiveDocumentsByService } from "@/store/slices/serviceDocumentsSlice";

import axiosInstance from "@/api/axiosInstance";
import {
  fetchOrderInputs,
  submitOrderInputs,
  resetOrderInputsState,
} from "@/store/slices/orderInputsSlice";
import ServiceCustomFieldsDisplay from "./ServiceCustomFieldsDisplay";
import {
  uploadCustomerDocument,
  fetchCustomerDocumentsByOrder,
} from "@/store/slices/customerDocumentSlice";


export default function DocumentUpload() {

  //added Tabs state
  const [activeTab, setActiveTab] = useState("documents");

  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("serviceId");
  const serviceName = searchParams.get("serviceName");
  const orderId = searchParams.get("orderId");
  const [formValues, setFormValues] = useState({});

  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);
  const documents = serviceDocuments[serviceId] || [];

  const { documents: uploadedDocs, loading } = useSelector(
    (state) => state.orderDocuments
  );

  const { items: orderInputs } = useSelector((state) => state.orderInputs);

  const [newFiles, setNewFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previewPopup, setPreviewPopup] = useState(null);


  // for monthly document 

const [monthlyFile, setMonthlyFile] = useState(null);
const [docMonth, setDocMonth] = useState("");
const [docYear, setDocYear] = useState("");
const [monthlyFileName, setMonthlyFileName] = useState("");
const [monthlyUploading, setMonthlyUploading] = useState(false);

const { documents: customerDocument } = useSelector(
  (state) => state.customerDocument
);

const monthlyDocs = customerDocument?.filter(
  (d) => d.doc_month && d.doc_year
);

  useEffect(() => {
    if (!serviceId || !orderId) {
      router.push("/");
      return;
    }

    dispatch(resetOrderDocumentsState());
    // dispatch(fetchDocumentsByService(serviceId));
    dispatch(fetchActiveDocumentsByService(serviceId));
    dispatch(fetchOrderDocuments(orderId));
    dispatch(resetOrderInputsState());
    dispatch(fetchOrderInputs(orderId)); // ✅ fetch previously submitted inputs
  }, [serviceId, orderId, dispatch, router]);

  // If orderInputs exist, mark form as read-only and populate initialValues
  const initialFormValues = {};
  if (orderInputs?.length) {
    orderInputs.forEach((input) => {
      const key = `field_${input.service_input_id}`;
      initialFormValues[key] = input.selected_option ?? input.text_value ?? "";
    });
  }

  useEffect(() => {
    if (orderInputs?.length) setIsSubmitted(true);
  }, [orderInputs]);

  const handleFileChange = (docId, files) => {
    const fileList = Array.from(files);
    setNewFiles((prev) => ({ ...prev, [docId]: fileList }));

    const previewsList = fileList.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => ({ ...prev, [docId]: previewsList }));
  };

  const handleRemoveNewFile = (docId, index) => {
    setNewFiles((prev) => {
      const updated = [...(prev[docId] || [])];
      updated.splice(index, 1);
      return { ...prev, [docId]: updated };
    });

    setPreviews((prev) => {
      const updated = [...(prev[docId] || [])];
      updated.splice(index, 1);
      return { ...prev, [docId]: updated };
    });
  };

  const handleRemoveUploadedFile = async (fileId) => {
    if (!confirm("Are you sure you want to remove this file?")) return;
    await axiosInstance.delete(`/order-document/${fileId}`);
    dispatch(fetchOrderDocuments(orderId));
  };

  const openPreview = (file) => {
    setPreviewPopup({
      url: file.url || file.signed_url || file.file_url,
      name: file.name || file.file_url?.split("/").pop(),
    });
  };


  // =========================
  // Handle custom fields submit
  // =========================
  const handleCustomFieldsSubmit = async (formValues) => {
    const inputs = Object.entries(formValues).map(([key, value]) => ({
      service_input_id: parseInt(key.replace("field_", "")),
      text_value: typeof value === "string" ? value : null,
      selected_option: typeof value === "string" || Array.isArray(value) ? value : null,
    }));

    try {
      await dispatch(submitOrderInputs({ order_id: orderId, inputs })).unwrap();
      alert("Custom fields saved successfully!");
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save custom fields");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.keys(newFiles).length) return alert("Select files to upload");

    try {
      // Upload each document type
      for (const docId in newFiles) {
        await dispatch(
          uploadOrderDocuments({
            order_id: orderId,
            service_doc_id: docId,
            files: Array.from(newFiles[docId]),
          })
        ).unwrap();
      }

      alert("Documents uploaded successfully!");
      setNewFiles({});
      setPreviews({});
      dispatch(fetchOrderDocuments(orderId)); // Refresh all uploaded files
    } catch (err) {
      alert(err || "Upload failed");
    }
  };

  // For monthly document 

  const handleMonthlyUpload = async (e) => {
  e.preventDefault();

  if (!monthlyFile || !docMonth || !docYear) {
    alert("Month, year, and file are required");
    return;
  }

  try {
    setMonthlyUploading(true);
    await dispatch(
      uploadCustomerDocument({
        file: monthlyFile,
        order_id: orderId,
        doc_month: docMonth,
        doc_year: docYear,
        file_name: monthlyFileName || monthlyFile.name.split(".")[0],
      })
    ).unwrap();

    alert("Monthly document uploaded successfully");

    setMonthlyFile(null);
    setMonthlyFileName("");
    setDocMonth("");
    setDocYear("");

    // refresh list
    dispatch(fetchCustomerDocumentsByOrder(orderId));
  } catch (err) {
    alert(err || "Monthly document upload failed");
  }
};


  return (
    <div className="container bg-white px-14 py-10 max-w-4xl">

      {/* --- TABS --- */}
      <div className="flex mb-10 justify-center">
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 ${activeTab === "documents"
            ? "border-b-2 border-[#FFBF00] font-bold"
            : ""
            }`}
        >
          Upload Documents
        </button>

        <button
          onClick={() => setActiveTab("fields")}
          className={`px-4 py-2 ${activeTab === "fields"
            ? "border-b-2 border-[#FFBF00] font-bold"
            : ""
            }`}
        >
          Additional Information
        </button>

        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-4 py-2 ${activeTab === "monthly"
            ? "border-b-2 border-[#FFBF00] font-bold"
            : ""
            }`}
        >
          Monthly Documents
        </button>
      </div>

      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
        {serviceName || "Service"} - Upload Documents
      </h2>

      {documents.length === 0 && (
        <p className="text-center text-gray-500 mb-6">
          No documents required for this service.
        </p>
      )}

      {/* <form onSubmit={handleSubmit} className="space-y-6"> */}


      {activeTab === "documents" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {documents.map((doc) => {
            const uploadedFilesForDoc =
              uploadedDocs?.filter((f) => f.service_doc_id === doc.id) || [];
            const previewsForDoc = previews[doc.id] || [];

            return (
              <div
                key={doc.id}
                className="grid grid-cols-1 md:grid-cols-6 items-start gap-4 border-b pb-4"
              >
                {/* Label */}
                <div className="md:col-span-2 flex items-center font-semibold text-gray-700">
                  {doc.doc_name}{" "}
                  {doc.is_mandatory === 1 && <span className="text-red-500">*</span>}

                  {/* SAMPLE DOCUMENT (if exists) */}
                  {doc.sample_pdf_signed_url && (
                    <div className="md:col-span-4 mb-3">
                      <div className="flex items-center justify-between bg-gray-100 p-2 rounded">


                        <a
                          href={doc.sample_pdf_signed_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  )}

                </div>



                {/* Input + thumbnails */}
                <div className="md:col-span-4 flex flex-col">
                  <input
                    type="file"
                    multiple={doc.allow_multiple === 1}
                    required={doc.is_mandatory && uploadedFilesForDoc.length === 0}
                    onChange={(e) => handleFileChange(doc.id, e.target.files)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Uploaded files */}
                  {uploadedFilesForDoc.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {uploadedFilesForDoc.map((file) => {
                        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file.file_url);
                        return (
                          <div
                            key={file.id}
                            className="w-20 h-20 border rounded-lg overflow-hidden shadow-sm flex items-center justify-center relative"
                          >
                            {isImage ? (
                              <img
                                src={file.signed_url || file.file_url}
                                alt="Uploaded"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <p className="text-xs text-center p-1">
                                {file.file_url.split("/").pop()}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedFile(file.id)}
                              className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-600"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* New file previews */}
                  {previewsForDoc.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {previewsForDoc.map((url, index) => {
                        const file = newFiles[doc.id][index];
                        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file.name);
                        return (
                          <div
                            key={index}
                            className="w-20 h-20 border rounded-lg overflow-hidden shadow-sm flex items-center justify-center relative"
                          >
                            {isImage ? (
                              <img
                                src={url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onClick={() => openPreview({ url, name: file.name })}
                              />

                            ) : (
                              <p
                                className="text-xs text-center p-1 cursor-pointer underline"
                                onClick={() => openPreview({ url, name: file.name })}
                              >
                                {file.name}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveNewFile(doc.id, index)}
                              className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-600"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="text-right mt-4">
            {uploadedDocs?.some((doc) => documents.map(d => d.id).includes(doc.service_doc_id)) ? (
              <button
                type="submit"
                // onClick={() => router.push(`/order-documents?orderId=${orderId}&serviceId=${serviceId}&serviceName=${serviceName}`)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submitted Documents
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 secondaryBg text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Submit Documents"}
              </button>
            )}
          </div>

        </form>
      )}
      {/* =========================
          Custom Fields Form
      ========================= */}

      {/* Wrapped in conditional rendering */}
      {activeTab === "fields" && (
        <div className="mt-10">
          <ServiceCustomFieldsDisplay
            serviceId={serviceId}
            onSubmit={handleCustomFieldsSubmit}
            readOnly={isSubmitted}
            initialValues={initialFormValues}
          />
        </div>
      )}
      {previewPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white p-4 rounded-lg max-w-3xl w-full relative">

            <button
              onClick={() => setPreviewPopup(null)}
              className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-3 text-center">
              {previewPopup.name}
            </h3>

            {previewPopup.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={previewPopup.url}
                className="max-h-[70vh] mx-auto rounded"
              />
            ) : (
              <iframe
                src={previewPopup.url}
                className="w-full h-[70vh] rounded"
              ></iframe>
            )}
          </div>
        </div>
      )}

{/* For monthly */}
    {activeTab === "monthly" && (
  <form
    onSubmit={handleMonthlyUpload}
    className="max-w-3xl mx-auto mt-8 space-y-6"
  >
    {/* File Name */}
    <div>
      <label className="block text-md font-medium text-gray-700 mb-1">
        File Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        placeholder="Enter file name"
        value={monthlyFileName}
        onChange={(e) => setMonthlyFileName(e.target.value)}
        className="w-full border text-gray-700 placeholder:text-gray-700 text-md border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#FFBF00] focus:outline-none"
        required
      />
    </div>

    {/* Month */}
    <div>
      <label className="block text-md font-medium text-gray-700 mb-1">
        Month <span className="text-red-500">*</span>
      </label>
      <select
        value={docMonth}
        onChange={(e) => setDocMonth(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#FFBF00] focus:outline-none"
        required
      >
        <option value="">Select Month</option>
        {[
          "01", "02", "03", "04", "05", "06",
          "07", "08", "09", "10", "11", "12",
        ].map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>

    {/* Year */}
    <div>
      <label className="block text-md font-medium text-gray-700 mb-1">
        Year <span className="text-red-500">*</span>
      </label>
      <select
        value={docYear}
        onChange={(e) => setDocYear(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#FFBF00] focus:outline-none"
        required
      >
        <option value="">Select Year</option>
        {[2024, 2025, 2026].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>

    {/* Upload Document */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Document <span className="text-red-500">*</span>
      </label>

      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="w-10 h-10 mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 8v4m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
        </div>

        <input
          type="file"
          className="hidden"
          onChange={(e) => setMonthlyFile(e.target.files[0])}
          required
        />
      </label>

      {monthlyFile && (
        <p className="mt-2 text-sm text-green-600">
          Selected file: {monthlyFile.name}
        </p>
      )}
    </div>

    {/* Submit Button */}
    <div className="flex justify-end pt-6">
      <button
        type="submit"
        disabled={monthlyUploading}
        className="px-8 py-3 bg-[#FFBF00] text-black font-semibold rounded-lg hover:bg-[#e6ac00] transition disabled:opacity-60"
      >
        {monthlyUploading ? "Uploading..." : "Submit"}
      </button>
    </div>
  </form>
)}


    </div>
  );
}
