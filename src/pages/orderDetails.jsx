import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// Fonction utilitaire pour générer une URL Google Maps statique
const getStaticMapUrl = (pickup, dropoff) => {
  if (!pickup || !dropoff) return null;

  const base = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams({
    size: "640x300",
    maptype: "roadmap",
    markers: `color:purple|label:A|${pickup}`,
    markers2: `color:blue|label:B|${dropoff}`,
    path: `color:0x5B21B6|weight:4|${pickup}|${dropoff}`,
    key: "YOUR_GOOGLE_MAPS_API_KEY", // ⚠️ à remplacer par ta clé API Google Maps
  });

  return `${base}?${params.toString()}`;
};

export default function OrderDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderFromNav = location.state?.order || location.state?.o;
  const [order, setOrder] = useState(orderFromNav || null);
  const [driver, setDriver] = useState(null);
  const [mapUrl, setMapUrl] = useState(null);

  // --- Fetch Order ---
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderFromNav && location.pathname.includes("/orderDetails/")) {
        const id = location.pathname.split("/orderDetails/")[1];
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
      }
    };
    fetchOrder();
  }, [orderFromNav, location.pathname]);

  // --- Fetch Driver ---
  useEffect(() => {
    const fetchDriver = async () => {
      if (order?.acceptedBy) {
        const snap = await getDoc(doc(db, "drivers", order.acceptedBy));
        if (snap.exists()) setDriver({ id: snap.id, ...snap.data() });
      }
    };
    fetchDriver();
  }, [order]);

  // --- Generate map when pickup/dropoff available ---
  useEffect(() => {
    if (order?.pickupAddress && order?.dropoffAddress) {
      const url = getStaticMapUrl(order.pickupAddress, order.dropoffAddress);
      setMapUrl(url);
    }
  }, [order]);

  if (!order)
    return (
      <div style={styles.loading}>
        <p>Loading order details...</p>
      </div>
    );

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate("/orders")}>
        ← Back to Orders
      </button>

      <div style={styles.content}>
        {/* === LEFT SIDE === */}
        <div style={styles.left}>
          <h2 style={styles.title}>Order #{order.id}</h2>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>General Information</h3>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Sender:</strong> {order.senderName || "—"}</p>
            <p><strong>Receiver:</strong> {order.receiverName || "—"}</p>
            <p><strong>Phone:</strong> {order.receiverPhone || "—"}</p>
            <p><strong>Created At:</strong> {order.createdAt?.toDate?.().toLocaleString() || "—"}</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Addresses</h3>
            <p><strong>Pickup:</strong> {order.pickupAddress || "—"}</p>
            <p><strong>Dropoff:</strong> {order.dropoffAddress || "—"}</p>
            <p><strong>Distance:</strong> {order.distance || "—"} miles</p>
            <p><strong>Estimated Time:</strong> {order.estimatedTime || "—"}</p>

            {/* 🗺️ Static Google Map */}
            {mapUrl && (
              <div style={styles.mapContainer}>
                <img
                  src={mapUrl}
                  alt="Map route"
                  style={{ width: "100%", borderRadius: 10 }}
                />
              </div>
            )}
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Payment</h3>
            <p><strong>Price:</strong> ${order.price || "0.00"}</p>
            <p><strong>Payment Method:</strong> {order.paymentMethod || "—"}</p>
            <p><strong>Transaction ID:</strong> {order.transactionId || "—"}</p>
            <p><strong>Payment Status:</strong> {order.paymentStatus || "—"}</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Timestamps</h3>
            <p><strong>Accepted At:</strong> {order.acceptedAt?.toDate?.().toLocaleString() || "—"}</p>
            <p><strong>Completed At:</strong> {order.completedAt?.toDate?.().toLocaleString() || "—"}</p>
            <p><strong>Canceled At:</strong> {order.canceledAt?.toDate?.().toLocaleString() || "—"}</p>
          </section>
        </div>

        {/* === RIGHT SIDE === */}
        <div style={styles.right}>
          <h3 style={styles.sectionTitle}>Driver Information</h3>
          {!driver ? (
            <p style={{ color: "#6B7280" }}>No driver assigned yet.</p>
          ) : (
            <div style={styles.driverCard}>
              <div style={styles.driverHeader}>
                {driver.photoURL ? (
                  <img
                    src={driver.photoURL}
                    alt={driver.fullName}
                    style={styles.driverAvatar}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {driver.fullName?.charAt(0) || "D"}
                  </div>
                )}
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 600 }}>
                    {driver.fullName || "Unnamed"}
                  </h4>
                  <p style={{ color: "#6B7280", fontSize: 13 }}>
                    {driver.email || "—"}
                  </p>
                  <p style={{ color: "#6B7280", fontSize: 13 }}>
                    {driver.phone || "—"}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  Vehicle
                </h4>
                {driver.vehicle ? (
                  <>
                    <p><strong>Brand:</strong> {driver.vehicle.brand || "—"}</p>
                    <p><strong>Model:</strong> {driver.vehicle.make || "—"}</p>
                    <p><strong>Year:</strong> {driver.vehicle.year || "—"}</p>
                    <p><strong>Plate:</strong> {driver.vehicle.plate || "—"}</p>
                    <p><strong>Color:</strong> {driver.vehicle.color || "—"}</p>
                  </>
                ) : (
                  <p style={{ color: "#6B7280" }}>No vehicle information.</p>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  License
                </h4>
                {driver.license ? (
                  <>
                    <p><strong>Number:</strong> {driver.license.number || "—"}</p>
                    <p><strong>State:</strong> {driver.license.state || "—"}</p>
                    <p><strong>Expiration:</strong> {driver.license.expiration || "—"}</p>
                  </>
                ) : (
                  <p style={{ color: "#6B7280" }}>No license details.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Styles --- */
const styles = {
  container: {
    marginLeft: "var(--sidebar-width)",
    marginTop: "85px",
    padding: "30px 40px",
    backgroundColor: "#F9FAFB",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#5B21B6",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 20,
  },
  content: {
    display: "flex",
    gap: 24,
    alignItems: "flex-start",
  },
  left: {
    flex: "0 0 65%",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #E5E7EB",
    padding: 24,
  },
  right: {
    flex: "0 0 35%",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #E5E7EB",
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 4,
  },
  mapContainer: {
    marginTop: 10,
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },
  driverCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  driverHeader: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 8,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    backgroundColor: "#E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "#6B7280",
    fontSize: 20,
  },
  loading: {
    marginLeft: "var(--sidebar-width)",
    padding: 40,
    fontFamily: "Inter, sans-serif",
  },
};
