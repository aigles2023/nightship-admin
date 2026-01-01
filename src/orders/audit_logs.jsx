import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
    });

    return () => unsub();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋 Audit Logs</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Action</th>
            <th style={th}>Order ID</th>
            <th style={th}>User</th>
            <th style={th}>From</th>
            <th style={th}>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td style={td}>{log.action}</td>
              <td style={td}>{log.orderId}</td>
              <td style={td}>{log.userEmail}</td>
              <td style={td}>{log.from || '—'}</td>
              <td style={td}>
                {log.timestamp?.toDate?.().toLocaleString() || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const th = {
  border: '1px solid #ccc',
  padding: '10px',
  background: '#f5f5f5',
  textAlign: 'left',
};

const td = {
  border: '1px solid #ccc',
  padding: '10px',
};

export default AuditLogs;
