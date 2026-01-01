import React from "react";
import Sidebar from "../components/sidebar";

export default function TestPage() {
  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <h1 style={styles.title}>✅ Sidebar Test</h1>
        <p style={styles.text}>
          Si tu vois ce texte **avec le sidebar visible à gauche**, alors tout fonctionne.
        </p>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#111827",
  },
  main: {
    flexGrow: 1,
    padding: "40px",
    marginLeft: "var(--sidebar-width)", // respecte la largeur dynamique
    transition: "margin-left 0.3s ease",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "16px",
  },
  text: {
    fontSize: "16px",
  },
};
