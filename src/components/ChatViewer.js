import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Search, ArrowLeft, MoreVertical, Phone, Video, 
    CheckCheck, User, Bot, Loader2 
} from 'lucide-react';
import './ChatViewer.css';

const ChatViewer = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [mobileView, setMobileView] = useState('list'); 
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    
    const scrollRef = useRef(null);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        setFilteredUsers(users.filter(u => 
            (u.fullName || '').toLowerCase().includes(term) || 
            (u.email || '').toLowerCase().includes(term)
        ));
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/chat/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(res.data.data);
                setFilteredUsers(res.data.data);
            }
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setMobileView('chat');
        setChatLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/chat/history/${user.id}?page=1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Debugging: Console check karein ki sender kya aa raha hai
            console.log("Chat Data:", res.data);

            if (res.data.success && Array.isArray(res.data.data)) {
                setMessages(res.data.data.reverse()); 
            } else {
                setMessages([]);
            }
        } catch (err) { console.error(err); }
        finally { setChatLoading(false); }
    };

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, selectedUser]);

    return (
        <div className="whatsapp-layout">
            
            {/* SIDEBAR (Contacts) */}
            <aside className={`wa-sidebar ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
                <div className="wa-header">
                    <div className="my-avatar"><User size={20}/></div>
                    <div className="header-icons"><MoreVertical size={20}/></div>
                </div>

                <div className="wa-search-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon"/>
                        <input 
                            placeholder="Search chat" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="wa-contact-list">
                    {loading ? <div className="loading-state">Loading...</div> : 
                    filteredUsers.map(user => (
                        <div 
                            key={user.id} 
                            onClick={() => handleUserSelect(user)}
                            className={`wa-contact-row ${selectedUser?.id === user.id ? 'active' : ''}`}
                        >
                            <div className="contact-avatar">
                                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                            </div>
                            <div className="contact-info">
                                <div className="row-top">
                                    <span className="contact-name">{user.fullName || 'Unknown'}</span>
                                </div>
                                <div className="row-bottom">
                                    <span className="contact-last-msg">{user.email}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* MAIN CHAT AREA */}
            <main className={`wa-chat-area ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>
                {selectedUser ? (
                    <>
                        <header className="wa-chat-header">
                            <button className="back-arrow" onClick={() => setMobileView('list')}>
                                <ArrowLeft size={24}/>
                            </button>
                            <div className="header-profile">
                                <div className="profile-pic">
                                    {selectedUser.fullName[0].toUpperCase()}
                                </div>
                                <div className="profile-text">
                                    <h3>{selectedUser.fullName}</h3>
                                    <span>Online</span>
                                </div>
                            </div>
                        </header>

                        {/* MESSAGES CONTAINER */}
                        <div className="wa-messages-container" ref={scrollRef}>
                            {chatLoading ? (
                                <div className="loading-state"><Loader2 className="spin"/> Loading...</div>
                            ) : messages.length > 0 ? (
                                messages.map((msg, index) => {
                                    
                                    // 🔥 MAJOR FIX: Sender Logic Check
                                    const senderRaw = msg.sender || 'USER'; 
                                    const senderUpper = senderRaw.toUpperCase();
                                    
                                    // Check if sender is Admin/AI (Case Insensitive)
                                    const isAi = senderUpper === 'ADMIN' || senderUpper === 'AI' || senderUpper === 'SYSTEM';

                                    return (
                                        <div key={index} className={`message-row ${isAi ? 'row-right' : 'row-left'}`}>
                                            <div className={`wa-bubble ${isAi ? 'bubble-green' : 'bubble-white'}`}>
                                                
                                                {/* Sender Name Handling */}
                                                <div className={`sender-name-tiny ${isAi ? 'system' : 'user-label'}`}>
                                                    {isAi ? 'AI Assistant' : selectedUser.fullName}
                                                </div>

                                                <div className="bubble-text">
                                                    {msg.message || msg.content || "..."}
                                                </div>
                                                
                                                <div className="bubble-meta">
                                                    <span className="timestamp">
                                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                                                    </span>
                                                    {isAi && <span className="ticks"><CheckCheck size={14} className="read"/></span>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="wa-encryption-msg">
                                    <span>🔒 No conversation history found.</span>
                                </div>
                            )}
                        </div>

                        <div className="wa-input-bar">
                            <input type="text" placeholder="Read-only view (Admin Mode)" disabled />
                        </div>
                    </>
                ) : (
                    <div className="wa-welcome-screen">
                        <h1>Select a User</h1>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatViewer;