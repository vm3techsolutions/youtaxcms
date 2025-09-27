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
import { fetchDocumentsByService } from "@/store/slices/serviceDocumentsSlice";
import axiosInstance from "@/api/axiosInstance";

export default function DocumentUpload() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("serviceId");
  const serviceName = searchParams.get("serviceName");
  const orderId = searchParams.get("orderId");

  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);
  const documents = serviceDocuments[serviceId] || [];

  const { documents: uploadedDocs, loading } = useSelector(
    (state) => state.orderDocuments
  );

  const [newFiles, setNewFiles] = useState({});
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    if (!serviceId || !orderId) {
      router.push("/");
      return;
    }

    dispatch(resetOrderDocumentsState());
    dispatch(fetchDocumentsByService(serviceId));
    dispatch(fetchOrderDocuments(orderId));
  }, [serviceId, orderId, dispatch, router]);

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

  return (
    <div className="container bg-white px-14 py-10 max-w-4xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
        {serviceName || "Service"} - Upload Documents
      </h2>

      {documents.length === 0 && (
        <p className="text-center text-gray-500 mb-6">
          No documents required for this service.
        </p>
      )}

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
                {doc.is_mandatory && <span className="text-red-500">*</span>}
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
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <p className="text-xs text-center p-1">{file.name}</p>
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
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Submit Documents"}
          </button>
        </div>
      </form>
    </div>
  );
}
