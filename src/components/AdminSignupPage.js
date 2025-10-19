import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const AdminSignupPage = () => {
    const [fullName, setFullName] = useState(''); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleAdminSignup = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:3001/api/auth/admin/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password }), 
            });

            const data = await response.json();

            if (response.ok) {
                alert('Admin user created successfully! Please log in.');
                navigate('/login'); // Redirect to login
            } else {
                alert(`Signup Failed: ${data.message || 'Check server logs.'}`);
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('A network error occurred.');
        }
    };

    return (
        <div className="login-container"> 
            <form onSubmit={handleAdminSignup}>
                <h2>Admin Sign Up (Setup)</h2>
                
                <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name (Admin Name)" 
                    required 
                />
                
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Email" 
                    required 
                />
                
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Password" 
                    required 
                />
                
                <button type="submit">Register Admin</button>
            </form>
        </div>
    );
};

export default AdminSignupPage;