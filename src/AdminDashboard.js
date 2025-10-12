import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [subscribers, setSubscribers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // यह Vercel के Environment Variable से URL उठाएगा
                const apiUrl = `${process.env.REACT_APP_API_URL}/api/subscribers`;
                const response = await fetch(apiUrl);
                const result = await response.json();
                if (result.success) {
                    setSubscribers(result.data);
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Subscribers List</h1>
                <button onClick={handleLogout} style={{ padding: '10px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>Logout</button>
            </div>
            <table border="1" style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Name</th>
                        <th style={{ padding: '8px' }}>Phone Number</th>
                        <th style={{ padding: '8px' }}>Subscribed At</th>
                    </tr>
                </thead>
                <tbody>
                    {subscribers.map(sub => (
                        <tr key={sub.id}>
                            <td style={{ padding: '8px' }}>{sub.id}</td>
                            <td style={{ padding: '8px' }}>{sub.name}</td>
                            <td style={{ padding: '8px' }}>{sub.phone_number}</td>
                            <td style={{ padding: '8px' }}>{new Date(sub.subscribed_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminDashboard;