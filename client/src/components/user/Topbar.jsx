"use client";

import { useSelector } from "react-redux";
import { Bell, UserCircle } from "lucide-react"; // using lucide-react icons
import Image from "next/image";

export default function Topbar() {
  // Get user info from Redux store
  const { userInfo } = useSelector((state) => state.user);

  return (
    <header className="w-full bg-white shadow-lg p-4 flex items-center justify-between">
      {/* Left: Greeting */}
      <div className="text-lg font-semibold">
        Hello,{" "}
        <span className="primaryText">
          {userInfo?.name || "User"}!
        </span>
      </div>

      {/* Right: Notifications & User Icon */}
      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <Bell size={24} />
          {/* Notification badge */}
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Icon / Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer">
          {userInfo?.avatar ? (
            <Image
              src={userInfo.avatar}
              alt={userInfo.name}
              width={40}
              height={40}
            />
          ) : (
            <UserCircle size={40} className="text-gray-400" />
          )}
        </div>
      </div>
    </header>
  );
}
