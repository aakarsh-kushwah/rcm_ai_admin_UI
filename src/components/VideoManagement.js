import React, { useState, useEffect } from 'react';
import './VideoManagement.css'; 

// =======================================================
// EditModal Component (Helper - unchanged)
// =======================================================
function EditModal({ video, onClose, onSave }) {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description);

    const handleSave = () => {
        onSave(video.id, video.type, { title, description });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Video Details</h2>
                <div className="form-group">
                    <label>Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4"></textarea>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">Cancel</button>
                    <button onClick={handleSave} className="save-btn">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

// =======================================================
// Main Video Management Component
// =======================================================
function VideoManagement() {
    // State for link submission
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState(''); 
    const [videoType, setVideoType] = useState('leaders');
    
    const [submitting, setSubmitting] = useState(false); 
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    // State for video lists (remains the same)
    const [leaderVideos, setLeaderVideos] = useState([]);
    const [productVideos, setProductVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState(null);

    // Function to fetch video lists (GET Request - remains the same)
    const fetchVideos = async () => {
        setLoading(true);
        setMessage('');
        const token = localStorage.getItem('token'); 
        
        if (!token) {
            setMessage('Authentication failed: Missing token.');
            setMessageType('error');
            setLoading(false);
            return;
        }
        
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [leadersRes, productsRes] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_URL}/api/videos/leaders`, { headers }),
                fetch(`${process.env.REACT_APP_API_URL}/api/videos/products`, { headers })
            ]);
            
            const leadersData = await leadersRes.json();
            const productsData = await productsRes.json();
            if (leadersData.success) setLeaderVideos(leadersData.data || []);
            if (productsData.success) setProductVideos(productsData.data || []);

        } catch (error) {
            setMessage(`Error: ${error.message || 'Failed to load existing videos.'}`);
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetchVideos();
        } else {
            setLoading(false);
            setMessage('Login token missing. Please re-login.');
            setMessageType('error');
        }
    }, []);

    // Function to handle video link submission
    const handleLinkSubmit = async (e) => {
        e.preventDefault();
        
        if (!videoUrl || !title) {
            setMessage('Title and YouTube URL are required.');
            setMessageType('error');
            return;
        }
        
        const token = localStorage.getItem('token'); 
        if (!token) {
            setMessage('Authentication failed. Please log in again.');
            setMessageType('error');
            return; 
        }

        setSubmitting(true);
        setMessage('Saving video link...');
        setMessageType('info');

        try {
            // CRITICAL: New POST endpoint for saving link metadata (MUST MATCH BACKEND ROUTE)
            const saveResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/videos/save-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title,
                    description,
                    videoUrl, // Send the YouTube URL
                    videoType,
                }),
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                throw new Error(errorData.message || 'Failed to save video link.');
            }

            setMessage('Video link saved successfully!');
            setMessageType('success');
            fetchVideos();
            setTitle(''); setDescription(''); setVideoUrl(''); // Clear inputs
        } catch (error) {
            console.error("Link submission error:", error);
            setMessage(`Error: ${error.message}`);
            setMessageType('error');
        } finally {
            setSubmitting(false);
        }
    };

    // Function to handle video deletion (token fix applied)
    const handleDelete = async (videoId, type) => {
        if (!window.confirm("Are you sure you want to delete this video?")) return;
        const token = localStorage.getItem('token'); 
        if (!token) { alert("Missing token."); return; }

        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/videos/${type}/${videoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchVideos();
        } catch (error) {
            alert("Failed to delete video.");
        }
    };

    // Function to handle video update (token fix applied)
    const handleUpdate = async (videoId, type, data) => {
        const token = localStorage.getItem('token'); 
        if (!token) { alert("Missing token."); return; }

        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/videos/${type}/${videoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            setIsModalOpen(false);
            fetchVideos(); 
        } catch (error) {
            alert("Failed to update video.");
        }
    };
    
    // Helper function to get YouTube Embed URL (used for 'View' button)
    const getEmbedUrl = (url, publicId) => {
        // publicId holds the clean 11-character YouTube ID
        if (publicId && publicId.length === 11) {
            return `https://www.youtube.com/embed/${publicId}?autoplay=0`;
        }
        // Fallback for non-YouTube links
        return url; 
    };


    return (
        <div className="video-management-page">
            <h2>Video Management (YouTube Links)</h2>

            {/* Video Link Submission Card */}
            <div className="management-card">
                <h3>Submit New Video Link</h3>
                <form className="upload-form" onSubmit={handleLinkSubmit}>
                    <div className="form-group">
                        <label>Video Title *</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3"></textarea>
                    </div>
                    <div className="form-group">
                        <label>Video Type *</label>
                        <select value={videoType} onChange={(e) => setVideoType(e.target.value)}>
                            <option value="leaders">Leader's Video</option>
                            <option value="products">Product's Video</option>
                        </select>
                    </div>
                    {/* CRITICAL CHANGE: File input removed, replaced with URL input */}
                    <div className="form-group"> 
                        <label>YouTube Video URL *</label>
                        <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="e.g., https://www.youtube.com/watch?v=..." required />
                    </div>
                    
                    <button type="submit" disabled={submitting} className="upload-btn">
                        {submitting ? 'Saving Link...' : 'Save Video Link'}
                    </button>
                    {message && <p className={`status-message ${messageType}`}>{message}</p>}
                </form>
            </div>

            {/* Video Management Cards (display logic remains the same) */}
            <div className="video-lists-container">
                {/* Leaders Videos */}
                <div className="management-card">
                    <h3>Manage Leaders' Videos ({leaderVideos.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="video-list">
                            {leaderVideos.map(video => (
                                <li key={video.id}>
                                    <span>{video.title}</span>
                                    <div className="actions">
                                        <button onClick={() => window.open(getEmbedUrl(video.videoUrl, video.publicId), '_blank')} className="edit-btn">View</button>
                                        <button onClick={() => { setCurrentVideo({ ...video, type: 'leaders' }); setIsModalOpen(true); }} className="edit-btn">Edit</button>
                                        <button onClick={() => handleDelete(video.id, 'leaders')} className="delete-btn">Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* Products Videos */}
                <div className="management-card">
                    <h3>Manage Products' Videos ({productVideos.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="video-list">
                            {productVideos.map(video => (
                                <li key={video.id}>
                                    <span>{video.title}</span>
                                    <div className="actions">
                                        <button onClick={() => window.open(getEmbedUrl(video.videoUrl, video.publicId), '_blank')} className="edit-btn">View</button>
                                        <button onClick={() => { setCurrentVideo({ ...video, type: 'products' }); setIsModalOpen(true); }} className="edit-btn">Edit</button>
                                        <button onClick={() => handleDelete(video.id, 'products')} className="delete-btn">Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {isModalOpen && <EditModal video={currentVideo} onClose={() => setIsModalOpen(false)} onSave={handleUpdate} />}
        </div>
    );
}

export default VideoManagement;
