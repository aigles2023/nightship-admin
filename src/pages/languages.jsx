import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";

export default function LanguageSettings() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [sidebarWidth, setSidebarWidth] = useState(
    getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width") || "200px"
  );

  const [selected, setSelected] = useState(i18n.language || "en");

  // ✅ Surveille la largeur du sidebar
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

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
  ];

  const changeLanguage = (lang) => {
    setSelected(lang);
    i18n.changeLanguage(lang);
  };

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
          {/* 🔙 Back button */}
          <button
            onClick={() => navigate("/settings")}
            style={styles.backButton}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eef2ff")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          >
            ← Back to Settings
          </button>

          <h2 style={styles.header}>Language Preferences</h2>
          <p style={styles.subtext}>
            Select your preferred language for the Admin Panel.
          </p>

          <div style={styles.langContainer}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  ...styles.langButton,
                  backgroundColor: selected === lang.code ? "#eef2ff" : "#f9fafb",
                  borderColor: selected === lang.code ? "#4f46e5" : "#d1d5db",
                  color: selected === lang.code ? "#1e3a8a" : "#374151",
                }}
                onMouseEnter={(e) => {
                  if (selected !== lang.code)
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  if (selected !== lang.code)
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
              >
                <span style={styles.flag}>{lang.flag}</span> {lang.name}
              </button>
            ))}
          </div>

          <footer style={styles.footer}>
            © 2025 ShipDash Inc. — All rights reserved.
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
    maxWidth: 600,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    transition: "all 0.4s ease",
    animation: "fadeSlide 0.6s ease",
    marginBottom: 60,
    textAlign: "center",
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
    alignSelf: "flex-start",
  },
  header: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 10,
    color: "#111827",
  },
  subtext: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 25,
  },
  langContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  langButton: {
    width: "80%",
    maxWidth: 350,
    padding: "12px 16px",
    fontSize: 16,
    fontWeight: 500,
    border: "2px solid #d1d5db",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  flag: {
    fontSize: 22,
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
