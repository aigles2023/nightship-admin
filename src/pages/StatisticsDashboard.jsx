import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export default function StatisticsDashboard() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completed: 0,
    cancelled: 0,
    activeDrivers: 0,
  });

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("miles");

  //---------------------------------------------------------
  // LOAD FIRESTORE DATA
  //---------------------------------------------------------
  useEffect(() => {
    async function loadData() {
      const snap = await getDocs(collection(db, "orders"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const completed = list.filter((o) => o.status === "completed").length;
      const cancelled = list.filter((o) => o.status === "cancelled").length;

      const driversSnap = await getDocs(collection(db, "drivers"));

      setStats({
        totalDeliveries: list.length,
        completed,
        cancelled,
        activeDrivers: driversSnap.size,
      });

      setOrders(list);
    }
    loadData();
  }, []);

  //---------------------------------------------------------
  // FILTER SORTING
  //---------------------------------------------------------
  const sortedOrders = [...orders].sort((a, b) => {
    if (filter === "miles") return (b.distanceMiles || 0) - (a.distanceMiles || 0);
    if (filter === "gains") return (b.payout || 0) - (a.payout || 0);
    if (filter === "date")
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    return 0;
  });

  return (
    <div className="stats-container">

      {/* CSS DIRECTEMENT INCLUS */}
      <style>{`
        /*
         * Container for the statistics dashboard.  We position it relative to the sidebar
         * (the sidebar width is provided via the CSS variable --sidebar-width) and then
         * explicitly set its width so it expands across the remainder of the viewport.  This
         * ensures the dashboard uses the full horizontal space instead of being constrained
         * to a narrow column, as seen in the original design.  Padding on the left and
         * right is increased for breathing room on larger displays.
         */
        .stats-container {
          position: relative;
          padding: 40px 60px;
          margin-left: var(--sidebar-width, 260px);
          width: calc(100% - var(--sidebar-width, 260px));
          background: #f7f9fc;
          min-height: 100vh;
          font-family: system-ui, sans-serif;
          color: #1a1a1a;
        }

        .stats-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 35px;
        }

        .stats-header h1 {
          font-size: 36px;
          font-weight: 700;
          color: #2c3e50;
        }

        .header-actions button {
          margin-left: 10px;
        }

        .btn {
          padding: 10px 18px;
          background: #0066ff;
          border-radius: 8px;
          color: #ffffff;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .btn:hover {
          background: #0054cc;
        }

        .btn-outline {
          padding: 10px 18px;
          background: transparent;
          border: 1px solid #d1d1d1;
          border-radius: 8px;
          color: #555;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .btn-outline:hover {
          background: #f4f7fc;
          border-color: #cbd6e2;
        }

        /* KPI cards layout adjusts based on available space.  Cards will grow to fill the
         * row while respecting a reasonable minimum width.  Increasing the min width to
         * 250px gives the numbers more room and prevents overly narrow cards on wide
         * displays.
         */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .kpi-card {
          background: #ffffff;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #eff2f7;
        }

        .kpi-title {
          font-size: 16px;
          color: #666;
        }

        .kpi-value {
          font-size: 36px;
          font-weight: 700;
          margin: 8px 0;
        }

        .kpi-trend {
          font-size: 13px;
        }

        .kpi-trend.positive {
          color: #0abf4a;
        }

        .kpi-trend.negative {
          color: #e63946;
        }

        .card {
          background: #ffffff;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #eff2f7;
        }

        .card h2 {
          font-size: 20px;
          margin-bottom: 18px;
        }

        /* Shared placeholder styling for charts and maps.  Increased height on large
         * screens and softened the background colour to a light grey.
         */
        .chart-placeholder,
        .usa-map-placeholder {
          background: #f0f4fa;
          height: 260px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #777;
          font-weight: 500;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 30px;
          margin-top: 30px;
        }

        .sort-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .sort-buttons button {
          padding: 8px 14px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e0e4eb;
          color: #555;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }

        .sort-buttons button:hover {
          background: #f4f7fc;
        }

        .sort-active {
          background: #0066ff;
          color: #fff;
          border-color: #0066ff;
        }

        .top-orders-list {
          list-style: none;
          padding: 0;
          margin-top: 10px;
        }

        .top-orders-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f5f8;
          transition: background-color 0.2s ease;
        }
        .top-orders-list li:hover {
          background-color: #f9fbff;
        }

        .order-sender {
          font-weight: 600;
          color: #333;
        }

        .order-value {
          color: #0066ff;
          font-weight: 600;
        }
      `}</style>

      {/* HEADER */}
      <div className="stats-header">
        <h1>Statistics & Insights</h1>

        <div className="header-actions">
          <button className="btn-outline">Export CSV</button>
          <button className="btn">Export PDF</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Deliveries</div>
          <div className="kpi-value">{stats.totalDeliveries}</div>
          <div className="kpi-trend positive">+12%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Completed</div>
          <div className="kpi-value">{stats.completed}</div>
          <div className="kpi-trend negative">-9%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Cancelled</div>
          <div className="kpi-value">{stats.cancelled}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Active Drivers</div>
          <div className="kpi-value">{stats.activeDrivers}</div>
          <div className="kpi-trend positive">+87</div>
        </div>
      </div>

      {/* GRAPH PLACEHOLDER */}
      <div className="card">
        <h2>Daily Orders Trend</h2>
        <div className="chart-placeholder">Chart Placeholder</div>
      </div>

      {/* MAP + TOP ORDERS */}
      <div className="main-grid">
        {/* MAP */}
        <div className="card">
          <h2>Deliveries Across USA</h2>
          <div className="usa-map-placeholder">USA MAP</div>
        </div>

        {/* TOP ORDERS */}
        <div className="card">
          <h2>Top Orders</h2>

          <div className="sort-buttons">
            <button
              className={filter === "miles" ? "sort-active" : ""}
              onClick={() => setFilter("miles")}
            >
              Miles
            </button>

            <button
              className={filter === "gains" ? "sort-active" : ""}
              onClick={() => setFilter("gains")}
            >
              Gains
            </button>

            <button
              className={filter === "date" ? "sort-active" : ""}
              onClick={() => setFilter("date")}
            >
              Date
            </button>
          </div>

          <ul className="top-orders-list">
            {sortedOrders.map((o) => (
              <li key={o.id}>
                <span className="order-sender">{o.senderName || "Unknown"}</span>
                <span className="order-value">
                  {o.distanceMiles ? `${o.distanceMiles.toFixed(1)} mi` : "—"}
                </span>
              </li>
            ))}
          </ul>

        </div>
      </div>
    </div>
  );
}
