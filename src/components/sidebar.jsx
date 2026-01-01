import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const width = collapsed ? "60px" : "200px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed]);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboards", route: "/cs-dashboard", icon: "📊" },
    { key: "orders", label: "Orders", route: "/orders", icon: "📦" },
    { key: "archives", label: "Archives", route: "/archive-order-dash", icon: "📄" },
    { key: "users", label: "Users", route: "/users", icon: "👤" },
    { key: "drivermanagement", label: "Driver Manag", route: "/driver-management", icon: "👤" },
    { key: "live", label: "Live Map", route: "/live-map", icon: "🗺️" },
    { key: "support", label: "Support", route: "/support", icon: "💬" },
    { key: "settings", label: "Settings", route: "/settings", icon: "⚙️" },
    { key: "admin", label: "Admin", route: "/admin", icon: "🔐" },
    { key: "audit", label: "Audit Logs", route: "/audit-logs", icon: "🧾" },
  ];

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: "var(--sidebar-width)",
        transition: "width 0.3s ease", // ⭐ Animation sidebar
      }}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
          cursor: "pointer",
          marginBottom: 16,
          transition: "all 0.3s ease",
        }}
      >
        <span
          style={{
            fontSize: 18,
            display: "inline-block",
            transition: "transform 0.3s ease",
            transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", // ⭐ Rotation smooth
          }}
        >
          ⏴
        </span>
      </div>

      <div
        style={{
          ...styles.sidebarHeader,
          textAlign: collapsed ? "center" : "left",
          opacity: collapsed ? 1 : 1,
          transition: "opacity 0.3s ease", // ⭐ Fade in/out
        }}
      >
        {collapsed ? "SD" : "shipdash"}
      </div>

      <div style={styles.sidebarNav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.route;
          return (
            <div
              key={item.key}
              onClick={() => navigate(item.route)}
              style={{
                ...styles.sidebarItem,
                flexDirection: collapsed ? "column" : "row",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",
                backgroundColor: isActive ? "#F5F7FB" : "transparent",
                borderLeft: collapsed
                  ? "none"
                  : isActive
                  ? "3px solid #5B21B6"
                  : "3px solid transparent",
                color: isActive ? "#5B21B6" : "#374151",
                fontWeight: isActive ? 700 : 500,
                position: "relative",
                transition: "all 0.3s ease", // ⭐ Smooth hover + collapse
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F3F4F6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isActive
                  ? "#F5F7FB"
                  : "transparent";
              }}
            >
              <span
                className="icon"
                style={{
                  ...styles.icon,
                  transition: "transform 0.3s ease", // ⭐ Smooth icon
                }}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <span
                  style={{
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? "translateX(-10px)" : "translateX(0)",
                  }}
                >
                  {item.label}
                </span>
              )}

              {collapsed && isActive && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#5B21B6",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.sidebarFooter}>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: "#B91C1C",
            fontSize: 16,
            cursor: "pointer",
            width: "100%",
            textAlign: collapsed ? "center" : "left",
            padding: collapsed ? 0 : "8px 0",
            transition: "all 0.3s ease", // ⭐ Smooth fade
          }}
        >
          {collapsed ? "⎋" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 200,
    backgroundColor: "#F8FAFC",
    borderRight: "1px solid #E5E7EB",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    zIndex: 1000,
  },
  sidebarHeader: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 24,
    color: "#111827",
  },
  sidebarNav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flexGrow: 1,
  },
  sidebarItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.3s, color 0.3s",
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: 16,
  },
  icon: {
    fontSize: 18,
  },
};
