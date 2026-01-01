import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import Sidebar from "../components/sidebar";

const CreateOrder = () => {
  const [form, setForm] = useState({
    status: "pending",
    acceptedBy: "",
    pickupAddress: "",
    deliveryAddress: "",
    deliveryDate: "",
    packageDescription: "",
    estimatedPrice: "",
    packageWeight: "",
    deliveryType: "standard",
    senderFullName: "",
    senderAddress: "",
    senderPhone: "",
    senderEmail: "",
    receiverFullName: "",
    receiverAddress: "",
    receiverPhone: "",
    receiverEmail: "",
  });

  const [drivers, setDrivers] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [priceCalculated, setPriceCalculated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const snap = await getDocs(collection(db, "drivers"));
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setDrivers(list);
  };

  // --- Google Autocomplete Hooks ---
  const {
    ready: pickupReady,
    value: pickupValue,
    suggestions: { status: pickupStatus, data: pickupSuggestions },
    setValue: setPickupValue,
    clearSuggestions: clearPickupSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: { componentRestrictions: { country: "us" } },
  });

  const {
    ready: deliveryReady,
    value: deliveryValue,
    suggestions: { status: deliveryStatus, data: deliverySuggestions },
    setValue: setDeliveryValue,
    clearSuggestions: clearDeliverySuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: { componentRestrictions: { country: "us" } },
  });

  const handleSelectPickup = async (address) => {
    setPickupValue(address, false);
    clearPickupSuggestions();
    setForm((prev) => ({ ...prev, pickupAddress: address }));
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setPickupCoords({ lat, lng });
  };

  const handleSelectDelivery = async (address) => {
    setDeliveryValue(address, false);
    clearDeliverySuggestions();
    setForm((prev) => ({ ...prev, deliveryAddress: address }));
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setDeliveryCoords({ lat, lng });
  };

  // --- Distance / Price ---
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleEstimatePrice = () => {
    if (pickupCoords && deliveryCoords) {
      const dist = haversineDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        deliveryCoords.lat,
        deliveryCoords.lng
      );
      const price = Math.max(5, (dist * 0.75).toFixed(2));
      setForm((prev) => ({ ...prev, estimatedPrice: price }));
      setPriceCalculated(true);
    } else {
      alert("Please select both pickup and delivery addresses.");
    }
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pickupCoords || !deliveryCoords) {
      alert("Please select both pickup and delivery addresses.");
      return;
    }

    if (form.pickupAddress === form.deliveryAddress) {
      alert("Pickup and delivery addresses cannot be identical.");
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        ...form,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        deliveryLat: deliveryCoords.lat,
        deliveryLng: deliveryCoords.lng,
        deliveryDate: Timestamp.fromDate(new Date(form.deliveryDate)),
        createdAt: Timestamp.now(),
      });

      alert("✅ Order successfully sent!");
      navigate("/orders");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // --- Render ---
  return (
    <div style={layout.container}>
      <Sidebar />
      <main style={layout.main}>
        <div style={container}>
          <h2 style={title}>➕ New Delivery Order</h2>

          <form onSubmit={handleSubmit} style={formStyle}>
            <h3 style={sectionTitle}>Sender Information</h3>
            <input
              type="text"
              name="senderFullName"
              placeholder="Sender Full Name"
              value={form.senderFullName}
              onChange={handleChange}
              style={inputStyle}
              required
            />
            <input
              type="text"
              name="senderAddress"
              placeholder="Sender Address"
              value={form.senderAddress}
              onChange={handleChange}
              style={inputStyle}
              required
            />
            <input
              type="tel"
              name="senderPhone"
              placeholder="Sender Phone"
              value={form.senderPhone}
              onChange={handleChange}
              style={inputStyle}
              required
            />
            <input
              type="email"
              name="senderEmail"
              placeholder="Sender Email (optional)"
              value={form.senderEmail}
              onChange={handleChange}
              style={inputStyle}
            />

            <h3 style={sectionTitle}>Receiver Information</h3>
            <input
              type="text"
              name="receiverFullName"
              placeholder="Receiver Full Name"
              value={form.receiverFullName}
              onChange={handleChange}
              style={inputStyle}
              required
            />
            <input
              type="text"
              name="receiverAddress"
              placeholder="Receiver Address"
              value={form.receiverAddress}
              onChange={handleChange}
              style={inputStyle}
              required
            />
            <input
              type="tel"
              name="receiverPhone"
              placeholder="Receiver Phone"
              value={form.receiverPhone}
              onChange={handleChange}
              style={inputStyle}
              required
            />
            <input
              type="email"
              name="receiverEmail"
              placeholder="Receiver Email (optional)"
              value={form.receiverEmail}
              onChange={handleChange}
              style={inputStyle}
            />

            <h3 style={sectionTitle}>Order Details</h3>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>

            <select
              name="acceptedBy"
              value={form.acceptedBy}
              onChange={handleChange}
              style={inputStyle}
              disabled={form.status === "pending"} // ✅ disable driver selection when pending
            >
              <option value="">
                {form.status === "pending"
                  ? "Unavailable while Pending"
                  : "Select a Driver"}
              </option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName || driver.email || driver.id}
                </option>
              ))}
            </select>

            {/* Address Autocomplete */}
            <div style={{ position: "relative" }}>
              <input
                value={pickupValue}
                onChange={(e) => setPickupValue(e.target.value)}
                disabled={!pickupReady}
                placeholder="Pickup Address"
                style={inputStyle}
              />
              {pickupStatus === "OK" && (
                <ul style={dropdown}>
                  {pickupSuggestions.map(({ place_id, description }) => (
                    <li
                      key={place_id}
                      onClick={() => handleSelectPickup(description)}
                      style={dropdownItem}
                    >
                      {description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <input
                value={deliveryValue}
                onChange={(e) => setDeliveryValue(e.target.value)}
                disabled={!deliveryReady}
                placeholder="Delivery Address"
                style={inputStyle}
              />
              {deliveryStatus === "OK" && (
                <ul style={dropdown}>
                  {deliverySuggestions.map(({ place_id, description }) => (
                    <li
                      key={place_id}
                      onClick={() => handleSelectDelivery(description)}
                      style={dropdownItem}
                    >
                      {description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              type="datetime-local"
              name="deliveryDate"
              value={form.deliveryDate}
              onChange={handleChange}
              style={inputStyle}
              required
              min={new Date().toISOString().slice(0, 16)}
              max={new Date(Date.now() + 7 * 86400000)
                .toISOString()
                .slice(0, 16)}
            />

            <textarea
              name="packageDescription"
              placeholder="Package Description"
              value={form.packageDescription}
              onChange={handleChange}
              style={{ ...inputStyle, height: "80px" }}
            />

            <input
              type="number"
              name="packageWeight"
              placeholder="Package Weight (kg)"
              value={form.packageWeight}
              onChange={handleChange}
              style={inputStyle}
            />

            <select
              name="deliveryType"
              value={form.deliveryType}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="same_day">Same Day</option>
            </select>

            {!priceCalculated && (
              <button
                type="button"
                onClick={handleEstimatePrice}
                style={secondaryBtn}
              >
                💰 Get a Price
              </button>
            )}

            {priceCalculated && (
              <>
                <p style={{ color: "#111827", fontWeight: "600" }}>
                  Estimated Price: <b>${form.estimatedPrice}</b>
                </p>
                <button type="submit" style={submitBtn}>
                  🚀 Send
                </button>
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

/* --- Styles --- */
const layout = {
  container: {
    display: "flex",
    backgroundColor: "#F9FAFB",
    fontFamily: "Inter, sans-serif",
    color: "#374151",
    minHeight: "100vh",
  },
  main: {
    flexGrow: 1,
    padding: 32,
    overflowY: "auto",
    marginLeft: "var(--sidebar-width)",
  },
};

const container = {
  maxWidth: "650px",
  margin: "40px auto",
  padding: "24px",
  background: "#fff",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const title = {
  textAlign: "center",
  marginBottom: "20px",
  fontSize: "1.6rem",
  color: "#111827",
};

const sectionTitle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  marginTop: "15px",
  color: "#1F2937",
};

const formStyle = { display: "flex", flexDirection: "column", gap: "14px" };
const inputStyle = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};
const submitBtn = {
  padding: "12px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#10B981",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "1rem",
};
const secondaryBtn = {
  padding: "10px",
  backgroundColor: "#3B82F6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};
const dropdown = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  background: "white",
  border: "1px solid #ccc",
  borderRadius: "6px",
  zIndex: 1000,
  maxHeight: "150px",
  overflowY: "auto",
};
const dropdownItem = {
  padding: "10px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
  backgroundColor: "#fff",
  transition: "background 0.2s",
};

export default CreateOrder;
