import React, { useState } from 'react';
import './Dashboard.css'; 

const VoiceTraining = () => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [audioFile, setAudioFile] = useState(null); // Changed from URL string to File object
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // File selection handler
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token'); 

            if (!token) {
                setMessage({ type: 'error', text: '🔒 Session Expired. Please Login Again.' });
                setLoading(false);
                return;
            }

            if (!audioFile) {
                setMessage({ type: 'error', text: '⚠️ Please select an audio file.' });
                setLoading(false);
                return;
            }
            
            // ✅ CHANGE: Use FormData for File Uploads
            const formData = new FormData();
            formData.append('question', question);
            formData.append('answer', answer);
            formData.append('audioFile', audioFile); // Field name must match backend (upload.single('audioFile'))

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/admin/smart-response`, {
                method: 'POST',
                headers: {
                    // ⚠️ NO Content-Type header needed! Fetch sets it automatically for FormData
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: '✅ Audio Uploaded & Smart Response Saved!' });
                setQuestion('');
                setAnswer('');
                setAudioFile(null);
                // Reset file input visually
                document.getElementById('fileInput').value = ""; 
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
            <p className="futuristic-subtitle">Upload voice files directly to train the AI.</p>

            <div className="dashboard-card-futuristic" style={{ maxWidth: '700px', margin: '2rem auto', cursor: 'default' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* 1. Question */}
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
                    </div>

                    {/* 2. Answer */}
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
                    </div>

                    {/* 3. File Upload (Replacing URL Input) */}
                    <div>
                        <label style={{ color: '#00f2fe', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
                            3. Upload Voice Audio (MP3/WAV)
                        </label>
                        <div style={{ 
                            border: '2px dashed rgba(0, 242, 254, 0.3)', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            textAlign: 'center',
                            background: 'rgba(255, 255, 255, 0.02)'
                        }}>
                            <input 
                                id="fileInput"
                                type="file" 
                                accept="audio/*"
                                onChange={handleFileChange}
                                required
                                style={{ color: '#fff' }}
                            />
                            {audioFile && (
                                <p style={{ color: '#4facfe', marginTop: '10px', fontSize: '14px' }}>
                                    Selected: {audioFile.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
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
                        {loading ? 'Uploading & Saving...' : '☁️ Upload & Save'}
                    </button>
                </form>
            </div>
        </div>
    );
};

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