import React, { useState } from "react";
import FinalDelete from "../orders/final_delete";

export default function AdminGate() {
  const [code, setCode] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // 🔐 Mot de passe admin
    if (code === "1234") {
      setAccessGranted(true);
      setError("");
    } else {
      setError("❌ Incorrect admin PIN code.");
    }
  };

  return (
    <div style={styles.container}>
      {!accessGranted ? (
        <div style={styles.card}>
          <h1 style={styles.title}>🔒 Admin Access</h1>
          <p style={styles.subtitle}>
            Enter your secure PIN to access Final Delete records.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="password"
              placeholder="Enter admin PIN"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Access Final Delete
            </button>
            {error && <p style={styles.error}>{error}</p>}
          </form>
        </div>
      ) : (
        <FinalDelete />
      )}
    </div>
  );
}

/* --- Styles --- */
const styles = {
  container: {
    backgroundColor: "#F9FAFB",
    minHeight: "100vh",
    padding: "60px 40px", // ✅ on réduit le top padding pour remonter la carte
    marginLeft: "var(--sidebar-width)",
    transition: "margin-left 0.3s ease",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "flex-start", // ✅ commence en haut
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
  },
  card: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    padding: "40px",
    width: "100%",
    maxWidth: 420,
    textAlign: "center",
    marginTop: "60px", // ✅ ajustement visuel fin
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: "10px 14px",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  button: {
    padding: "10px 14px",
    backgroundColor: "#5B21B6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 10,
  },
};
