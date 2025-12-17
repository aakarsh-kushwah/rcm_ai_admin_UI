import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- CSS STYLES (Inline for simplicity) ---
const styles = {
  container: { display: 'flex', height: 'calc(100vh - 80px)', border: '1px solid #e5e7eb', backgroundColor: '#fff' },
  sidebar: { width: '300px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' },
  sidebarHeader: { padding: '15px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', backgroundColor: '#fff' },
  userList: { overflowY: 'auto', flex: 1 },
  userItem: { padding: '15px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' },
  activeUser: { backgroundColor: '#e0e7ff', borderLeft: '4px solid #3730a3' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
  chatHeader: { padding: '15px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', fontWeight: 'bold' },
  messagesBox: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  messageBubble: { maxWidth: '70%', padding: '10px 15px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.4' },
  sent: { alignSelf: 'flex-end', backgroundColor: '#2563eb', color: 'white', borderBottomRightRadius: '2px' },
  received: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', color: '#1f2937', borderBottomLeftRadius: '2px' },
  timestamp: { fontSize: '10px', marginTop: '4px', opacity: 0.8, textAlign: 'right' },
  loadMoreBtn: { margin: '0 auto 15px auto', padding: '5px 15px', fontSize: '12px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '20px', cursor: 'pointer' }
};

const ChatViewer = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const messagesEndRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  // 1. Fetch Users on Mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Fetch Messages when User Selects or Page Changes
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id, page);
    }
  }, [selectedUser, page]);

  // Scroll to bottom only on FIRST load of a user
  useEffect(() => {
    if (page === 1 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/chat/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (userId, pageNum) => {
    setLoadingChat(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/chat/history/${userId}?page=${pageNum}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        if (pageNum === 1) {
          setMessages(res.data.data);
        } else {
          // Prepend older messages
          setMessages(prev => [...res.data.data, ...prev]);
        }
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (err) {
      console.error("Failed to load chat", err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleUserSelect = (user) => {
    if (selectedUser?.id !== user.id) {
      setSelectedUser(user);
      setMessages([]);
      setPage(1); // Reset page for new user
    }
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR: User List */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Recent Chats</div>
        <div style={styles.userList}>
          {loadingUsers ? <p style={{padding:'20px', textAlign:'center'}}>Loading...</p> : 
           users.map(user => (
            <div 
              key={user.id} 
              onClick={() => handleUserSelect(user)}
              style={{...styles.userItem, ...(selectedUser?.id === user.id ? styles.activeUser : {})}}
            >
              <div style={{fontWeight:'bold', fontSize:'14px'}}>{user.fullName || 'User'}</div>
              <div style={{fontSize:'12px', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {user.email}
              </div>
            </div>
          ))}
          {!loadingUsers && users.length === 0 && (
             <p style={{padding:'20px', textAlign:'center', color:'#999'}}>No conversations found.</p>
          )}
        </div>
      </div>

      {/* MAIN: Chat Area */}
      <div style={styles.chatArea}>
        {selectedUser ? (
          <>
            <div style={styles.chatHeader}>
              <div>
                <span style={{fontSize:'16px'}}>{selectedUser.fullName}</span>
                <span style={{fontSize:'12px', color:'#6b7280', marginLeft:'10px'}}>({selectedUser.rcmId})</span>
              </div>
            </div>

            <div style={styles.messagesBox}>
              {/* Pagination Button */}
              {hasMore && (
                <button 
                  onClick={() => setPage(prev => prev + 1)} 
                  disabled={loadingChat}
                  style={styles.loadMoreBtn}
                >
                  {loadingChat ? 'Loading...' : 'Load Older Messages'}
                </button>
              )}

              {/* Message List */}
              {messages.map((msg) => {
                const isUser = msg.sender !== 'ADMIN'; // Adjust based on your DB logic
                return (
                  <div key={msg.id} style={{...styles.messageBubble, ...(isUser ? styles.received : styles.sent)}}>
                    <div>{msg.message}</div>
                    <div style={styles.timestamp}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>
            Select a conversation to start reading
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatViewer;