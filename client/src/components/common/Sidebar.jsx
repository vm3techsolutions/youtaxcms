"use client";

import { useSelector } from "react-redux";
import Link from "next/link";

// ✅ Heroicons (solid)
import {
  Cog6ToothIcon, // Settings
  BanknotesIcon, // Orders / Payments
  ArrowDownTrayIcon, // Downloads / Services
  IdentificationIcon, // Customers / Identity
  UserCircleIcon, // Profile / Operations
  UsersIcon, // Manage Users
  ChartBarIcon, // Reports / Analytics
  ClipboardDocumentListIcon, // Order History / Records
  BriefcaseIcon, // Deliverables / Work Items
  TagIcon, // Categories
} from "@heroicons/react/24/solid";

// 🔹 Menu configuration with distinct icons per item
const menuConfig = {
  Admin: [
    { name: "Orders", path: "/admin/orders", icon: BanknotesIcon },
    { name: "Services", path: "/admin/services", icon: ArrowDownTrayIcon },
    { name: "Categories", path: "/admin/service-categories", icon: TagIcon },
    { name: "Customers", path: "/admin/customers", icon: IdentificationIcon },
    { name: "Order History", path: "/admin/order-history", icon: ClipboardDocumentListIcon },
    { name: "Manage Users", path: "/admin/manage-users", icon: UsersIcon },
  ],

  Sale: [
    { name: "Orders", path: "/sales/orders", icon: BanknotesIcon },
    { name: "Verify KYC", path: "/sales/verify-kyc", icon: IdentificationIcon },
    { name: "Order History", path: "/sales/order-history", icon: ClipboardDocumentListIcon },
  ],

  Accounts: [
    { name: "Orders", path: "/accounts/orders", icon: BanknotesIcon },
    { name: "Order History", path: "/accounts/order-history", icon: ClipboardDocumentListIcon },
  ],

  Operation: [
    { name: "Orders", path: "/operations/orders", icon: BanknotesIcon },
    { name: "Deliverables", path: "/operations/deliverables", icon: BriefcaseIcon },
    { name: "Order History", path: "/operations/order-history", icon: ClipboardDocumentListIcon },
  ],
};

export default function Sidebar() {
  const { currentAdmin } = useSelector((state) => state.admin);
  const role = currentAdmin?.role || "Viewer"; // fallback role
  const items = menuConfig[role] || [];

  return (
    <div className="h-full bg-white flex flex-col justify-between border-r border-gray-200">
      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 rounded-md text-gray-700 transition-all"
            >
              <Icon className="w-5 h-5 text-gray-500" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
