"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/store/slices/adminSlice";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, currentAdmin } = useSelector((state) => state.admin);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ✅ Prefill saved email if "remember me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberMeAdminEmail");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Save email if remember me is checked
    if (rememberMe) {
      localStorage.setItem("rememberMeAdminEmail", formData.email);
    } else {
      localStorage.removeItem("rememberMeAdminEmail");
    }

    try {
      const resultAction = await dispatch(loginAdmin(formData));
      if (loginAdmin.fulfilled.match(resultAction)) {
        const role = resultAction.payload.admin.role; // role from backend

        switch (role) {
          case "Admin":
            router.push("/admin/dashboard");
            break;
          case "Sale":       // match DB
            router.push("/sales/dashboard");
            break;
          case "Accounts":   // match DB
            router.push("/accounts/dashboard");
            break;
          case "Operation":
            router.push("/operations/dashboard");
            break;
          default:
            router.push("/admin/dashboard");
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (currentAdmin) {
      const role = currentAdmin.role;
      switch (role) {
        case "Admin":
          router.push("/admin/dashboard");
          break;
        case "Sale":
          router.push("/sales/dashboard");
          break;
        case "Accounts":
          router.push("/accounts/dashboard");
          break;
        case "Operation":
          router.push("/operations/dashboard");
          break;
        default:
          router.push("/admin/dashboard");
      }
    }
  }, [currentAdmin, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full md:w-[600px] bg-white p-14 rounded-2xl shadow-md">
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
          Employee Login 
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Password with Eye Icon */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember Me
            </label>
            <Link
              href="/admin/forgot-password"
              className="text-blue-600 hover:text-blue-400"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Button */}
          <button
            type="submit"
            className={`w-[30%] mx-auto block p-3 rounded-xl text-white font-medium transition duration-200 ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "primaryBg hover:secondaryBg cursor-pointer"
              }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Error Messages */}
        {error && (
          <p className="text-center text-sm text-red-500 mt-4">
            {typeof error === "string" ? error : "Login failed"}
          </p>
        )}
      </div>
    </div>
  );
}
