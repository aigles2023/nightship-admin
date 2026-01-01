import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function DriverManagement() {
  const auth = getAuth();
  const [userRole, setUserRole] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  /* =========================
      Helpers
  ========================== */

  const cleanVehicleType = (v) => {
    if (!v || String(v).trim() === "") return "Standard";
    let out = String(v);
    if (out.includes(".")) out = out.split(".").pop();
    out = out.replace(/([A-Z])/g, " $1").trim();
    out = out.replace(/\s+/g, " ").trim();
    const key = out.toLowerCase();

    const map = {
      "standard": "Standard",
      "comfort": "Comfort",
      "comfort xl": "Comfort XL",
      "electric": "Electric",
      "luxury": "Luxury",
      "black luxury": "Black Luxury",
    };

    return map[key] ?? (out.charAt(0).toUpperCase() + out.slice(1));
  };

  const isBlackColor = (color) => {
    const c = String(color || "").toLowerCase().trim();
    return c === "black" || c === "noir";
  };

  /**
   * Compute eligibleCategories based on selected "ride type" + driver vehicle constraints
   * - Comfort XL requires seats>=7 + hasAC
   * - Electric requires isElectric
   * - Luxury requires luxuryVerified
   * - Black Luxury requires luxuryVerified + black color + dressCode.black
   */
  const computeEligibleFromRideType = (rideType, driver) => {
    const seatsTotal = Number(driver?.vehicle?.seatsTotal || 0);
    const hasAC = driver?.vehicle?.hasAC === true;
    const isElectric = driver?.vehicle?.isElectric === true;
    const luxuryVerified = driver?.vehicle?.luxuryVerified === true;
    const blackOk = isBlackColor(driver?.vehicle?.color) && driver?.dressCode?.black === true;

    const base = ["Standard"]; // Standard always OK if 5 seats is enforced elsewhere

    const canXL = seatsTotal >= 7 && hasAC;
    const canElectric = isElectric;
    const canLuxury = luxuryVerified;
    const canBlack = luxuryVerified && blackOk;

    // Keep ordering stable
    const add = (arr, v) => (arr.includes(v) ? arr : [...arr, v]);

    let out = [...base];

    if (rideType === "Standard Ride") {
      // only Standard
      return out;
    }

    if (rideType === "Comfort Ride") {
      out = add(out, "Comfort");
      // Allow Comfort XL only if vehicle qualifies
      if (canXL) out = add(out, "Comfort XL");
      return out;
    }

    if (rideType === "Electric Ride") {
      out = add(out, "Comfort");
      if (canElectric) out = add(out, "Electric");
      return out;
    }

    if (rideType === "Electric XL Ride") {
      out = add(out, "Comfort");
      if (canXL) out = add(out, "Comfort XL");
      if (canElectric) out = add(out, "Electric");
      return out;
    }

    if (rideType === "Luxury Ride") {
      out = add(out, "Comfort");
      if (canXL) out = add(out, "Comfort XL");
      if (canElectric) out = add(out, "Electric");
      if (canLuxury) out = add(out, "Luxury");
      return out;
    }

    if (rideType === "Black Ride") {
      out = add(out, "Comfort");
      if (canXL) out = add(out, "Comfort XL");
      if (canElectric) out = add(out, "Electric");
      if (canLuxury) out = add(out, "Luxury");
      if (canBlack) out = add(out, "Black Luxury");
      return out;
    }

    // Women Ride is not a vehicle category; it is womenChoice eligibility (toggle)
    // We still give strong vehicle access (same as Electric XL) but womenEligible must be true.
    if (rideType === "Women Ride") {
      out = add(out, "Comfort");
      if (canXL) out = add(out, "Comfort XL");
      if (canElectric) out = add(out, "Electric");
      return out;
    }

    return out;
  };

  /**
   * Map rideType to driver main level (vehicleType) to align with backend driverCat logic
   */
  const rideTypeToDriverLevel = (rideType) => {
    switch (rideType) {
      case "Standard Ride":
        return "Standard";
      case "Comfort Ride":
        return "Comfort";
      case "Electric Ride":
      case "Electric XL Ride":
        return "Electric";
      case "Luxury Ride":
        return "Luxury";
      case "Black Ride":
        return "Black Luxury";
      case "Women Ride":
        // women is not a vehicle, choose a default level:
        // if driver electric -> Electric, else Comfort (simple)
        return "Comfort";
      default:
        return "Standard";
    }
  };

  /* =========================
      Role loading
  ========================== */

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const fetchRole = async () => {
      const roleDoc = await getDoc(doc(db, "users", user.uid));
      if (roleDoc.exists()) {
        setUserRole(roleDoc.data().role || "CS");
      } else {
        setUserRole("CS");
      }
    };
    fetchRole();
  }, [auth]);

  /* =========================
      Real-time drivers
  ========================== */

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "drivers"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDrivers(list);
    });
    return () => unsub();
  }, []);

  /* =========================
      Actions
  ========================== */

  const sendForManagerReview = async (id) => {
    try {
      await updateDoc(doc(db, "drivers", id), {
        status: "under_review",
        reviewedBy: auth.currentUser.uid,
        reviewedAt: new Date(),
      });
      alert("✅ Driver escalated to Manager for review.");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update status.");
    }
  };

  // Ride type mapping (labels only)
  const rideTypeMapping = useMemo(
    () => ({
      "Standard Ride": ["Standard", "Driver with Pet"],

      "Comfort Ride": ["Standard", "Comfort", "Comfort XL", "Driver with Pet"],

      "Electric Ride": ["Standard", "Comfort", "Electric", "Driver with Pet"],

      "Electric XL Ride": ["Standard", "Comfort", "Comfort XL", "Electric", "Driver with Pet"],

      "Luxury Ride": ["Standard", "Comfort", "Comfort XL", "Electric", "Luxury", "Driver with Pet"],

      "Black Ride": ["Standard", "Comfort", "Comfort XL", "Electric", "Luxury", "Black Luxury", "Driver with Pet"],

      // WomenPlus = womenChoice (not a vehicle category)
      "Women Ride": ["Standard", "Comfort", "Comfort XL", "Electric", "WomenPlus(womenChoice)", "Driver with Pet"],
    }),
    []
  );

  const approveDriver = async (id) => {
    try {
      await updateDoc(doc(db, "drivers", id), {
        status: "approved",
        isApproved: true,
        verifiedByAdmin: true, // ✅ IMPORTANT for backend dispatchRide filter
        approvedBy: auth.currentUser.uid,
        approvedAt: new Date(),
      });
      alert("✅ Driver approved successfully.");
    } catch (err) {
      console.error(err);
      alert("❌ Error while approving driver.");
    }
  };

  const rejectDriver = async (id) => {
    try {
      await updateDoc(doc(db, "drivers", id), {
        status: "rejected",
        isApproved: false,
        verifiedByAdmin: false,
        rejectedBy: auth.currentUser.uid,
        rejectedAt: new Date(),
      });
      alert("🚫 Driver marked as rejected.");
    } catch (err) {
      console.error(err);
      alert("❌ Error rejecting driver.");
    }
  };

  const handleFieldAction = async (driverId, fieldKey, action) => {
    const newStatus = action === "approve" ? "approved" : "needs_attention";
    try {
      if (fieldKey === "documents") {
        const driverRef = doc(db, "drivers", driverId);
        const updates = {};
        const snap = await getDoc(driverRef);
        if (snap.exists()) {
          const docs = snap.data().documents || {};
          Object.keys(docs).forEach((key) => {
            updates[`${key}Status`] = newStatus;
          });
        }
        await updateDoc(driverRef, updates);
      } else {
        const statusField = `${fieldKey}Status`;
        await updateDoc(doc(db, "drivers", driverId), { [statusField]: newStatus });
      }

      alert(
        action === "approve"
          ? `✅ ${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)} approved`
          : `⚠️ ${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)} flagged for review`
      );
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update status");
    }
  };

  /**
   * Assign ride type + compute eligibleCategories + set driver main level
   * Also handles:
   * - petFriendly toggle (separate)
   * - womenEligible toggle (WomenPlus / womenChoice eligibility)
   */
  const assignRideCategory = async (rideType) => {
    if (!selectedDriver?.id) return;

    try {
      const eligibleCategories = computeEligibleFromRideType(rideType, selectedDriver);
      const driverLevel = rideTypeToDriverLevel(rideType);

      // WomenPlus (womenChoice) is an eligibility toggle, not a vehicle category
      const womenEligible = rideType === "Women Ride" ? true : !!selectedDriver?.womenEligible;

      await updateDoc(doc(db, "drivers", selectedDriver.id), {
        finalAllowedRideType: rideType,
        vehicleType: cleanVehicleType(driverLevel),
        eligibleCategories,
        womenEligible,
        updatedBy: auth.currentUser.uid,
        updatedAt: new Date(),
      });

      setSelectedDriver((prev) => ({
        ...prev,
        finalAllowedRideType: rideType,
        vehicleType: cleanVehicleType(driverLevel),
        eligibleCategories,
        womenEligible,
      }));

      alert(`✅ Ride type assigned: ${rideType}`);
    } catch (e) {
      console.error(e);
      alert("❌ Failed to assign ride type.");
    }
  };

  const togglePetFriendly = async (driverId, value) => {
    try {
      await updateDoc(doc(db, "drivers", driverId), {
        petFriendly: !!value,
        updatedBy: auth.currentUser.uid,
        updatedAt: new Date(),
      });
      setSelectedDriver((prev) => ({ ...prev, petFriendly: !!value }));
    } catch (e) {
      console.error(e);
      alert("❌ Failed to update Pet friendly.");
    }
  };

  const toggleWomenEligible = async (driverId, value) => {
    try {
      await updateDoc(doc(db, "drivers", driverId), {
        womenEligible: !!value,
        updatedBy: auth.currentUser.uid,
        updatedAt: new Date(),
      });
      setSelectedDriver((prev) => ({ ...prev, womenEligible: !!value }));
    } catch (e) {
      console.error(e);
      alert("❌ Failed to update Women eligibility.");
    }
  };

  /* =========================
      Styles
  ========================== */

  const pageStyle = {
    marginLeft: "var(--sidebar-width)",
    marginTop: "85px",
    padding: "32px",
    backgroundColor: "#F3F4F6",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
    marginRight: "380px",
  };

  const btnStyle = {
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "background 0.2s ease",
  };

  /* =========================
      Modal
  ========================== */

  const ReviewModal = ({ driver }) => {
    if (!driver) return null;
    const docs = driver.documents || {};

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
        }}
        onClick={() => setShowModal(false)}
      >
        <div
          style={{
            width: "500px",
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
            Review Documents
          </h3>

          {Object.keys(docs).length === 0 ? (
            <p>No documents uploaded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(docs).map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#4F46E5", textDecoration: "underline" }}
                >
                  📎 {key}
                </a>
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
            {userRole === "CS" && (
              <>
                <button
                  style={btnStyle}
                  onClick={() => {
                    sendForManagerReview(driver.id);
                    setShowModal(false);
                  }}
                >
                  Send for Manager Review
                </button>
                <button
                  style={{ ...btnStyle, backgroundColor: "#DC2626" }}
                  onClick={() => {
                    rejectDriver(driver.id);
                    setShowModal(false);
                  }}
                >
                  Reject
                </button>
              </>
            )}

            {userRole === "Manager" && (
              <button
                style={{ ...btnStyle, backgroundColor: "#16A34A" }}
                onClick={() => {
                  approveDriver(driver.id);
                  setShowModal(false);
                }}
              >
                Approve Driver
              </button>
            )}

            <button
              style={{ ...btnStyle, backgroundColor: "#9CA3AF" }}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* =========================
      Details
  ========================== */

  const DriverDetails = ({ driver }) => {
    if (!driver) return null;

    const formatAddress = (addr) => {
      if (!addr) return "";
      if (typeof addr === "string") return addr;
      const parts = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean);
      return parts.join(", ");
    };

    const docs = driver.documents || {};

    let licenseStatus = "";
    if (driver.license && driver.license.expiration) {
      const expParts = String(driver.license.expiration).split(/[\/-]/);
      if (expParts.length === 3) {
        const [mm, dd, yy] = expParts;
        const year = yy.length === 2 ? "20" + yy : yy;
        const expDate = new Date(parseInt(year, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
        licenseStatus = expDate >= new Date() ? "Active" : "Expired";
      }
    }

    const vehicleType = cleanVehicleType(driver.vehicleType);

    // Requirements checks for warnings
    const seatsTotal = Number(driver?.vehicle?.seatsTotal || 0);
    const hasAC = driver?.vehicle?.hasAC === true;
    const isElectric = driver?.vehicle?.isElectric === true;
    const luxuryVerified = driver?.vehicle?.luxuryVerified === true;
    const blackOk = isBlackColor(driver?.vehicle?.color) && driver?.dressCode?.black === true;

    const warnings = [];
    if (vehicleType === "Comfort XL" && (seatsTotal < 7 || !hasAC)) {
      warnings.push("Comfort XL requires seatsTotal >= 7 and AC.");
    }
    if (vehicleType === "Electric" && !isElectric) {
      warnings.push("Electric level requires vehicle.isElectric = true.");
    }
    if (vehicleType === "Luxury" && !luxuryVerified) {
      warnings.push("Luxury level requires vehicle.luxuryVerified = true.");
    }
    if (vehicleType === "Black Luxury" && (!luxuryVerified || !blackOk)) {
      warnings.push("Black Luxury requires luxuryVerified + black vehicle color + driver dressCode.black = true.");
    }
    if (driver?.womenEligible === true && (driver?.gender !== "F" || driver?.genderVerified !== true)) {
      warnings.push("Women eligibility requires gender=F and genderVerified=true.");
    }

    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginTop: 20,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {driver.fullName || driver.name || "Unnamed"}
          </h3>
          <span style={{ fontSize: 14, color: "#6B7280" }}>
            Account created on{" "}
            {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : "—"}
          </span>
        </div>

        {warnings.length > 0 && (
          <div
            style={{
              border: "1px solid #F59E0B",
              backgroundColor: "#FFFBEB",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
              color: "#92400E",
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            <b>⚠️ Requirements warning</b>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Personal and DOB */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Name & DOB</h4>
          <p style={{ margin: "4px 0" }}>
            <b>Full Name:</b> {driver.name || driver.fullName || "—"}
          </p>
          <p style={{ margin: "4px 0" }}>
            <b>Date of Birth:</b> {driver.dob || "—"}
          </p>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              style={{ ...btnStyle, backgroundColor: "#16A34A" }}
              onClick={() => handleFieldAction(driver.id, "personal", "approve")}
            >
              Approve
            </button>
            <button
              style={{ ...btnStyle, backgroundColor: "#DC2626" }}
              onClick={() => handleFieldAction(driver.id, "personal", "reject")}
            >
              Reject
            </button>
          </div>
        </div>

        {/* Contact details */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Contact Details</h4>
          <p style={{ margin: "4px 0" }}>
            <b>Email:</b> {driver.email || "—"}
          </p>
          <p style={{ margin: "4px 0" }}>
            <b>Phone:</b> {driver.phone || "—"}
          </p>
          <p style={{ margin: "4px 0" }}>
            <b>Address:</b> {formatAddress(driver.address) || "—"}
          </p>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              style={{ ...btnStyle, backgroundColor: "#16A34A" }}
              onClick={() => handleFieldAction(driver.id, "contact", "approve")}
            >
              Approve
            </button>
            <button
              style={{ ...btnStyle, backgroundColor: "#DC2626" }}
              onClick={() => handleFieldAction(driver.id, "contact", "reject")}
            >
              Reject
            </button>
          </div>
        </div>

        {/* Driver license */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Driver License</h4>
          {driver.license ? (
            <>
              <p style={{ margin: "4px 0" }}>
                <b>Number:</b> {driver.license.number || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>State:</b> {driver.license.state || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Expiration:</b> {driver.license.expiration || "—"}
                {licenseStatus && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: licenseStatus === "Active" ? "#16A34A" : "#DC2626",
                      fontWeight: 600,
                    }}
                  >
                    ({licenseStatus})
                  </span>
                )}
              </p>
            </>
          ) : (
            <p style={{ margin: "4px 0", fontStyle: "italic" }}>No license info</p>
          )}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              style={{ ...btnStyle, backgroundColor: "#16A34A" }}
              onClick={() => handleFieldAction(driver.id, "license", "approve")}
            >
              Approve
            </button>
            <button
              style={{ ...btnStyle, backgroundColor: "#DC2626" }}
              onClick={() => handleFieldAction(driver.id, "license", "reject")}
            >
              Reject
            </button>
          </div>
        </div>

        {/* Vehicle information */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Vehicle Information</h4>
          {driver.vehicle ? (
            <>
              <p style={{ margin: "4px 0" }}>
                <b>Brand:</b> {driver.vehicle.brand || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Make:</b> {driver.vehicle.make || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Year:</b> {driver.vehicle.year || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Color:</b> {driver.vehicle.color || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Plate:</b> {driver.vehicle.plate || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>State:</b> {driver.vehicle.state || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Seats Total:</b> {driver.vehicle.seatsTotal ?? "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>AC:</b> {driver.vehicle.hasAC ? "Yes" : "No"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Electric:</b> {driver.vehicle.isElectric ? "Yes" : "No"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>Luxury Verified:</b> {driver.vehicle.luxuryVerified ? "Yes" : "No"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <b>DressCode Black:</b> {driver.dressCode?.black ? "Yes" : "No"}
              </p>
            </>
          ) : (
            <p style={{ margin: "4px 0", fontStyle: "italic" }}>No vehicle info</p>
          )}

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              style={{ ...btnStyle, backgroundColor: "#16A34A" }}
              onClick={() => handleFieldAction(driver.id, "vehicle", "approve")}
            >
              Approve
            </button>
            <button
              style={{ ...btnStyle, backgroundColor: "#DC2626" }}
              onClick={() => handleFieldAction(driver.id, "vehicle", "reject")}
            >
              Reject
            </button>
          </div>
        </div>

        {/* ===========================================================
            RIDE CATEGORY APPROVAL (CS)
        =========================================================== */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
            Ride Category Approval (CS Only)
          </h4>

          {userRole !== "CS" ? (
            <p style={{ fontStyle: "italic", color: "#6B7280" }}>
              Only CS can assign allowed ride categories.
            </p>
          ) : (
            <>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.keys(rideTypeMapping).map((type) => (
                  <div
                    key={type}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 10,
                      border: "1px solid #E5E7EB",
                      borderRadius: 10,
                      backgroundColor: "#F9FAFB",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="radio"
                        name="ride-type"
                        checked={selectedDriver?.finalAllowedRideType === type}
                        onChange={() => assignRideCategory(type)}
                      />
                      <span style={{ fontWeight: 700 }}>{type}</span>
                    </label>

                    <span style={{ fontSize: 12, color: "#6B7280", textAlign: "right" }}>
                      {rideTypeMapping[type].join(", ")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 10,
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <b>Driver with Pet</b>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      Allow this driver to accept rides with pets.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!selectedDriver?.petFriendly}
                    onChange={(e) => togglePetFriendly(driver.id, e.target.checked)}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 10,
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <b>WomenPlus (womenChoice)</b>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      Driver must be Female + genderVerified to really be eligible.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!selectedDriver?.womenEligible}
                    onChange={(e) => toggleWomenEligible(driver.id, e.target.checked)}
                  />
                </div>
              </div>

              {/* Summary */}
              <div style={{ marginTop: 12, fontSize: 13, color: "#374151" }}>
                <div>
                  <b>Driver Level:</b> {cleanVehicleType(selectedDriver?.vehicleType)}
                </div>
                <div>
                  <b>Eligible Categories:</b>{" "}
                  {selectedDriver?.eligibleCategories?.length
                    ? selectedDriver.eligibleCategories.join(", ")
                    : "—"}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Uploaded documents */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Uploaded Documents</h4>
          {Object.keys(docs).length === 0 ? (
            <p style={{ fontStyle: "italic" }}>No documents uploaded</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(docs).map(([key, url]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 120, fontWeight: 600, textTransform: "capitalize" }}>
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  {url ? (
                    <>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#2563EB", textDecoration: "underline" }}
                      >
                        View
                      </a>
                      <a href={url} download style={{ color: "#2563EB", textDecoration: "underline" }}>
                        Download
                      </a>
                    </>
                  ) : (
                    <span style={{ color: "#DC2626" }}>Missing</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              style={{ ...btnStyle, backgroundColor: "#16A34A" }}
              onClick={() => handleFieldAction(driver.id, "documents", "approve")}
            >
              Approve
            </button>
            <button
              style={{ ...btnStyle, backgroundColor: "#DC2626" }}
              onClick={() => handleFieldAction(driver.id, "documents", "reject")}
            >
              Reject
            </button>
          </div>
        </div>

        {/* Bottom action panel */}
        <div
          style={{
            borderTop: "1px solid #E5E7EB",
            paddingTop: 16,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {userRole === "CS" && driver.status !== "approved" && (
            <>
              <button
                style={{ ...btnStyle, backgroundColor: "#6B7280" }}
                onClick={() => {
                  const ok = window.confirm(
                    "Have you reviewed all documents and compared them with the provided information?"
                  );
                  if (ok) alert("Driver review completed");
                }}
              >
                Review Driver
              </button>

              <button
                style={{ ...btnStyle, backgroundColor: "#16A34A" }}
                onClick={() => {
                  const ok = window.confirm("Approve this driver?");
                  if (ok) approveDriver(driver.id);
                }}
              >
                Approve Driver
              </button>

              <button
                style={{ ...btnStyle, backgroundColor: "#2563EB" }}
                onClick={() => {
                  const ok = window.confirm("Send for Manager review?");
                  if (ok) sendForManagerReview(driver.id);
                }}
              >
                Send to Manager
              </button>

              <button
                style={{ ...btnStyle, backgroundColor: "#DC2626" }}
                onClick={() => {
                  const ok = window.confirm("Reject this driver?");
                  if (ok) rejectDriver(driver.id);
                }}
              >
                Reject Driver
              </button>
            </>
          )}

          {userRole === "Manager" && driver.status === "under_review" && (
            <button
              style={{ ...btnStyle, backgroundColor: "#16A34A" }}
              onClick={() => {
                const ok = window.confirm("Approve this driver?");
                if (ok) approveDriver(driver.id);
              }}
            >
              Approve Driver
            </button>
          )}
        </div>
      </div>
    );
  };

  /* =========================
      Counts & filtering
  ========================== */

  const counts = {
    pending: drivers.filter((d) => d.status === "pending").length,
    under_review: drivers.filter((d) => d.status === "under_review").length,
    approved: drivers.filter((d) => d.status === "approved").length,
    rejected: drivers.filter((d) => d.status === "rejected").length,
  };

  const filteredList = drivers.filter((d) => {
    if (activeTab === "pending") return d.status === "pending";
    if (activeTab === "waiting") return d.status === "under_review";
    if (activeTab === "approved") return d.status === "approved";
    if (activeTab === "rejected") return d.status === "rejected";
    return true;
  });

  const rightPanelStyle = {
    position: "fixed",
    right: 0,
    top: "85px",
    width: "360px",
    height: "calc(100vh - 85px)",
    backgroundColor: "#F8FAFC",
    borderLeft: "1px solid #E5E7EB",
    boxShadow: "-1px 0 4px rgba(0,0,0,0.05)",
    padding: "24px",
    overflowY: "auto",
    zIndex: 50,
    transition: "all 0.3s ease",
  };

  return (
    <>
      {/* LEFT MAIN AREA */}
      <div style={pageStyle}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Driver Management
        </h2>

        {selectedDriver ? (
          <DriverDetails driver={selectedDriver} />
        ) : (
          <p style={{ color: "#6B7280", fontStyle: "italic" }}>
            Select a driver from the list to view details.
          </p>
        )}

        {showModal && <ReviewModal driver={selectedDriver} />}
      </div>

      {/* RIGHT FIXED PANEL */}
      <div style={rightPanelStyle}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          Current Drivers
        </h3>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {[
            { key: "pending", label: "Pending", color: "#16A34A" },
            {
              key: "waiting",
              label: "Waiting for approval",
              color: "#2563EB",
              hidden: counts.under_review === 0,
            },
            { key: "approved", label: "Approved", color: "#1D4ED8" },
            { key: "rejected", label: "Rejected", color: "#DC2626" },
          ]
            .filter((t) => !t.hidden)
            .map((tab) => (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 10px",
                  borderRadius: 8,
                  backgroundColor: activeTab === tab.key ? `${tab.color}22` : "#F3F4F6",
                  color: activeTab === tab.key ? tab.color : "#374151",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {tab.label}
                {tab.key === "pending" && counts.pending > 0 && (
                  <span
                    style={{
                      backgroundColor: "#16A34A",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {counts.pending}
                  </span>
                )}
                {tab.key === "rejected" && counts.rejected > 0 && (
                  <span
                    style={{
                      backgroundColor: "#DC2626",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {counts.rejected}
                  </span>
                )}
              </div>
            ))}
        </div>

        {/* Scrollable list */}
        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {filteredList.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 10 }}>
              No drivers in this category.
            </p>
          ) : (
            filteredList.slice(0, 20).map((driver) => (
              <div
                key={driver.id}
                onClick={() => {
                  setSelectedDriver(driver);
                  setShowModal(false);
                }}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 12,
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <b style={{ fontSize: 14 }}>{driver.fullName || "Unnamed"}</b>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <div style={{ fontStyle: "italic", fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                  Driver • Details →
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
