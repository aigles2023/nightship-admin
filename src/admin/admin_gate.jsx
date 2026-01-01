import React, { useState } from 'react';
import FinalDelete from '../orders/final_delete';

const AdminGate = () => {
  const [code, setCode] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔐 Mot de passe admin (à changer si tu veux)
    if (code === '1234') {
      setAccessGranted(true);
      setError('');
    } else {
      setError('Incorrect admin PIN code.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }}>
      {accessGranted ? (
        <FinalDelete />
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 class='boot'>🔐 Admin Access</h2>
          <input
            type="password"
            placeholder="Enter admin PIN"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10 }}
          />
          <button type="submit">Access Final Delete</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      )}
    </div>
  );
};

export default AdminGate;
