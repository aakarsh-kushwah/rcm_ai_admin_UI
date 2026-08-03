import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Shield, RefreshCw } from 'lucide-react';
import './AdminLoginPage.css';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState('');

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value !== '') {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { loginId, password });
      
      if (res.data.requiresVerification) {
        setEmailForVerification(res.data.email);
        setStep(2);
        setTimer(60);
        setCanResend(false);
        alert(res.data.message);
      } else {
        const { accessToken, refreshToken, user } = res.data;
        if (user.role !== 'ADMIN') throw new Error('Unauthorized.');

        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/admin/verify`, { email: emailForVerification, code: fullOtp });
      const { accessToken, refreshToken, user } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userRole', user.role); // Save role
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed.');
    }
    finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { loginId, password });
      if (res.data.requiresVerification) {
        alert(res.data.message);
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0].focus();
      } else {
        setError('Failed to resend code. Please try logging in again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend code.');
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="whatsapp-container">
      <div className="whatsapp-card">
        {step === 1 && (
          <form onSubmit={handleLoginSubmit}>
            <h2 className="whatsapp-header">🔐 Admin Login</h2>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Mail style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8696a0' }} size={20} />
              <input
                type="text"
                placeholder="Email / ID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="whatsapp-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Lock style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8696a0' }} size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="whatsapp-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            {error && <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', backgroundColor: 'rgba(153, 27, 27, 0.2)', padding: '10px', borderRadius: '4px' }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="whatsapp-btn"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <Link to="/signup" className="whatsapp-link" style={{ display: "block", marginTop: "1rem" }}>Don't have an admin gateway account? Request Access</Link>
          </form>
        )}

        {step === 2 && (
          <div>
            <h2 className="whatsapp-header">🔐 Verify Your Login</h2>
            <p className="whatsapp-text-muted" style={{ fontWeight: 'bold', color: '#fff' }}>🔐 Verification code has been transmitted to Super Admin's WhatsApp. Please contact Super Admin manually to fetch your secure gateway token.</p>
            <form onSubmit={handleVerificationSubmit}>
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="otp-input"
                    required
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="whatsapp-btn"
              >
                <Shield style={{ display: 'inline-block', marginRight: '8px' }} size={20} />{loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
            <p className="whatsapp-text-muted" style={{ marginTop: '1rem' }}>
              Resend code in:
              <span style={{ fontWeight: 'bold', color: '#00a884', marginLeft: '8px' }}>{timer}s</span>
            </p>
            <button
              onClick={handleResendCode}
              disabled={!canResend || loading}
              className="whatsapp-btn"
              style={{ backgroundColor: 'transparent', color: canResend && !loading ? '#00a884' : '#8696a0' }}
            >
              <RefreshCw style={{ display: 'inline-block', marginRight: '8px' }} size={20} />Resend Code via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLoginPage;
