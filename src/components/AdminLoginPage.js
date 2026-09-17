import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Lock, Mail, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => loginId.trim().length > 0 && password.length > 0, [loginId, password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    // Clear stale or expired tokens from storage prior to dispatching login request
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');

    setLoading(true);
    setError('');
    console.log('🚀 [AdminLoginPage] Submitting login request for:', loginId.trim());

    try {
      const res = await apiClient.post(
        '/api/auth/login',
        { loginId: loginId.trim(), password },
        { withCredentials: true }
      );

      console.log('📥 [AdminLoginPage] Received response status:', res.status, res.data);

      const token = res?.data?.token || res?.data?.accessToken;
      const user = res?.data?.user || res?.data?.admin || {};

      if (!token) {
        throw new Error('Invalid login response structure: token missing.');
      }

      const userRole = (user.role || '').toUpperCase();
      if (userRole && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        throw new Error('Access Denied: Admins only.');
      }

      console.log('🔐 [AdminLoginPage] Saving token & user to localStorage...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', userRole || 'ADMIN');

      toast.success('Admin login successful! Redirecting to dashboard...');
      console.log('✅ [AdminLoginPage] Authentication successful. Navigating to /dashboard');

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Login failed.';
      console.error('❌ [AdminLoginPage] Login error:', errorMsg, err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container">
      <div className="ambient-shape shape-1" />
      <div className="ambient-shape shape-2" />

      <form className="login-card" onSubmit={onSubmit}>
        <div className="card-header">
          <div className="logo-glow" />
          <h1>CORE ADMIN</h1>
          <p>Secure access</p>
        </div>

        <div className="glass-form">
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Email / Admin ID"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error ? <div className="error-msg">{error}</div> : null}

          <button className="primary-btn" type="submit" disabled={!canSubmit || loading}>
            <LogIn size={18} />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}

