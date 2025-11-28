"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAccountsStats } from "@/store/slices/accountsStatsSlice";
import dynamic from "next/dynamic";

// Dynamic imports for Recharts (SSR fix)
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

export default function AccountsDashboard() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.accountsStats);

  useEffect(() => {
    dispatch(fetchAccountsStats());
  }, [dispatch]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg font-semibold text-gray-700">Loading accounts stats...</p>
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
        <p className="text-gray-500">No stats found.</p>
      </div>
    );

  // Ensure all values are numbers
  const assigned = Number(stats.assignedOrders) || 0;
  const worked = Number(stats.workedOrders) || 0;
  const pending = Number(stats.pendingPaymentOrders) || 0;
  const full = Number(stats.fullPaymentOrders) || 0;

  const chartData = [
    { name: "Assigned Orders", value: assigned },
    { name: "Worked Orders", value: worked },
    { name: "Pending Payment", value: pending },
    { name: "Full Payment", value: full },
  ];

  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0);
  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

  // Custom label showing value + percentage with 1 decimal to sum ~100%
  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        fontSize={13}
        fontWeight={600}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${name}:  (${(percent * 100).toFixed(1)}%)`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Accounts Dashboard 📊</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {/* Total Orders card */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border-t-4 border-indigo-600">
          <h2 className="text-gray-500 text-sm font-semibold">Total Orders</h2>
          <p className="text-4xl font-bold mt-2 text-indigo-600">{totalOrders}</p>
        </div>

        {/* Individual order cards */}
        {chartData.map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border-t-4"
            style={{ borderTopColor: COLORS[i] }}
          >
            <h2 className="text-gray-500 text-sm font-semibold">{card.name}</h2>
            <p className={`text-4xl font-bold mt-2`} style={{ color: COLORS[i] }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-2xl shadow p-4 py-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Orders Breakdown</h3>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
               fill="#8884d8"
              outerRadius={120}
              dataKey="value"
              label={renderCustomLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
