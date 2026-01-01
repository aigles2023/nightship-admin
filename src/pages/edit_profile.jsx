import React, { useEffect, useState } from 'react';
import { getAuth, updateEmail, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';

const EditAdminProfile = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [initialData, setInitialData] = useState({});
  const [formData, setFormData] = useState({ firstName: '', lastName: '', username: '', email: '' });
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const email = currentUser.email || '';

          const initial = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
            email
          };

          setInitialData(initial);
          setFormData(initial);
          setPhotoPreview(currentUser.photoURL || '');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const hasChanges = () => {
    return (
      formData.firstName !== initialData.firstName ||
      formData.lastName !== initialData.lastName ||
      formData.username !== initialData.username ||
      formData.email !== initialData.email ||
      photoFile !== null
    );
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges()) {
      setMessage('You must edit at least one field or click Cancel.');
      return;
    }

    try {
      if (formData.email !== user.email) {
        await updateEmail(user, formData.email);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email
      });

      const profileUpdates = {
        displayName: `${formData.firstName} ${formData.lastName}`
      };
      if (photoPreview && photoFile) {
        profileUpdates.photoURL = photoPreview;
      }
      await updateProfile(user, profileUpdates);

      setMessage('Profile updated successfully!');
      setTimeout(() => navigate('/admin-profile'), 1500);
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Edit Profile</h2>

      {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {photoPreview && (
          <img src={photoPreview} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <input type="file" accept="image/*" onChange={handlePhotoChange} />

        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First Name"
          style={inputStyle}
        />

        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last Name"
          style={inputStyle}
        />

        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          style={inputStyle}
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          style={inputStyle}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ ...buttonStyle, backgroundColor: '#3B82F6' }}>Save</button>
          <button type="button" onClick={() => navigate('/admin-profile')} style={{ ...buttonStyle, backgroundColor: '#9CA3AF' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  fontSize: '16px'
};

const buttonStyle = {
  padding: '10px 20px',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '16px'
};

export default EditAdminProfile;
