// --- src/pages/About.jsx ---
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";

export default function About() {
  const navigate = useNavigate();
  const [sidebarWidth, setSidebarWidth] = useState(
    getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width") || "200px"
  );

  // ✅ Observe la largeur de la sidebar
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const width = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width");
      setSidebarWidth(width);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: false,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={layout.container}>
      <Sidebar />
      <main
        style={{
          ...layout.main,
          marginLeft: `calc(${sidebarWidth} + 30px)`,
          transition: "margin-left 0.4s ease-in-out",
        }}
      >
        <div style={styles.card}>
          {/* 🔙 Back to Settings Button */}
          <button
            onClick={() => navigate("/settings")}
            style={styles.backButton}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eef2ff")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          >
            ← Back to Settings
          </button>

          <h2 style={styles.header}>About NightShip</h2>

          <section style={styles.section}>
            <h3 style={styles.title}>What is NightShip?</h3>
            <p style={styles.text}>
              NightShip is a modern delivery platform connecting drivers with senders,
              especially for night or long-distance intercity deliveries.
              Our mission is to make logistics faster, safer, and more accessible for everyone.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.title}>Version</h3>
            <p style={styles.text}>
              Admin Panel Version: <strong>1.0.0</strong>
            </p>
            <p style={styles.text}>
              Last Update: <strong>July 20, 2025</strong>
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.title}>Team</h3>
            <p style={styles.text}>
              Developed by the <strong>NightShip</strong> team.
              For inquiries, reach out to our support staff.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.title}>Legal</h3>
            <p style={styles.text}>
              By using this application, you agree to our{" "}
              <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.title}>Contact Support</h3>
            <p style={styles.text}>
              For assistance, please contact our team via the Help section in Settings,
              or email us at: <strong>support@nightship.com</strong>
            </p>
          </section>

          <footer style={styles.footer}>
            © 2025 ShipDash Inc. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}

/* --- Layout global --- */
const layout = {
  container: {
    display: "flex",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
    height: "100%",
    minHeight: "100vh",
    overflow: "auto",
  },
  main: {
    flex: 1,
    padding: "70px 0",
    transition: "all 0.4s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    boxSizing: "border-box",
  },
};

/* --- Styles --- */
const styles = {
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: "40px 45px",
    width: "100%",
    maxWidth: 800,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    transition: "all 0.4s ease",
    animation: "fadeSlide 0.6s ease",
    marginBottom: 60,
    position: "relative",
  },
  backButton: {
    backgroundColor: "#f3f4f6",
    border: "none",
    color: "#1f2937",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    marginBottom: "20px",
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
  header: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 25,
    color: "#111827",
    borderBottom: "2px solid #E5E7EB",
    paddingBottom: 10,
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 6,
    color: "#1F2937",
  },
  text: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 1.6,
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
  },
};

/* --- Animation fade + slide-in --- */
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  const keyframes = `
  @keyframes fadeSlide {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }`;
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
}
