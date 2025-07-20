import React from 'react';



const About = () => {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>About NightShip</h2>

      <section style={styles.section}>
        <h3 style={styles.title}>What is NightShip?</h3>
        <p style={styles.text}>
          NightShip is a modern delivery platform connecting drivers with senders, especially for night or long-distance intercity deliveries. 
          Our mission is to make logistics faster, safer, and more accessible for everyone.
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.title}>Version</h3>
        <p style={styles.text}>Admin Panel Version: 1.0.0</p>
        <p style={styles.text}>Last Update: July 20, 2025</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.title}>Team</h3>
        <p style={styles.text}>
          Developed by the NightShip team. For inquiries, reach out to our support team.
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.title}>Legal</h3>
        <p style={styles.text}>Terms of Service and Privacy Policy apply when using this application.</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.title}>Contact Support</h3>
        <p style={styles.text}>
          For assistance, please contact our support team via the Help section in Settings, or email us at: <strong>support@nightship.com</strong>
        </p>
      </section>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    maxWidth: '900px',
    margin: 'auto',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  header: {
    fontSize: '26px',
    marginBottom: '20px',
    color: '#222',
    borderBottom: '1px solid #ccc',
    paddingBottom: '10px',
  },
  section: {
    marginBottom: '25px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  text: {
    fontSize: '16px',
    color: '#555',
    lineHeight: '1.6',
  },
};

export default About;
