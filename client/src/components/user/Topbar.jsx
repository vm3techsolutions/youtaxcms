"use client";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Bell, UserCircle } from "lucide-react";
import Image from "next/image";
import { logout } from "@/store/slices/userSlice";

export default function Topbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { userInfo } = useSelector((state) => state.user);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/user/login"); // redirect after logout
  };

  return (
    <header className="w-full bg-white shadow-lg p-4 flex items-center justify-between">
      {/* Greeting */}
      <div className="text-lg font-semibold">
        Hello, <span className="primaryText">{userInfo?.name || "User"}!</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        {/* <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <Bell size={24} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button> */}

        {/* User Avatar with hover dropdown */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer">
            {userInfo?.avatar ? (
              <Image
                src={userInfo.avatar}
                alt={userInfo.name || "User Avatar"}
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
              className="w-full px-4 py-2 text-left text-sm "
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
