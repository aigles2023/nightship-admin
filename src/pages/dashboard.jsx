import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    orders: 0,
    drivers: 0,
    users: 0,
    delivered: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchAlerts();

    // Live listening for recent orders
    const q = query(collection(db, 'orders'), orderBy('deliveryDate', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(order => {
        if (filterStatus === 'all') return true;
        return order.status === filterStatus;
      });
      setRecentOrders(filtered);
    });

    return () => unsubscribe();
  }, [filterStatus]);

  const fetchStats = async () => {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const orders = ordersSnap.docs.map(doc => doc.data());

    const driversSnap = await getDocs(collection(db, 'drivers'));
    const usersSnap = await getDocs(collection(db, 'users'));

    const deliveredCount = orders.filter(o => o.status === 'completed').length;

    setStats({
      orders: orders.length,
      drivers: driversSnap.size,
      users: usersSnap.size,
      delivered: deliveredCount,
    });
  };

  const fetchAlerts = async () => {
    const now = new Date();
    const snap = await getDocs(collection(db, 'orders'));
    const alerts = snap.docs.map(doc => {
      const data = doc.data();
      if (data.status === 'pending' && data.createdAt?.toDate) {
        const age = (now - data.createdAt.toDate()) / (1000 * 60); // minutes
        if (age > 60) return { id: doc.id, ...data };
      }
      return null;
    }).filter(Boolean);
    setPendingAlerts(alerts);
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Orders',
      data: [5, 8, 12, 6, 14, 4, 7], // Placeholder
      backgroundColor: '#3B82F6'
    }]
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>📊 Admin Dashboard</h2>

      {/* Action Buttons */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button style={quickBtn} onClick={() => navigate('/create-order')}>
  ➕ Créer commande</button>
        <button style={quickBtn}>🧍‍♂️ Voir conducteurs actifs</button>
        <button style={quickBtn}>📬 Support</button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 30 }}>
        <Card icon="📦" label="Total Orders" value={stats.orders} />
        <Card icon="🚚" label="Drivers" value={stats.drivers} />
        <Card icon="👤" label="Customers" value={stats.users} />
        <Card icon="✅" label="Delivered" value={stats.delivered} />
      </div>

      {/* Bar Chart */}
      <div style={{ maxWidth: '600px', marginBottom: 40 }}>
        <Bar data={chartData} />
      </div>

      {/* Alerts */}
      <div style={{ marginBottom: 30 }}>
        <h3>⚠️ Alerts</h3>
        {pendingAlerts.length > 0 ? (
          <ul>
            {pendingAlerts.map(order => (
              <li key={order.id}>
                Order <strong>{order.id}</strong> pending for more than 1h
              </li>
            ))}
          </ul>
        ) : (
          <p>No alerts 🎉</p>
        )}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ marginRight: 10 }}>📂 Filter recent orders:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Recent Orders Table */}
      <div>
        <h3>🕒 Recent Orders</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Customer</th>
              <th style={th}>Status</th>
              <th style={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id}>
                <td style={td}>{order.id}</td>
                <td style={td}>{order.customerName || '—'}</td>
                <td style={td}>{order.status}</td>
                <td style={td}>{order.deliveryDate?.toDate?.().toLocaleString() || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Voir tout */}
        <button
          onClick={() => window.location.href = '/orders'}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Voir toutes les commandes →
        </button>
      </div>
    </div>
  );
};

const Card = ({ icon, label, value }) => (
  <div style={{
    flex: '1 1 200px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 20
  }}>
    <div style={{ fontSize: 30 }}>{icon}</div>
    <div style={{ fontWeight: 'bold', fontSize: 20 }}>{value}</div>
    <div style={{ color: '#6b7280' }}>{label}</div>
  </div>
);

const quickBtn = {
  padding: '10px 16px',
  backgroundColor: '#10B981',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold'
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

export default Dashboard;
