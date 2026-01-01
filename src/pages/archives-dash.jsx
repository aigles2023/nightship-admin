import React from "react";
import Sidebar from "../components/sidebar";

export default function ArchivesDash() {
  return (
    <>
      <Sidebar />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "var(--sidebar-width)",
          right: 0,
          bottom: 0,
          backgroundColor: "#F9FAFB",
          padding: "40px",
          overflowY: "auto",
          transition: "all 0.3s ease",
          zIndex: 1,
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111" }}>
          ✅ If you see this text, layout works!
        </h1>
        <p>
          This is static text placed in a div that respects your sidebar width.
        </p>
        <div
          style={{
            marginTop: "30px",
            background: "#fff",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <p>Sample box – should appear right of the sidebar.</p>
        </div>
      </div>
    </>
  );
}
