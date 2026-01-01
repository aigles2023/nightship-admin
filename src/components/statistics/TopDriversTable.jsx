import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TopDriversTable({ orders, filter, onFilterChange }) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Top Orders (Sort)</CardTitle>
      </CardHeader>

      <CardContent>
        {/* FILTER BUTTONS */}
        <div className="flex space-x-3 mb-4">
          <button
            className={`px-3 py-1 rounded ${filter === "miles" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => onFilterChange("miles")}
          >
            Miles
          </button>

          <button
            className={`px-3 py-1 rounded ${filter === "gains" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => onFilterChange("gains")}
          >
            Gains
          </button>

          <button
            className={`px-3 py-1 rounded ${filter === "date" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => onFilterChange("date")}
          >
            Date
          </button>
        </div>

        {/* RENDERED ORDERS */}
        <ul className="space-y-3">
          {orders.slice(0, 5).map((o) => (
            <li key={o.id} className="flex justify-between text-sm">
              <span>{o.senderName || "Unknown"}</span>

              <span className="font-bold">
                {filter === "miles" && `${o.distanceMiles?.toFixed(1)} mi`}
                {filter === "gains" && `$${o.payout?.toFixed(2)}`}
                {filter === "date" &&
                  new Date(o.createdAt?.seconds * 1000).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
