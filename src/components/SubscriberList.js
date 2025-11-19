import React, { useState, useEffect } from 'react';
import './SubscriberList.css'; // इस CSS फाइल को हम नीचे बनाएंगे

function SubscriberList() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSubscribers = async () => {
            setLoading(true);
            setError('');
            try {
const token = localStorage.getItem('token'); // ✅ FIXED: Standardized to 'token'
               if (!token) {
                    setError('Authorization token not found.');
                    return;
                } 
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/subscribers`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data. Please check your permissions.');
                }

                const result = await response.json();
                if (result.success) {
                    setSubscribers(result.data);
                } else {
                    setError(result.message || 'Could not fetch subscribers.');
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message || 'An error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscribers();
    }, []);

    const renderContent = () => {
        if (loading) {
            return <div className="loading-message">Loading Subscribers...</div>;
        }

        if (error) {
            return <div className="error-message">Error: {error}</div>;
        }

        if (subscribers.length === 0) {
            return <div className="empty-message">No subscribers found from the landing page form.</div>;
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
                                <td data-label="Phone Number">{sub.phoneNumber}</td>
                                <td data-label="Subscribed At">{new Date(sub.subscribedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="list-page">
            <header className="list-header">
                <h1 className="list-title">Landing Page Subscribers</h1>
            </header>
            <main className="list-content">
                {renderContent()}
            </main>
        </div>
    );
}

export default SubscriberList;