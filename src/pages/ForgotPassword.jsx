import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase/config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  React.useEffect(() => {
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  const showError = (msg) => toast.error(msg, { position: 'top-center', theme: 'colored' });
  const showSuccess = (msg) => toast.success(msg, { position: 'top-center', theme: 'colored' });

  // Étape 1 : Vérification utilisateur
  const handleNextStep1 = async () => {
    if (!fullName || !email) return showError('Please fill in all fields.');

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showError('User not found. Please contact support: 571-349-6741 or support@shipdash.com');
        return;
      }

      const userData = querySnapshot.docs[0].data();
      const allowedRoles = ['ops', 'manager', 'supervisor', 'cs'];

      if (!allowedRoles.includes(userData.role)) {
        showError('User not found. Please contact support: 571-349-6741 or support@shipdash.com');
        return;
      }

      // Génération du code OTP à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      console.log('🔹 OTP Sent (simulation):', code);

      showSuccess('Verification code sent to your email.');
      setStep(2);
    } catch (error) {
      console.error(error);
      showError('Something went wrong.');
    }
  };

  // Étape 2 : Vérification du code
  const handleVerifyCode = () => {
    if (!enteredCode.match(/^[0-9]{6}$/)) {
      showError('Please enter a valid 6-digit code.');
      return;
    }

    if (enteredCode === generatedCode) {
      showSuccess('Code verified successfully!');
      setIsVerified(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        showError('Too many attempts. Please contact support: 571-349-6741 or support@shipdash.com');
        setTimeout(() => navigate('/login'), 4000);
      } else {
        showError(`Incorrect code. Attempt ${newAttempts}/3`);
      }
    }
  };

  const handleNextToChangePassword = () => {
    if (!isVerified) return;
    navigate('/change-password');
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
        {/* --- Logo SD --- */}
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
            Reset Password
          </h2>
        </div>

        {/* Étape 1 */}
        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleNextStep1}
              disabled={!fullName || !email}
              style={{
                ...btnPrimary,
                backgroundColor: fullName && email ? '#2563eb' : '#9ca3af',
                cursor: fullName && email ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={enteredCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setEnteredCode(val);
              }}
              style={inputStyle}
            />
            <button onClick={handleVerifyCode} style={btnSecondary}>
              Verify
            </button>
            <button
              onClick={handleNextToChangePassword}
              disabled={!isVerified}
              style={{
                ...btnPrimary,
                backgroundColor: isVerified ? '#2563eb' : '#9ca3af',
                cursor: isVerified ? 'pointer' : 'not-allowed',
                marginTop: 10,
              }}
            >
              Next
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/login')}
          style={{ ...btnText, marginTop: 15 }}
        >
          Back to Login
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

const btnSecondary = {
  ...btnPrimary,
  backgroundColor: '#7c3aed',
  marginTop: 5,
};

const btnText = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontSize: 14,
  textDecoration: 'underline',
  cursor: 'pointer',
};

export default ForgotPassword;
