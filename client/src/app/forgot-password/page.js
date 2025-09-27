"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, clearPasswordMessages } from "@/store/slices/passwordResetSlice";

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const { loading, successMessage, error } = useSelector((state) => state.passwordReset);

  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  // clear old messages on mount
  useEffect(() => {
    return () => {
      dispatch(clearPasswordMessages());
    };
  }, [dispatch]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 mt-3 text-center">{successMessage}</p>}
      </div>
    </div>
  );
}
