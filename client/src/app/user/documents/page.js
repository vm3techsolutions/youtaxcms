"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useRouter } from "next/navigation";
import { uploadOrderDocuments, fetchOrderDocuments, resetOrderDocumentsState } from "@/store/slices/orderDocumentsSlice";

export default function DocumentUpload() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const serviceName = searchParams.get("serviceName");
  const orderId = searchParams.get("orderId"); // Pass orderId in URL

  const { documents, loading, error, success } = useSelector((state) => state.orderDocuments);
  const [uploadedFiles, setUploadedFiles] = useState({});

  useEffect(() => {
    if (!serviceId || !orderId) {
      router.push("/"); // redirect if no service or order
      return;
    }
    dispatch(resetOrderDocumentsState());
    dispatch(fetchOrderDocuments(orderId)); // fetch previously uploaded docs if needed
  }, [serviceId, orderId, dispatch]);

  const handleFileChange = (docId, files) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      for (const docId in uploadedFiles) {
        const filesArray = Array.from(uploadedFiles[docId]); // support multiple files
        await dispatch(uploadOrderDocuments({ order_id: orderId, service_doc_id: docId, files: filesArray })).unwrap();
      }
      alert("Documents uploaded successfully!");
      // router.push("/"); // redirect after upload
    } catch (err) {
      alert(err || "Failed to upload documents");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-xl">
      <h2 className="text-2xl font-bold mb-4">{serviceName} - Upload Documents</h2>

      {loading && <p>Uploading documents...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {documents.length === 0 && <p>No documents required for this service.</p>}

        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-4">
            <label className="w-40 font-semibold">{doc.doc_name}{doc.is_mandatory ? "*" : ""}</label>
            <input
              type="file"
              onChange={(e) => handleFileChange(doc.id, e.target.files)}
              multiple={doc.allow_multiple === 1} // allow multiple files if backend allows
              required={doc.is_mandatory}
            />
          </div>
        ))}

        {documents.length > 0 && (
          <button type="submit" className="px-6 py-2 primary-btn text-white rounded-lg mt-4">
            Submit Documents
          </button>
        )}
      </form>
    </div>
  );
}
