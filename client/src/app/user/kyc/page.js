"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyKycDocument } from "@/store/slices/kycSlice";
import KycStatus from "./KycStatus";
import KycUploadForm from "./KycUploadForm";
import KycDocumentsList from "./KycDocumentsList";

export default function KycPage() {
  const dispatch = useDispatch();
  const { document, loading, error } = useSelector((state) => state.kyc);

  useEffect(() => {
    dispatch(fetchMyKycDocument());
  }, [dispatch]);

  // normalize error (stringify objects safely)
  const errorMessage =
    error && (typeof error === "string" ? error : error.message || JSON.stringify(error));

  return (
    <div className="max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">KYC Verification</h1>

      {/* Uploaded Document */}
      <KycDocumentsList document={document} />

      {/* Upload Form */}
      <KycUploadForm />

      

      {/* Feedback */}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {errorMessage && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
}
