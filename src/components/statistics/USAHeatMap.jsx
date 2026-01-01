import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function USAHeatMap({ orders }) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Deliveries Across USA</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-48 bg-blue-100 flex items-center justify-center rounded-lg">
          <p className="text-gray-500">MAP PLACEHOLDER</p>
        </div>
      </CardContent>
    </Card>
  );
}
