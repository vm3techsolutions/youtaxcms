"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerStats } from "@/store/slices/customerStatsSlice";
import dynamic from "next/dynamic";

// ✅ Dynamic import for Recharts (avoids Next.js SSR issues)
const PieChart = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { loading, stats, error } = useSelector((state) => state.customerStats);

  useEffect(() => {
    dispatch(fetchCustomerStats());
  }, [dispatch]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg font-semibold text-gray-700">Loading analytics...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );

  if (!stats)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-500">No statistics available yet.</p>
      </div>
    );

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];
  const chartData = [
    { name: "Completed", value: stats.completedOrders },
    { name: "In Progress", value: stats.inProgressOrders },
    { name: "Pending Payment", value: stats.pendingPayments },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Welcome Back 👋
      </h1>

      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Orders", value: stats.totalOrders, color: "text-blue-600" },
          { label: "Completed", value: stats.completedOrders, color: "text-green-600" },
          { label: "In Progress", value: stats.inProgressOrders, color: "text-yellow-500" },
          { label: "Pending Payment", value: stats.pendingPayments, color: "text-red-500" },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border-t-4"
            style={{ borderTopColor: COLORS[idx] }}
          >
            <h2 className="text-gray-500 text-sm font-semibold">{card.label}</h2>
            <p className={`text-4xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* 🔹 Analytics Section */}
      <div className="bg-white rounded-2xl shadow p-8 flex flex-col lg:flex-row items-center">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            Order Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🔹 Progress Bars */}
        <div className="flex-1 mt-8 lg:mt-0 lg:ml-8 space-y-6 w-full">
          {chartData.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-2 text-gray-700 font-semibold">
                <span>{item.name}</span>
                <span>{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${(item.value / stats.totalOrders) * 100 || 0}%`,
                    backgroundColor: COLORS[idx],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
