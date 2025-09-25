"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Sidebar from "@/components/common/Sidebar";
import Topbar from "@/components/common/Topbar";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Admin slice instead of user slice
  const { token } = useSelector((state) => state.admin);

  // ✅ Pages where we don't want Topbar/Sidebar
  const hideLayout =
    pathname === "/admin/login" || pathname === "/admin/register";

  // ✅ If already logged in → redirect away from login/register
  useEffect(() => {
    if (hideLayout && token) {
      router.push("/admin/dashboard");
    }
  }, [pathname, token, router]);

  if (hideLayout) {
    return (
      <main className="flex min-h-screen items-center justify-center w-full bg-gray-50">
          {children}
      </main>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full">
      {/* ✅ Topbar always at the top */}
      <Topbar />

      <div className="flex flex-1 mt-4 overflow-hidden">
        {/* ✅ Sidebar on the left */}
        <aside className="w-64 shadow-md h-full">
          <Sidebar />
        </aside>

        {/* ✅ Main content on the right */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
