import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '../firebase/config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const VerifyOpsAccess = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [opsUser, setOpsUser] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  const showError = (msg) => toast.error(msg, { position: 'top-center', theme: 'colored' });
  const showSuccess = (msg) => toast.success(msg, { position: 'top-center', theme: 'colored' });

  // STEP 1 — Verify Username
  const handleVerifyUsername = async () => {
    if (!username.trim()) return;

    try {
      const q = query(collection(db, 'users'), where('username', '==', username.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        showError('Username not found. Please contact support.');
        return;
      }

      const userData = snapshot.docs[0].data();
      if (userData.role !== 'ops') {
        showError('Access denied. Only OPS users can register new users.');
        return;
      }

      setOpsUser(userData);
      showSuccess('Username verified!');
      setStep(2);
    } catch (err) {
      console.error(err);
      showError('Something went wrong while verifying username.');
    }
  };

  // STEP 2 — Verify Email
  const handleVerifyEmail = async () => {
    if (!email.trim()) return;

    if (opsUser.email !== email.trim()) {
      showError('Email does not match this OPS account.');
      return;
    }

    showSuccess('Email verified!');
    setStep(3);
  };

  // STEP 3 — Verify Password
  const handleVerifyPassword = async () => {
    if (!password.trim()) return;

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      showSuccess('Access granted! Redirecting...');
      setTimeout(() => navigate('/register-user'), 1500);
    } catch (err) {
      showError('Incorrect password.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fc',
        fontFamily: 'Inter, sans-serif',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: '40px 35px',
          width: '90%',
          maxWidth: 400,
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
          transform: fadeIn ? 'scale(1)' : 'scale(0.95)',
          opacity: fadeIn ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: 'white',
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 10,
              boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
            }}
          >
            SD
          </div>
          <h2 style={{ color: '#0f172a', fontWeight: 600, fontSize: 22, margin: 0 }}>
            Verify OPS Access
          </h2>
        </div>

        {/* --- Step 1: Username --- */}
        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Enter OPS Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleVerifyUsername}
              disabled={username.trim().length < 2}
              style={{
                ...btnPrimary,
                backgroundColor: username.trim().length >= 2 ? '#2563eb' : '#9ca3af',
                cursor: username.trim().length >= 2 ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </>
        )}

        {/* --- Step 2: Email --- */}
        {step === 2 && (
          <>
            <input
              type="email"
              placeholder="Enter OPS Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleVerifyEmail}
              disabled={!email.trim()}
              style={{
                ...btnPrimary,
                backgroundColor: email.trim() ? '#2563eb' : '#9ca3af',
                cursor: email.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </>
        )}

        {/* --- Step 3: Password --- */}
        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="Enter OPS Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleVerifyPassword}
              disabled={!password.trim()}
              style={{
                ...btnPrimary,
                backgroundColor: password.trim() ? '#2563eb' : '#9ca3af',
                cursor: password.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Verify
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/login')}
          style={{ ...btnText, marginTop: 15 }}
        >
          Cancel
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

// Styles
const inputStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 15,
  border: '1px solid #ccc',
  borderRadius: 8,
  fontSize: 15,
};

const btnPrimary = {
  width: '100%',
  padding: 12,
  border: 'none',
  color: '#fff',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 500,
  transition: '0.3s',
};

const btnText = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontSize: 14,
  textDecoration: 'underline',
  cursor: 'pointer',
};

export default VerifyOpsAccess;
