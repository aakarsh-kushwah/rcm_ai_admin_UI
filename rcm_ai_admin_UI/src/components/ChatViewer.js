import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';
import {
    Search, ArrowLeft, MoreVertical,
    CheckCheck, User, Loader2
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

    /* =========================
       FETCH USERS
    ========================= */
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get(`/api/admin/users`);

            if (res.data?.success) {
                setUsers(res.data.data);
                setFilteredUsers(res.data.data);
            }
        } catch (err) {
            console.error('❌ Fetch Users Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       SEARCH
    ========================= */
    useEffect(() => {
        const term = searchTerm.toLowerCase();
        setFilteredUsers(
            users.filter(u =>
                (u.fullName || '').toLowerCase().includes(term) ||
                (u.email || '').toLowerCase().includes(term)
            )
        );
    }, [searchTerm, users]);

    /* =========================
       FETCH CHAT HISTORY
    ========================= */
    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setMobileView('chat');
        setChatLoading(true);
        setMessages([]);

        try {
            const res = await apiClient.get(`/api/chat/history/${user.id}?page=1`, {
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (res.data?.success && Array.isArray(res.data.data)) {
                // 🔥 NO reverse (backend already ASC)
                setMessages(res.data.data);
            }
        } catch (err) {
            console.error('❌ Chat Fetch Error:', err.message);
        } finally {
            setChatLoading(false);
        }
    };

    /* =========================
       AUTO SCROLL
    ========================= */
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    /* =========================
       UI
    ========================= */
    return (
        <div className="whatsapp-layout">

            {/* SIDEBAR */}
            <aside className={`wa-sidebar ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
                <div className="wa-header">
                    <div className="my-avatar"><User size={20} /></div>
                    <MoreVertical size={20} />
                </div>

                <div className="wa-search-bar">
                    <Search size={18} />
                    <input
                        placeholder="Search chat"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="wa-contact-list">
                    {loading ? (
                        <div className="loading-state">Loading users...</div>
                    ) : (
                        filteredUsers.map(user => (
                            <div
                                key={user.id}
                                className={`wa-contact-row ${selectedUser?.id === user.id ? 'active' : ''}`}
                                onClick={() => handleUserSelect(user)}
                            >
                                <div className="contact-avatar">
                                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="contact-info">
                                    <div className="contact-name">{user.fullName || 'Unknown'}</div>
                                    <div className="contact-last-msg">{user.email}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* CHAT */}
            <main className={`wa-chat-area ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>
                {selectedUser ? (
                    <>
                        <header className="wa-chat-header">
                            <button onClick={() => setMobileView('list')}>
                                <ArrowLeft size={22} />
                            </button>
                            <div>
                                <h3>{selectedUser.fullName}</h3>
                                <span>Read-Only (Admin)</span>
                            </div>
                        </header>

                        <div className="wa-messages-container" ref={scrollRef}>
                            {chatLoading ? (
                                <div className="loading-state">
                                    <Loader2 className="spin" /> Loading chat...
                                </div>
                            ) : messages.length ? (
                                messages.map((msg, i) => {
                                    const isAI = msg.sender !== "USER";
                                    const text = msg.message || msg.response;

                                    return (
                                        <div key={i} className={`message-row ${isAI ? 'row-right' : 'row-left'}`}>
                                            <div className={`wa-bubble ${isAI ? 'bubble-green' : 'bubble-white'}`}>
                                                <div className="sender-name-tiny">
                                                    {isAI ? 'AI Assistant' : selectedUser.fullName}
                                                </div>
                                                <div>{text}</div>
                                                <div className="bubble-meta">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                    {isAI && <CheckCheck size={14} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="wa-encryption-msg">🔒 No conversation found</div>
                            )}
                        </div>

                        <div className="wa-input-bar">
                            <input disabled placeholder="Admin Read-Only Mode" />
                        </div>
                    </>
                ) : (
                    <div className="wa-welcome-screen">
                        <h2>Select a user to view chat</h2>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatViewer;
