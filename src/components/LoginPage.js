import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const LoginPage = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Always use the live API from environment variable
  const apiUrl = `${process.env.REACT_APP_API_URL}/api/auth/login`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        navigate('/dashboard');
      } else if (response.status === 401) {
        alert('Invalid credentials. Please check your ID or password.');
      } else {
        alert(data.message || 'Login failed. Try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          type="text"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="RCM ID / Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <hr style={{ margin: '20px 0' }} />
      <p>Need to set up the system?</p>
      <Link to="/admin/signup">
        <button type="button" className="admin-setup-button">
          Go to Admin Setup
        </button>
      </Link>
    </div>
  );
};

export default LoginPage;
