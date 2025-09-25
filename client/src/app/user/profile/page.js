"use client";

import { useSelector } from "react-redux";

export default function UserProfile() {
  const user = useSelector((state) => state.user.userInfo);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">No user data found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-10 border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
        User Profile
      </h2>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Full Name:</h3>
          <p className="text-gray-600">{user.name}</p>
        </div>

        {/* Email with verification */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Email:</h3>
          <p className="text-gray-600">{user.email}</p>
          <span
            className={`ml-3 px-2 py-1 text-xs rounded-full font-medium ${
              user.isEmailVerified
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {user.isEmailVerified ? "Verified" : "Not Verified"}
          </span>
        </div>

        {/* Phone with verification */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Phone Number:</h3>
          <p className="text-gray-600">
            {user.phone || "Not Provided"}
          </p>
          <span
            className={`ml-3 px-2 py-1 text-xs rounded-full font-medium ${
              user.isPhoneVerified
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {user.isPhoneVerified ? "Verified" : "Not Verified"}
          </span>
        </div>

        {/* PAN Card */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">PAN Card:</h3>
          <p className="text-gray-600">{user.pancard || "Not Provided"}</p>
        </div>

        {/* Location */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Location:</h3>
          <p className="text-gray-600">{user.location || "Not Provided"}</p>
        </div>

        {/* Branch */}
        <div className="flex items-center">
          <h3 className="w-40 font-semibold text-gray-700">Branch:</h3>
          <p className="text-gray-600">{user.options || "Not Provided"}</p>
        </div>
      </div>
    </div>
  );
}
