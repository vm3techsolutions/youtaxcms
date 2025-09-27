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

export default function DocumentUpload() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Get query params safely
  const serviceId = searchParams.get("serviceId");
  const serviceName = searchParams.get("serviceName");
  const orderId = searchParams.get("orderId");

  // ✅ Redux state
  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);
  const documents = serviceDocuments[serviceId] || [];

  const { loadingUpload, documents: uploadedDocs } = useSelector(
    (state) => state.orderDocuments
  );

  const [uploadedFiles, setUploadedFiles] = useState({});

  // ✅ Client-only effect
  useEffect(() => {
    if (!serviceId || !orderId) {
      router.push("/"); // redirect if missing params
      return;
    }

    dispatch(resetOrderDocumentsState());
    dispatch(fetchDocumentsByService(serviceId));
    dispatch(fetchOrderDocuments(orderId));
  }, [serviceId, orderId, dispatch, router]);

  const handleFileChange = (docId, files) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.keys(uploadedFiles).length)
      return alert("Select files to upload");

    try {
      for (const docId in uploadedFiles) {
        const filesArray = Array.from(uploadedFiles[docId]);
        await dispatch(
          uploadOrderDocuments({
            order_id: orderId,
            service_doc_id: docId,
            files: filesArray,
          })
        ).unwrap();
      }

      alert("Documents uploaded successfully!");
      setUploadedFiles({});
      dispatch(fetchOrderDocuments(orderId)); // refresh uploaded files
    } catch (err) {
      alert(err || "Upload failed");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">
        {serviceName || "Service"} - Upload Documents
      </h2>

      {documents.length === 0 && (
        <p>No documents required for this service.</p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="flex flex-col">
            <label className="font-semibold mb-1">
              {doc.doc_name}
              {doc.is_mandatory ? "*" : ""}
            </label>
            <input
              type="file"
              multiple={doc.allow_multiple === 1}
              required={doc.is_mandatory}
              onChange={(e) => handleFileChange(doc.id, e.target.files)}
              placeholder={`Upload ${doc.doc_name}`}
              className="border border-gray-300 rounded px-2 py-1"
            />

            {/* Show already uploaded files */}
            {uploadedDocs?.filter((f) => f.service_doc_id === doc.id)?.length >
              0 && (
              <ul className="ml-2 text-sm text-gray-600 mt-1">
                {uploadedDocs
                  .filter((f) => f.service_doc_id === doc.id)
                  .map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.file_url.split("/").pop()}
                      </a>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}

        {documents.length > 0 && (
          <div className="col-span-2 text-right mt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded"
              disabled={loadingUpload}
            >
              {loadingUpload ? "Uploading..." : "Submit Documents"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
