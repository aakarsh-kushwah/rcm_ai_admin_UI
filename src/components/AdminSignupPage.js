import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const AdminSignupPage = () => {
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // ✅ Always use environment URL in production
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, adminKey, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Admin created successfully!');
        navigate('/login');
      } else {
        alert(data.message || '❌ Signup failed. Please check your admin key or try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('⚠️ Unable to reach the server. Please check your network or backend URL.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Admin Signup</h2>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin Email"
          required
        />

        <input
          type="text"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="Admin Key"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />

        <button type="submit">Create Admin</button>
      </form>
    </div>
  );
};

export default AdminSignupPage;
