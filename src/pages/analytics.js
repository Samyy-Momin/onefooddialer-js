import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/Navbar";

const COLORS = ["#4ade80", "#60a5fa", "#facc15"];

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/data/analytics.json")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) return <p className="p-8">Loading analytics...</p>;

  return (
    <>
      <Navbar />
      <main className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Orders Line Chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">Orders Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.orders}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4ade80"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Plan Bar Chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">Revenue by Plan</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.revenueByPlan}>
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customers by Plan Pie Chart */}
          <div className="bg-white p-4 rounded-xl shadow col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-2">
              Customer Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.customersByPlan}
                  dataKey="customers"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.customersByPlan.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </>
  );
}
