import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { FaUser, FaBell, FaQuestionCircle, FaGlobe, FaInfoCircle, FaLock, FaSignOutAlt } from 'react-icons/fa';

const Settings = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const settingsOptions = [
    {
      icon: <FaUser />,
      label: 'My Account',
      action: () => navigate('/admin-profile'),
    },
    {
      icon: <FaBell />,
      label: 'Notifications',
      action: () => navigate('/notifications'),
    },
    {
      icon: <FaQuestionCircle />,
      label: 'Help / FAQ',
      action: () => navigate('/support'),
    },
    {
      icon: <FaGlobe />,
      label: 'Languages',
      action: () => navigate('/languages'),
    },
    {
      icon: <FaInfoCircle />,
      label: 'About NightShip',
      action: () => navigate('/about'),
    },
    {
      icon: <FaLock />,
      label: 'Change Password',
      action: () => navigate('/change-password'),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Settings</h2>
        <p><strong>Email:</strong> {user?.email}</p>

        <div style={styles.optionsContainer}>
          {settingsOptions.map((option, index) => (
            <button key={index} onClick={option.action} style={styles.optionButton}>
              <span style={styles.icon}>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>

        <button onClick={handleSignOut} style={styles.signOutButton}>
          <FaSignOutAlt style={{ marginRight: '8px' }} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#222',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '20px',
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  icon: {
    marginRight: '10px',
  },
  signOutButton: {
    marginTop: '30px',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Settings;
