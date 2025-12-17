import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, Calendar, Send, Image as ImageIcon, 
  Type, Link as LinkIcon, Layers, CheckCircle, 
  AlertCircle, X, Loader2, Wand2 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './SendNotification.css';

const SendNotification = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Advanced State Management
  const [activeTab, setActiveTab] = useState('content'); // content | actions | schedule
  const [platform, setPlatform] = useState('ios'); // ios | android
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    deepLink: '', // e.g., app://products/123
    scheduledTime: '',
    actionButtons: [], // e.g., [{ label: 'Buy', link: '' }]
  });

  // Auth Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  // Cloudinary Optimization
  const CLOUD_NAME = process.env.REACT_APP_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.REACT_APP_UPLOAD_PRESET;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
      // Smart Crop optimization
      const optimized = res.data.secure_url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
      setForm({ ...form, imageUrl: optimized });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddAction = () => {
    if (form.actionButtons.length >= 2) return toast.error("Max 2 actions allowed");
    setForm({
      ...form,
      actionButtons: [...form.actionButtons, { label: 'New Action', link: '' }]
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...form.actionButtons];
    newActions[index][field] = value;
    setForm({ ...form, actionButtons: newActions });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if(!form.title || !form.body) return toast.error("Title and Body are required");

    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Payload Construction
    const payload = {
      title: form.title,
      body: form.body,
      imageUrl: form.imageUrl,
      data: {
        deepLink: form.deepLink,
        actions: JSON.stringify(form.actionButtons)
      },
      scheduledTime: form.scheduledTime || new Date().toISOString()
    };

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notifications/send`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`🚀 Campaign Launched! Reach: ${res.data.successCount || 'Global'}`);
      setForm({ title: '', body: '', imageUrl: '', deepLink: '', actionButtons: [], scheduledTime: '' });
    } catch (err) {
      toast.error("Campaign failed to launch. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* BACKGROUND ELEMENTS */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <div className="dashboard-grid">
        {/* === LEFT PANEL: CONTROL CENTER === */}
        <section className="control-panel glass-panel">
          <header className="panel-header">
            <div className="header-icon-box">
              <Send size={24} className="text-white" />
            </div>
            <div>
              <h1>Push Command Center</h1>
              <p>Orchestrate global campaigns with precision.</p>
            </div>
          </header>

          <nav className="tab-nav">
            <button 
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} 
              onClick={() => setActiveTab('content')}
            >
              <Type size={16} /> Content
            </button>
            <button 
              className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`} 
              onClick={() => setActiveTab('actions')}
            >
              <Layers size={16} /> Interactivity
            </button>
            <button 
              className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} 
              onClick={() => setActiveTab('schedule')}
            >
              <Calendar size={16} /> Schedule
            </button>
          </nav>

          <div className="panel-content">
            <AnimatePresence mode="wait">
              {activeTab === 'content' && (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="form-group-stack"
                >
                  <div className="input-group">
                    <label>Campaign Title <span className="badge-ai"><Wand2 size={10}/> AI</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Flash Sale Alert ⚡" 
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      maxLength={50}
                    />
                    <div className="char-counter" style={{ width: `${(form.title.length/50)*100}%` }}></div>
                  </div>

                  <div className="input-group">
                    <label>Message Body</label>
                    <textarea 
                      placeholder="Write impactful copy here..." 
                      value={form.body}
                      onChange={(e) => setForm({...form, body: e.target.value})}
                      rows={3}
                      maxLength={150}
                    />
                  </div>

                  <div className="input-group">
                    <label>Rich Media (Banner)</label>
                    <div 
                      className={`drop-zone ${form.imageUrl ? 'has-image' : ''}`}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        onChange={handleFileUpload} 
                        accept="image/*"
                      />
                      {uploading ? (
                        <Loader2 className="spinner" />
                      ) : form.imageUrl ? (
                        <div className="preview-image-container">
                          <img src={form.imageUrl} alt="preview" />
                          <button 
                            className="remove-img-btn"
                            onClick={(e) => { e.stopPropagation(); setForm({...form, imageUrl: ''}); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="placeholder-content">
                          <ImageIcon size={32} />
                          <span>Click to Upload 2:1 Aspect Ratio</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'actions' && (
                <motion.div 
                  key="actions"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="form-group-stack"
                >
                  <div className="input-group">
                    <label>Deep Link (On Click)</label>
                    <div className="input-with-icon">
                      <LinkIcon size={16} />
                      <input 
                        type="text" 
                        placeholder="myapp://products/detail/123" 
                        value={form.deepLink}
                        onChange={(e) => setForm({...form, deepLink: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="action-buttons-manager">
                    <div className="flex-row-between">
                      <label>Action Buttons ({form.actionButtons.length}/2)</label>
                      <button type="button" onClick={handleAddAction} className="text-btn">
                        + Add Button
                      </button>
                    </div>
                    {form.actionButtons.map((btn, i) => (
                      <div key={i} className="action-row">
                        <input 
                          type="text" 
                          placeholder="Label (e.g. Buy)" 
                          value={btn.label}
                          onChange={(e) => updateAction(i, 'label', e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Action Link" 
                          value={btn.link}
                          onChange={(e) => updateAction(i, 'link', e.target.value)}
                        />
                        <button 
                          className="delete-action"
                          onClick={() => {
                             const newActions = form.actionButtons.filter((_, idx) => idx !== i);
                             setForm({...form, actionButtons: newActions});
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div 
                  key="schedule"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="form-group-stack center-content"
                >
                  <div className="schedule-card">
                    <div className="radio-group">
                      <label className={`radio-option ${!form.scheduledTime ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="schedule" 
                          checked={!form.scheduledTime} 
                          onChange={() => setForm({...form, scheduledTime: ''})}
                        />
                        <Send size={18} />
                        <div className="radio-text">
                          <span>Send Immediately</span>
                          <small>Best for breaking news</small>
                        </div>
                      </label>
                      <label className={`radio-option ${form.scheduledTime ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="schedule" 
                          checked={!!form.scheduledTime} 
                          onChange={() => setForm({...form, scheduledTime: new Date().toISOString().slice(0, 16)})} 
                        />
                        <Calendar size={18} />
                        <div className="radio-text">
                          <span>Schedule Later</span>
                          <small>Optimize for local timezones</small>
                        </div>
                      </label>
                    </div>
                    
                    {form.scheduledTime && (
                      <input 
                        type="datetime-local" 
                        className="date-picker"
                        value={form.scheduledTime}
                        onChange={(e) => setForm({...form, scheduledTime: e.target.value})}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="panel-footer">
            <button 
              className="launch-btn-main" 
              onClick={handleSend}
              disabled={loading || uploading}
            >
              {loading ? <Loader2 className="spinner" /> : <Send size={18} />}
              {form.scheduledTime ? "Schedule Campaign" : "Blast Campaign"}
            </button>
          </div>
        </section>


        {/* === RIGHT PANEL: PREVIEW ENGINE === */}
        <section className="preview-engine">
          <div className="platform-toggle">
            <button 
              className={platform === 'ios' ? 'active' : ''}
              onClick={() => setPlatform('ios')}
            >
              iOS 17
            </button>
            <button 
              className={platform === 'android' ? 'active' : ''}
              onClick={() => setPlatform('android')}
            >
              Android 14
            </button>
          </div>

          <div className="device-frame-container">
            <div className={`phone-frame ${platform}`}>
              <div className="notch"></div>
              <div className="screen-content">
                
                {/* Status Bar */}
                <div className="status-bar">
                  <span>9:41</span>
                  <div className="icons">
                    <div className="signal"></div>
                    <div className="wifi"></div>
                    <div className="battery"></div>
                  </div>
                </div>

                {/* The Notification Card */}
                <motion.div 
                  className={`notification-card ${platform}`}
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="notif-header">
                    <div className="app-info">
                      <div className="app-icon-mini">R</div>
                      <span className="app-name">RCM AI</span>
                      {platform === 'android' && <span className="dot-separator">•</span>}
                      <span className="time-ago">now</span>
                    </div>
                  </div>

                  <div className="notif-body-content">
                    <div className="text-content">
                      <h4 className={!form.title ? 'placeholder' : ''}>
                        {form.title || "Your Headline Here"}
                      </h4>
                      <p className={!form.body ? 'placeholder' : ''}>
                        {form.body || "Notification body text will appear here."}
                      </p>
                    </div>
                    {form.imageUrl && platform === 'ios' && (
                      <div className="img-thumbnail">
                        <img src={form.imageUrl} alt="thumb" />
                      </div>
                    )}
                  </div>

                  {/* Big Image (Expanded View) */}
                  {form.imageUrl && (
                    <div className="big-image-preview">
                       <img src={form.imageUrl} alt="banner" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  {form.actionButtons.length > 0 && (
                    <div className="action-buttons-preview">
                      {form.actionButtons.map((btn, i) => (
                        <span key={i} className="action-chip">{btn.label || 'Action'}</span>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Background Wallpaper for Realism */}
                <div className="wallpaper-blur"></div>
              </div>
            </div>
          </div>
          
          <div className="preview-hint">
            <Smartphone size={14} />
            <span>Real-time {platform === 'ios' ? 'iPhone' : 'Pixel'} Rendering</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SendNotification;