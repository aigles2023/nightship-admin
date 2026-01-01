// --- src/pages/Login.jsx ---
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDocs, query, where, collection, doc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../firebase/config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const showError = (message) => {
    toast.error(message, {
      position: "top-center",
      autoClose: 3500,
      theme: "colored",
    });
  };

  const showSuccess = (message) => {
    toast.success(message, {
      position: "top-center",
      autoClose: 2500,
      theme: "colored",
    });
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    showError("Please fill in all fields.");
    return;
  }

  const emailClean = email.trim().toLowerCase();

  try {
    // --- Étape 1 : Vérifie Firestore ---
    const collections = [
      "customer-supports",
      "ops-managers",
      "regular-managers",
      "regular-supervisors",
    ];

    let userData = null;
    let userRole = null;
    let userDocRef = null;

    for (const col of collections) {
      const q = query(collection(db, col), where("email", "==", emailClean));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        userData = docSnap.data();
        userRole = userData.role;
        userDocRef = doc(db, col, docSnap.id);
        break;
      }
    }

    // --- Aucun compte trouvé ---
    if (!userData) {
      showError("User not found. Please contact support.");
      return;
    }

    // --- Étape 2 : Mot de passe temporaire ? ---
    if (userData.isTemporaryPassword) {
      toast.warn("Temporary password detected. Please change it first.", {
        position: "top-center",
        autoClose: 4000,
        theme: "colored",
      });

      // ⛔ Important : on retourne immédiatement
      setTimeout(() => {
        navigate("/change-password", {
          state: {
            email: emailClean,
            ref: userDocRef.path,
            role: userRole,
          },
        });
      }, 500);

      return Promise.reject("TEMP_PASSWORD"); // ⛔ Stoppe ici la suite
    }

    // --- Étape 3 : Connexion Firebase Auth ---
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailClean,
      password
    );
    const user = userCredential.user;
    console.log("✅ Authenticated:", user.email);

    // --- Étape 4 : Redirection selon le rôle ---
    showSuccess(`Welcome back, ${userRole}!`);
    setTimeout(() => {
      switch (userRole) {
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
          showError("Access denied. Invalid role.");
          signOut(auth);
      }
    }, 800);
  } catch (error) {
    if (error === "TEMP_PASSWORD") return; // ✅ ignore cette erreur spéciale

    console.error("🔥 Login error:", error);
    const code = error.code;
    if (code === "auth/user-not-found" || code === "auth/invalid-email") {
      showError("User not found. Please contact support.");
    } else if (code === "auth/wrong-password") {
      showError("Incorrect password.");
    } else {
      showError(`Login failed: ${error.message}`);
    }
  }
};

  const handleRegisterAccess = () => navigate("/verify-ops-access");

  // --- UI ---
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fc",
        fontFamily: "Inter, sans-serif",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: "40px 35px",
          width: "90%",
          maxWidth: 400,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          transform: fadeIn ? "scale(1)" : "scale(0.95)",
          opacity: fadeIn ? 1 : 0,
          transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* --- LOGO --- */}
        <div style={{ textAlign: "center", marginBottom: 15 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "white",
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 10,
              boxShadow: "0 3px 10px rgba(37, 99, 235, 0.3)",
            }}
          >
            SD
          </div>
          <h2
            style={{
              textAlign: "center",
              color: "#0f172a",
              fontWeight: 600,
              fontSize: 22,
              margin: 0,
            }}
          >
            ShipDash Addmin
          </h2>
        </div>

        {/* --- FORM --- */}
        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginBottom: 5 }}>Email</label>
          <input
            type="email"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginBottom: 20,
              border: "1px solid #ccc",
              borderRadius: 8,
              fontSize: 15,
            }}
          />

          <label style={{ display: "block", marginBottom: 5 }}>Password</label>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 40px 12px 12px",
                border: "1px solid #ccc",
                borderRadius: 8,
                fontSize: 15,
              }}
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              style={{
                position: "absolute",
                top: "50%",
                right: 10,
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
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
                {showPassword ? (
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
            </button>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            Login
          </button>

          {/* --- Forgot password + Register User --- */}
          <div
            style={{
              textAlign: "center",
              marginTop: 15,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Forgot password?
            </Link>
            <span style={{ color: "#888" }}>|</span>
            <button
              type="button"
              onClick={() => navigate("/verify-ops-access")}
              style={{
                color: "#2563eb",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: 14,
              }}
            >
              Register User
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
