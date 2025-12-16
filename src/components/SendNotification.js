import React, { useState } from 'react';
import axios from 'axios';

const SendNotification = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token'); // Admin Token

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notifications/send`,
        { title, body },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`✅ Sent successfully! Success: ${res.data.successCount}`);
      setTitle('');
      setBody('');
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">📢 Send Announcement</h2>
      <form onSubmit={handleSend}>
        <div className="mb-4">
          <label className="block text-gray-700">Title</label>
          <input 
            className="w-full p-2 border rounded" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="New Update Available!"
            required 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Message</label>
          <textarea 
            className="w-full p-2 border rounded" 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
            placeholder="Check out the new leader videos..."
            required 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send Notification 🚀'}
        </button>
      </form>
    </div>
  );
};

export default SendNotification;