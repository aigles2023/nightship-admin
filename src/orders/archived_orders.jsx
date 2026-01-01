import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';

const ArchivedOrders = () => {
  const [archivedOrders, setArchivedOrders] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'deleted_orders'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArchivedOrders(data);
    });

    return () => unsub();
  }, []);

  const moveToFinalDelete = async (order) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this order? This action cannot be undone.");
    if (!confirm) return;

    try {
      const currentUser = auth.currentUser?.email || "unknown";

      await setDoc(doc(db, 'final_delete_queue', order.id), {
        ...order,
        finalDeletedBy: currentUser,
        finalDeletedAt: new Date(),
      });

      await deleteDoc(doc(db, 'deleted_orders', order.id));

      alert("Order moved to final delete queue.");
    } catch (error) {
      console.error("Error moving to final delete:", error);
    }
  };

  const restoreOrder = async (order) => {
    try {
      await setDoc(doc(db, 'orders', order.id), {
        ...order,
        restoredFrom: 'deleted_orders',
        restoredAt: new Date()
      });

      await deleteDoc(doc(db, 'deleted_orders', order.id));

      alert("Order restored to active orders.");
    } catch (error) {
      console.error("Error restoring order:", error);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁 Archived Orders</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Deleted By</th>
            <th style={th}>Deleted At</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {archivedOrders.map((order) => (
            <tr key={order.id}>
              <td style={td}>{order.id}</td>
              <td style={td}>{order.deletedBy || '—'}</td>
              <td style={td}>
                {order.deletedAt?.toDate?.().toLocaleString() || '—'}
              </td>
              <td style={td}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => restoreOrder(order)}
                    style={buttonGreen}
                    title="Restore to Orders"
                  >
                    ♻️
                  </button>
                  <button
                    onClick={() => moveToFinalDelete(order)}
                    style={buttonRed}
                    title="Permanently delete (admin only)"
                  >
                    ❌
                  </button>
                </div>
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

const buttonGreen = {
  padding: '6px 10px',
  backgroundColor: '#10B981',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

const buttonRed = {
  padding: '6px 10px',
  backgroundColor: '#DC2626',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

export default ArchivedOrders;
