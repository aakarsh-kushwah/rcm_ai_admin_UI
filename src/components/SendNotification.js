import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon, Link as LinkIcon, X, Loader2, Bell } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './SendNotification.css';

const SendNotification = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // === STATE ===
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Simple Form Data
  const [form, setForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    url: '' // Yeh raha aapka URL option
  });

  // Auth Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const CLOUD_NAME = process.env.REACT_APP_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.REACT_APP_UPLOAD_PRESET;

  // 1. Image Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
      setForm({ ...form, imageUrl: res.data.secure_url });
      toast.success("Image Uploaded");
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  // 2. Send Function
  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return toast.error("Title aur Body likhna zaroori hai");

    setLoading(true);
    const token = localStorage.getItem('token');

    // Payload ready karna
    const payload = {
      title: form.title,
      body: form.body,
      imageUrl: form.imageUrl,
      data: {
        url: form.url // Mobile app is URL ko use karke page open karega
      }
    };

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notifications/send`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Notification Sent Successfully! 🚀");
      setForm({ title: '', body: '', imageUrl: '', url: '' }); // Reset Form
    } catch (err) {
      console.error(err);
      toast.error("Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <Toaster position="top-center" />
      
      <div className="content-grid">
        
        {/* === LEFT: FORM === */}
        <div className="form-panel glass">
          <div className="panel-header">
            <div className="icon-badge"><Bell size={20} /></div>
            <h2>Push Notification</h2>
          </div>

          <div className="scroll-area">
            <form onSubmit={handleSend}>
              
              {/* Title Input */}
              <div className="input-group">
                <label>Title</label>
                <input 
                  type="text" 
                  placeholder="Enter Title..." 
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  maxLength={50}
                />
                <span className="char-count">{form.title.length}/50</span>
              </div>

              {/* Body Input */}
              <div className="input-group">
                <label>Message</label>
                <textarea 
                  placeholder="Type your message here..." 
                  value={form.body}
                  onChange={(e) => setForm({...form, body: e.target.value})}
                  rows={4}
                  maxLength={150}
                />
              </div>

              {/* URL Input (Main Feature) */}
              <div className="input-group">
                <label>Target URL (Link)</label>
                <div className="url-input-wrapper">
                  <LinkIcon size={16} className="input-icon"/>
                  <input 
                    type="text" 
                    placeholder="https://example.com/offer" 
                    value={form.url}
                    onChange={(e) => setForm({...form, url: e.target.value})}
                  />
                </div>
                <small className="hint">User click karne par is link par jayega.</small>
              </div>

              {/* Image Upload */}
              <div className="input-group">
                <label>Banner Image (Optional)</label>
                <div 
                  className={`image-dropzone ${form.imageUrl ? 'active' : ''}`}
                  onClick={() => fileInputRef.current.click()}
                >
                  <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} accept="image/*" />
                  
                  {uploading ? <Loader2 className="spin" /> : 
                   form.imageUrl ? (
                    <div className="img-preview">
                      <img src={form.imageUrl} alt="preview" />
                      <button type="button" onClick={(e) => {e.stopPropagation(); setForm({...form, imageUrl: ''})}}>
                        <X size={14}/>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-text">
                      <ImageIcon size={20} />
                      <span>Click to Upload</span>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>

          <div className="panel-footer">
            <button className="submit-btn" onClick={handleSend} disabled={loading || uploading}>
              {loading ? <Loader2 className="spin" /> : <Send size={18} />}
              Send Notification
            </button>
          </div>
        </div>

        {/* === RIGHT: PREVIEW === */}
        <div className="preview-panel">
          <div className="phone-mockup">
            <div className="screen">
              <div className="status-bar">
                <span>12:30</span>
                <span>📶 🔋</span>
              </div>

              {/* Notification Card Preview */}
              <div className="notif-card">
                <div className="notif-header">
                  <span className="app-name">RCM AI</span>
                  <span className="time">now</span>
                </div>
                <div className="notif-body">
                  <div className="text-area">
                    <h4>{form.title || "Notification Title"}</h4>
                    <p>{form.body || "Notification message will appear here..."}</p>
                  </div>
                </div>
                {form.imageUrl && (
                  <div className="notif-image">
                    <img src={form.imageUrl} alt="banner" />
                  </div>
                )}
                {form.url && (
                   <div className="link-badge">
                      🔗 Attached: {form.url.substring(0, 25)}...
                   </div>
                )}
              </div>

            </div>
          </div>
          <p>Live Preview</p>
        </div>

      </div>
    </div>
  );
};

export default SendNotification;