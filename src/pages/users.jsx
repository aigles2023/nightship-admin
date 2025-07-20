import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiEdit, FiEye, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUserStatus = async (user) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isActive: !user.isActive,
      });
    } catch (error) {
      console.error('Erreur activation utilisateur :', error);
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(`Archiver ${user.name} ?`);
    if (!confirmed) return;

    try {
      const deletedRef = doc(db, 'deleted_users', user.id);
      await setDoc(deletedRef, {
        ...user,
        deletedAt: Timestamp.now(),
      });

      await deleteDoc(doc(db, 'users', user.id));
    } catch (error) {
      console.error('Erreur suppression utilisateur :', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleDateString();
  };

  return (
    <div className="users-container">
      <h2 class='boot'>User Management</h2>

      <input
        type="text"
        placeholder="Search by name or email"
        className="search-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>{user.role || 'user'}</td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td className="action-buttons">
                  <button title="View"><FiEye /></button>
                  <button title="Edit"><FiEdit /></button>
                  <button title={user.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleUserStatus(user)}>
                    {user.isActive ? <FiUserX /> : <FiUserCheck />}
                  </button>
                  <button title="Archive" onClick={() => deleteUser(user)}><FiTrash2 /></button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
