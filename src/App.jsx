// --- src/App.jsx ---
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Layout principal
import AppLayout from "./layouts/AppLayout";

// Pages publiques
import Login from "./pages/login";
import ForgotPassword from "./pages/ForgotPassword";
import RegisterUser from "./pages/auth/RegisterUser";
import VerifyOpsAccess from "./pages/VerifyOpsAccess";

// Dashboards internes
import OpsDashboard from "./pages/dashboards/ops-manager/OpsDashboard";
import SupervisorDashboard from "./pages/dashboards/regular-supervisor/SupervisorDashboard";
import ManagerDashboard from "./pages/dashboards/regular-manager/ManagerDashboard";
import CSDashboard from "./pages/dashboards/customer-supports/CSDashboard";

// Modules unifiés
import OrdersDash from "./pages/orders-dash";
import UsersDash from "./pages/users-dash";
import DriverManagement from "./pages/driver-management";
import LiveMapDash from "./pages/live-map-dash";
import SupportDash from "./pages/support-dash";
import StatisticsDashboard from "./pages/StatisticsDashboard";
import SettingsDash from "./pages/settings-dash";
import AdminDash from "./pages/admin-dash";
import AuditLogsDash from "./pages/audit-logs-dash";
import ArchiveOrderDash from "./pages/archive-order-dash";
import TestPage from "./pages/test";

// Pages internes
import AdminProfile from "./pages/admin_profile";
import EditAdminProfile from "./pages/edit_profile";
import ChangePassword from "./pages/change_password";
import CreateOrder from "./pages/create_order";
import Languages from "./pages/languages";
import About from "./pages/about";

// ✅ Nouvelles pages profils
import DriverProfile from "./pages/DriverProfile";
import SenderProfile from "./pages/SenderProfile";

// ✅ Nouvelles pages commandes
import OrderDetails from "./pages/orderDetails";

import "./theme-fix.css";
import "./app.css";

const App = () => {
  const [user, setUser] = useState(undefined);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) return null; // évite affichage clignotant

  return (
    <Router>
      <Routes>
        {/* --- Routes publiques --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/verify-ops-access" element={<VerifyOpsAccess />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* --- Routes privées --- */}
        {user ? (
          <>
            <Route element={<AppLayout />}>
              {/* --- Dashboards et modules principaux --- */}
              <Route path="/orders" element={<OrdersDash />} />
              <Route path="/users" element={<UsersDash />} />
              <Route path="/driver-management" element={<DriverManagement />} />
              <Route path="/live-map" element={<LiveMapDash />} />
              <Route path="/support" element={<SupportDash />} />
              <Route path="/settings" element={<SettingsDash />} />
              <Route path="/admin" element={<AdminDash />} />
              <Route path="/audit-logs" element={<AuditLogsDash />} />
              <Route path="/archive-order-dash" element={<ArchiveOrderDash />} />
              <Route path="/test" element={<TestPage />} />

              {/* --- Pages internes --- */}
              <Route path="/admin-profile" element={<AdminProfile />} />
              <Route path="/edit-profile" element={<EditAdminProfile />} />
              <Route path="/create-order" element={<CreateOrder />} />
              <Route path="/languages" element={<Languages />} />
              <Route path="/about" element={<About />} />

              {/* --- Dashboards spécifiques --- */}
              <Route path="/cs-dashboard" element={<CSDashboard />} />
              <Route path="/statistics-dashboard" element={<StatisticsDashboard />} />
              <Route path="/ops-dashboard" element={<OpsDashboard />} />
              <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />

              {/* --- Profils utilisateurs --- */}
              <Route path="/driver/:id" element={<DriverProfile />} />
              <Route path="/sender/:id" element={<SenderProfile />} />

              {/* --- Détails commande --- */}
              <Route path="/orderDetails/:id" element={<OrderDetails />} />
            </Route>

            {/* --- Redirection par défaut --- */}
            <Route path="*" element={<Navigate to="/orders" />} />
          </>
        ) : (
          // 🚫 Non connecté → redirection vers login
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
