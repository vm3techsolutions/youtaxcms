"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "@/store/slices/userSlice";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, successMessage } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pancard: "",
    location: "",
    options: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    dispatch(signupUser(formData));
  };

  useEffect(() => {
    if (successMessage) {
      setTimeout(() => {
        router.push("/user/login");
      }, 1500); // wait 1.5s before redirect
    }
  }, [successMessage, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-4xl bg-white p-14 rounded-2xl shadow-md">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/assets/logo/youtax_logo.png" alt="YouTax Logo" width={250} height={120} />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold my-6 text-center secondaryText">Register</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Mobile + PAN */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="phone"
              placeholder="Mobile No."
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="pancard"
              placeholder="PAN"
              value={formData.pancard}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location + Branch */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="options"
              value={formData.options}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Office</option>
              <option value="pune">Pune</option>
              <option value="baramati">Baramati</option>
            </select>
          </div>

          {/* Password + Confirm Password with eye toggle */}
          <div className="grid grid-cols-2 gap-4 relative">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>

          {/* Remember Me + Forgot Password */}
          {/* <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Remember Me
            </label>
            <Link href="/user/forgot-password" className="text-blue-600 hover:text-blue-400">
              Forgot Password?
            </Link>
          </div> */}

          {/* Button */}
          <button
            type="submit"
            className={`w-[20%] mx-auto block p-3 rounded-xl text-white font-medium transition duration-200 ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "primaryBg cursor-pointer"
              }`}
            disabled={loading}
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>


          {/* Already have account */}
          <p className="mt-2 text-center text-sm">
            Already have an account?{" "}
            <Link href="/user/login" className="text-blue-800 hover:text-blue-400">
              Sign In
            </Link>
          </p>
        </form>

        {/* Error & Success Messages */}
        {error && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}
        {successMessage && <p className="text-center text-sm text-green-500 mt-4">{successMessage}</p>}
      </div>
    </div>
  );
}
