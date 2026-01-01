import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import jsPDF from "jspdf";
import { getAuth } from "firebase/auth";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [order, setOrder] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchOrder = async () => {
      const docRef = doc(db, "orders", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrder(docSnap.data());
        setFormData(docSnap.data());
      } else {
        alert("Order not found.");
      }
    };

    fetchOrder();
  }, [id]);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "orders", id), formData);
      alert("Order updated.");
      setEditing(false);
    } catch (e) {
      console.error("Update error:", e);
    }
  };

  const handleExportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(16);
    docPdf.text("Order Details", 10, 10);

    Object.entries(order || {}).forEach(([key, value], i) => {
      docPdf.setFontSize(12);
      docPdf.text(`${key}: ${value?.toString?.() || "—"}`, 10, 20 + i * 8);
    });

    docPdf.save(`order-${id}.pdf`);
  };

  const handleExportCSV = () => {
    const csv = Object.entries(order || {})
      .map(([key, value]) => `${key},"${value?.toString?.() || ""}"`)
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `order-${id}.csv`;
    a.click();
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to archive this order?");
    if (!confirm) return;

    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "deleted_orders", id), {
        ...order,
        deletedBy: user?.email || "unknown",
        deletedAt: new Date(),
      });

      await deleteDoc(doc(db, "orders", id));
      alert("Order archived.");
      navigate("/orders");
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const updateStatus = async () => {
    const next =
      order.status === "pending"
        ? "accepted"
        : order.status === "accepted"
        ? "completed"
        : "pending";

    try {
      await updateDoc(doc(db, "orders", id), { status: next });
      setOrder((prev) => ({ ...prev, status: next }));
      alert("Status updated.");
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  if (!order) return <p>Loading order...</p>;

  return (
    <div style={{ padding: "2rem" }}>

    <button
  onClick={() => navigate('/orders')}
  style={{
    marginBottom: '20px',
    background: '#f3f4f6',
    border: '1px solid #ccc',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
  ← Back to Orders
</button>
      <h2>📄 Order Details: {id}</h2>

      {editing ? (
        <>
          <label>
            Customer Name:
            <input
              name="customerName"
              value={formData.customerName || ""}
              onChange={handleChange}
              style={input}
            />
          </label>
          <br />
          <label>
            Delivery Date:
            <input
              name="deliveryDate"
              value={formData.deliveryDate || ""}
              onChange={handleChange}
              style={input}
            />
          </label>
          <br />
          <button onClick={handleUpdate} style={buttonGreen}>
            💾 Save
          </button>
        </>
      ) : (
        <>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Customer:</strong> {order.customerName}</p>
          <p><strong>Driver:</strong> {order.acceptedBy}</p>
          <p>
            <strong>Delivery Date:</strong>{" "}
            {order.deliveryDate?.toDate?.().toLocaleString() || order.deliveryDate}
          </p>
        </>
      )}

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={handleEditToggle} style={buttonGray}>
          {editing ? "Cancel" : "✏️ Edit"}
        </button>
        <button onClick={updateStatus} style={buttonBlue}>
          🔁 Change Status
        </button>
        <button onClick={handleExportPDF} style={button}>
          🧾 Export PDF
        </button>
        <button onClick={handleExportCSV} style={button}>
          📄 Export CSV
        </button>
        <button onClick={handleDelete} style={buttonRed}>
          🗑 Archive
        </button>
      </div>
    </div>
  );
};

const input = {
  padding: "8px",
  margin: "8px 0",
  width: "300px",
};

const button = {
  padding: "10px 14px",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#e2e8f0",
};

const buttonRed = {
  ...button,
  backgroundColor: "#DC2626",
  color: "white",
};

const buttonGreen = {
  ...button,
  backgroundColor: "#10B981",
  color: "white",
};

const buttonBlue = {
  ...button,
  backgroundColor: "#3B82F6",
  color: "white",
};

const buttonGray = {
  ...button,
  backgroundColor: "#6B7280",
  color: "white",
};

export default OrderDetails;
