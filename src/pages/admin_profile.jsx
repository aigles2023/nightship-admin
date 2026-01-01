import React, { useEffect, useState, useRef } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, storage } from "../firebase/config";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";

// Valid US state codes
const VALID_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

export default function AdminProfile() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // 🆕 Control the width of the profile card. The previous implementation
  // placed everything in a narrow column which felt cramped. We'll
  // explicitly set a max width and center the content to make better
  // use of horizontal space on larger screens.
  const containerStyle = {
    ...styles.container,
    maxWidth: "900px",
    width: "100%",
    margin: "0 auto",
  };

  // 🔹 Fetch user data
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "admins", user.uid);

    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        const authData = {
          fullName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
        };
        setUserData(authData);
      }
    });

    return () => unsub();
  }, [user]);

  // 🔹 Upload new photo (persistent)
  const handlePhotoUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const preview = URL.createObjectURL(file);
  setPhotoPreview(preview);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("⚠️ You must be logged in to upload a profile photo.");
      return;
    }

    const uid = currentUser.uid;
    const ext = file.name.split('.').pop() || 'jpg';
    const fileRef = storageRef(storage, `avatars/${uid}/profile.${ext}`);

    // 1️⃣ Upload to Firebase Storage
    await uploadBytes(fileRef, file);

    // 2️⃣ Get public URL
    const url = await getDownloadURL(fileRef);

    // 3️⃣ Update Firebase Auth profile
    await updateProfile(currentUser, { photoURL: url });

    // 4️⃣ Save to Firestore (change "customer-supports" → "admins")
    await setDoc(doc(db, "admins", uid), {
      photoURL: url,
      updatedAt: new Date(),
    }, { merge: true });

    // 5️⃣ Update UI
    setUserData((prev) => ({ ...prev, photoURL: url }));
    setPhotoPreview("");
    alert("✅ Profile picture updated successfully!");
  } catch (error) {
    console.error("Upload failed:", error);
    alert("❌ Failed to upload image. Check console for details.");
  }
};


  // 🔹 Input handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;

    // Full name: only letters
    if (name === "fullName") {
      formatted = value.replace(/[^a-zA-Z\s]/g, "");
    }

    // City: only letters
    if (name === "city") {
      formatted = value.replace(/[^a-zA-Z\s]/g, "");
    }

    // ZIP: digits only, 5 max
    if (name === "zip") {
      formatted = value.replace(/\D/g, "").slice(0, 5);
    }

    // State: 2 uppercase letters, valid states only
    if (name === "state") {
      formatted = value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
    }

    // Phone: auto format (XXX)-XXX-XXXX
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      let result = digits;
      if (digits.length > 3 && digits.length <= 6) {
        result = `(${digits.slice(0, 3)})-${digits.slice(3)}`;
      } else if (digits.length > 6) {
        result = `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      formatted = result;
    }

    // DOB: auto format MM/DD/YYYY
    if (name === "dob") {
      const digits = value.replace(/\D/g, "").slice(0, 8);
      let result = digits;
      if (digits.length > 2 && digits.length <= 4) {
        result = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else if (digits.length > 4) {
        result = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      }
      formatted = result;
    }

    setUserData((prev) => ({ ...prev, [name]: formatted }));
  };

  // 🔹 Validation rules (at save)
  const validateFields = () => {
    const errs = {};

    // Full Name
    if (!userData.fullName?.trim()) errs.fullName = "Full name is required.";

    // DOB
    if (!userData.dob?.trim()) {
      errs.dob = "Date of birth is required.";
    } else {
      const [m, d, y] = userData.dob.split("/").map(Number);
      const valid =
        m >= 1 &&
        m <= 12 &&
        d >= 1 &&
        d <= 31 &&
        y >= 1900 &&
        y <= 2015 &&
        !(m === 2 && d > 29);
      if (!valid) errs.dob = "Invalid date of birth (MM/DD/YYYY).";
    }

    // Phone
    const phoneDigits = userData.phone?.replace(/\D/g, "");
    if (!phoneDigits || phoneDigits.length !== 10)
      errs.phone = "Phone number must be 10 digits.";

    // Address
    if (!userData.street?.trim()) errs.street = "Street is required.";
    if (!userData.city?.trim()) errs.city = "City is required.";
    if (!userData.state?.trim() || !VALID_STATES.includes(userData.state))
      errs.state = "Invalid state code.";
    if (!userData.zip?.trim() || userData.zip.length !== 5)
      errs.zip = "ZIP must be 5 digits.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 🔹 Save data
  const saveChanges = async () => {
    if (!validateFields()) {
      alert("❌ Please fix the highlighted errors.");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "admins", user.uid), userData, {
        merge: true,
      });
      alert("✅ Changes saved successfully.");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cancel edits
  const cancelChanges = () => {
    setEditMode(false);
    setErrors({});
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate("/settings")}>← Back to Settings</button>
      <h2 style={styles.title}>My Account</h2>
      <div style={containerStyle}>
        {/* --- Profile Picture --- */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Profile Picture</h3>
          <div style={styles.photoBox}>
            {photoPreview || userData.photoURL || user?.photoURL ? (
              <img
                src={photoPreview || userData.photoURL || user?.photoURL}
                alt="Profile"
                style={styles.photo}
              />
            ) : (
              <div style={styles.placeholder}>
                {(userData.fullName?.[0] || "U").toUpperCase()}
              </div>
            )}
            {editMode && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  style={styles.uploadBtn}
                >
                  📸 Upload New Photo
                </button>
              </>
            )}
            <p style={styles.note}>Accepted format: square or passport-style.</p>
          </div>
          {/* Move Edit button here when not editing */}
          {!editMode && (
            <button onClick={() => setEditMode(true)} style={{ ...styles.editBtn, marginTop: 16 }}>
              ✏️ Edit Profile
            </button>
          )}
        </section>


        {/* --- Personal Info --- */}
<section style={styles.section}>
  <h3 style={styles.sectionTitle}>Personal Information</h3>
  <div style={styles.grid}>
    {/* Full Name */}
    <label style={styles.label}>
      <span style={styles.labelText}>Full Name</span>
      {editMode ? (
        <input
          name="fullName"
          value={userData.fullName || ""}
          onChange={handleChange}
          disabled={!editMode}
          style={{
            ...styles.input,
            ...(errors.fullName && styles.errorInput),
          }}
        />
      ) : (
        <div style={styles.displayValue}>{userData.fullName || "—"}</div>
      )}
    </label>

    {/* Date of Birth */}
    <label style={styles.label}>
      <span style={styles.labelText}>Date of Birth</span>
      {editMode ? (
        <input
          name="dob"
          value={userData.dob || ""}
          onChange={handleChange}
          placeholder="MM/DD/YYYY"
          disabled={!editMode}
          style={{
            ...styles.input,
            ...(errors.dob && styles.errorInput),
          }}
        />
      ) : (
        <div style={styles.displayValue}>{userData.dob || "—"}</div>
      )}
    </label>

    {/* Gender */}
    <label style={styles.label}>
      <span style={styles.labelText}>Gender</span>
      {editMode ? (
        <select
          name="gender"
          value={userData.gender || ""}
          onChange={handleChange}
          disabled={!editMode}
          style={styles.input}
        >
          <option value="">Select gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      ) : (
        <div style={styles.displayValue}>{userData.gender || "—"}</div>
      )}
    </label>

    {/* Email */}
    <label style={styles.label}>
      <span style={styles.labelText}>Email</span>
      <input
        type="email"
        value={user?.email || ""}
        disabled
        style={{ ...styles.input, backgroundColor: "#E5E7EB" }}
      />
      <small style={styles.note}>Contact support-tech@shipdash.com to change.</small>
    </label>

    {/* Phone Number */}
    <label style={styles.label}>
      <span style={styles.labelText}>Phone Number</span>
      {editMode ? (
        <input
          name="phone"
          value={userData.phone || ""}
          onChange={handleChange}
          placeholder="(000)-000-0000"
          disabled={!editMode}
          style={{
            ...styles.input,
            ...(errors.phone && styles.errorInput),
          }}
        />
      ) : (
        <div style={styles.displayValue}>{userData.phone || "—"}</div>
      )}
    </label>
  </div>
</section>

{/* --- Address --- */}
<section style={styles.section}>
  <h3 style={styles.sectionTitle}>Address</h3>
  <div style={styles.grid}>
    {/* Street */}
    <label style={styles.label}>
      <span style={styles.labelText}>Street</span>
      {editMode ? (
        <input
          name="street"
          value={userData.street || ""}
          onChange={handleChange}
          disabled={!editMode}
          style={{
            ...styles.input,
            ...(errors.street && styles.errorInput),
          }}
        />
      ) : (
        <div style={styles.displayValue}>{userData.street || "—"}</div>
      )}
    </label>

    {/* City */}
    <label style={styles.label}>
      <span style={styles.labelText}>City</span>
      {editMode ? (
        <input
          name="city"
          value={userData.city || ""}
          onChange={handleChange}
          disabled={!editMode}
          style={{
            ...styles.input,
            ...(errors.city && styles.errorInput),
          }}
        />
      ) : (
        <div style={styles.displayValue}>{userData.city || "—"}</div>
      )}
    </label>

    {/* State */}
    <label style={styles.label}>
      <span style={styles.labelText}>State</span>
      {editMode ? (
        <input
          name="state"
          value={userData.state || ""}
          onChange={handleChange}
          disabled={!editMode}
          style={{
            ...styles.input,
            ...(errors.state && styles.errorInput),
          }}
        />
      ) : (
        <div style={styles.displayValue}>{userData.state || "—"}</div>
      )}
    </label>

    {/* ZIP Code */}
    <label style={styles.label}>
      <span style={styles.labelText}>ZIP Code</span>
      {editMode ? (
        <input
          name="zip"
          value={userData.zip || ""}
          onChange={handleChange}
          disabled={!editMode}
          style={{
            ...styles.input,
            ...(errors.zip && styles.errorInput),
          }}
        />
      ) : (
        <div style={styles.displayValue}>{userData.zip || "—"}</div>
      )}
    </label>

    {/* Country (always USA) */}
    <label style={styles.label}>
      <span style={styles.labelText}>Country</span>
      <input
        value="USA"
        readOnly
        style={{
          ...styles.input,
          backgroundColor: "#D1D5DB",
          color: "#111827",
        }}
      />
    </label>
  </div>
</section>


        {/* --- Buttons for edit mode --- */}
        {editMode && (
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button onClick={saveChanges} style={styles.saveBtn}>
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
            <button onClick={cancelChanges} style={styles.cancelBtn}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Styles --- */
const styles = {
  page: {
    marginLeft: "var(--sidebar-width)",
    padding: "40px",
    backgroundColor: "#F9FAFB",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
    transition: "margin-left 0.3s ease",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#2563EB",
    cursor: "pointer",
    fontSize: "16px",
    marginBottom: "20px",
  },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 30 },
  container: { display: "flex", flexDirection: "column", gap: 30 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
label: {
  display: 'flex',
  flexDirection: 'column',
  fontSize: 14,
},

labelText: {
  fontWeight: 600, // ✅ gras uniquement sur le titre du champ
  marginBottom: 4,
},

  input: {
    marginTop: 6,
    padding: 10,
    borderRadius: 6,
    border: "1px solid #D1D5DB",
    fontSize: 14,
    color: "#111827",
  },
  errorInput: {
    border: "1px solid #DC2626",
    backgroundColor: "#FEE2E2",
  },
  // When not editing, fields are displayed as plain text rather than inputs. We
  // use a simple style that mimics the spacing and typography of the input
  // fields but removes the border/background to clearly indicate read-only.
  displayValue: {
    marginTop: 6,
    padding: "10px 0",
    fontSize: 14,
    color: "#111827",
    minHeight: 38,
    borderBottom: "1px solid #E5E7EB",
  },
  photoBox: { display: "flex", flexDirection: "column", alignItems: "center" },
  photo: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: "50%",
    border: "3px solid #E5E7EB",
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    backgroundColor: "#E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 40,
    color: "#6B7280",
  },
  uploadBtn: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    padding: "8px 14px",
    border: "none",
    borderRadius: 6,
    marginTop: 8,
    cursor: "pointer",
  },
  note: { fontSize: 12, color: "#6B7280" },
  editBtn: {
    backgroundColor: "#6B7280",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  saveBtn: {
    backgroundColor: "#3B82F6",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  cancelBtn: {
    backgroundColor: "#9CA3AF",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
};
