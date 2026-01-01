import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import Sidebar from "../components/sidebar";
import { useNavigate } from "react-router-dom";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const ordersPerPage = 30;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(list);
    });
    return () => unsub();
  }, []);

  // Helpers
  const getColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "accepted":
      case "in-progress":
        return "#2563EB";
      case "completed":
        return "#16A34A";
      case "canceled_by_driver":
      case "canceled_by_client":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  // --- Active orders (main zone)
  const activeOrders = orders.filter((o) =>
    ["pending", "accepted", "in-progress"].includes(o.status)
  );

  // Pagination
  const totalPages = Math.ceil(activeOrders.length / ordersPerPage);
  const startIdx = (currentPage - 1) * ordersPerPage;
  const paginated = activeOrders.slice(startIdx, startIdx + ordersPerPage);

  // --- Completed and canceled (right panel)
  const completedOrders = orders.filter((o) => o.status === "completed");
  const canceledOrders = orders.filter(
    (o) => o.status === "canceled_by_driver" || o.status === "canceled_by_client"
  );

  const displayedRightList =
    activeTab === "completed" ? completedOrders : canceledOrders;

  return (
    <div style={layout.container}>
      <Sidebar />
      <main style={layout.main}>
        {/* LEFT MAIN ZONE */}
        <h2 style={styles.title}>Orders Management</h2>

        {/* Filter & Search */}
        <div style={styles.filterBar}>
          <label style={{ fontWeight: 600 }}>Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in-progress">In Progress</option>
          </select>
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Orders table */}
        <div style={styles.tableCard}>
          <h4 style={styles.cardTitle}>Active Orders</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Sender</th>
                <th style={styles.th}>Driver</th>
                <th style={styles.th}>Created At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated
                .filter((order) =>
                  filter === "all" ? true : order.status === filter
                )
                .filter((order) =>
                  order.id.toLowerCase().includes(search.toLowerCase())
                )
                .map((order, index) => (
                  <tr
                    key={order.id}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                      transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#EEF2FF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? "#FFFFFF" : "#F9FAFB")
                    }
                  >
                    <td style={styles.td}>{order.id}</td>
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 600,
                        color: getColor(order.status),
                      }}
                    >
                      {order.status}
                    </td>
                    <td style={styles.td}>{order.senderName || "—"}</td>
                    <td style={styles.td}>{order.acceptedBy || "—"}</td>
                    <td style={styles.td}>
                      {order.createdAt?.toDate?.().toLocaleString() || "—"}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.viewBtn}
                        onClick={() =>
                          navigate(`/orderDetails/${order.id}`, {
                            state: { order },
                          })
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {activeOrders.length === 0 && (
            <p style={styles.noData}>No active orders found.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  style={{
                    ...styles.pageBtn,
                    backgroundColor:
                      currentPage === i + 1 ? "#5B21B6" : "#E5E7EB",
                    color: currentPage === i + 1 ? "#fff" : "#111827",
                  }}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* RIGHT FIXED PANEL */}
      <div style={styles.rightPanel}>
        <h3 style={styles.panelTitle}>Orders Overview</h3>

        {/* Tabs */}
        <div style={styles.tabRow}>
          {[
            { key: "completed", label: "Completed Orders", color: "#16A34A" },
            { key: "canceled", label: "Canceled Orders", color: "#DC2626" },
          ].map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tab,
                backgroundColor:
                  activeTab === tab.key ? `${tab.color}22` : "#F3F4F6",
                color: activeTab === tab.key ? tab.color : "#374151",
              }}
            >
              {tab.label}
              <span
                style={{
                  backgroundColor: tab.color,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 6,
                }}
              >
                {tab.key === "completed"
                  ? completedOrders.length
                  : canceledOrders.length}
              </span>
            </div>
          ))}
        </div>

        {/* Orders List */}
        <div style={styles.scrollList}>
          {displayedRightList.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 8 }}>
              No orders in this category.
            </p>
          ) : (
            displayedRightList.slice(0, 20).map((o) => (
              <div
                key={o.id}
                style={styles.listItem}
                onClick={() => navigate(`/orderDetails/${o.id}`, { state: { o } })}
              >
                <b style={{ fontSize: 13 }}>{o.id}</b>
                <span
                  style={{
                    fontSize: 12,
                    color: getColor(o.status),
                    fontWeight: 600,
                  }}
                >
                  {o.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Styles --- */
const styles = {
  page: {
    marginLeft: "var(--sidebar-width)",
    marginTop: "85px",
    padding: "40px",
    backgroundColor: "#F9FAFB",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
    marginRight: "380px", // leave space for right panel
  },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  filterBar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  select: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #E5E7EB",
    background: "#fff",
  },
  searchInput: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #E5E7EB",
    background: "#fff",
    width: 220,
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 12,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    backgroundColor: "#5B21B6",
    color: "#fff",
    padding: "10px",
    textAlign: "left",
    border: "1px solid #E5E7EB",
  },
  td: {
    padding: "10px",
    border: "1px solid #E5E7EB",
    fontSize: 14,
    color: "#374151",
  },
  viewBtn: {
    padding: "6px 10px",
    border: "none",
    borderRadius: 6,
    backgroundColor: "#5B21B6",
    color: "#fff",
    cursor: "pointer",
  },
  noData: { textAlign: "center", marginTop: 10, color: "#6B7280" },
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  pageBtn: {
    padding: "6px 10px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  rightPanel: {
    position: "fixed",
    right: 0,
    top: "85px",
    width: "360px",
    height: "calc(100vh - 85px)",
    backgroundColor: "#FFFFFF",
    borderLeft: "1px solid #E5E7EB",
    boxShadow: "-2px 0 6px rgba(0,0,0,0.05)",
    padding: "20px",
    overflowY: "auto",
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10,
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 6,
  },
  tabRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
  },
  scrollList: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 10px",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

// Layout object for consistent sidebar behavior
const layout = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
  },
  main: {
    flexGrow: 1,
    marginTop: "85px",
    padding: "40px",
    marginLeft: "var(--sidebar-width)",
    marginRight: "380px",
    transition: "margin-left 0.3s ease",
  },
};
