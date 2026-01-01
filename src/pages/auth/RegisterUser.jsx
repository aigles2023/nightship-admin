import React, { useState, useEffect } from 'react';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Initialize main Firebase instance
import { auth, db, firebaseConfig } from '../../firebase/config';

const RegisterUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('customer-support');
  const [managerEmail, setManagerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [confirmEnabled, setConfirmEnabled] = useState(false);
  const navigate = useNavigate();

  // ✅ Récupère l'OPS connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setManagerEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Génère un mot de passe temporaire sécurisé
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const formatName = (str) => {
    return str
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // --- REGISTER FUNCTION ---
  const handleRegister = async () => {
    setLoading(true);
    const formattedName = formatName(name);
    const password = generatePassword();

    try {
      // ✅ Crée une instance secondaire pour ne pas déconnecter l’OPS actuel
      const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);

      // ✅ Création du compte Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // 🔸 Détermine la collection selon le rôle
      let collectionName = '';
      switch (role) {
        case 'customer-support':
          collectionName = 'customer-supports';
          break;
        case 'regular-manager':
          collectionName = 'regular-managers';
          break;
        case 'regular-supervisor':
          collectionName = 'regular-supervisors';
          break;
        case 'ops-manager':
          collectionName = 'ops-managers';
          break;
        default:
          collectionName = 'ops-managers';
      }

      // 🔸 Enregistre dans Firestore avec l'UID comme ID du document
      await setDoc(doc(collection(db, collectionName), uid), {
        uid,
        fullName: formattedName,
        email: email.toLowerCase(),
        role,
        createdAt: new Date().toISOString(),
        createdBy: managerEmail,
        isTemporaryPassword: true, // ✅ booléen lisible par Login.jsx
        temporaryPasswordValue: password, // facultatif (utile pour affichage OPS)
        status: 'active',
      });

      // ✅ Déconnecte le compte temporaire et détruit l’app secondaire
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      toast.success(
        `✅ User created successfully!\nTemporary password: ${password}`,
        {
          position: 'top-center',
          autoClose: 10000,
        }
      );

      setTimeout(() => navigate('/ops-dashboard'), 2000);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      toast.error('Error: ' + error.message, { position: 'top-center' });
    } finally {
      setLoading(false);
      setShowDialog(false);
      setConfirmEnabled(false);
    }
  };

  const openDialog = (e) => {
    e.preventDefault();
    setShowDialog(true);
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
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: '40px 35px',
          width: '90%',
          maxWidth: 420,
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
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
          <h2 style={{ color: '#0f172a', fontWeight: 600, fontSize: 22 }}>
            Register New User
          </h2>
        </div>

        <form onSubmit={openDialog}>
          <label style={{ display: 'block', marginBottom: 5 }}>Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={{ display: 'block', marginBottom: 5 }}>Email</label>
          <input
            type="email"
            placeholder="user@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={{ display: 'block', marginBottom: 5 }}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={inputStyle}
          >
            <option value="customer-support">Customer Support</option>
            <option value="regular-supervisor">Supervisor</option>
            <option value="regular-manager">Manager</option>
            <option value="ops-manager">OPS Manager</option>
          </select>

          <label style={{ display: 'block', marginBottom: 5 }}>Manager (OPS)</label>
          <input
            type="text"
            value={managerEmail}
            readOnly
            style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#6b7280' }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnPrimary,
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/ops-dashboard')}
            style={btnText}
          >
            Cancel
          </button>
        </form>
      </div>

      {showDialog && (
        <div style={dialogOverlay}>
          <div style={dialogBox}>
            <h3 style={{ color: '#111827', marginBottom: 10 }}>Confirm User Creation</h3>
            <p style={{ color: '#374151', fontSize: 14, marginBottom: 20 }}>
              By creating this user, you agree to respect our internal policies.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setShowDialog(false)}
                style={{ ...btnSecondary, backgroundColor: '#9ca3af' }}
              >
                Cancel
              </button>

              <button
                onClick={handleRegister}
                disabled={!confirmEnabled}
                style={{
                  ...btnSecondary,
                  backgroundColor: confirmEnabled ? '#2563eb' : '#cbd5e1',
                  cursor: confirmEnabled ? 'pointer' : 'not-allowed',
                }}
              >
                Approve
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 13, color: '#555' }}>
                <input
                  type="checkbox"
                  style={{ marginRight: 5 }}
                  onChange={(e) => setConfirmEnabled(e.target.checked)}
                />
                I have read and accept the terms of user creation.
              </label>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

// --- Styles ---
const inputStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 20,
  border: '1px solid #ccc',
  borderRadius: 8,
  fontSize: 15,
};

const btnPrimary = {
  width: '100%',
  padding: 12,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 500,
  transition: '0.3s',
};

const btnSecondary = {
  padding: '10px 25px',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 500,
};

const btnText = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontSize: 14,
  textDecoration: 'underline',
  cursor: 'pointer',
  marginTop: 10,
};

const dialogOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const dialogBox = {
  background: 'white',
  padding: '25px 30px',
  borderRadius: 12,
  width: '90%',
  maxWidth: 400,
  boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
};

export default RegisterUser;
