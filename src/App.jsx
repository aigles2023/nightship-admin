import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Layout
import AppLayout from './layouts/applayout';

// Pages
import Dashboard from './pages/dashboard';
import Users from './pages/Users';
import Map from './pages/live_map';
import Support from './pages/Support';
import Settings from './pages/settings';
import Login from './pages/login';
import AdminOrders from './pages/admin_orders';
import OrderDetails from './orders/orders_details';
import ArchivedOrders from './orders/archived_orders';
import FinalDelete from './orders/final_delete';
import AuditLogs from './orders/audit_logs';
import AdminGate from './admin/admin_gate';
import CreateOrder from './pages/create_order';
import ChangePassword from './pages/change_password';
import AdminProfile from './pages/admin_profile';
import EditAdminProfile from './pages/edit_profile';
import Languages from './pages/languages';


import About from './pages/about';

// Styles
import './app.css';

const App = () => {
  const [user, setUser] = useState(undefined);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) return null;

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="map" element={<Map />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="archived-orders" element={<ArchivedOrders />} />
          <Route path="final-delete" element={<FinalDelete />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="admin" element={<AdminGate />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
          <Route path="/edit-profile" element={<EditAdminProfile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/about" element={<About />} />
           <Route path="/languages" element={<Languages />} />

        </Route>
      </Routes>
    </Router>
  );
};

export default App;
