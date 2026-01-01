import React, { useEffect, useState } from 'react';
import Sidebar from "../components/sidebar";
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';

export default function ArchivedOrders() {
  const [archivedOrders, setArchivedOrders] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'deleted_orders'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArchivedOrders(data);
    });
    return () => unsub();
  }, []);

  const moveToFinalDelete = async (order) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this order? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const currentUser = auth.currentUser?.email || "unknown";
      await setDoc(doc(db, 'final_delete_queue', order.id), {
        ...order,
        finalDeletedBy: currentUser,
        finalDeletedAt: new Date(),
      });
      await deleteDoc(doc(db, 'deleted_orders', order.id));
      alert("Order moved to final delete queue.");
    } catch (error) {
      console.error("Error moving to final delete:", error);
    }
  };

  const restoreOrder = async (order) => {
    try {
      await setDoc(doc(db, 'orders', order.id), {
        ...order,
        restoredFrom: 'deleted_orders',
        restoredAt: new Date(),
      });
      await deleteDoc(doc(db, 'deleted_orders', order.id));
      alert("Order restored to active orders.");
    } catch (error) {
      console.error("Error restoring order:", error);
    }
  };

  return (
    <div style={layout.container}>
      <Sidebar />
      <main style={layout.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>📁 Archived Orders</h1>
          <p style={styles.subtitle}>
            Manage deleted orders — restore or permanently remove them.
          </p>
        </div>

        {archivedOrders.length === 0 ? (
          <p style={styles.noData}>No archived orders found 🎉</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Deleted By</th>
                  <th style={styles.th}>Deleted At</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={styles.td}>{order.id}</td>
                    <td style={styles.td}>{order.deletedBy || '—'}</td>
                    <td style={styles.td}>
                      {order.deletedAt?.toDate?.().toLocaleString() || '—'}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          onClick={() => restoreOrder(order)}
                          style={styles.buttonGreen}
                          title="Restore to Orders"
                        >
                          ♻️ Restore
                        </button>
                        <button
                          onClick={() => moveToFinalDelete(order)}
                          style={styles.buttonRed}
                          title="Permanently delete (admin only)"
                        >
                          ❌ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

/* --- Styles --- */
const styles = {
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  noData: {
    textAlign: "center",
    padding: "60px 0",
    color: "#6B7280",
    fontSize: 15,
  },
  tableWrapper: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    backgroundColor: "#F3F4F6",
    color: "#111827",
    padding: "12px 14px",
    fontSize: 14,
    borderBottom: "1px solid #E5E7EB",
  },
  td: {
    padding: "10px 14px",
    fontSize: 14,
    color: "#374151",
    borderBottom: "1px solid #E5E7EB",
  },
  actions: {
    display: "flex",
    gap: 8,
  },
  buttonGreen: {
    padding: "6px 12px",
    backgroundColor: "#10B981",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "background-color 0.2s ease",
  },
  buttonRed: {
    padding: "6px 12px",
    backgroundColor: "#DC2626",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "background-color 0.2s ease",
  },
};

// Layout styles shared with pages using the Sidebar
const layout = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
    paddingTop: "50px",
  },
  main: {
    flexGrow: 1,
    padding: "0 30px",
    overflowY: "auto",
    marginLeft: "var(--sidebar-width)",
    transition: "margin-left 0.3s ease",
  },
};

