"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesStats } from "@/store/slices/salesStatsSlice";
import dynamic from "next/dynamic";

// Recharts dynamic imports (Fix SSR)
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

export default function SalesDashboard() {
  const dispatch = useDispatch();
  const { loading, stats, error } = useSelector((state) => state.salesStats);

  useEffect(() => {
    dispatch(fetchSalesStats());
  }, [dispatch]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg font-semibold text-gray-700">Loading sales analytics...</p>
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
        <p className="text-gray-500">No sales stats found.</p>
      </div>
    );

  // COLORS
  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  // SALES CHART DATA
  const chartData = [
    { name: "Completed", value: stats.completedOrders },
    { name: "In Progress", value: stats.inProgressOrders },
    { name: "Pending Payment", value: stats.pendingPaymentOrders },
    { name: "Awaiting Docs", value: stats.awaitingDocsOrders },
    { name: "Awaiting Payment", value: stats.awaitingPaymentOrders },
    { name: "Under Review", value: stats.underReviewOrders },
  ];

  // Custom labels
  const renderCustomLabel = ({
    cx, cy, midAngle, outerRadius, percent, name, value, index
  }) => {
    const RADIAN = Math.PI / 180;
    let radius = outerRadius + 30;
    let x = cx + radius * Math.cos(-midAngle * RADIAN);
    let y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        fontSize={12}
        fontWeight={600}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${name} (${(percent * 100).toFixed(1)}%)`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Sales Dashboard 📈
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Orders", value: stats.totalOrders, color: "text-blue-600" },
          { label: "Total Customers", value: stats.totalCustomers, color: "text-green-600" },
          { label: "Active Services", value: stats.activeServices, color: "text-purple-600" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border-t-4"
            style={{ borderTopColor: COLORS[i] }}
          >
            <h2 className="text-gray-500 text-sm font-semibold">{card.label}</h2>
            <p className={`text-4xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Progress bars */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col lg:flex-row items-center">

        {/* PIE CHART */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            Sales Order Breakdown
          </h3>

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

        {/* PROGRESS BARS */}
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
