import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LineTrendChart({ orders }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const trend = days.map((day, i) => ({
    day,
    completed: orders.filter((o) => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt.seconds * 1000);
      return d.getDay() === (i + 1);
    }).length,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={trend}>
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}
