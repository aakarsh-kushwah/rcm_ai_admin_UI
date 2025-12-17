import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Key, ShieldCheck, Send, ArrowRight } from 'lucide-react';
import './Login.css';

const LoginPage = () => {
    const navigate = useNavigate();
    
    // --- Configuration ---
    const OWNER_WHATSAPP_NUMBER = "917722923842"; // REPLACE with your phone number (Country code first, no +)
    const SECRET_ACCESS_CODE = "Qazxsw@123"; // The code you give to people you approve

    // --- State ---
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'request'
    const [loginData, setLoginData] = useState({ loginId: '', password: '' });
    const [requestData, setRequestData] = useState({ name: '', rcmId: '' });
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);

    // --- API URL ---
    const apiUrl = `${process.env.REACT_APP_API_URL}/api/auth/login`;

    // 1. Handle Login (Standard)
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(apiUrl, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user.role); 
                navigate('/dashboard'); 
            } else {
                alert(data.message || 'Login failed.');
            }
        } catch (error) {
            alert('Network error. Check backend.'); 
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle WhatsApp Request
    const handleRequestAccess = (e) => {
        e.preventDefault();
        if(!requestData.name || !requestData.rcmId) {
            alert("Please fill in all details.");
            return;
        }

        const message = `Hello Owner, I want to become an Admin for RCM AI.\n\nName: ${requestData.name}\nRCM ID: ${requestData.rcmId}\n\nPlease verify me and provide the Admin Access Code.`;
        
        const url = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // 3. Handle Secret Code Verification
    const handleVerifyCode = () => {
        if(verificationCode === SECRET_ACCESS_CODE) {
            const confirm = window.confirm("Code Verified! Redirecting to Admin Setup...");
            if(confirm) navigate('/admin/signup');
        } else {
            alert("❌ Invalid Access Code. Ask the owner for the correct code.");
        }
    };

    return (
        <div className="glass-container">
            {/* Background Elements for Depth */}
            <div className="ambient-shape shape-1"></div>
            <div className="ambient-shape shape-2"></div>

            <div className="login-card">
                <div className="card-header">
                    <div className="logo-glow">
                        <ShieldCheck size={40} color="#fff" />
                    </div>
                    <h1>RCM AI</h1>
                    <p>Secure Admin Panel</p>
                </div>

                {/* Tabs */}
                <div className="glass-tabs">
                    <button 
                        className={activeTab === 'login' ? 'active' : ''} 
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </button>
                    <button 
                        className={activeTab === 'request' ? 'active' : ''} 
                        onClick={() => setActiveTab('request')}
                    >
                        Request Access
                    </button>
                </div>

                {/* === FORM 1: LOGIN === */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLogin} className="glass-form animate-fade">
                        <div className="input-group">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="RCM ID / Email"
                                value={loginData.loginId}
                                onChange={(e) => setLoginData({...loginData, loginId: e.target.value})}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                required
                            />
                        </div>

                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Access Dashboard'} <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {/* === FORM 2: REQUEST ACCESS (SECURITY) === */}
                {activeTab === 'request' && (
                    <div className="request-section animate-fade">
                        <div className="info-box">
                            <p>To become an Admin, you must be verified by the Owner via WhatsApp.</p>
                        </div>

                        <form onSubmit={handleRequestAccess} className="glass-form">
                            <div className="input-group">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Your Full Name"
                                    value={requestData.name}
                                    onChange={(e) => setRequestData({...requestData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <ShieldCheck size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Your RCM ID"
                                    value={requestData.rcmId}
                                    onChange={(e) => setRequestData({...requestData, rcmId: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className="whatsapp-btn">
                                <Send size={18} /> Send Request to Owner
                            </button>
                        </form>

                        <div className="verification-area">
                            <p>Already got the code?</p>
                            <div className="verify-row">
                                <div className="input-group small">
                                    <Key size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Enter Access Code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleVerifyCode} className="verify-btn">
                                    Verify
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="footer-text">Protected by RCM Secure Systems © 2025</div>
        </div>
    );
};

export default LoginPage;