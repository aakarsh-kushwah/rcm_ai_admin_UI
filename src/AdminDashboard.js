import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi'; // Logout Icon
import './AdminDashboard.css'; // Import the new CSS file

function AdminDashboard() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true); // Add loading state
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Start loading
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
            } finally {
                setLoading(false); // Stop loading regardless of result
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    const renderContent = () => {
        if (loading) {
            return <div className="loading-message">Loading Subscribers...</div>;
        }

        if (subscribers.length === 0) {
            return <div className="empty-message">No subscribers found.</div>;
        }

        return (
            <div className="table-container">
                <table className="subscriber-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Phone Number</th>
                            <th>Subscribed At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscribers.map(sub => (
                            <tr key={sub.id}>
                                <td data-label="ID">{sub.id}</td>
                                <td data-label="Name">{sub.name}</td>
                                <td data-label="Phone Number">{sub.phone_number}</td>
                                <td data-label="Subscribed At">{new Date(sub.subscribed_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Subscribers List</h1>
                <button onClick={handleLogout} className="logout-button">
                    <FiLogOut /> <span>Logout</span>
                </button>
            </header>
            <main className="dashboard-content">
                {renderContent()}
            </main>
        </div>
    );
}

export default AdminDashboard;