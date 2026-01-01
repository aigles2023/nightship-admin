import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { doc, getDoc, updateDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export default function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [addressData, setAddressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHoldField, setShowHoldField] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [message, setMessage] = useState("");

  // === Charger le driver et adresse ===
  useEffect(() => {
    const loadDriver = async () => {
      try {
        const driverRef = doc(db, "drivers", id);
        const driverSnap = await getDoc(driverRef);

        if (driverSnap.exists()) {
          setDriver({ id: driverSnap.id, ...driverSnap.data() });

          const addrSnap = await getDocs(collection(db, `drivers/${id}/address`));
          if (!addrSnap.empty) setAddressData(addrSnap.docs[0].data());
        } else {
          console.warn("Driver introuvable");
        }
      } catch (error) {
        console.error("Erreur chargement driver:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDriver();
  }, [id]);

  // === Fonction de mise en hold ===
  const handleHold = async () => {
    if (!holdReason.trim()) {
      setMessage("Please enter a reason for hold.");
      return;
    }

    try {
      const driverRef = doc(db, "drivers", id);
      await updateDoc(driverRef, {
        status: "on_hold",
        holdReason: holdReason,
        holdDate: Timestamp.now(),
      });

      setMessage("✅ Driver has been put on hold and sent for review.");
      setShowHoldField(false);
      setHoldReason("");
      const updatedSnap = await getDoc(driverRef);
      setDriver({ id, ...updatedSnap.data() });
    } catch (error) {
      console.error("Erreur mise en hold:", error);
      setMessage("❌ Error updating driver status.");
    }
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#16A34A";
      case "pending":
        return "#F59E0B";
      case "under_review":
        return "#2563EB";
      case "on_hold":
        return "#D97706";
      case "banned":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  if (loading)
    return (
      <div style={layout.loading}>
        <p>Loading driver details...</p>
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
          <h1 style={styles.title}>Driver Details</h1>
        </div>

        {driver ? (
          <div style={styles.card}>
            {/* Photo */}
            <div style={styles.photoWrapper}>
              {driver.photoUrl ? (
                <img
                  src={driver.photoUrl}
                  alt="Profile"
                  style={styles.photo}
                />
              ) : (
                <div style={styles.photoPlaceholder}>No Photo</div>
              )}
            </div>

            <h2 style={styles.name}>{driver.fullName || "—"}</h2>
            <p style={styles.email}>{driver.email || "—"}</p>

            <div style={styles.infoSection}>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: getStatusColor(driver.status),
                    fontWeight: 600,
                  }}
                >
                  {driver.status || "pending"}
                </span>
              </p>
              <p>
                <strong>Active:</strong>{" "}
                {driver.isAvailable ? "Online" : "Offline"}
              </p>
              <p>
                <strong>Phone:</strong> {driver.phone || "—"}
              </p>
              <p>
                <strong>Vehicle:</strong>{" "}
                {driver.vehicleType || "—"} {driver.vehicleModel || ""}
              </p>
              <p>
                <strong>Plate:</strong> {driver.vehiclePlate || "—"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {addressData
                  ? `${addressData.street || ""}, ${addressData.city || ""}, ${addressData.state || ""} ${addressData.zip || ""}`
                  : "—"}
              </p>
              <p>
                <strong>Country:</strong> {addressData?.country || "—"}
              </p>
              <p>
                <strong>Registered:</strong>{" "}
                {formatDateUS(driver.createdAt || driver.created_at)}
              </p>
            </div>

            {/* HOLD SECTION */}
            <div style={styles.holdSection}>
              {driver.status !== "on_hold" ? (
                <>
                  {!showHoldField ? (
                    <button
                      style={styles.holdBtn}
                      onClick={() => setShowHoldField(true)}
                    >
                      Put on Hold
                    </button>
                  ) : (
                    <div style={styles.holdForm}>
                      <textarea
                        placeholder="Enter reason for hold..."
                        value={holdReason}
                        onChange={(e) => setHoldReason(e.target.value)}
                        style={styles.textArea}
                      />
                      <div style={styles.holdActions}>
                        <button style={styles.saveBtn} onClick={handleHold}>
                          Confirm Hold
                        </button>
                        <button
                          style={styles.cancelBtn}
                          onClick={() => {
                            setShowHoldField(false);
                            setHoldReason("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: "#D97706", marginTop: 10 }}>
                  ⚠️ Driver currently on hold.
                  {driver.holdReason && (
                    <span> Reason: {driver.holdReason}</span>
                  )}
                </p>
              )}
            </div>

            {message && <p style={styles.message}>{message}</p>}
          </div>
        ) : (
          <div style={styles.notFound}>
            <p>Driver not found.</p>
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
    marginTop: 10,
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
  title: { fontSize: 24, fontWeight: 700, color: "#111827", marginLeft: 20 },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 32,
    maxWidth: 650,
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
  holdSection: {
    marginTop: 20,
    borderTop: "1px solid #E5E7EB",
    paddingTop: 16,
  },
  holdBtn: {
    backgroundColor: "#D97706",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  holdForm: { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 },
  textArea: {
    width: "100%",
    minHeight: 80,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #D1D5DB",
    resize: "vertical",
  },
  holdActions: { display: "flex", gap: 10 },
  saveBtn: {
    backgroundColor: "#5B21B6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    cursor: "pointer",
  },
  cancelBtn: {
    backgroundColor: "#9CA3AF",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    cursor: "pointer",
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
  },
  notFound: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
  },
};
