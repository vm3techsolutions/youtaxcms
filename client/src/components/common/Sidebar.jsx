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
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";

// 🔹 Menu config with icons
const menuConfig = {
  Admin: [
    // { name: "Overview", path: "/admin/dashboard", icon: Cog6ToothIcon },
    { name: "Orders", path: "/admin/orders", icon: BanknotesIcon },
    { name: "Services", path: "/admin/services", icon: ArrowDownTrayIcon },
    { name: "Customers", path: "/admin/customers", icon: IdentificationIcon },
    { name: "Manage Users", path: "/admin/manage-users", icon: UsersIcon },
  ],
  Sale: [
    // { name: "Overview", path: "/sales/dashboard", icon: Cog6ToothIcon },
    { name: "Orders", path: "/sales/orders", icon: ChartBarIcon },
    { name: "Verify KYC", path: "/sales/verify-kyc", icon: ChartBarIcon },
  ],
  Accounts: [
    // { name: "Overview", path: "/accounts/dashboard", icon: Cog6ToothIcon },
    { name: "Orders", path: "/accounts/orders", icon: ArrowDownTrayIcon },
    { name: "Payment", path: "/accounts/payment", icon: ChartBarIcon },
    { name: "Invoice", path: "/accounts/invoice", icon: ChartBarIcon },
  ],
  Operation: [
    // { name: "Overview", path: "/operations/dashboard", icon: Cog6ToothIcon },
    { name: "Orders", path: "/operations/orders", icon: UserCircleIcon },
    { name: "Deliverables", path: "/operations/deliverables", icon: UserCircleIcon },
  ],
};

export default function Sidebar() {
  const { currentAdmin } = useSelector((state) => state.admin);
  const role = currentAdmin?.role || "Viewer"; // fallback role
  const items = menuConfig[role] || [];

//   console.log("currentAdmin =>", currentAdmin);
// console.log("role =>", role);

  return (
    <div className="h-full bg-white flex flex-col justify-between border-r border-gray-200">
      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700"
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
