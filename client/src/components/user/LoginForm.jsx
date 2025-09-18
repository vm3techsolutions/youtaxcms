"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/store/slices/userSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, successMessage, token } = useSelector(
    (state) => state.user
  );

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);

  // ✅ Prefill credentials if saved in localStorage
  useEffect(() => {
    const savedCredentials = localStorage.getItem("rememberMe");
    if (savedCredentials) {
      const { email, password } = JSON.parse(savedCredentials);
      setCredentials({ email, password });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rememberMe) {
      localStorage.setItem("rememberMe", JSON.stringify(credentials));
    } else {
      localStorage.removeItem("rememberMe");
    }

    dispatch(loginUser(credentials));
  };

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (token) {
      router.push("/user/dashboard");
    }
  }, [token, router]);

  // ✅ Redirect after successful login
  useEffect(() => {
    if (successMessage) {
      router.push("/user/dashboard");
    }
  }, [successMessage, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-4xl bg-white p-14 rounded-2xl shadow-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/assets/logo/youtax_logo.png"
            alt="YouTax Logo"
            width={250}
            height={120}
          />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold my-6 text-center secondaryText">
          Sign In
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={credentials.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMe}
              />
              Remember Me
            </label>
            <Link
              href="/user/forgot-password"
              className="text-blue-600 hover:text-blue-400"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Button */}
          <button
            type="submit"
            className={`w-[20%] mx-auto block p-3 rounded-xl text-white font-medium transition duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "primaryBg hover:secondaryBg cursor-pointer"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>

          {/* New user? Register */}
          <p className="mt-2 text-center text-sm">
            Don’t have an account?{" "}
            <Link
              href="/user/register"
              className="text-blue-800 hover:text-blue-400"
            >
              Sign Up
            </Link>
          </p>
        </form>

        {/* Error & Success Messages */}
        {error && (
          <p className="text-center text-sm text-red-500 mt-4">{error}</p>
        )}
        {successMessage && (
          <p className="text-center text-sm text-green-500 mt-4">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
}
