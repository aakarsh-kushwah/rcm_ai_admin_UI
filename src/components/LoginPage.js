import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const LoginPage = () => {
    const [loginId, setLoginId] = useState(''); 
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // ✅ CRITICAL FIX: Store token AND role
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user.role); 
                
                console.log('Login successful:', data);
                
                // Redirect Admin/User to the protected dashboard path
                navigate('/dashboard'); 
            } else {
                alert(data.message || 'Login failed. Check your ID/Email and password.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('A network error occurred. Check if the backend is running.');
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

                <button type="submit">Log In</button>
            </form>

            <hr style={{margin: '20px 0'}} /> 
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