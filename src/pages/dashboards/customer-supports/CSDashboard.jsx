import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Sidebar is provided by AppLayout; this page doesn't render it directly.
// import Sidebar from "../../../components/sidebar";
import { db } from "../../../firebase/config";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

/*
 * Admin Overview (Dashboard)
 *
 * This component includes the main dashboard layout and live data,
 * with the sidebar menu imported as a separate component.
 */
export default function CSDashboard() {
  // Firebase auth
  const auth = getAuth();
  const storage = getStorage();
  // Refs for file input
  const fileInputRef = useRef(null);
  // Connected user info
  const [user, setUser] = useState(null);
  // Dashboard state
  const [stats, setStats] = useState({
    orders: 0,
    drivers: 0,
    customers: 0,
    delivered: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  // List of pending/in-progress orders for secondary table
  const [pendingList, setPendingList] = useState([]);
  const [pendingFilter, setPendingFilter] = useState("all");

  // Selected week start (Monday 5:00) for the orders chart.  This allows
  // navigation to previous or future weeks and is used to compute
  // chart data.  We default to the current week.
  const defaultWeekStart = () => {
    const now = new Date();
    const start = new Date(now);
    const daysSinceMonday = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - daysSinceMonday);
    start.setHours(5, 0, 0, 0);
    return start;
  };
  const [weekStart, setWeekStart] = useState(defaultWeekStart);

  // Format a date for the HTML date input (YYYY-MM-DD)
  const formatInputDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Navigate to previous or next week by adjusting weekStart
  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const newStart = new Date(prev);
      newStart.setDate(prev.getDate() - 7);
      return newStart;
    });
  };
  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const newStart = new Date(prev);
      newStart.setDate(prev.getDate() + 7);
      return newStart;
    });
  };
  const handleWeekDateChange = (e) => {
    const selected = new Date(e.target.value);
    if (isNaN(selected)) return;
    // Adjust to Monday 5:00am of the selected week
    const start = new Date(selected);
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    start.setHours(5, 0, 0, 0);
    setWeekStart(start);
  };

  // Start times for online, break and lunch to display timers
  const [onlineStart, setOnlineStart] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [lunchStartTime, setLunchStartTime] = useState(null);
  // A ticking state to force re-render every second for timers
  const [tick, setTick] = useState(0);
  const [chartData, setChartData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Orders",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "#3B82F6",
      },
    ],
  });
  // Online/offline and break/lunch states
  const [online, setOnline] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [onLunch, setOnLunch] = useState(false);
  // Navigation
  const navigate = useNavigate();

  // User details from Firestore
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Navigate to the user's profile page
  const navigateToProfile = () => {
    navigate("/admin-profile");
  };

  // Trigger file input click when avatar is clicked
  const handleAvatarClick = () => {
    if (user?.photoURL) {
      navigateToProfile();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload a new profile photo to Firebase Storage and update the user's profile
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const fileRef = storageRef(storage, `avatars/${user.uid}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      setUser({ ...user, photoURL: url });
    } catch (err) {
      console.error("Error uploading profile photo:", err);
    }
  };

  // Record HR activity logs (online/offline, break, lunch)
  const trackActivity = async (type, action) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await setDoc(
        doc(collection(db, "hr_logs")),
        {
          uid,
          type,
          action,
          timestamp: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error recording activity:", error);
    }
  };

  // Toggle online/offline status
  const handleToggleOnline = async () => {
    if (!online) {
      await trackActivity("online", "start");
      setOnlineStart(new Date());
    } else {
      await trackActivity("online", "end");
      setOnlineStart(null);
    }
    setOnline(!online);
  };

  // Toggle break status
  const handleBreak = async () => {
    if (!onBreak) {
      await trackActivity("break", "start");
      setBreakStartTime(new Date());
    } else {
      await trackActivity("break", "end");
      setBreakStartTime(null);
    }
    setOnBreak(!onBreak);
  };

  // Toggle lunch status
  const handleLunch = async () => {
    if (!onLunch) {
      await trackActivity("lunch", "start");
      setLunchStartTime(new Date());
    } else {
      await trackActivity("lunch", "end");
      setLunchStartTime(null);
    }
    setOnLunch(!onLunch);
  };

  // Listen to authentication state changes and fetch user profile data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  // When a user is authenticated, listen to their profile document for updates
  useEffect(() => {
    if (!user) return;
    const csRef = doc(db, "customer-supports", user.uid);
    const unsubCS = onSnapshot(csRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFullName(data.fullName || user.displayName || "");
        setEmail(data.email || user.email || "");
      } else {
        const userRef = doc(db, "users", user.uid);
        const unsubUser = onSnapshot(userRef, (snap2) => {
          if (snap2.exists()) {
            const data2 = snap2.data();
            setFullName(data2.fullName || user.displayName || "");
            setEmail(data2.email || user.email || "");
          } else {
            setFullName(user.displayName || "");
            setEmail(user.email || "");
          }
        });
        return () => unsubUser();
      }
    });
    return () => unsubCS();
  }, [user]);

  // Real-time updates on orders, drivers, and users
  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const allOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(5, 0, 0, 0);
      if (now.getHours() < 5) {
        dayStart.setDate(dayStart.getDate() - 1);
      }
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      dayEnd.setHours(4, 59, 59, 999);
      const ordersToday = allOrders.filter((o) => {
        let date;
        if (o.deliveryDate?.toDate) date = o.deliveryDate.toDate();
        else if (o.createdAt?.toDate) date = o.createdAt.toDate();
        if (!date) return false;
        return date >= dayStart && date <= dayEnd;
      });
      const deliveredToday = ordersToday.filter((o) => o.status === "completed").length;
      const customerIds = new Set();
      ordersToday.forEach((o) => {
        if (o.customerId) customerIds.add(o.customerId);
        else if (o.customerName) customerIds.add(o.customerName);
        else if (o.senderName) customerIds.add(o.senderName);
      });
      setStats((prev) => ({
        ...prev,
        orders: ordersToday.length,
        delivered: deliveredToday,
        customers: customerIds.size,
      }));
      // Pending alerts list: include pending orders with createdAt; age will be computed per render using tick
      const alerts = ordersToday
        .filter((o) => o.status === "pending" && (o.createdAt?.toDate || o.createdAt))
        .map((o) => ({ id: o.id, ...o }));
      setPendingAlerts(alerts);

      // Compute chart data for the selected week
      const { labels, data } = computeWeekDataForRange(allOrders, weekStart);
      setChartData({
        labels,
        datasets: [
          {
            label: "Orders",
            data,
            backgroundColor: "#3B82F6",
          },
        ],
      });
      const inProgress = ordersToday.filter(
        (o) => o.status === "pending" || o.status === "accepted" || o.status === "in-progress"
      );
      setPendingList(inProgress);
    });
    const unsubDrivers = onSnapshot(collection(db, "drivers"), (snap) => {
      setStats((prev) => ({ ...prev, drivers: snap.size }));
    });
    return () => {
      unsubOrders();
      unsubDrivers();
    };
  }, [weekStart]);

  // Recent orders listener with filtering
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("deliveryDate", "desc"),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtered = orders.filter((order) => {
        if (filterStatus === "all") return true;
        return order.status === filterStatus;
      });
      setRecentOrders(filtered);
    });
    return () => unsubscribe();
  }, [filterStatus]);

  // Tick every second for timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Sidebar is rendered by AppLayout, so we do not render it here */}
      <main style={styles.main}>
       

        {/* Action buttons row */}
        <div style={styles.actionsBar}>
          <button style={styles.actionBtn} onClick={() => navigate("/create-order")}>
            + Create Order
          </button>
          <button style={styles.actionBtn} onClick={() => navigate("/live-map")}>
            View Active Drivers
          </button>
          <button style={styles.actionBtn} onClick={() => navigate("/support")}>
            Support
          </button>
           <button style={styles.actionBtn} onClick={() => navigate("/statistics-dashboard")}>
            Statistics
          </button>
      
        </div>

        {/* Stat Cards */}
        <div style={styles.topStatsRow}>
          <StatCard label="Orders" value={stats.orders} />
          <StatCard label="Drivers" value={stats.drivers} />
          <StatCard label="Customers" value={stats.customers} />
          <StatCard label="Delivered" value={stats.delivered} />
        </div>

        {/* Chart and Alerts row */}
        <div style={styles.twoColumnRow}>
          <div style={styles.cardLarge}>
            {/* Chart header with week navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h4 style={styles.cardTitle}>Orders Chart</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={handlePrevWeek} style={styles.chartNavBtn} title="Previous week">
                  ◀
                </button>
                <input
                  type="date"
                  value={formatInputDate(weekStart)}
                  onChange={handleWeekDateChange}
                  style={styles.dateInput}
                />
                <button onClick={handleNextWeek} style={styles.chartNavBtn} title="Next week">
                  ▶
                </button>
              </div>
            </div>
            <Bar data={chartData} />
          </div>
          <div style={styles.cardMedium}>
            <h4 style={styles.cardTitle}>Alerts</h4>
            {pendingAlerts.length > 0 ? (
              <ul style={{ paddingLeft: 16 }}>
                {pendingAlerts.map((order) => {
                  // Compute how long this order has been pending in a human friendly format
                  let ageLabel = "";
                  try {
                    const created = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt instanceof Date ? order.createdAt : null);
                    if (created) {
                      const ageMs = Date.now() - created.getTime();
                      const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
                      const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
                      if (ageHours < 24) {
                        ageLabel = `${ageHours}h${ageMinutes > 0 ? ` ${ageMinutes}m` : ""}`;
                      } else {
                        const days = Math.floor(ageHours / 24);
                        const remainingHours = ageHours % 24;
                        ageLabel = `${days}D${remainingHours > 0 ? ` ${remainingHours}H` : ""}`;
                      }
                    }
                  } catch (err) {
                    ageLabel = "";
                  }
                  return (
                    <li key={order.id} style={styles.alertItem}>
                      🕒 Order <strong>{order.id}</strong> pending for <strong>{ageLabel}</strong>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={styles.noAlerts}>No pending orders today 🎉</p>
            )}
          </div>
        </div>

        {/* Filter for recent orders */}
        <div style={styles.filterRow}>
          <label style={{ marginRight: 10 }}>📂 Filter recent orders:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.select}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Recent Orders Table */}
        <div style={styles.tableCard}>
          <h4 style={styles.cardTitle}>Recent Orders</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={styles.td}>{order.id}</td>
                  <td style={styles.td}>{order.senderName || order.customerName || "—"}</td>
                  <td style={styles.td}>{order.status}</td>
                  <td style={styles.td}>
                    {
                      (order.deliveryDate?.toDate && order.deliveryDate.toDate().toLocaleString()) ||
                      (order.date?.toDate && order.date.toDate().toLocaleString()) ||
                      (order.createdAt?.toDate && order.createdAt.toDate().toLocaleString()) ||
                      "—"
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => navigate("/orders")} style={styles.seeAllOrdersBtn}>
            See all orders →
          </button>
        </div>

        {/* Pending/In-progress Orders Section */}
        <div style={styles.tableCard}>
          <h4 style={styles.cardTitle}>Active Orders</h4>
          {/* Filter for active orders */}
          <div style={styles.filterRow}>
            <label style={{ marginRight: 10 }}>Filter:</label>
            <select
              value={pendingFilter}
              onChange={(e) => setPendingFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {pendingList
                .filter((o) => (pendingFilter === "all" ? true : o.status === pendingFilter))
                .map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/order/${order.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={styles.td}>{order.id}</td>
                    <td style={styles.td}>{order.senderName || order.customerName || "—"}</td>
                    <td style={styles.td}>{order.status}</td>
                    <td style={styles.td}>
                      {
                        (order.deliveryDate?.toDate && order.deliveryDate.toDate().toLocaleString()) ||
                        (order.date?.toDate && order.date.toDate().toLocaleString()) ||
                        (order.createdAt?.toDate && order.createdAt.toDate().toLocaleString()) ||
                        "—"
                      }
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// Compute number of orders per day of the current business week
function computeWeekData(orders) {
  const now = new Date();
  const start = new Date(now);
  const daysSinceMonday = (now.getDay() + 6) % 7;
  start.setDate(now.getDate() - daysSinceMonday);
  start.setHours(5, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setHours(4, 59, 0, 0);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  orders.forEach((o) => {
    let date;
    if (o.deliveryDate?.toDate) date = o.deliveryDate.toDate();
    else if (o.createdAt?.toDate) date = o.createdAt.toDate();
    if (!date) return;
    if (date >= start && date <= end) {
      const d = date.getDay();
      const index = d === 0 ? 6 : d - 1;
      counts[labels[index]] = (counts[labels[index]] || 0) + 1;
    }
  });
  const data = labels.map((l) => counts[l] || 0);
  return { labels, data };
}

// Compute number of orders per day for a specific business week.  The `start`
// argument should be a Date representing the Monday at 5:00am of the desired
// week.  This function mirrors `computeWeekData` but allows selecting
// arbitrary week ranges.  Orders are counted if their delivery date or
// creation date falls within the interval [start, start + 7 days).
function computeWeekDataForRange(orders, start) {
  // Copy start to avoid mutating the passed date
  const s = new Date(start);
  const end = new Date(s);
  end.setDate(s.getDate() + 7);
  end.setHours(4, 59, 0, 0);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  orders.forEach((o) => {
    let date;
    if (o.deliveryDate?.toDate) date = o.deliveryDate.toDate();
    else if (o.date?.toDate) date = o.date.toDate();
    else if (o.createdAt?.toDate) date = o.createdAt.toDate();
    if (!date) return;
    if (date >= s && date <= end) {
      const d = date.getDay();
      const idx = d === 0 ? 6 : d - 1;
      const label = labels[idx];
      counts[label] = (counts[label] || 0) + 1;
    }
  });
  const data = labels.map((l) => counts[l] || 0);
  return { labels, data };
}

// Format a duration given a start date into HH:MM:SS
function formatDuration(start) {
  if (!start) return "";
  const diff = Date.now() - new Date(start).getTime();
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

/* Reusable stat card component */
const StatCard = ({ label, value }) => (
  <div style={styles.statCard}>
    <div style={styles.statCardLabel}>{label}</div>
    <div style={styles.statCardValue}>{value}</div>
  </div>
);

// Style definitions for main/dashboard
const styles = {
  container: {
    // Flex layout to display sidebar and main side by side
    display: "flex",
    height: "100vh",
    paddingTop:'30px',
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
  },
  /* Main styles */
  main: {
    flexGrow: 1,
    padding: 32,
    overflowY: "auto",
    marginLeft: "var(--sidebar-width)", // ✅ décale à droite du sidebar
    transition: "margin-left 0.3s ease", 
    width: "calc(100vw - var(--sidebar-width))", // ✅ corrige le débordement
  boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111827",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
  searchInput: {
    padding: "8px 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    outline: "none",
    width: 200,
  },
  profileWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "#E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "#374151",
    fontSize: 14,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    fontSize: 12,
  },
  profileName: {
    fontWeight: 600,
    color: "#111827",
  },
  profileEmail: {
    color: "#6B7280",
  },
  /* Stat cards */
  topStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 20,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statCardLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111827",
  },
  /* Two column row for chart and alerts */
  twoColumnRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
    marginBottom: 32,
  },
  cardLarge: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  cardMedium: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: "#111827",
  },
  alertItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  noAlerts: {
    fontSize: 14,
    color: "#6B7280",
  },
  /* Filter row */
  filterRow: {
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  select: {
    padding: "6px 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  /* Table card */
  tableCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    marginTop: '30px',
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  chartNavBtn: {
    padding: "4px 8px",
    backgroundColor: "#E5E7EB",
    border: "1px solid #D1D5DB",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    color: "#374151",
  },
  dateInput: {
    padding: "4px 8px",
    border: "1px solid #D1D5DB",
    borderRadius: 4,
    fontSize: 12,
    color: "#374151",
  },
  th: {
    border: "1px solid #ccc",
    padding: 10,
    background: "#f5f5f5",
    textAlign: "left",
    fontSize: 14,
  },
  td: {
    border: "1px solid #ccc",
    padding: 10,
    fontSize: 14,
  },
  seeAllOrdersBtn: {
    marginTop: 12,
    padding: "8px 16px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  /* Action bar at top for shortcuts and status toggles */
  actionsBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  actionBtn: {
    padding: "8px 14px",
    border: "none",
    borderRadius: 6,
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    backgroundColor: "#6B7280",
  },
  timer: {
    alignSelf: "center",
    color: "#6B7280",
    fontSize: 12,
    marginLeft: 4,
    minWidth: 50,
    textAlign: "left",
  },
};
