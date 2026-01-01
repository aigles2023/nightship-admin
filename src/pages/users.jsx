import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FiEdit,
  FiEye,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiAlertTriangle,
  FiLock,
} from "react-icons/fi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // 🔹 Fusionne les collections 'drivers' et 'senders'
  useEffect(() => {
    const unsubDrivers = onSnapshot(collection(db, "drivers"), (snapshot) => {
      const drivers = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: "driver",
        ...doc.data(),
      }));
      setUsers((prev) => {
        const senders = prev.filter((u) => u.type === "sender");
        return [...senders, ...drivers];
      });
    });

    const unsubSenders = onSnapshot(collection(db, "senders"), (snapshot) => {
      const senders = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: "sender",
        ...doc.data(),
      }));
      setUsers((prev) => {
        const drivers = prev.filter((u) => u.type === "driver");
        return [...drivers, ...senders];
      });
    });

    return () => {
      unsubDrivers();
      unsubSenders();
    };
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  // 🔸 Gérer les statuts des drivers
  const updateDriverStatus = async (user, newStatus) => {
    try {
      const ref = doc(db, "drivers", user.id);
      await updateDoc(ref, { status: newStatus });
      alert(`${user.name}'s status updated to ${newStatus.toUpperCase()}`);
    } catch (error) {
      console.error("Erreur mise à jour du statut :", error);
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  // 🔸 (Ancienne logique) Suspendre / activer un sender
  const toggleUserStatus = async (user) => {
    try {
      const collectionName = user.type === "driver" ? "drivers" : "senders";
      const ref = doc(db, collectionName, user.id);
      await updateDoc(ref, { isActive: !user.isActive });
    } catch (error) {
      console.error("Erreur activation utilisateur :", error);
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(`Archiver ${user.name} ?`);
    if (!confirmed) return;
    try {
      const collectionName = user.type === "driver" ? "drivers" : "senders";
      const deletedRef = doc(db, "deleted_users", user.id);
      await setDoc(deletedRef, {
        ...user,
        deletedAt: Timestamp.now(),
        originalCollection: collectionName,
      });
      await deleteDoc(doc(db, collectionName, user.id));
    } catch (error) {
      console.error("Erreur suppression utilisateur :", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";
    return timestamp.toDate().toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "green";
      case "pending":
        return "orange";
      case "rejected":
        return "red";
      case "on_hold":
        return "#d6a700";
      case "banned":
        return "#800000";
      default:
        return "gray";
    }
  };

  return (
    <div
      className="users-container"
      style={{
        backgroundColor: "#f7f8fa",
        minHeight: "100vh",
        padding: "30px",
        color: "#000",
      }}
    >
      <h2
        style={{
          fontSize: "22px",
          fontWeight: "700",
          marginBottom: "20px",
          color: "#111",
        }}
      >
        User & Driver Management
      </h2>

      <input
        type="text"
        placeholder="Search by name or email"
        className="search-input"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "20px",
          fontSize: "15px",
          color: "#000",
          backgroundColor: "#fff",
        }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div
        style={{
          overflowX: "auto",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <table
          className="user-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#000",
          }}
        >
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Registered</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>{user.name || "N/A"}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>
                    {user.type === "driver" ? "Driver" : "Sender"}
                  </td>
                  <td style={tdStyle}>
                    {user.type === "driver" ? (
                      <span
                        style={{
                          color: getStatusColor(user.status),
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {user.status || "pending"}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: user.isActive ? "green" : "red",
                          fontWeight: 600,
                        }}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>{formatDate(user.created_at)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {/* View */}
                      <button style={iconButtonStyle} title="View">
                        <FiEye />
                      </button>

                      {/* Edit */}
                      <button style={iconButtonStyle} title="Edit">
                        <FiEdit />
                      </button>

                      {/* Actions spécifiques aux drivers */}
                      {user.type === "driver" ? (
                        <>
                          <button
                            style={{ ...iconButtonStyle, color: "green" }}
                            title="Approve"
                            onClick={() => updateDriverStatus(user, "approved")}
                          >
                            <FiUserCheck />
                          </button>

                          <button
                            style={{ ...iconButtonStyle, color: "orange" }}
                            title="Pending"
                            onClick={() => updateDriverStatus(user, "pending")}
                          >
                            ⏸️
                          </button>

                          <button
                            style={{ ...iconButtonStyle, color: "#d6a700" }}
                            title="On Hold (Fraud Review)"
                            onClick={() => updateDriverStatus(user, "on_hold")}
                          >
                            <FiAlertTriangle />
                          </button>

                          <button
                            style={{ ...iconButtonStyle, color: "red" }}
                            title="Reject"
                            onClick={() => updateDriverStatus(user, "rejected")}
                          >
                            <FiUserX />
                          </button>

                          <button
                            style={{ ...iconButtonStyle, color: "#800000" }}
                            title="Ban (Permanent Suspension)"
                            onClick={() => updateDriverStatus(user, "banned")}
                          >
                            <FiLock />
                          </button>
                        </>
                      ) : (
                        // Pour les senders : simple activation / désactivation
                        <button
                          style={{
                            ...iconButtonStyle,
                            color: user.isActive ? "red" : "green",
                          }}
                          title={user.isActive ? "Deactivate" : "Activate"}
                          onClick={() => toggleUserStatus(user)}
                        >
                          {user.isActive ? <FiUserX /> : <FiUserCheck />}
                        </button>
                      )}

                      {/* Archive */}
                      <button
                        style={iconButtonStyle}
                        title="Archive"
                        onClick={() => deleteUser(user)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    color: "#777",
                    padding: "16px",
                  }}
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Styles */
const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #ddd",
  color: "#333",
  fontWeight: "600",
};

const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
  color: "#000",
};

const iconButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "18px",
  color: "#444",
};

export default Users;
