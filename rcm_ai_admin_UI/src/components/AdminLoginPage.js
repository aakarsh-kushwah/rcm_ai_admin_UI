import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { Lock, Shield } from 'lucide-react';
import './AdminLoginPage.css';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Google Login, 2: Master Password
  const [tempToken, setTempToken] = useState(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState(''); // To display which admin is logging in

  /**
   * @function handleGoogleLoginSuccess
   * @description Handles the successful Google OAuth login, initiating phase one of admin authentication.
   * @param {object} credentialResponse - The response object from Google containing the credential.
   * @returns {void}
   */
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/admin/google-phase-one`, {
        credential: credentialResponse.credential,
      });
      setTempToken(res.data.tempAdminToken);
      console.log("Backend Response:", res.data);
      setAdminEmail("rcmaiasistant@gmail.com"); // Temporarily setting, should be derived from credentialResponse by decoding the JWT.
      setStep(2);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Google Auth Phase One Error:', err);
      setError(err.response?.data?.message || err.message || 'Google login failed for admin.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function handleGoogleLoginError
   * @description Handles errors during the Google OAuth login process.
   * @returns {void}
   */
  const handleGoogleLoginError = () => {
    setError('Google login failed. Please try again.');
    setLoading(false);
  };

  /**
   * @function handleMasterPasswordSubmit
   * @description Handles the submission of the master password, completing phase two of admin authentication.
   * @param {object} e - The form submission event.
   * @returns {void}
   */
  const handleMasterPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/admin/verify-master-password`, {
        tempToken: tempToken,
        masterPassword: masterPassword,
      });

      const { accessToken, refreshToken, admin } = res.data;

      // Store tokens and admin info
      localStorage.setItem('adminAccessToken', accessToken);
      localStorage.setItem('adminRefreshToken', refreshToken);
      localStorage.setItem('adminRole', admin.role);
      localStorage.setItem('admin', JSON.stringify(admin));

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Master Password Phase Two Error:', err);
      setError(err.response?.data?.message || err.message || 'Master password verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whatsapp-container">
      <div className="whatsapp-card">
        {step === 1 && (
          <div>
            <h2 className="whatsapp-header">🔐 Admin Login - Step 1</h2>
            <p className="whatsapp-text-muted" style={{ marginBottom: '1rem' }}>Verify your Google identity</p>
            {error && <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', backgroundColor: 'rgba(153, 27, 27, 0.2)', padding: '10px', borderRadius: '4px' }}>{error}</div>}
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              disabled={loading}
            />
            <Link to="/signup" className="whatsapp-link" style={{ display: "block", marginTop: "1rem" }}>Don't have an admin gateway account? Request Access</Link>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleMasterPasswordSubmit}>
            <h2 className="whatsapp-header">🔐 Admin Login - Step 2</h2>
            <p className="whatsapp-text-muted" style={{ marginBottom: '1rem' }}>Enter Master Password for {adminEmail}</p>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Lock style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8696a0' }} size={20} />
              <input
                type="password"
                placeholder="Master Password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                required
                className="whatsapp-input"
                style={{ paddingLeft: '40px' }}
                disabled={loading}
              />
            </div>
            {error && <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', backgroundColor: 'rgba(153, 27, 27, 0.2)', padding: '10px', borderRadius: '4px' }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="whatsapp-btn"
            >
              <Shield style={{ display: 'inline-block', marginRight: '8px' }} size={20} />{loading ? 'Verifying...' : 'Verify Master Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminLoginPage;
