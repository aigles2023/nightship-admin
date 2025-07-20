import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const FinalDelete = () => {
  const [orders, setOrders] = useState([]);
  const [pin, setPin] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const secretPin = "1234"; // Change this later securely

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'final_delete_queue'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(data);
    });

    return () => unsub();
  }, []);

  const confirmAccess = () => {
    if (pin === secretPin) {
      setAuthorized(true);
    } else {
      alert("Incorrect PIN");
    }
  };

  const restoreOrder = async (order) => {
    try {
      const cleanOrder = { ...order };
      delete cleanOrder.finalDeletedAt;
      delete cleanOrder.finalDeletedBy;
      delete cleanOrder.deletedBy;
      delete cleanOrder.deletedAt;
      delete cleanOrder.restoredAt;

      cleanOrder.restoredAt = new Date();
      cleanOrder.status = cleanOrder.status || 'pending';

      await setDoc(doc(db, 'orders', order.id), cleanOrder);
      await deleteDoc(doc(db, 'final_delete_queue', order.id));
      alert("Order restored successfully.");
    } catch (error) {
      console.error("Error restoring order:", error);
      alert("Error restoring order.");
    }
  };

  const permanentlyDelete = async (orderId) => {
    const confirm = window.confirm("This will permanently delete the order. Proceed?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'final_delete_queue', orderId));
      alert("Order permanently deleted.");
    } catch (error) {
      console.error("Error deleting permanently:", error);
      alert("Error deleting order.");
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡 Final Delete - Admin Only</h1>

      {!authorized ? (
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="password"
            placeholder="Enter admin PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ padding: '10px', fontSize: '1rem' }}
          />
          <button onClick={confirmAccess} style={{ ...button, marginLeft: '10px' }}>
            Unlock
          </button>
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Order ID</th>
                <th style={th}>Final Deleted By</th>
                <th style={th}>Final Deleted At</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={td}>{order.id}</td>
                  <td style={td}>{order.finalDeletedBy || '—'}</td>
                  <td style={td}>
                    {order.finalDeletedAt?.toDate?.().toLocaleString() || '—'}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => restoreOrder(order)}
                        style={buttonGreen}
                        title="Restore"
                      >
                        ♻️
                      </button>
                      <button
                        onClick={() => permanentlyDelete(order.id)}
                        style={buttonRed}
                        title="Permanently delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
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

const button = {
  padding: '8px 14px',
  backgroundColor: '#4B5563',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1rem',
};

const buttonGreen = {
  ...button,
  backgroundColor: '#10B981'
};

const buttonRed = {
  ...button,
  backgroundColor: '#DC2626'
};

export default FinalDelete;
