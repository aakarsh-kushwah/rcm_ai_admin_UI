// AdminSignupPage.js
import React, { useState } from 'react';

function AdminSignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();

    // Send all required fields
    const payload = { fullName, email, password };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Admin registered successfully!');
        setFullName('');
        setEmail('');
        setPassword('');
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Signup error:', err);
      alert('Server connection failed.');
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '60px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}
    >
      <h2>🧑‍💼 Admin Signup</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Create Admin
        </button>
      </form>
    </div>
  );
}

// Inline styles for neat layout
const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  margin: '10px 0',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '16px',
};

const buttonStyle = {
  width: '100%',
  padding: '10px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#007bff',
  color: '#fff',
  fontSize: '16px',
  cursor: 'pointer',
};

export default AdminSignupPage;