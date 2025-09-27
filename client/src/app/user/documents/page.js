"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useRouter } from "next/navigation";
import {
  uploadOrderDocuments,
  fetchOrderDocuments,
  resetOrderDocumentsState,
} from "@/store/slices/orderDocumentsSlice";

export default function DocumentUpload() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const serviceName = searchParams.get("serviceName");
  const orderId = searchParams.get("orderId");

  const {
    documents,
    loadingUpload,
    loadingFetch,
    error,
    successUpload,
  } = useSelector((state) => state.orderDocuments);

  const [uploadedFiles, setUploadedFiles] = useState({});

  useEffect(() => {
    if (!serviceId || !orderId) {
      router.push("/"); // redirect if no service or order
      return;
    }

    dispatch(resetOrderDocumentsState());
    dispatch(fetchOrderDocuments(orderId)); // fetch previously uploaded docs
  }, [serviceId, orderId, dispatch, router]);

  const handleFileChange = (docId, files) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(uploadedFiles).length === 0) {
      alert("Please select files to upload.");
      return;
    }

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
      dispatch(fetchOrderDocuments(orderId)); // refresh the list after upload
      setUploadedFiles({}); // reset file inputs
    } catch (err) {
      alert(err || "Failed to upload documents");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-xl">
      <h2 className="text-2xl font-bold mb-4">{serviceName} - Upload Documents</h2>

      {loadingFetch && <p>Loading documents...</p>}
      {loadingUpload && <p>Uploading documents...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {successUpload && <p className="text-green-500">Documents uploaded successfully!</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {documents.length === 0 && !loadingFetch && <p>No documents required for this service.</p>}

        {documents.map((doc) => (
          <div key={doc.id} className="flex flex-col gap-2">
            <label className="font-semibold">
              {doc.doc_name}
              {doc.is_mandatory ? "*" : ""}
            </label>

            <input
              type="file"
              onChange={(e) => handleFileChange(doc.id, e.target.files)}
              multiple={doc.allow_multiple === 1}
              required={doc.is_mandatory}
            />

            {/* Display already uploaded files for this document */}
            {doc.files && doc.files.length > 0 && (
              <ul className="ml-2 text-sm text-gray-600">
                {doc.files.map((file) => (
                  <li key={file.id}>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                      {file.file_url.split("/").pop()}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {documents.length > 0 && (
          <button
            type="submit"
            className="px-6 py-2 primary-btn text-white rounded-lg mt-4"
            disabled={loadingUpload}
          >
            {loadingUpload ? "Uploading..." : "Submit Documents"}
          </button>
        )}
      </form>
    </div>
  );
}
