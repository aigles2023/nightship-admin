import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function SenderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sender, setSender] = useState(null);
  const [loading, setLoading] = useState(true);

  // === Charger les infos du sender ===
  useEffect(() => {
    const loadSender = async () => {
      try {
        const senderRef = doc(db, "senders", id);
        const senderSnap = await getDoc(senderRef);
        if (senderSnap.exists()) {
          setSender({ id: senderSnap.id, ...senderSnap.data() });
        } else {
          console.warn("Sender introuvable");
        }
      } catch (error) {
        console.error("Erreur chargement sender:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSender();
  }, [id]);

  const formatDateUS = (ts) => {
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  const getStatusColor = (isActive) => (isActive ? "#16A34A" : "#DC2626");

  if (loading)
    return (
      <div style={layout.loading}>
        <p>Loading sender details...</p>
      </div>
    );

  return (
    <div style={layout.container}>
      <Sidebar />
      <main style={layout.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <button onClick={() => navigate("/users")} style={styles.backBtn}>
            ← Back to Users
          </button>
          <h1 style={styles.title}>Sender Details</h1>
        </div>

        {sender ? (
          <div style={styles.card}>
            {/* Photo */}
            <div style={styles.photoWrapper}>
              {sender.photoUrl ? (
                <img
                  src={sender.photoUrl}
                  alt="Profile"
                  style={styles.photo}
                />
              ) : (
                <div style={styles.photoPlaceholder}>No Photo</div>
              )}
            </div>

            <h2 style={styles.name}>{sender.fullName || sender.name || "—"}</h2>
            <p style={styles.email}>{sender.email || "—"}</p>

            {/* Infos principales */}
            <div style={styles.infoSection}>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: getStatusColor(sender.isActive),
                    fontWeight: 600,
                  }}
                >
                  {sender.isActive ? "Active" : "Inactive"}
                </span>
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {sender.phone || sender.senderPhone || "—"}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {[sender.street, sender.city, sender.state]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>

              <p>
                <strong>Country:</strong> {sender.country || "—"}
              </p>

              <p>
                <strong>Registered:</strong>{" "}
                {formatDateUS(sender.createdAt || sender.created_at)}
              </p>
            </div>
          </div>
        ) : (
          <div style={styles.notFound}>
            <p>Sender not found.</p>
          </div>
        )}
      </main>
    </div>
  );
}

/* === STYLES === */
const layout = {
  container: {
    display: "flex",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
    minHeight: "100vh",
  },
  main: {
    flexGrow: 1,
    padding: 32,
    marginLeft: "var(--sidebar-width)",
  },
  loading: {
    display: "flex",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "#6B7280",
  },
};

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    padding: "6px 14px",
    backgroundColor: "#5B21B6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  title: { fontSize: 24, fontWeight: 700, color: "#111827" },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 32,
    maxWidth: 600,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  photoWrapper: {
    width: 180,
    height: 200,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    margin: "0 auto",
  },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlaceholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#9CA3AF",
  },
  name: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 20,
    fontWeight: 700,
  },
  email: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 20,
  },
  infoSection: {
    fontSize: 15,
    lineHeight: "1.8",
  },
  notFound: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
  },
};
