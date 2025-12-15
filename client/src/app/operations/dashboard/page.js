

"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOperationsStats } from "@/store/slices/operationsStatsSlice";
import dynamic from "next/dynamic";

// Recharts dynamic imports (fix SSR issues)
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

// ===== CONSTANTS =====
const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];
const LABEL_SPACING = 18;

// label counters (reset before each render)
let leftIndex = 0;
let rightIndex = 0;

// ===== LABEL RENDERER =====
const renderLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
}) => {
  const RADIAN = Math.PI / 180;
  const isRightSide = Math.cos(-midAngle * RADIAN) >= 0;

  const x = isRightSide
    ? cx + outerRadius + 40
    : cx - outerRadius - 40;

  const index = isRightSide ? rightIndex++ : leftIndex++;
  const y = cy - 60 + index * LABEL_SPACING;

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      fontSize={13}
      fontWeight={600}
      textAnchor={isRightSide ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export default function OperationsDashboard() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector(
    (state) => state.operationsStats
  );

  useEffect(() => {
    dispatch(fetchOperationsStats());
  }, [dispatch]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg font-semibold text-gray-700">
          Loading operations stats...
        </p>
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
        <p className="text-gray-500">No operations stats found.</p>
      </div>
    );

  const assigned = Number(stats.assignedOrders) || 0;
  const worked = Number(stats.workedOrders) || 0;
  const pending = Number(stats.pendingPaymentOrders) || 0;
  const full = Number(stats.fullPaymentOrders) || 0;

  const chartData = [
    { name: "Assigned Orders", value: assigned },
    { name: "Worked Orders", value: worked },
    { name: "Pending Payments", value: pending },
    { name: "Full Payments", value: full },
  ];

  const total = assigned + worked + pending + full;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Operations Dashboard 🛠️
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-indigo-600">
          <h2 className="text-gray-500 text-sm font-semibold">Total Orders</h2>
          <p className="text-4xl font-bold mt-2 text-indigo-600">{total}</p>
        </div>

        {chartData.map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-md border-t-4"
            style={{ borderTopColor: COLORS[i] }}
          >
            <h2 className="text-gray-500 text-sm font-semibold">{card.name}</h2>
            <p
              className="text-4xl font-bold mt-2"
              style={{ color: COLORS[i] }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Order Breakdown
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            {/* reset label counters on each render */}
            {(() => {
              leftIndex = 0;
              rightIndex = 0;
              return null;
            })()}

            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
                fill="#8884d8"
              outerRadius={120}
              dataKey="value"
              label={renderLabel}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
