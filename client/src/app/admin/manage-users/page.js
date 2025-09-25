// app/admin/manage-admins/page.js
"use client";

import RegisterAdminForm from "@/components/admin/RegisterAdminForm";

export default function ManageAdminsPage() {
  return (
    <main className="flex w-full bg-gray-50 p-6">
      <div className="w-full max-w-2xl bg-white p-6">
        <h2 className="text-2xl font-bold mb-6 primaryText">Register New User</h2>
        <RegisterAdminForm />
      </div>
    </main>
  );
}
