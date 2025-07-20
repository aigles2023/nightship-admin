import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Restriction de longueur minimale
    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Admin Login</h2>
      <form onSubmit={handleLogin}>
        {/* Email */}
        <label style={{ display: 'block', marginBottom: 5 }}>Email</label>
        <input
          type="email"
          placeholder="example@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            padding: 10,
            marginBottom: 20,
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        />

        {/* Password */}
        <label style={{ display: 'block', marginBottom: 5 }}>Password</label>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '10px 40px 10px 10px',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          />
          {/* Icône œil en SVG */}
          <button
            type="button"
            onClick={toggleShowPassword}
            style={{
              position: 'absolute',
              top: '50%',
              right: 10,
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
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

        {/* Login button */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 10,
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Login
        </button>

        {/* Forgot password */}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <Link to="/reset-password" style={{ color: '#007bff', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
