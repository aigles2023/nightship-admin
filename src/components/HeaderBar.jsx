import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, onSnapshot, setDoc, getDoc, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export default function HeaderBar({ onLockScreenChange }) {
  const auth = getAuth();
  const storage = getStorage();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  const [online, setOnline] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [onLunch, setOnLunch] = useState(false);

  const [shiftStart, setShiftStart] = useState(null);
  const [shiftDuration, setShiftDuration] = useState(0);
  const [breakDuration, setBreakDuration] = useState(0);
  const [lunchDuration, setLunchDuration] = useState(0);

  const [breakStart, setBreakStart] = useState(null);
  const [lunchStart, setLunchStart] = useState(null);
  const [userDocRef, setUserDocRef] = useState(null);
  const COLLECTION = "customer-supports";

  // 🔹 Empêche la déconnexion si actif
  useEffect(() => {
    const preventLogout = (e) => {
      if (online || onBreak || onLunch) {
        e.preventDefault();
        alert(
          "⚠️ You cannot log out while Online, on Break, or on Lunch.\nPlease end all active sessions first."
        );
      }
    };
    window.addEventListener("beforeunload", preventLogout);
    return () => window.removeEventListener("beforeunload", preventLogout);
  }, [online, onBreak, onLunch]);

  // 🔹 Lecture et écoute Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setEmail(u.email || "");
        setPhotoURL(u.photoURL || "");

        const ref = doc(db, COLLECTION, u.uid);
        setUserDocRef(ref);

        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setFullName(d.fullName || u.displayName || "");
          setPhotoURL(d.photoURL || u.photoURL || "");
        }

        // écoute en temps réel
        onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setFullName(d.fullName || u.displayName || "");
            setPhotoURL(d.photoURL || u.photoURL || "");
          }
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Timers
  useEffect(() => {
    let interval;
    if (online && shiftStart) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - shiftStart) / 1000);
        setShiftDuration(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [online, shiftStart]);

  useEffect(() => {
    let interval;
    if (onBreak && breakStart) {
      interval = setInterval(() => {
        setBreakDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak, breakStart]);

  useEffect(() => {
    let interval;
    if (onLunch && lunchStart) {
      interval = setInterval(() => {
        setLunchDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onLunch, lunchStart]);

  // --- Format temps
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // --- Logs RH
  const logActivity = async (type, action) => {
    if (!auth.currentUser) return;
    await setDoc(
      doc(collection(db, "hr_logs")),
      {
        uid: auth.currentUser.uid,
        type,
        action,
        timestamp: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  // --- Go Online
  const toggleOnline = async () => {
    if (onBreak || onLunch) {
      alert("⚠️ Cannot go offline while on Break or Lunch!");
      return;
    }

    const newState = !online;
    setOnline(newState);

    if (newState) {
      const now = Date.now();
      setShiftStart(now);
      setShiftDuration(0);
      await logActivity("shift", "start");
    } else {
      await logActivity("shift", "end");
      setShiftStart(null);
      setShiftDuration(0);
      setBreakDuration(0);
      setLunchDuration(0);
      setOnBreak(false);
      setOnLunch(false);
    }
  };

  // --- Break
  const toggleBreak = async () => {
    if (onLunch) {
      alert("⚠️ You cannot take a Break while on Lunch!");
      return;
    }
    if (!online) {
      alert("⚠️ You must be Online to start a Break!");
      return;
    }

    const newState = !onBreak;
    setOnBreak(newState);

    if (newState) {
      if (!breakStart) setBreakStart(Date.now());
      await logActivity("break", "start");
      onLockScreenChange?.(true);
    } else {
      await logActivity("break", "end");
      setBreakStart(null);
      onLockScreenChange?.(false);
    }
  };

  // --- Lunch
  const toggleLunch = async () => {
    if (onBreak) {
      alert("⚠️ You cannot start Lunch during a Break!");
      return;
    }
    if (!online) {
      alert("⚠️ You must be Online to take Lunch!");
      return;
    }

    const newState = !onLunch;
    setOnLunch(newState);

    if (newState) {
      if (!lunchStart) setLunchStart(Date.now());
      await logActivity("lunch", "start");
      onLockScreenChange?.(true);
    } else {
      await logActivity("lunch", "end");
      setLunchStart(null);
      onLockScreenChange?.(false);
    }
  };

  const formattedShiftStart = shiftStart
    ? new Date(shiftStart).toLocaleTimeString()
    : "--:--:--";

  return (
    <header style={styles.header}>
      {/* --- Bloc gauche --- */}
      <div style={styles.leftBlock}>
        <div style={styles.shiftInfo}>
          <div style={styles.label}>🕒 Connected at:</div>
          <div style={styles.value}>{formattedShiftStart}</div>
        </div>

        <div style={styles.buttonBlock}>
          <button
            style={{
              ...styles.btnOnline,
              backgroundColor: online ? "#16A34A" : "#E5E7EB",
              color: online ? "white" : "#111827",
            }}
            onClick={toggleOnline}
            title={online ? "End your shift" : "Start your shift"}
          >
            {online ? "Go Offline" : "Go Online"}
          </button>
          <div style={styles.timerText}>{formatTime(shiftDuration)}</div>
        </div>
      </div>

      {/* --- Centre : Breaks --- */}
      <div style={styles.center}>
        <div style={styles.breakBlock}>
          <button
            style={{
              ...styles.btn,
              backgroundColor: onBreak ? "#F59E0B" : "#6B7280",
            }}
            onClick={toggleBreak}
          >
            {onBreak ? "End Break" : "Break"}
          </button>
          <div style={styles.timerText}>{formatTime(breakDuration)}</div>
        </div>

        <div style={styles.breakBlock}>
          <button
            style={{
              ...styles.btn,
              backgroundColor: onLunch ? "#F59E0B" : "#6B7280",
            }}
            onClick={toggleLunch}
          >
            {onLunch ? "End Lunch" : "Lunch"}
          </button>
          <div style={styles.timerText}>{formatTime(lunchDuration)}</div>
        </div>
      </div>

      {/* --- Profil (clic redirige) --- */}
      <div
        style={styles.profile}
        onClick={() => navigate("/admin-profile")}
        title="View Profile"
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <div style={styles.avatarBox}>
          {photoURL ? (
            <img src={photoURL} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {(fullName?.[0] || "U").toUpperCase()}
            </div>
          )}
        </div>
        <div style={styles.info}>
          <div style={styles.name}>{fullName || "User"}</div>
          <div style={styles.email}>{email}</div>
        </div>
      </div>
    </header>
  );
}

/* --- Styles --- */
const styles = {
  header: {
    position: "fixed",
    top: 0,
    left: "var(--sidebar-width)",
    right: 0,
    height: 85,
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    zIndex: 900,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    transition: "left 0.3s ease",
  },
  leftBlock: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  shiftInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
    color: "#374151",
  },
  label: { fontWeight: 600 },
  value: { fontSize: 14, color: "#111827" },
  buttonBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  btnOnline: {
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    padding: "10px 16px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  center: {
    display: "flex",
    alignItems: "flex-end",
    gap: 30,
  },
  breakBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  btn: {
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    padding: "10px 16px",
    cursor: "pointer",
    transition: "background 0.2s ease, transform 0.1s ease",
  },
  timerText: {
    fontSize: 12,
    color: "#374151",
    marginTop: 4,
  },
  profile: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    transition: "transform 0.2s ease",
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #E5E7EB",
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
    fontWeight: 600,
    color: "#374151",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  name: {
    fontWeight: 600,
    fontSize: 14,
    color: "#111827",
  },
  email: {
    fontSize: 12,
    color: "#6B7280",
  },
};
