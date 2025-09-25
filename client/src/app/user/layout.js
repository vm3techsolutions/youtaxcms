"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Sidebar from "@/components/user/Sidebar";
import Topbar from "@/components/user/Topbar";

export default function UserLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Redux state
  const { token } = useSelector((state) => state.user);

  // Pages where layout should be hidden
  const hideLayout =
    pathname === "/user/login" || pathname === "/user/register";

  // Redirect logged-in users away from login/register
  useEffect(() => {
    if ((pathname === "/user/login" || pathname === "/user/register") && token) {
      router.push("/user/dashboard");
    }
  }, [pathname, token, router]);

  if (hideLayout) {
    // For login/register → full width page
    return (
      <main className="flex min-h-screen items-center justify-center w-full bg-gray-50">{children}</main>
    );
  }

  return (
    <div className="flex flex-col  h-screen w-full">
      {/* ✅ Topbar always at the top */}
      <Topbar />

      <div className="flex flex-1 mt-4 overflow-hidden">
        {/* ✅ Sidebar on the left */}
        <aside className="w-64  shadow-md h-full">
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
