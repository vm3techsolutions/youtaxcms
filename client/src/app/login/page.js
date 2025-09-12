"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/store/slices/authSlice";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading, error } = useSelector((state) => state.auth);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  // Redirect when user state updates
  useEffect(() => {
    if (user) {
      // Redirect based on role
      switch (user.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "sales":
          router.push("/sales/dashboard");
          break;
        case "account":
          router.push("/account/dashboard");
          break;
        case "operation":
          router.push("/operation/dashboard");
          break;
        case "customer":
          router.push("/customer/dashboard");
          break;
        default:
          router.push("/login"); // fallback route
      }
    }
  }, [user, router]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} placeholder="Email" />
      <input {...register("password")} placeholder="Password" type="password" />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
