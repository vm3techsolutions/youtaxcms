"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  sendOtp,
  verifyOtp,
  clearMessages,
  fetchVerificationStatus,
} from "@/store/slices/userSlice";
import { useState, useEffect } from "react";
import { resetPassword, clearPasswordMessages } from "@/store/slices/passwordResetSlice"; // new slice

export default function UserProfile() {
  const dispatch = useDispatch();
  const {
    userInfo,
    otpLoading,
    verifyLoading,
    successMessage,
    error,
    verificationStatus,
  } = useSelector((state) => state.user);

  const { loading: passwordLoading, successMessage: passwordSuccess, error: passwordError } =
    useSelector((state) => state.passwordReset);

  const [otpType, setOtpType] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pancard: "",
    location: "",
    options: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // Clear messages
  useEffect(() => {
    if (successMessage || error || passwordSuccess || passwordError) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
        dispatch(clearPasswordMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, passwordSuccess, passwordError, dispatch]);

  // Fetch verification + pre-fill data
  useEffect(() => {
    if (userInfo) {
      setIsVerifying(true);
      dispatch(fetchVerificationStatus()).finally(() => setIsVerifying(false));

      setFormData({
        name: userInfo.name || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        pancard: userInfo.pancard || "",
        location: userInfo.location || "",
        options: userInfo.options || "",
      });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Updated Profile Data:", formData);
    // dispatch(updateUserProfile(formData))
  };

  const handleUpdatePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) return;
    // Call resetPassword action from slice
    dispatch(resetPassword({ token: "userTokenHere", newPassword: passwordData.newPassword }));
    setPasswordData({ currentPassword: "", newPassword: "" });
  };

  return (
    <div className="max-w-6xl bg-white p-8 rounded-xl shadow-lg border border-gray-100 mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">My Profile</h2>

      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {passwordSuccess && <p className="text-green-600 mb-4">{passwordSuccess}</p>}
      {passwordError && <p className="text-red-600 mb-4">{passwordError}</p>}

      {/* Profile fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-gray-700 font-semibold">Full Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 font-semibold">Email:</label>
          <div className="flex items-center">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="flex-1 border rounded px-3 py-2 mt-1"
            />
            {renderVerificationBadge(verificationStatus.email_verified, "email")}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-gray-700 font-semibold">Phone:</label>
          <div className="flex items-center">
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="flex-1 border rounded px-3 py-2 mt-1"
              placeholder="Enter phone number"
            />
            {renderVerificationBadge(verificationStatus.phone_verified, "phone")}
          </div>
        </div>

        {/* PAN Card */}
        <div>
          <label className="block text-gray-700 font-semibold">PAN Card:</label>
          <input
            type="text"
            name="pancard"
            value={formData.pancard}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-gray-700 font-semibold">Location:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-gray-700 font-semibold">Branch:</label>
          <input
            type="text"
            name="options"
            value={formData.options}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
      </div>

      {/* Save Profile Button */}
      <div className="mt-6 text-right">
        <button
          onClick={handleSave}
          className="primary-btn text-white px-6 py-2 rounded"
        >
          Save Changes
        </button>
      </div>

      {/* Set New Password Section */}
      {/* <div className="pt-6">
        <h3 className="text-2xl font-semibold mb-4 pb-4 border-b">Set New Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-semibold">Current Password:</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">New Password:</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleUpdatePassword}
            disabled={passwordLoading}
            className="primary-btn text-white px-6 py-2 rounded"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div> */}

      {/* OTP Input */}
      {otpType && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Enter OTP for {otpType}</h4>
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
