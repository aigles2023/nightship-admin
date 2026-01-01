import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";
import HeaderBar from "../components/HeaderBar"; // ✅ on importe ton header global

const AppLayout = () => {
  return (
    <div style={styles.container}>
      {/* ✅ Barre latérale gauche fixe */}
      <Sidebar />

      {/* ✅ Conteneur principal */}
      <div style={styles.contentWrapper}>
        {/* ✅ Barre de navigation supérieure toujours visible */}
        <HeaderBar />

        {/* ✅ Contenu des pages en dessous */}
        <main style={styles.main}>
          <Outlet /> {/* Toutes les pages (Dashboard, Orders, Support, etc.) s’affichent ici */}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
    width: "100%",
    overflowX: "hidden", // ✅ évite les espaces blancs à droite
  },
  
  main: {
    flexGrow: 1,
    padding: "60px 0 32px", // ✅ espace ajouté sous le HeaderBar (fixe à 70px)
    overflowY: "auto",
    boxSizing: "border-box",
  },
  
};

export default AppLayout;
