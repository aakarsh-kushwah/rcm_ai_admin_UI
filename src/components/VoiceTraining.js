import React, { useState } from 'react';
import './Dashboard.css'; // Reusing your existing styles

const VoiceTraining = () => {
    // We now need 3 states for the Smart FAQ logic
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // ✅ FIX 1: Use 'token' (Matches what you set in LoginPage.js)
            const token = localStorage.getItem('token'); 

            if (!token) {
                setMessage({ type: 'error', text: '🔒 Session Expired. Please Login Again.' });
                setLoading(false);
                return;
            }
            
            // ✅ FIX 2: Pointing to the new "Smart Response" endpoint
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/admin/smart-response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // ✅ FIX 3: Sending all 3 required fields
                body: JSON.stringify({ question, answer, audioUrl })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: '✅ Smart Response Saved! (Zero Cost Mode Active)' });
                // Reset form
                setQuestion('');
                setAnswer('');
                setAudioUrl('');
            } else {
                setMessage({ type: 'error', text: `❌ Error: ${data.message}` });
            }
        } catch (error) {
            console.error("Upload Error:", error);
            setMessage({ type: 'error', text: '🔥 Server Connection Failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="futuristic-dashboard-container">
            <h1 className="futuristic-heading">🧠 Smart AI Training</h1>
            <p className="futuristic-subtitle">Define exact Q&A pairs to bypass AI costs and ensure perfect voice pronunciation.</p>

            <div className="dashboard-card-futuristic" style={{ maxWidth: '700px', margin: '2rem auto', cursor: 'default' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Field 1: The Trigger Question */}
                    <div>
                        <label style={{ color: '#00f2fe', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
                            1. User Question (Trigger)
                        </label>
                        <input 
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What is RCM?"
                            required
                            style={inputStyle}
                        />
                        <small style={{ color: '#aaa', marginTop: '5px', display: 'block' }}>
                            If the user types this (or something similar), the AI won't be called.
                        </small>
                    </div>

                    {/* Field 2: The Text Answer */}
                    <div>
                        <label style={{ color: '#00f2fe', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
                            2. AI Text Answer (Script)
                        </label>
                        <textarea 
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="e.g. RCM is India's largest direct selling company..."
                            required
                            style={{ ...inputStyle, minHeight: '100px' }}
                        />
                        <small style={{ color: '#aaa', marginTop: '5px', display: 'block' }}>
                            This exact text will be shown in the chat window.
                        </small>
                    </div>

                    {/* Field 3: The Audio URL */}
                    <div>
                        <label style={{ color: '#00f2fe', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
                            3. Cloudinary Audio URL
                        </label>
                        <input 
                            type="url" 
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            placeholder="https://res.cloudinary.com/..."
                            required
                            style={inputStyle}
                        />
                         <small style={{ color: '#aaa', marginTop: '5px', display: 'block' }}>
                            The pre-recorded voice file for the answer above.
                        </small>
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div style={{ 
                            padding: '12px', 
                            borderRadius: '5px', 
                            backgroundColor: message.type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                            color: message.type === 'success' ? '#00ff00' : '#ff4444',
                            textAlign: 'center',
                            border: message.type === 'success' ? '1px solid #00ff00' : '1px solid #ff4444'
                        }}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            padding: '15px',
                            background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#000',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '10px'
                        }}
                    >
                        {loading ? 'Saving to Database...' : '💾 Save Smart Response'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Common Input Style for cleaner code
const inputStyle = {
    width: '100%', 
    padding: '12px', 
    borderRadius: '8px', 
    border: '1px solid rgba(0, 242, 254, 0.3)', 
    background: 'rgba(255, 255, 255, 0.05)', 
    color: '#fff',
    fontSize: '14px'
};

export default VoiceTraining;