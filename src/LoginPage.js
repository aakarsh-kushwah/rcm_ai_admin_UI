import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock } from 'react-icons/fa'; // Importing an icon
import './LoginPage.css'; // Linking the CSS file

function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // ⚠️ This is for demonstration only. Real auth should be on a backend.
        if (password === 'admin123') {
            localStorage.setItem('adminToken', 'dummy_token_for_auth');
            navigate('/dashboard');
        } else {
            setError('गलत पासवर्ड!'); // "Incorrect Password!"
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1 className="login-title">Admin Panel</h1>
                <p className="login-subtitle">Please enter your password to continue</p>
                
                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <FaLock className="input-icon" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className="login-input"
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
}

export default LoginPage;