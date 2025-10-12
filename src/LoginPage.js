import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // ⚠️ यह सिर्फ एक उदाहरण है, असली पासवर्ड को बैकएंड से चेक करवाना चाहिए
        if (password === 'admin123') { // सिंपल पासवर्ड चेक
            localStorage.setItem('adminToken', 'dummy_token_for_auth'); // एक टोकन सेव करें
            navigate('/dashboard'); // डैशबोर्ड पर भेजें
        } else {
            setError('गलत पासवर्ड!');
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Admin Panel Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    style={{ padding: '10px' }}
                />
                <button type="submit" style={{ padding: '10px', marginLeft: '5px' }}>Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default LoginPage;