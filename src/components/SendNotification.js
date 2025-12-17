import React, { useState } from 'react';
import axios from 'axios';
import './SendNotification.css'; // 👈 Import the CSS file here!

// --- ICONS ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const SendNotification = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- CONFIG ---
  const CLOUD_NAME = process.env.REACT_APP_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.REACT_APP_UPLOAD_PRESET;

  // --- LOGIC: Auto-Resize Image ---
  const optimizeUrl = (originalUrl) => {
    return originalUrl.replace('/upload/', '/upload/w_1024,h_512,c_fill,g_auto,q_auto/');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      alert("❌ Missing Cloudinary Config in .env file!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      );
      
      const perfectSizeUrl = optimizeUrl(res.data.secure_url);
      setImageUrl(perfectSizeUrl);

    } catch (error) {
      console.error("Upload Error:", error);
      alert("❌ Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token'); 

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notifications/send`,
        { title, body, imageUrl }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`✅ Sent successfully to ${res.data.successCount} devices!`);
      setTitle('');
      setBody('');
      setImageUrl('');
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-page">
      <div className="notification-container">
        
        {/* --- LEFT SIDE: FORM --- */}
        <div className="form-card">
          <div className="form-header">
            <div className="header-icon">
               <SendIcon />
            </div>
            <div>
              <h2 style={{margin:0, fontSize: '24px', color: '#1f2937'}}>Push Notification</h2>
              <p style={{margin:0, fontSize: '14px', color: '#6b7280'}}>Send updates to all users instantly.</p>
            </div>
          </div>

          <form onSubmit={handleSend}>
            {/* Title Input */}
            <div className="form-group">
              <label className="form-label">Notification Title</label>
              <input 
                className="form-input" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Big Sale is Live! 🎉"
                maxLength={50}
                required 
              />
              <div className={`char-count ${title.length > 40 ? 'limit' : ''}`}>
                {title.length}/50
              </div>
            </div>

            {/* Body Input */}
            <div className="form-group">
              <label className="form-label">Message Body</label>
              <textarea 
                className="form-textarea" 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="e.g. Check out the new features we just added..."
                rows="3"
                maxLength={150}
                required 
              />
              <div className={`char-count ${body.length > 140 ? 'limit' : ''}`}>
                {body.length}/150
              </div>
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Banner Image (Optional)</label>
              <label className="upload-label">
                
                {uploading ? (
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <div className="spinner"></div>
                    <p style={{fontSize:'12px', color:'#2563eb'}}>Uploading...</p>
                  </div>
                ) : imageUrl ? (
                   <img src={imageUrl} alt="Uploaded" className="preview-image" />
                ) : (
                  <>
                    <UploadIcon />
                    <p style={{fontSize:'14px', color:'#4b5563', fontWeight:'500'}}>Click to upload image</p>
                    <p style={{fontSize:'12px', color:'#9ca3af'}}>Auto-resized to 2:1</p>
                  </>
                )}
                
                <input type="file" style={{display:'none'}} onChange={handleFileChange} accept="image/*" />
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading || uploading} className="send-btn">
              {loading ? 'Sending...' : <>Send Notification <SendIcon /></>}
            </button>
          </form>
        </div>

        {/* --- RIGHT SIDE: PHONE PREVIEW --- */ }
        <div className="preview-section">
            <div className="preview-title">Live Preview</div>
            
            {/* PHONE FRAME */}
            <div className="phone-frame">
                <div className="notch"></div>
                
                {/* SCREEN */}
                <div className="screen">
                    <div className="status-bar">
                        <span>12:30</span>
                        <span>5G 100%</span>
                    </div>

                    {/* NOTIFICATION CARD */}
                    <div className="notif-card">
                        <div className="notif-header">
                            <div className="app-info">
                                <div className="app-icon-small">R</div>
                                <span className="app-name">RCM AI</span>
                                <span className="time">• Now</span>
                            </div>
                        </div>

                        <div className="notif-content">
                            <div className="notif-title">{title || "Notification Title"}</div>
                            <div className="notif-body">{body || "Your message body will appear here."}</div>
                        </div>

                        {imageUrl ? (
                             <img src={imageUrl} alt="Preview" className="notif-image" />
                        ) : (
                             <div className="placeholder-image">Image appears here</div>
                        )}
                        
                        {imageUrl && (
                            <div className="notif-actions">
                                <span className="action-btn">OPEN</span>
                                <span className="action-btn" style={{color:'#6b7280'}}>DISMISS</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SendNotification;