"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUsers } from "@/store/slices/adminCustomerSlice";

const CustomersTab = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.adminCustomer);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  if (loading) return <p className="text-center text-gray-500 mt-10">Loading customers...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Customers</h2>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-400 text-white">
            <tr>
              <th className="px-6 py-3 font-medium">#</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">KYC Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.id}
                className={`border-b transition-colors duration-200 ${
                  i % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-100"
                }`}
              >
                <td className="px-6 py-4 text-gray-700">{i + 1}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">{u.phone}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      u.kyc_status === "verified"
                        ? "bg-green-100 text-green-700"
                        : u.kyc_status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.kyc_status || "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="text-center text-gray-500 py-6">No customers found.</p>
        )}
      </div>
    </div>
  );
};

export default CustomersTab;
