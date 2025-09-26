"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  sendOtp,
  verifyOtp,
  clearMessages,
  fetchVerificationStatus,
} from "@/store/slices/userSlice";
import { useState, useEffect } from "react";

export default function UserProfile() {
  const dispatch = useDispatch();
  const {
    userInfo,
    otpLoading,
    verifyLoading,
    successMessage,
    error,
    verificationStatus,
    loadingVerification, // optional flag to show spinner
  } = useSelector((state) => state.user);

  const [otpType, setOtpType] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);

  // Auto clear messages
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  // Fetch verification status on mount
  useEffect(() => {
    if (userInfo) {
      setIsVerifying(true);
      dispatch(fetchVerificationStatus()).finally(() => setIsVerifying(false));
    }
  }, [userInfo, dispatch]);

  if (!userInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">No user data found.</p>
      </div>
    );
  }

  const handleSendOtp = (type) => {
    setOtpType(type);
    dispatch(sendOtp(type));
  };

  const handleVerifyOtp = () => {
    if (otpType && otpCode) {
      dispatch(verifyOtp({ type: otpType, otp: otpCode }));
      setOtpCode("");
      setOtpType(null);
    }
  };

  const renderVerificationBadge = (verified, type) => {
    if (isVerifying) {
      return (
        <span className="ml-3 px-2 py-1 text-xs rounded-full font-medium bg-gray-200 text-gray-400 animate-pulse">
          Loading...
        </span>
      );
    }
    return (
      <>
        <span
          className={`ml-3 px-2 py-1 text-xs rounded-full font-medium ${
            verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {verified ? "Verified" : "Not Verified"}
        </span>
        {!verified && (
          <button
            onClick={() => handleSendOtp(type)}
            disabled={otpLoading}
            className="ml-4 text-blue-600 underline"
          >
            {otpLoading && otpType === type ? "Sending..." : "Verify"}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="max-w-3xl bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
        User Profile
      </h2>

      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-6">
        {/* Full Name */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Full Name:</h3>
          <p className="text-gray-600">{userInfo.name}</p>
        </div>

        {/* Email */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Email:</h3>
          <p className="text-gray-600">{userInfo.email}</p>
          {renderVerificationBadge(verificationStatus.email_verified, "email")}
        </div>

        {/* Phone */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Phone:</h3>
          <p className="text-gray-600">{userInfo.phone || "Not Provided"}</p>
          {renderVerificationBadge(verificationStatus.phone_verified, "phone")}
        </div>

        {/* PAN Card */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">PAN Card:</h3>
          <p className="text-gray-600">{userInfo.pancard || "Not Provided"}</p>
        </div>

        {/* Location */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Location:</h3>
          <p className="text-gray-600">{userInfo.location || "Not Provided"}</p>
        </div>

        {/* Branch */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Branch:</h3>
          <p className="text-gray-600">{userInfo.options || "Not Provided"}</p>
        </div>
      </div>

      {/* OTP Input */}
      {otpType && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            Enter OTP for {otpType}
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
              placeholder="Enter OTP"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={verifyLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {verifyLoading ? "Verifying..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
