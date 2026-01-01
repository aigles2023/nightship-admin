import React from "react";

export default function AuditLogsDash() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🧾 Audit Logs</h1>
        <p style={styles.subtitle}>
          Review all platform activities, user actions, and historical events.
        </p>
      </div>

      <div style={styles.contentCard}>
        <p style={styles.placeholder}>
          No audit records found yet. Activity logs will appear here once users interact with the system.
        </p>
      </div>
    </div>
  );
}

/* --- Styles --- */
const styles = {
  container: {
    backgroundColor: "#F9FAFB",
    minHeight: "100vh",
    paddingTop:'75px',
    paddingLeft: "30px",
    marginLeft: "var(--sidebar-width)", // ✅ Aligné à droite du Sidebar
    transition: "margin-left 0.3s ease",
    boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    padding: 24,
    minHeight: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    color: "#6B7280",
    fontSize: 15,
    textAlign: "center",
  },
};
