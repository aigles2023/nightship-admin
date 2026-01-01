// --- src/pages/ChangePassword.jsx ---
import React, { useState, useEffect } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import Sidebar from "../components/sidebar";

export default function ChangePassword() {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // récupérés depuis Login.jsx
  const email = location.state?.email || "";
  const refPath = location.state?.ref || "";
  const role = location.state?.role || "";

  // 🧩 Indique si c’est un utilisateur temporaire
  const isTempUser = !!(email && refPath && role);

  // --- Password requirements ---
  const validations = {
    length: newPassword.length >= 6 && newPassword.length <= 10,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    noSpaces: !/\s/.test(newPassword),
  };
  const allValid = Object.values(validations).every(Boolean);
  const passwordsMatch =
    newPassword && confirmNewPassword && newPassword === confirmNewPassword;

  // --- Silent auto-login ---
  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        if (!auth.currentUser && email && currentPassword) {
          await signInWithEmailAndPassword(auth, email, currentPassword);
        }
      } catch (err) {
        console.warn("Auto-login skipped:", err.message);
      }
    };
    tryAutoLogin();
  }, [auth, email, currentPassword]);

  // --- Handle password change ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!passwordsMatch) return setError("New passwords do not match.");
    if (!allValid)
      return setError("Password does not meet all requirements.");

    try {
      let user = auth.currentUser;

      if (!user) {
        if (!email || !currentPassword)
          return setError("Missing credentials. Please try again.");
        const cred = await signInWithEmailAndPassword(
          auth,
          email,
          currentPassword
        );
        user = cred.user;
      }

      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      // ✅ Met à jour Firestore : le mot de passe n’est plus temporaire
      if (refPath) {
        const userDoc = doc(db, refPath);
        await updateDoc(userDoc, { isTemporaryPassword: false });
      }

      setSuccessMsg("Password successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setTimeout(() => {
        switch (role) {
          case "customer-support":
            navigate("/cs-dashboard");
            break;
          case "regular-supervisor":
            navigate("/supervisor-dashboard");
            break;
          case "regular-manager":
            navigate("/manager-dashboard");
            break;
          case "ops-manager":
            navigate("/ops-dashboard");
            break;
          default:
            navigate("/login");
        }
      }, 2000);
    } catch (err) {
      console.error("❌ Password update error:", err);
      setError(err.message || "Failed to update password.");
    }
  };

  const EyeIcon = ({ visible }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <path d="M17.94 17.94a10.42 10.42 0 0 1-5.94 1.94C7.41 19.88 3 15 3 12s4.41-7.88 9-7.88c2.07 0 4.01.66 5.61 1.78" />
          <path d="M1 1l22 22" />
        </>
      ) : (
        <>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  return (
    <div style={layout.container}>
      {/* ✅ Affiche le sidebar uniquement si utilisateur complet ET pas temporaire */}
      {auth.currentUser && !isTempUser && <Sidebar />}

      <main
        style={{
          ...layout.main,
          paddingLeft: auth.currentUser && !isTempUser ? "var(--sidebar-width)" : "0",
          transition: "all 0.4s ease-in-out",
        }}
      >
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white",
                  fontSize: 26,
                  fontWeight: "bold",
                  marginBottom: 15,
                  boxShadow: "0 3px 10px rgba(37, 99, 235, 0.3)",
                }}
              >
                SD
              </div>
              <h2 style={{ color: "#111827", fontWeight: 700, fontSize: 24 }}>
                Change Password
              </h2>
              <p style={{ color: "#6b7280", fontSize: 14 }}>
                Enter your current and new password below.
              </p>
            </div>

            <form onSubmit={handlePasswordChange} style={styles.form}>
              {/* Champs identiques */}
              <div style={styles.fieldContainer}>
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Current (temporary) password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={styles.eyeButton}
                >
                  <EyeIcon visible={showCurrent} />
                </button>
              </div>

              <div style={styles.fieldContainer}>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={styles.eyeButton}
                >
                  <EyeIcon visible={showNew} />
                </button>
              </div>

              <div style={styles.fieldContainer}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeButton}
                >
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>

              {/* règles */}
              <ul style={styles.rules}>
                <li style={{ color: validations.uppercase ? "green" : "red" }}>
                  At least one uppercase letter
                </li>
                <li style={{ color: validations.lowercase ? "green" : "red" }}>
                  At least one lowercase letter
                </li>
                <li style={{ color: validations.number ? "green" : "red" }}>
                  At least one number
                </li>
                <li style={{ color: validations.symbol ? "green" : "red" }}>
                  At least one special symbol
                </li>
                <li style={{ color: validations.length ? "green" : "red" }}>
                  Between 6–10 characters
                </li>
                <li style={{ color: validations.noSpaces ? "green" : "red" }}>
                  No spaces or accents
                </li>
              </ul>

              {passwordsMatch === false && (
                <p style={{ color: "red", fontSize: 14 }}>
                  Passwords do not match.
                </p>
              )}
              {passwordsMatch === true && (
                <p style={{ color: "green", fontSize: 14 }}>
                  Password matches.
                </p>
              )}

              {error && <p style={styles.error}>{error}</p>}
              {successMsg && <p style={styles.success}>{successMsg}</p>}

              <div style={styles.buttons}>
                <button
                  type="submit"
                  disabled={!passwordsMatch}
                  style={{
                    ...styles.saveBtn,
                    backgroundColor: passwordsMatch ? "#2563eb" : "#9ca3af",
                    cursor: passwordsMatch ? "pointer" : "not-allowed",
                  }}
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --- Layout --- */
const layout = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
  },
  main: {
    width: "100%",
    padding: "60px 60px 40px 80px",
    transition: "all 0.4s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
};

/* --- Styles --- */
const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginLeft: "30px",
    marginRight: "auto",
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: "40px 35px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  },
  form: { display: "flex", flexDirection: "column" },
  fieldContainer: { position: "relative", marginBottom: 20 },
  input: {
    width: "100%",
    padding: "12px 40px 12px 12px",
    fontSize: 15,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
  },
  eyeButton: {
    position: "absolute",
    top: "50%",
    right: 10,
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  rules: {
    listStyle: "none",
    marginBottom: 10,
    padding: 0,
    fontSize: 14,
    textAlign: "left",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 15,
  },
  saveBtn: {
    padding: "10px 20px",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    transition: "0.3s",
  },
  cancelBtn: {
    padding: "10px 20px",
    backgroundColor: "#9CA3AF",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "0.3s",
  },
  error: { color: "red", fontSize: 14, marginBottom: 10 },
  success: { color: "green", fontSize: 14, marginBottom: 10 },
};
