import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function FraudChart() {
  const data = [
    {
      month: "Jan",
      frauds: 40,
    },

    {
      month: "Feb",
      frauds: 65,
    },

    {
      month: "Mar",
      frauds: 52,
    },

    {
      month: "Apr",
      frauds: 81,
    },

    {
      month: "May",
      frauds: 73,
    },

    {
      month: "Jun",
      frauds: 95,
    },
  ];

  return (
    <div className="chart-container">
      <h2>Fraud Detection Trends</h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="frauds"
            stroke="#2563eb"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FraudChart;