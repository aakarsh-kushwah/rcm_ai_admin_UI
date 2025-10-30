// AdminSignupPage.js
import React, { useState } from 'react';

function AdminSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), // ✅ Must match backend fields
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Admin registered successfully');
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Signup error:', err);
      alert('Server connection failed');
    }
  };

  return (
    <div className="signup-container">
      <h2>Admin Signup</h2>
      <form onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Create Admin</button>
      </form>
    </div>
  );
}

export default AdminSignupPage;
