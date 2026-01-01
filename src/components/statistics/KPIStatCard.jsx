import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function KPIStatCard({ title, value, trend, color }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{value}</p>
        {trend && (
          <p className={`${color === "red" ? "text-red-600" : "text-green-600"} text-sm`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
