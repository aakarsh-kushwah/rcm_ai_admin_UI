import React, { useState } from 'react';
import './UserAuth.css';
import { useNavigate } from 'react-router-dom';

const AdminSignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('Creating admin...');

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/api/auth/admin/signup`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Admin created successfully!');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.message || 'Signup failed. Try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setMessage('🚫 Server not reachable. Try again later.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSignup}>
        <h2>Admin Signup</h2>

        <input
          type="email"
          value={email}
          placeholder="Enter Admin Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          value={password}
          placeholder="Enter Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Create Admin</button>
      </form>

      {message && <p style={{ marginTop: '15px', color: '#ccc' }}>{message}</p>}
    </div>
  );
};

export default AdminSignupPage;
