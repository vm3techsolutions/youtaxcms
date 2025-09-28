"use client";

import { useSelector } from "react-redux";
import Link from "next/link";

// ✅ Heroicons (solid)
import {
  Cog6ToothIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  IdentificationIcon,
  UserCircleIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/solid";

export default function Sidebar() {
  const { userInfo } = useSelector((state) => state.user);

  return (
    <div className="h-full bg-white flex flex-col justify-between">
      {/* Navigation */}
      <nav className="mt-6 space-y-1">
        <Link
          href="/user/services"
          className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          <span>Service</span>
        </Link>

        <Link
          href="/user/orders"
          className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          <span>Orders</span>
        </Link>

        <Link
          href="/user/payment"
          className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
        >
          <BanknotesIcon className="w-5 h-5" />
          <span>Payments</span>
        </Link>

        <Link
          href="/user/downloads"
          className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Downloads</span>
        </Link>

        <Link
          href="/user/kyc"
          className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
        >
          <IdentificationIcon className="w-5 h-5" />
          <span>KYC</span>
        </Link>

        <Link
          href="/user/profile"
          className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
        >
          <UserCircleIcon className="w-5 h-5" />
          <span>My Profile</span>
        </Link>

        <Link
          href="/user/support"
          className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
        >
          <LifebuoyIcon className="w-5 h-5" />
          <span>Support</span>
        </Link>
      </nav>

      
    </div>
  );
}
