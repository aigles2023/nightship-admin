
import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';

const AdminProfile = () => {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const fetchUserData = async () => {
    if (user) {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        setUserData({});
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const renderAvatar = () => {
    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt="Avatar"
          onClick={() => setShowModal(true)}
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: '1rem',
            boxShadow: '0 0 8px rgba(0,0,0,0.2)',
            cursor: 'pointer'
          }}
        />
      );
    } else {
      const initials = user?.email?.charAt(0)?.toUpperCase() || 'U';
      return (
        <div
          onClick={() => setShowModal(true)}
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            color: 'white',
            fontSize: 40,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 8px rgba(0,0,0,0.2)',
            cursor: 'pointer'
          }}
        >
          {initials}
        </div>
      );
    }
  };

  const exportToText = () => {
    const textContent = `
Admin Profile
-------------
Full Name: ${userData?.firstName || '-'} ${userData?.lastName || '-'}
Username: ${userData?.username || '-'}
Email: ${user?.email || '-'}
UID: ${user?.uid}
Role: ${userData?.role || 'admin'}
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'admin_profile.txt';
    link.click();
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '26px', marginBottom: '30px', textAlign: 'center' }}>
        👋 Welcome back, {userData?.firstName || 'Admin'}!
      </h2>

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '30px 40px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {renderAvatar()}

        <div style={{ width: '100%', textAlign: 'left', marginTop: '10px' }}>
          <p><strong>First Name:</strong> {userData?.firstName || '-'}</p>
          <p><strong>Last Name:</strong> {userData?.lastName || '-'}</p>
          <p><strong>Username:</strong> {userData?.username || '-'}</p>
          <p><strong>Email:</strong> {user?.email || '-'}</p>
          <p><strong>User ID:</strong> {user?.uid}</p>
          <p><strong>Role:</strong> 
            <span style={{
              padding: '2px 8px',
              backgroundColor: userData?.role === 'superadmin' ? '#F59E0B' : '#3B82F6',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              marginLeft: '6px'
            }}>
              {userData?.role || 'admin'}
            </span>
          </p>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/edit-profile')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit
          </button>

          <button
            onClick={fetchUserData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            🔁 Refresh
          </button>

          <button
            onClick={exportToText}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            📤 Export
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            position: 'relative',
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
            animation: 'zoomIn 0.3s ease-in-out'
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                fontWeight: 'bold',
                cursor: 'pointer',
                color: '#444'
              }}
            >
              ×
            </button>
            <img
              src={user?.photoURL}
              alt="Large avatar"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes zoomIn {
          from { transform: scale(0.8); opacity: 0.3 }
          to { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;
