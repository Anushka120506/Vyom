import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

function FraudChart({ trendData = [] }) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const formattedData = trendData.map((item) => {
    const monthIndex = item._id.month - 1;
    return {
      month: `${monthNames[monthIndex]} '${item._id.year.toString().slice(-2)}`,
      Alarms: item.count,
      "Avg Risk": Math.round(item.avgScore || 0),
    };
  });

  const chartData =
    formattedData.length > 0
      ? formattedData
      : [
          { month: "No Logs", Alarms: 0, "Avg Risk": 0 },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="chart-container"
    >
      <h2>Monthly Threat Activity Trend</h2>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Alarms"
            stroke="#ef4444"
            strokeWidth={3}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="Avg Risk"
            stroke="#3b82f6"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default FraudChart;