"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword, clearPasswordMessages } from "@/store/slices/passwordResetSlice";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, successMessage, error } = useSelector((state) => state.passwordReset);
  const searchParams = useSearchParams();

  const token = searchParams.get("token"); // reset link will have ?token=XYZ
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) return alert("Invalid or missing token!");
    dispatch(resetPassword({ token, newPassword }));
  };

  // clear old messages on mount
  useEffect(() => {
    return () => {
      dispatch(clearPasswordMessages());
    };
  }, [dispatch]);

  // if success → redirect to login
  useEffect(() => {
    if (successMessage) {
      setTimeout(() => {
        router.push("/user/login");
      }, 2000);
    }
  }, [successMessage, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 rounded-xl text-white font-medium ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "primaryBg hover:secondaryBg"
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 mt-3 text-center">{successMessage}</p>}
      </div>
    </div>
  );
}
