import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const isActive = (path) => {
    if (path === '/orders') return location.pathname.startsWith('/orders');
    if (path === '/settings') return location.pathname.startsWith('/settings') || location.pathname.startsWith('/change-password') || location.pathname.startsWith('/about');
    return location.pathname === path;
  };

  const menu = [
    { path: '/', label: 'Dashboard' },
    { path: '/orders', label: 'Orders' },
    { path: '/archived-orders', label: 'Archives orders' },
    { path: '/users', label: 'Users' },
    { path: '/map', label: 'Live Map' },
    { path: '/support', label: 'Support' },
    { path: '/settings', label: 'Settings' },
    { path: '/admin', label: 'Admin' },
    { path: '/audit-logs', label: 'Audit Logs' },
  ];

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    });
  };

  const renderAvatar = () => {
    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt="Profile"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      );
    } else {
      const initials = user?.email?.charAt(0)?.toUpperCase() || '?';
      return (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 18
          }}
        >
          {initials}
        </div>
      );
    }
  };

  return (
    <div style={{
      width: '220px',
      background: '#111827',
      color: 'white',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      zIndex: 1000,
    }}>
      {/* Top section */}
      <div>
        <Link to="/admin-profile" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1rem',
            cursor: 'pointer'
          }}>
            {renderAvatar()}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Admin</span>
              <span style={{ fontSize: '0.8rem', color: '#ccc' }}>
                {user?.email || 'unknown@admin.com'}
              </span>
            </div>
          </div>
        </Link>

        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem' }}>
          {menu.map((item) => (
            <li key={item.path} style={{ marginBottom: '1rem' }}>
              <Link to={item.path} style={{
                color: isActive(item.path) ? '#10B981' : 'white',
                textDecoration: 'none',
                fontWeight: isActive(item.path) ? 'bold' : 'normal'
              }}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom section */}
      <div style={{ paddingTop: 50 }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            color: '#EF4444',
            fontSize: 16,
            cursor: 'pointer',
            padding: 0
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10v1" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
