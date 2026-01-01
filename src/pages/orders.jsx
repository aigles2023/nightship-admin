import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
      },
      (error) => {
        console.error("Erreur lors de la récupération des commandes :", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      filter === "all" ? true : order.status === filter;
    const matchesSearch = order.id
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Fonction couleur selon statut
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B"; // orange
      case "accepted":
      case "in-progress":
        return "#2563EB"; // bleu
      case "completed":
        return "#16A34A"; // vert
      case "canceled_by_driver":
      case "canceled_by_client":
        return "#DC2626"; // rouge
      default:
        return "#6B7280"; // gris
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>All Orders</h1>

          {/* Filtres et recherche */}
          <div style={styles.filterWrapper}>
            <label style={{ marginRight: 8 }}>📦 Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled_by_driver">Canceled by Driver</option>
              <option value="canceled_by_client">Canceled by Client</option>
            </select>

            {/* Recherche par ID */}
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </header>

        {/* Tableau principal */}
        <div style={styles.tableCard}>
          <h4 style={styles.cardTitle}>Orders List</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Driver</th>
                <th style={styles.th}>Delivery Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <tr
                  key={order.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                    transition: "background-color 0.3s ease",
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
                      color: getStatusColor(order.status),
                    }}
                  >
                    {order.status}
                  </td>
                  <td style={styles.td}>{order.senderName || "—"}</td>
                  <td style={styles.td}>{order.acceptedBy || "Unassigned"}</td>
                  <td style={styles.td}>
                    {order.deliveryDate?.toDate?.().toLocaleString() || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <p style={styles.noData}>No orders found for this filter.</p>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---- Styles modernes et unifiés ---- */
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
  },
  main: {
    flexGrow: 1,
    padding: "30px 40px",
    overflowY: "auto",
    marginLeft: "var(--sidebar-width)",
    transition: "margin-left 0.3s ease",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#5B21B6", // violet comme dans sidebar active
  },
  filterWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  select: {
    padding: "6px 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    transition: "all 0.3s ease",
    outline: "none",
    cursor: "pointer",
  },
  searchInput: {
    padding: "6px 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    transition: "all 0.3s ease",
    width: "220px",
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    transition: "box-shadow 0.3s ease, transform 0.2s ease",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    color: "#111827",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    border: "1px solid #E5E7EB",
    padding: "12px",
    textAlign: "left",
    backgroundColor: "#F3F4F6",
    fontSize: "14px",
    fontWeight: 700,
    color: "#5B21B6", // violet pour les titres
  },
  td: {
    border: "1px solid #E5E7EB",
    padding: "12px",
    fontSize: "14px",
    color: "#374151",
  },
  noData: {
    textAlign: "center",
    marginTop: 16,
    color: "#6B7280",
    fontSize: 14,
  },
};
