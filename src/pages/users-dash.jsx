// --- Users.jsx (FINAL CLEAN VERSION, harmonisé avec tout l'admin) ---
import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [userType, setUserType] = useState("drivers");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [addressData, setAddressData] = useState(null);
  const [page, setPage] = useState(1);
  const tableRef = useRef(null);
  const perPage = 25;

  const navigate = useNavigate();

  /* =========================================================================
     LOAD USERS BY TYPE
  ========================================================================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, userType), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: userType === "drivers" ? "Driver" : "Sender",
      }));
      setUsers(data);
      setSelectedUser(null);
      setAddressData(null);
      setPage(1);
    });

    return () => unsub();
  }, [userType]);

  /* =========================================================================
     LOAD DRIVER ADDRESS SUBCOLLECTION
  ========================================================================= */
  useEffect(() => {
    const loadAddress = async () => {
      if (selectedUser && userType === "drivers") {
        try {
          const addrSnap = await getDocs(
            collection(db, `drivers/${selectedUser.id}/address`)
          );

          if (!addrSnap.empty) setAddressData(addrSnap.docs[0].data());
          else setAddressData(null);
        } catch (e) {
          console.error("Error loading address:", e);
        }
      } else setAddressData(null);
    };

    loadAddress();
  }, [selectedUser, userType]);

  /* =========================================================================
     CLICK OUTSIDE TO DESELECT
  ========================================================================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setSelectedUser(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================================================================
     FILTER + PAGINATION
  ========================================================================= */
  const filteredUsers = users.filter(
    (u) =>
      (u.fullName || u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + perPage);

  const nextPage = () => page < totalPages && setPage((p) => p + 1);
  const prevPage = () => page > 1 && setPage((p) => p - 1);

  /* =========================================================================
     STATUS COLORS
  ========================================================================= */
  const getStatusColor = (user) => {
    if (userType === "drivers") {
      switch (user.status) {
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
    }
    return user.isActive ? "#16A34A" : "#DC2626";
  };

  /* =========================================================================
     STATS
  ========================================================================= */
  const getStats = () => {
    if (userType === "drivers") {
      return {
        total: users.length,
        approved: users.filter((u) => u.status === "approved").length,
        pending: users.filter((u) => u.status === "pending").length,
        review: users.filter((u) => u.status === "under_review").length,
        hold: users.filter((u) => u.status === "on_hold").length,
        banned: users.filter((u) => u.status === "banned").length,
      };
    }
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
    };
  };
  const stats = getStats();

  const formatDateUS = (ts) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  const handleViewProfile = (user) => {
    if (userType === "drivers") navigate(`/driver/${user.id}`);
    else navigate(`/sender/${user.id}`);
  };

  /* =========================================================================
     RENDER
  ========================================================================= */
  return (
    <div style={layout.container}>
      <main style={layout.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>
            {userType === "drivers" ? "Drivers" : "Senders"}
          </h1>

          <div style={styles.headerControls}>
            <button
              onClick={() =>
                setUserType(userType === "drivers" ? "senders" : "drivers")
              }
              style={styles.switchBtn}
            >
              Switch to {userType === "drivers" ? "Senders" : "Drivers"}
            </button>

            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* STATS */}
        <div style={styles.statsBar}>
          {userType === "drivers" ? (
            <>
              <span style={styles.stat}>Total: {stats.total}</span>
              <span style={{ ...styles.stat, color: "#16A34A" }}>
                Approved: {stats.approved}
              </span>
              <span style={{ ...styles.stat, color: "#F59E0B" }}>
                Pending: {stats.pending}
              </span>
              <span style={{ ...styles.stat, color: "#2563EB" }}>
                Under Review: {stats.review}
              </span>
              <span style={{ ...styles.stat, color: "#D97706" }}>
                On Hold: {stats.hold}
              </span>
              <span style={{ ...styles.stat, color: "#DC2626" }}>
                Banned: {stats.banned}
              </span>
            </>
          ) : (
            <>
              <span style={styles.stat}>Total: {stats.total}</span>
              <span style={{ ...styles.stat, color: "#16A34A" }}>
                Active: {stats.active}
              </span>
              <span style={{ ...styles.stat, color: "#DC2626" }}>
                Inactive: {stats.inactive}
              </span>
            </>
          )}
        </div>

        {/* TABLE + DETAILS */}
        <div style={styles.wrapper}>
          {/* TABLE */}
          <div ref={tableRef} style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "160px" }}>Full Name</th>
                  <th style={{ ...styles.th, width: "230px" }}>Email</th>
                  <th style={{ ...styles.th, width: "120px" }}>Status</th>
                  <th style={{ ...styles.th, width: "140px" }}>Registered</th>
                  <th style={{ ...styles.th, width: "80px" }}>View</th>
                </tr>
              </thead>

              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, i) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{
                        backgroundColor:
                          selectedUser?.id === user.id
                            ? "#E0F0FF"
                            : i % 2 === 0
                            ? "#FFFFFF"
                            : "#F9FAFB",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#EEF2FF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          selectedUser?.id === user.id
                            ? "#E0F0FF"
                            : i % 2 === 0
                            ? "#FFFFFF"
                            : "#F9FAFB")
                      }
                    >
                      <td style={styles.td}>
                        {user.fullName || user.name || "—"}
                      </td>

                      <td style={styles.td}>{user.email || "—"}</td>

                      <td
                        style={{
                          ...styles.td,
                          fontWeight: 600,
                          color: getStatusColor(user),
                        }}
                      >
                        {userType === "drivers"
                          ? user.status || "pending"
                          : user.isActive
                          ? "Active"
                          : "Inactive"}
                      </td>

                      <td style={styles.td}>
                        {formatDateUS(user.createdAt || user.created_at)}
                      </td>

                      <td style={styles.td}>
                        <button
                          style={styles.viewBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(user);
                          }}
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={styles.noData}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={styles.pagination}>
              <button
                onClick={prevPage}
                disabled={page === 1}
                style={{
                  ...styles.pageBtn,
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                ◀
              </button>

              <span style={styles.pageInfo}>
                Page {page} / {totalPages || 1}
              </span>

              <button
                onClick={nextPage}
                disabled={page === totalPages}
                style={{
                  ...styles.pageBtn,
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                ▶
              </button>
            </div>
          </div>

          {/* DETAILS PANEL */}
          <div style={styles.detailsPanel}>
            {selectedUser ? (
              <div style={styles.detailsCard}>
                <div style={styles.avatarWrapper}>
                  {selectedUser.photoUrl ? (
                    <img
                      src={selectedUser.photoUrl}
                      alt="Profile"
                      style={styles.avatar}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>No Photo</div>
                  )}
                </div>

                <h3 style={styles.userName}>
                  {selectedUser.fullName || selectedUser.name || "—"}
                </h3>
                <p style={styles.userEmail}>{selectedUser.email || "—"}</p>

                <div style={styles.infoSection}>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: getStatusColor(selectedUser),
                      }}
                    >
                      {selectedUser.status ||
                        (selectedUser.isActive ? "Active" : "Inactive")}
                    </span>
                  </p>

                  {userType === "drivers" ? (
                    <>
                      <p>
                        <strong>Active:</strong>{" "}
                        {selectedUser.isAvailable ? "Online" : "Offline"}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {addressData
                          ? `${addressData.street || ""}, ${addressData.city || ""}, ${addressData.state || ""} ${addressData.zip || ""}`
                          : "—"}
                      </p>
                      <p>
                        <strong>Country:</strong>{" "}
                        {addressData?.country || "—"}
                      </p>
                      <p>
                        <strong>Registered:</strong>{" "}
                        {formatDateUS(
                          selectedUser.createdAt || addressData?.created_at
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Phone:</strong>{" "}
                        {selectedUser.senderPhone ||
                          selectedUser.phone ||
                          "—"}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {[selectedUser.street, selectedUser.city, selectedUser.state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                      <p>
                        <strong>Country:</strong>{" "}
                        {selectedUser.country || "—"}
                      </p>
                      <p>
                        <strong>Registered:</strong>{" "}
                        {formatDateUS(selectedUser.createdAt)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.emptyPanel}>
                <p style={{ color: "#9CA3AF" }}>
                  Select a {userType === "drivers" ? "driver" : "sender"} to
                  view details.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================================
   STYLES
========================================================================= */
const layout = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    transition: "all 0.3s ease",
  },
  main: {
    flexGrow: 1,
    padding: 32,
    marginLeft: "var(--sidebar-width)",
    width: "calc(100vw - var(--sidebar-width))",
    transition: "margin-left 0.3s ease",
    boxSizing: "border-box",
    overflowY: "auto",
  },
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
    paddingTop: "30px",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
  },
  headerControls: { display: "flex", gap: 10, alignItems: "center" },

  switchBtn: {
    padding: "8px 14px",
    backgroundColor: "#5B21B6",
    color: "#fff",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background-color 0.2s ease",
  },

  searchInput: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #E5E7EB",
    background: "#fff",
    width: 220,
    fontSize: 14,
  },

  statsBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: "12px 18px",
    marginBottom: 20,
  },
  stat: { fontSize: 14, fontWeight: 600 },

  wrapper: {
    display: "flex",
    gap: 20,
    width: "100%",
  },

  tableCard: {
    flex: 1.6,
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #E5E7EB",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  th: {
    background: "#5B21B6",
    border: "1px solid #E5E7EB",
    padding: 12,
    fontSize: 14,
    color: "#fff",
    fontWeight: 600,
    textAlign: "left",
  },

  td: {
    border: "1px solid #E5E7EB",
    padding: 12,
    fontSize: 14,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },

  viewBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    color: "#4B5563",
    transition: "color 0.2s ease",
  },

  noData: {
    padding: 20,
    textAlign: "center",
    color: "#6B7280",
  },

  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 15,
  },

  pageBtn: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    backgroundColor: "#5B21B6",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  pageInfo: {
    fontWeight: 600,
    color: "#374151",
  },

  detailsPanel: {
    flex: 1,
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
    minHeight: 400,
  },

  detailsCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 160,
    height: 200,
    background: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%", objectFit: "cover" },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#9CA3AF",
  },

  userName: { marginTop: 14, fontSize: 18, fontWeight: 700 },
  userEmail: { fontSize: 14, color: "#6B7280" },

  infoSection: {
    marginTop: 14,
    width: "100%",
    fontSize: 14,
    color: "#374151",
  },

  emptyPanel: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
