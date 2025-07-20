// src/pages/Orders.jsx
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(data);
      },
      (error) => {
        console.error("Erreur lors de la récupération des commandes :", error);
      }
    );

    return () => unsubscribe(); // Nettoyage
  }, []);

  return (
    <div>
      <h1>Commandes en temps réel</h1>
      <table border="1" cellPadding="10" style={{ marginTop: '20px' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Client</th>
            <th>Conducteur</th>
            <th>Date de livraison</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.status}</td>
              <td>{order.senderName || 'N/A'}</td>
              <td>{order.acceptedBy || 'Non assigné'}</td>
              <td>{order.deliveryDate?.toDate?.().toLocaleString() || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;