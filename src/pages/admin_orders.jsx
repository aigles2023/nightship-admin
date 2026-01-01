
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const getNextStatus = (current) => {
    if (current === 'pending') return 'accepted';
    if (current === 'accepted') return 'completed';
    return 'pending';
  };

  const updateOrderStatus = async (orderId, currentStatus) => {
    const newStatus = getNextStatus(currentStatus);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
      });
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const archiveOrder = async (order) => {
    const confirm = window.confirm("Do you really want to delete this order? It will be moved to Archives.");
    if (!confirm) return;

    try {
      const user = auth.currentUser;
      const email = user?.email || "unknown";

      const orderRef = doc(db, 'orders', order.id);
      const deletedRef = doc(db, 'deleted_orders', order.id);

      await setDoc(deletedRef, {
        ...order,
        deletedBy: email,
        deletedAt: new Date()
      });

      await deleteDoc(orderRef);
      alert("Order moved to archive successfully.");
    } catch (error) {
      console.error('Error archiving order:', error);
    }
  };

  const handleEdit = (order) => {
    navigate(`/orders/${order.id}?edit=true`);
  };

  const handleView = (order) => {
    navigate(`/orders/${order.id}`);
  };

  const exportOrder = (order) => {
    console.log("Exporting order:", order);
    alert("Export function not implemented yet.");
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦 Real-Time Orders</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Status</th>
            <th style={th}>Customer</th>
            <th style={th}>Driver</th>
            <th style={th}>Delivery Date</th>
            <th style={th}>Notes</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={td}>{order.id}</td>
              <td style={td}>{order.status}</td>
              <td style={td}>{order.customerName || '—'}</td>
              <td style={td}>{order.acceptedBy || '—'}</td>
              <td style={td}>
                {order.deliveryDate?.toDate?.().toLocaleString() || '—'}
              </td>
              <td style={td}>
                {order.restoredFrom === 'final_delete_queue' && (
                  <span title="Restored from Final Delete" style={{ color: '#10B981' }}>
                    ♻️ Restored
                  </span>
                )}
              </td>
              <td style={td}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleView(order)}
                    style={buttonGray}
                    title="View order"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => handleEdit(order)}
                    style={buttonYellow}
                    title="Edit order"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => exportOrder(order)}
                    style={buttonPurple}
                    title="Export order"
                  >
                    📤
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, order.status)}
                    style={buttonBlue}
                    title="Change order status"
                  >
                    🔁
                  </button>
                  <button
                    onClick={() => archiveOrder(order)}
                    style={buttonRed}
                    title="Delete (move to Archives)"
                  >
                    🗑
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

const buttonBlue = {
  padding: '6px 10px',
  backgroundColor: '#3B82F6',
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

const buttonYellow = {
  padding: '6px 10px',
  backgroundColor: '#F59E0B',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

const buttonPurple = {
  padding: '6px 10px',
  backgroundColor: '#8B5CF6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

const buttonGray = {
  padding: '6px 10px',
  backgroundColor: '#6B7280',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

export default AdminOrders;
