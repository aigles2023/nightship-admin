import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const Support = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    const unsubMessages = onSnapshot(collection(db, 'support_messages'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    });

    const unsubFaqs = onSnapshot(collection(db, 'faq'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFaqs(data);
    });

    return () => {
      unsubMessages();
      unsubFaqs();
    };
  }, []);

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Support Center</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('inbox')} style={tabButtonStyle(activeTab === 'inbox')}>
          Inbox
        </button>
        <button onClick={() => setActiveTab('faq')} style={tabButtonStyle(activeTab === 'faq')}>
          FAQ
        </button>
      </div>

      {activeTab === 'inbox' ? (
        <div>
          {messages.length === 0 ? <p>No support messages.</p> : (
            <ul>
              {messages.map(msg => (
                <li key={msg.id} style={messageCardStyle}>
                  <strong>{msg.name || 'Anonymous'}</strong> ({msg.email})<br />
                  <em>{new Date(msg.createdAt?.seconds * 1000).toLocaleString()}</em>
                  <p>{msg.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          {faqs.length === 0 ? <p>No FAQ yet.</p> : (
            <ul>
              {faqs.map(faq => (
                <li key={faq.id} style={faqCardStyle}>
                  <strong>Q:</strong> {faq.question}<br />
                  <strong>A:</strong> {faq.answer}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const tabButtonStyle = (active) => ({
  padding: '10px 20px',
  marginRight: '10px',
  backgroundColor: active ? '#3B82F6' : '#ccc',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
});

const messageCardStyle = {
  backgroundColor: '#f9f9f9',
  padding: '15px',
  borderRadius: '6px',
  marginBottom: '15px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
};

const faqCardStyle = {
  backgroundColor: '#f3f3f3',
  padding: '15px',
  borderRadius: '6px',
  marginBottom: '10px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

export default Support;
