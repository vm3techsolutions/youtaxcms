"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { Bell, UserCircle } from "lucide-react";
import Image from "next/image";
import {
  logoutAdmin,
  fetchCurrentAdmin,
} from "@/store/slices/adminSlice";

export default function Topbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { currentAdmin, token } = useSelector((state) => state.admin);

  // 🔹 Fetch current admin on mount if token exists but Redux lost data
  useEffect(() => {
    if (!currentAdmin && token) {
      dispatch(fetchCurrentAdmin());
    }
  }, [currentAdmin, token, dispatch]);

  // Hide Topbar on login/signup routes
  if (pathname === "/admin/login" || pathname === "/admin/signup") {
    return null;
  }

  const handleLogout = () => {
    dispatch(logoutAdmin());
    router.push("/admin/login");
  };

  return (
    <header className="w-full bg-white shadow-lg p-4 flex items-center justify-between">
      {/* Greeting */}
      <div className="text-lg font-semibold">
        Hello,{" "}
        <span className="primaryText">
          {currentAdmin?.name || "Admin"}!
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        {/* <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <Bell size={24} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button> */}

        {/* Admin Avatar with hover dropdown */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer">
            {currentAdmin?.avatar ? (
              <Image
                src={currentAdmin.avatar}
                alt={currentAdmin.name || "Admin Avatar"}
                width={40}
                height={40}
              />
            ) : (
              <UserCircle size={40} className="text-gray-400" />
            )}
          </div>

          {/* Dropdown (shown on hover) */}
          <div className="absolute right-0 w-32 bg-white border rounded-lg shadow-md hidden group-hover:block z-50">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
