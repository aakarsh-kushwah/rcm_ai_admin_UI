import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

function UserChatHistory() {
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { userEmail } = location.state || {};

    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userEmail) return; // अगर ईमेल नहीं मिला तो कुछ न करें

        const fetchAllChats = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    // सिर्फ इस यूज़र की चैट को फ़िल्टर करें
                    const userChats = result.data[userEmail] || [];
                    setChats(userChats);
                }
            } catch (error) {
                console.error("Failed to fetch chats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllChats();
    }, [userEmail]);

    if (!userEmail) {
        return <p>User email not provided. Please go back to the user list.</p>;
    }

    if (loading) return <p>Loading chat history for {userEmail}...</p>;

    return (
        <div>
            <button onClick={() => navigate('/users')} style={{ marginBottom: '20px' }}>
                &larr; Back to User List
            </button>
            <h3>Chat History for {userEmail} (User ID: {userId})</h3>
            <div style={{ border: '1px solid #ccc', padding: '10px', height: '60vh', overflowY: 'auto' }}>
                {chats.length > 0 ? chats.map((msg, index) => (
                    <div key={index} style={{ margin: '10px 0', textAlign: msg.sender === 'USER' ? 'right' : 'left' }}>
                        <div style={{ display: 'inline-block', padding: '10px', borderRadius: '10px', background: msg.sender === 'USER' ? '#dcf8c6' : '#f1f1f1' }}>
                            <p style={{ margin: 0 }}>{msg.message}</p>
                            <small style={{ fontSize: '0.7em', color: '#888' }}>{new Date(msg.createdAt).toLocaleString()}</small>
                        </div>
                    </div>
                )) : <p>No chat history found for this user.</p>}
            </div>
        </div>
    );
}

export default UserChatHistory;