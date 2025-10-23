import React, { useState, useEffect } from 'react';
// Assuming you have ChatViewer.css for styling

function ChatViewer() {
    const [chats, setChats] = useState({});
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchChats = async () => {
            setLoading(true);
            setError('');
            
            const token = localStorage.getItem('token');
            if (!token) {
                 setError('Authentication token missing. Please log in.');
                 setLoading(false);
                 return;
            }

            try {
                // Fetch all chat messages, grouped by user email from the backend
                const apiUrl = `${process.env.REACT_APP_API_URL}/api/chat/admin/chats`;
                const response = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status === 401 || response.status === 403) {
                     // This handles the authentication loop error.
                     throw new Error('Unauthorized access. Check Admin permissions.');
                }
                if (!response.ok) {
                     const errorData = await response.json();
                     throw new Error(errorData.message || 'Failed to fetch data.');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    setChats(result.data);
                } else {
                    setError(result.message || 'Could not fetch chat sessions.');
                }
            } catch (err) {
                console.error("Failed to fetch chats", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);

    if (loading) return <p>Loading chat sessions...</p>;
    if (error) return <p style={{color: 'red'}}>Error: {error}</p>;

    const chatSessions = Object.keys(chats);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 70px)', border: '1px solid #ddd' }}>
            <div style={{ width: '30%', borderRight: '1px solid #ccc', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                <h2 style={{ padding: '10px', margin: 0, borderBottom: '1px solid #ccc', backgroundColor: '#eee' }}>User Sessions</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {chatSessions.length > 0 ? chatSessions.map(email => (
                        <li key={email} onClick={() => setSelectedSession(email)} 
                            style={{ padding: '15px', cursor: 'pointer', borderBottom: '1px solid #eee', 
                                    backgroundColor: selectedSession === email ? '#e0eaff' : 'transparent' }}>
                            {email}
                        </li>
                    )) : <li>No chat sessions found.</li>}
                </ul>
            </div>
            <div style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                {selectedSession ? (
                    <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
                        <h3>Conversation with {selectedSession}</h3>
                        {/* Reverse order for chat history display */}
                        {chats[selectedSession].slice().reverse().map((msg, index) => ( 
                            <div key={index} style={{ margin: '10px 0', textAlign: msg.sender === 'USER' ? 'right' : 'left' }}>
                                <div style={{ display: 'inline-block', padding: '10px', borderRadius: '10px', maxWidth: '70%',
                                        background: msg.sender === 'USER' ? '#007bff' : '#f1f1f1', 
                                        color: msg.sender === 'USER' ? 'white' : 'black' }}>
                                    <p style={{ margin: 0 }}>{msg.message}</p>
                                    <small style={{ fontSize: '0.7em', color: msg.sender === 'USER' ? '#ccc' : '#888' }}>
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <p>Select a user to view the chat history.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatViewer;