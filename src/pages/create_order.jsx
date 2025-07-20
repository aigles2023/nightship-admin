import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CreateOrder = () => {
  const [form, setForm] = useState({
    customerName: '',
    status: 'pending',
    acceptedBy: '',
    pickupAddress: '',
    deliveryAddress: '',
    deliveryDate: '',
    packageDescription: '',
    estimatedPrice: '',
    packageWeight: '',
    deliveryType: 'standard',
    packagePhotoURL: '',
  });

  const [drivers, setDrivers] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const snap = await getDocs(collection(db, 'drivers'));
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDrivers(list);
  };

  // --- Autocomplete Hooks ---
  const {
    ready: pickupReady,
    value: pickupValue,
    suggestions: { status: pickupStatus, data: pickupSuggestions },
    setValue: setPickupValue,
    clearSuggestions: clearPickupSuggestions,
  } = usePlacesAutocomplete({ debounce: 300, requestOptions: { componentRestrictions: { country: 'us' } } });

  const {
    ready: deliveryReady,
    value: deliveryValue,
    suggestions: { status: deliveryStatus, data: deliverySuggestions },
    setValue: setDeliveryValue,
    clearSuggestions: clearDeliverySuggestions,
  } = usePlacesAutocomplete({ debounce: 300, requestOptions: { componentRestrictions: { country: 'us' } } });

  const handleSelectPickup = async (address) => {
    setPickupValue(address, false);
    clearPickupSuggestions();
    setForm(prev => ({ ...prev, pickupAddress: address }));
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setPickupCoords({ lat, lng });
  };

  const handleSelectDelivery = async (address) => {
    setDeliveryValue(address, false);
    clearDeliverySuggestions();
    setForm(prev => ({ ...prev, deliveryAddress: address }));
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setDeliveryCoords({ lat, lng });
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleEstimatePrice = () => {
    if (pickupCoords && deliveryCoords) {
      const dist = haversineDistance(pickupCoords.lat, pickupCoords.lng, deliveryCoords.lat, deliveryCoords.lng);
      const price = Math.max(5, (dist * 0.75).toFixed(2));
      setForm(prev => ({ ...prev, estimatedPrice: price }));
    } else {
      alert("Tu dois sélectionner une adresse de départ et d’arrivée.");
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return '';
    const storage = getStorage();
    const storageRef = ref(storage, `package_photos/${Date.now()}_${photoFile.name}`);
    await uploadBytes(storageRef, photoFile);
    return await getDownloadURL(storageRef);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pickupCoords || !deliveryCoords) return alert("Tu dois sélectionner les deux adresses via autocomplétion.");
    if (form.pickupAddress === form.deliveryAddress) return alert("Pickup et delivery ne peuvent pas être identiques.");

    try {
      const photoURL = await uploadPhoto();

      await addDoc(collection(db, 'orders'), {
        ...form,
        packagePhotoURL: photoURL,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        deliveryLat: deliveryCoords.lat,
        deliveryLng: deliveryCoords.lng,
        deliveryDate: Timestamp.fromDate(new Date(form.deliveryDate)),
        createdAt: Timestamp.now()
      });

      alert('✅ Commande créée avec succès !');
      navigate('/orders');
    } catch (error) {
      alert('Erreur : ' + error.message);
    }
  };

  return (
    <div style={container}>
      <h2 style={title}>➕ Nouvelle commande</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input type="text" name="customerName" placeholder="Nom du client" value={form.customerName} onChange={handleChange} style={inputStyle} required />
        <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
        </select>

        <select name="acceptedBy" value={form.acceptedBy} onChange={handleChange} style={inputStyle}>
          <option value="">Aucun conducteur (auto-attribution)</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>{driver.fullName || driver.email || driver.id}</option>
          ))}
        </select>

        <div style={{ position: 'relative' }}>
          <input value={pickupValue} onChange={(e) => setPickupValue(e.target.value)} disabled={!pickupReady} placeholder="Adresse de départ" style={inputStyle} />
          {pickupStatus === 'OK' && <ul style={dropdown}>{pickupSuggestions.map(({ place_id, description }) => (<li key={place_id} onClick={() => handleSelectPickup(description)} style={dropdownItem}>{description}</li>))}</ul>}
        </div>

        <div style={{ position: 'relative' }}>
          <input value={deliveryValue} onChange={(e) => setDeliveryValue(e.target.value)} disabled={!deliveryReady} placeholder="Adresse de livraison" style={inputStyle} />
          {deliveryStatus === 'OK' && <ul style={dropdown}>{deliverySuggestions.map(({ place_id, description }) => (<li key={place_id} onClick={() => handleSelectDelivery(description)} style={dropdownItem}>{description}</li>))}</ul>}
        </div>

        <input type="datetime-local" name="deliveryDate" value={form.deliveryDate} onChange={handleChange} style={inputStyle} required min={new Date().toISOString().slice(0, 16)} max={new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16)} />

        <textarea name="packageDescription" placeholder="Description du colis" value={form.packageDescription} onChange={handleChange} style={{ ...inputStyle, height: '80px' }} />

        <input type="number" name="packageWeight" placeholder="Poids estimé (kg)" value={form.packageWeight} onChange={handleChange} style={inputStyle} />

        <select name="deliveryType" value={form.deliveryType} onChange={handleChange} style={inputStyle}>
          <option value="standard">Standard</option>
          <option value="express">Express</option>
          <option value="same_day">Same Day</option>
        </select>

        <input type="file" onChange={(e) => setPhotoFile(e.target.files[0])} style={inputStyle} accept="image/*" />

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="number" name="estimatedPrice" placeholder="Prix estimé" value={form.estimatedPrice} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} required />
          <button type="button" onClick={handleEstimatePrice} style={secondaryBtn}>💰 Estimer</button>
        </div>

        <button type="submit" style={submitBtn}>✅ Créer</button>
      </form>
    </div>
  );
};

// Styles (inchangés)
const container = {
  maxWidth: '600px', margin: '40px auto', padding: '20px', background: '#f9fafb', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};
const title = { textAlign: 'center', marginBottom: '20px', fontSize: '1.5rem', color: '#111827' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc' };
const submitBtn = { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#10B981', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };
const secondaryBtn = { padding: '10px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const dropdown = { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '6px', zIndex: 1000, maxHeight: '150px', overflowY: 'auto' };
const dropdownItem = { padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' };

export default CreateOrder;
