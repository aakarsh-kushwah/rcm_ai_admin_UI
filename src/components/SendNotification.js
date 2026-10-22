import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon, Link as LinkIcon, X, Loader2, Bell } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './SendNotification.css';

const API = process.env.REACT_APP_API_URL;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (backend limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const POLL_EVERY_MS = 3000;
const POLL_MAX_MS = 5 * 60 * 1000;
const TITLE_MAX = 100;
const BODY_MAX = 300;

const errorMessage = (err, fallback) => {
  const status = err && err.response && err.response.status;
  const data = (err && err.response && err.response.data) || {};
  if (status === 429) return data.message || 'Too many requests. Please wait and try again.';
  if (status === 403) return 'Session expired or no admin access. Please login again.';
  if (status === 413) return 'Image is too large. Maximum 10MB.';
  if (data.detail) return `${data.message || fallback}: ${data.detail}`;
  return data.message || fallback;
};

const SendNotification = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const localPreviewRef = useRef('');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState('');
  const [job, setJob] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState('edit'); // mobile: 'edit' | 'preview'

  const [form, setForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    url: ''
  });

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  // Cleanup on unmount: stop polling, free preview memory
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    };
  }, []);

  const clearLocalPreview = () => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = '';
    setLocalPreview('');
  };

  const removeImage = () => {
    clearLocalPreview();
    setProgress(0);
    setForm((f) => ({ ...f, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1. Image upload -> our backend (admin only), NOT Cloudinary directly
  const processFile = async (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP or GIF images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image is too large. Maximum 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    clearLocalPreview();
    const previewUrl = URL.createObjectURL(file);
    localPreviewRef.current = previewUrl;
    setLocalPreview(previewUrl);

    setUploading(true);
    setProgress(0);
    setForm((f) => ({ ...f, imageUrl: '' }));

    const formData = new FormData();
    formData.append('image', file); // field name MUST be "image"

    try {
      const token = localStorage.getItem('token');
      // No manual Content-Type: the browser adds the multipart boundary itself
      const res = await axios.post(`${API}/api/upload/image?type=banner`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': undefined },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        }
      });

      if (!res.data || !res.data.url) throw new Error('No URL returned');
      setForm((f) => ({ ...f, imageUrl: res.data.url }));
      setProgress(100);
      toast.success('Image uploaded');
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, 'Image upload failed'));
      removeImage();
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e) => processFile(e.target.files && e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    processFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  };

  const openPicker = () => {
    if (!uploading && fileInputRef.current) fileInputRef.current.click();
  };

  // Poll broadcast progress
  const startPolling = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const startedAt = Date.now();
    const token = localStorage.getItem('token');

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/admin/notifications/send-all/${jobId}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJob({ jobId, ...res.data });
        const done = res.data.progressPercent >= 100 || res.data.queueState === 'failed';
        if (done || Date.now() - startedAt > POLL_MAX_MS) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (e) {
        if (Date.now() - startedAt > POLL_MAX_MS) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    }, POLL_EVERY_MS);
  };

  // 2. Send
  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading || uploading) return; // blocks double submit and sending while uploading

    if (!form.title.trim() || !form.body.trim()) {
      setTab('edit');
      return toast.error('Title aur Body likhna zaroori hai');
    }
    if (localPreview && !form.imageUrl) {
      return toast.error('Image upload poora nahi hua. Dobara try karo ya image hata do.');
    }

    const link = form.url.trim();
    if (link && !(link.startsWith('/') && !link.startsWith('//')) && !/^https:\/\//i.test(link)) {
      setTab('edit');
      return toast.error('Link "/" se ya "https://" se shuru hona chahiye.');
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      ...(link ? { actionUrl: link } : {})
    };

    try {
      const res = await axios.post(`${API}/api/admin/notifications/send-all`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Notification queued. Sending in background.');
      setJob({ jobId: res.data.jobId, status: 'queued', progressPercent: 0 });
      if (res.data.jobId) startPolling(res.data.jobId);

      setForm({ title: '', body: '', imageUrl: '', url: '' });
      clearLocalPreview();
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTab('edit');
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, 'Failed to send notification.'));
    } finally {
      setLoading(false);
    }
  };

  const previewImage = form.imageUrl || localPreview;
  const hasText = Boolean(form.title || form.body);
  const now = new Date();
  const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateLabel = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  const jobFailed = job && (job.queueState === 'failed' || job.status === 'failed');
  const jobDone = job && !jobFailed && job.progressPercent >= 100;
  const jobLabel = jobFailed ? 'Failed' : jobDone ? 'Sent' : 'Sending';

  const formPanel = (
    <section className={`sn-card ${tab === 'edit' ? '' : 'sn-hide-mobile'}`} aria-label="Compose notification">
      <form onSubmit={handleSend} noValidate>
        <div className="sn-field">
          <div className="sn-label-row">
            <label className="sn-label" htmlFor="sn-title">Title</label>
            <span className={`sn-count ${form.title.length > TITLE_MAX - 15 ? 'is-near' : ''}`}>
              {form.title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            id="sn-title"
            className="sn-input"
            type="text"
            placeholder="e.g. Weekend offer is live"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={TITLE_MAX}
            autoComplete="off"
          />
        </div>

        <div className="sn-field">
          <div className="sn-label-row">
            <label className="sn-label" htmlFor="sn-body">Message</label>
            <span className={`sn-count ${form.body.length > BODY_MAX - 30 ? 'is-near' : ''}`}>
              {form.body.length}/{BODY_MAX}
            </span>
          </div>
          <textarea
            id="sn-body"
            className="sn-textarea"
            placeholder="Short and clear. First line sabse zyada dikhti hai."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={4}
            maxLength={BODY_MAX}
          />
        </div>

        <div className="sn-field">
          <div className="sn-label-row">
            <label className="sn-label" htmlFor="sn-url">
              Link <span className="sn-optional">(optional)</span>
            </label>
          </div>
          <div className="sn-input-icon-wrap">
            <LinkIcon size={16} />
            <input
              id="sn-url"
              className="sn-input"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Khali chhodo to dashboard khulega"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <small className="sn-hint">User click karega to is link par jayega. Khali chhodo to /dashboard khulega.</small>
        </div>

        <div className="sn-field">
          <div className="sn-label-row">
            <span className="sn-label">
              Banner image <span className="sn-optional">(optional)</span>
            </span>
          </div>

          <div
            className={`sn-drop ${previewImage ? 'has-image' : ''} ${dragging ? 'is-dragging' : ''}`}
            role={previewImage ? undefined : 'button'}
            tabIndex={previewImage ? undefined : 0}
            aria-label={previewImage ? undefined : 'Upload banner image'}
            onClick={() => !previewImage && openPicker()}
            onKeyDown={(e) => {
              if (!previewImage && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openPicker();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp,image/gif"
            />

            {previewImage ? (
              <div className="sn-drop-img">
                <img src={previewImage} alt="Banner preview" />
                {uploading ? (
                  <div className="sn-drop-uploading">
                    <Loader2 className="sn-spin" />
                    <span>{progress}%</span>
                    <div className="sn-track"><div className="sn-fill" style={{ width: `${progress}%` }} /></div>
                  </div>
                ) : (
                  <button type="button" className="sn-drop-remove" onClick={removeImage} aria-label="Remove image">
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : uploading ? (
              <div className="sn-drop-bare-uploading">
                <Loader2 className="sn-spin" />
                <span>{progress}%</span>
                <div className="sn-track is-wide"><div className="sn-fill" style={{ width: `${progress}%` }} /></div>
              </div>
            ) : (
              <div className="sn-drop-empty">
                <ImageIcon size={24} />
                <strong>Tap to upload image</strong>
                <span>ya yaha drag &amp; drop karo</span>
              </div>
            )}
          </div>
          <small className="sn-hint">JPG, PNG, WEBP ya GIF. Maximum 10MB. Image 16:9 me crop hoti hai.</small>
        </div>

        {job && (
          <div className="sn-job" aria-live="polite">
            <div className="sn-job-top">
              <span>Broadcast</span>
              <span className={`sn-pill ${jobDone ? 'is-done' : ''} ${jobFailed ? 'is-failed' : ''}`}>{jobLabel}</span>
            </div>
            <div className="sn-track is-wide">
              <div className="sn-fill" style={{ width: `${job.progressPercent || 0}%` }} />
            </div>
            <div className="sn-stats">
              <div className="sn-stat"><b>{job.totalTokens || 0}</b><span>Total</span></div>
              <div className="sn-stat"><b>{job.success_count || 0}</b><span>Sent</span></div>
              <div className="sn-stat"><b>{job.failure_count || 0}</b><span>Failed</span></div>
              <div className="sn-stat"><b>{job.purged_dead_tokens || 0}</b><span>Removed dead</span></div>
            </div>
          </div>
        )}
      </form>
    </section>
  );

  const previewPanel = (
    <aside className={`sn-preview ${tab === 'preview' ? '' : 'sn-hide-mobile'}`} aria-label="Live preview">
      <div className="sn-phone">
        <div className="sn-screen">
          <div className="sn-status">
            <span>{clock}</span>
            <span>5G 100%</span>
          </div>

          <div className="sn-clock">
            <b>{clock}</b>
            <span>{dateLabel}</span>
          </div>

          <div className={`sn-notif ${hasText ? '' : 'is-placeholder'}`}>
            <div className="sn-notif-head">
              <span className="sn-app-icon" />
              <span className="sn-app-name">RCMAI</span>
              <span className="sn-notif-time">now</span>
            </div>
            <h4>{form.title || 'Notification title'}</h4>
            <p>{form.body || 'Your message will appear here.'}</p>
            {previewImage && (
              <div className="sn-notif-img">
                <img src={previewImage} alt="" />
              </div>
            )}
            {form.url && (
              <div className="sn-notif-link">
                Opens: {form.url.substring(0, 28)}{form.url.length > 28 ? '...' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="sn-preview-caption">Live preview</p>
    </aside>
  );

  return (
    <div className="sn-page">
      <Toaster position="top-center" />

      <header className="sn-header">
        <div className="sn-header-icon"><Bell size={22} /></div>
        <div>
          <h1>Push notification</h1>
          <p>Sabhi users ko bhejo</p>
        </div>
      </header>

      <div className="sn-tabs" role="tablist" aria-label="Edit or preview">
        <button type="button" role="tab" className="sn-tab" aria-selected={tab === 'edit'} onClick={() => setTab('edit')}>
          Edit
        </button>
        <button type="button" role="tab" className="sn-tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
          Preview
        </button>
      </div>

      <main className="sn-grid">
        {formPanel}
        {previewPanel}
      </main>

      <div className="sn-footer">
        <div className="sn-footer-inner">
          <button type="button" className="sn-submit" onClick={handleSend} disabled={loading || uploading}>
            {loading ? <Loader2 className="sn-spin" size={18} /> : <Send size={18} />}
            {uploading ? 'Uploading image...' : loading ? 'Sending...' : 'Send notification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNotification;