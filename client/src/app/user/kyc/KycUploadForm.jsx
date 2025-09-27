"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadKycDocument, clearKycMessages, fetchMyKycDocument } from "@/store/slices/kycSlice";

export default function KycUploadForm() {
  const dispatch = useDispatch();
  const { loadingUpload, document, successMessage, error } = useSelector((state) => state.kyc);

  const [docType, setDocType] = useState("aadhaar");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);

  // Fetch existing KYC document on mount
  useEffect(() => {
    dispatch(fetchMyKycDocument());
  }, [dispatch]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => dispatch(clearKycMessages()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("remarks", remarks);
    formData.append("document", file);

    dispatch(uploadKycDocument(formData));
  };

  return (
    <div className="max-w-md mx-auto">
      {successMessage && <p className="text-green-600 mb-2">{successMessage}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-2xl p-6 space-y-4 border">
        <h2 className="text-lg font-semibold">Upload Document</h2>

        <label className="block">
          <span className="text-sm text-gray-600">Document Type</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2"
          >
            <option value="aadhaar">Aadhaar Card</option>
            <option value="pan">PAN Card</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
            <option value="voter_id">Voter ID</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">Remarks (optional)</span>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">Upload File</span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1 w-full"
          />
        </label>

        <button
          type="submit"
          disabled={loadingUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {loadingUpload ? "Uploading..." : "Submit"}
        </button>

        {document?.signed_url && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-700">Uploaded Document:</h3>
            <a
              href={document.signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              View Document
            </a>
          </div>
        )}

      </form>
    </div>
  );
}
