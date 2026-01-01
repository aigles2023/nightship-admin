import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import {
  FaUser,
  FaQuestionCircle,
  FaGlobe,
  FaInfoCircle,
  FaLock,
  FaSignOutAlt,
} from "react-icons/fa";

const Settings = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const settingsOptions = [
    {
      icon: <FaUser />,
      label: "My Account",
      action: () => navigate("/admin-profile"),
    },
    {
      icon: <FaQuestionCircle />,
      label: "Help / FAQ",
      action: () => navigate("/support"),
    },
    {
      icon: <FaGlobe />,
      label: "Languages",
      action: () => navigate("/languages"),
    },
    {
      icon: <FaInfoCircle />,
      label: "About NightShip",
      action: () => navigate("/about"),
    },
    {
      icon: <FaLock />,
      label: "Change Password",
      action: () => navigate("/change-password"),
    },
  ];

  return (
    <div style={layout.container}>
      {/* Sidebar rendered globally by AppLayout */}

      <main style={layout.main}>
        <div style={styles.card}>
          <h2 style={styles.title}>Settings</h2>

          <p style={styles.email}>
            <strong>Email:</strong> {user?.email}
          </p>

          <div style={styles.optionsContainer}>
            {settingsOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                style={styles.optionButton}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#eef2ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9f9f9")
                }
              >
                <span style={styles.icon}>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          <button onClick={handleSignOut} style={styles.signOutButton}>
            <FaSignOutAlt style={{ marginRight: 8 }} />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
};

/* ===========================================
   LAYOUT — IDENTIQUE À : Dashboard, Audit, Orders
   =========================================== */
const layout = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#F9FAFB",
    paddingTop: "30px",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
    transition: "all 0.3s ease",
  },

  main: {
    flexGrow: 1,
    marginLeft: "var(--sidebar-width)", // dynamically controlled by AppLayout
    transition: "margin-left 0.3s ease",
    padding: "40px 30px",
    overflowY: "auto",
    width: "calc(100vw - var(--sidebar-width))",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
};

/* ===========================================
   PAGE STYLES
   =========================================== */
const styles = {
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "30px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  title: {
    fontSize: "26px",
    fontWeight: 700,
    marginBottom: "20px",
    color: "#111827",
  },

  email: {
    marginBottom: "15px",
    color: "#444",
  },

  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "10px",
  },

  optionButton: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9f9f9",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: 500,
    color: "#1f2937",
  },

  icon: {
    marginRight: "10px",
    fontSize: "18px",
    color: "#4f46e5",
  },

  signOutButton: {
    marginTop: "30px",
    padding: "12px 16px",
    fontSize: "16px",
    borderRadius: "8px",
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    width: "100%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    transition: "background-color 0.3s ease",
  },
};

export default Settings;
