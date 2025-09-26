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

      {/* Status */}
      <KycStatus status={document?.status} remarks={document?.remarks} />

      {/* Required Documents Info */}
      <div className="bg-white shadow-md rounded-2xl p-6 border">
        <h2 className="text-lg font-semibold mb-2">Required Documents</h2>
        <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
          <li>
            Any 1 Identity Proof: <span className="font-medium">Aadhaar, PAN, Passport,
            Driving License, Voter ID</span>
          </li>
          <li>
            Any 1 Address Proof: <span className="font-medium">Aadhaar, Passport, Utility Bill,
            Bank Statement</span>
          </li>
        </ul>
      </div>

      {/* Upload Form */}
      <KycUploadForm />

      {/* Uploaded Document */}
      <KycDocumentsList document={document} />

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
