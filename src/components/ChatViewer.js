import React, { useState, useEffect } from 'react';

function ChatViewer() {
    const [chats, setChats] = useState({});
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const fetchChats = async () => {
            setLoading(true);
            try {
                const apiUrl = `${process.env.REACT_APP_API_URL}/api/chat/admin/chats`;
                const token = localStorage.getItem('token'); // ✅ FIXED: Use 'token'
                const response = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // ... (rest of logic)
            } catch (err) {
                // ...
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);
    if (loading) return <p>Loading chat sessions...</p>;

    const chatSessions = Object.keys(chats);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 70px)' }}>
            <div style={{ width: '30%', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
                <h2 style={{ padding: '10px', margin: 0, borderBottom: '1px solid #ccc' }}>Chat Sessions</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {chatSessions.length > 0 ? chatSessions.map(sessionId => (
                        <li key={sessionId} onClick={() => setSelectedSession(sessionId)} style={{ padding: '15px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                            {sessionId}
                        </li>
                    )) : <li>No sessions found.</li>}
                </ul>
            </div>
            <div style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                {selectedSession ? (
                    <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
                        <h3>Conversation for {selectedSession}</h3>
                        {chats[selectedSession].map((msg, index) => (
                            <div key={index} style={{ margin: '10px 0', textAlign: msg.sender === 'USER' ? 'right' : 'left' }}>
                                <div style={{ display: 'inline-block', padding: '10px', borderRadius: '10px', background: msg.sender === 'USER' ? '#dcf8c6' : '#f1f1f1' }}>
                                    <p style={{ margin: 0 }}>{msg.message}</p>
                                    <small style={{ fontSize: '0.7em', color: '#888' }}>{new Date(msg.createdAt).toLocaleTimeString()}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <p>Select a session to view the chat.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatViewer;