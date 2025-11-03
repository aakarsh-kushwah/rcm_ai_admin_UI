// src/components/VideoManagement.js
import React, { useState, useEffect, useCallback } from 'react';
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
    // --- ✅ Naya State: Batch Scrape (Free) ---
    const [urls, setUrls] = useState(''); // Text area ke liye
    const [videoType, setVideoType] = useState('leaders');
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');
    const [importMessageType, setImportMessageType] = useState('');

    // --- State for video lists ---
    const [leaderVideos, setLeaderVideos] = useState([]);
    const [productVideos, setProductVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState(null);
    const token = localStorage.getItem('token'); 

    // --- Fetch Videos (GET) ---
    const fetchVideos = useCallback(async () => {
        setLoading(true);
        if (!token) {
            setImportMessage('Authentication failed: Missing token.');
            setImportMessageType('error');
            setLoading(false);
            return;
        }
        
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const API_URL = process.env.REACT_APP_API_URL;
            if (!API_URL) throw new Error("API URL not configured");

            // Admin panel ke liye 1000 ki limit theek hai
            const [leadersRes, productsRes] = await Promise.all([
                fetch(`${API_URL}/api/videos/leaders?page=1&limit=1000`, { headers }),
                fetch(`${API_URL}/api/videos/products?page=1&limit=1000`, { headers })
            ]);
            
            const leadersData = await leadersRes.json();
            const productsData = await productsRes.json();
            
            if (leadersData.success) setLeaderVideos(leadersData.data || []);
            if (productsData.success) setProductVideos(productsData.data || []);

        } catch (error) {
            setImportMessage(`Error: ${error.message || 'Failed to load existing videos.'}`);
            setImportMessageType('error');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    // --- ✅ Naya Function: Batch Scrape Import (Multiple URLs) ---
    const handleBatchScrapeImport = async (e) => {
        e.preventDefault();
        
        // Text area se URLs ko split karke array banayein
        const urlList = urls.split('\n').filter(url => url.trim() !== ''); // Khali line hata dein

        if (urlList.length === 0) {
            setImportMessage('Please paste at least one YouTube URL.');
            setImportMessageType('error');
            return;
        }
        
        if (!token) {
           setImportMessage('Authentication failed. Please log in again.');
           setImportMessageType('error');
           return; 
        }

        setIsImporting(true);
        setImportMessage(`Importing ${urlList.length} video(s)... This may take a moment.`);
        setImportMessageType('info');

        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const importResponse = await fetch(`${API_URL}/api/videos/batch-scrape-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    urls: urlList, // URLs ka array bhejein
                    videoType: videoType,
                }),
            });

            const data = await importResponse.json();
            if (!importResponse.ok || !data.success) {
                throw new Error(data.message || 'Failed to import videos.');
            }

            setImportMessage(data.message); // e.g., "Imported 10 new videos. (Skipped 5 duplicates)"
            setImportMessageType('success');
            fetchVideos(); // List ko refresh karein
            setUrls(''); // Text area saaf karein
        } catch (error) {
            console.error("Batch import error:", error);
            setImportMessage(`Import Failed: ${error.message}`);
            setImportMessageType('error');
        } finally {
            setIsImporting(false);
        }
    };


    // --- Delete Video (DELETE) ---
    const handleDelete = async (videoId, type) => {
        // ... (Yeh function same rahega)
        if (!window.confirm("Are you sure?")) return;
        if (!token) { alert("Missing token."); return; }
        try {
            const API_URL = process.env.REACT_APP_API_URL;
            await fetch(`${API_URL}/api/videos/${type}/${videoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchVideos();
        } catch (error) {
            alert("Failed to delete video.");
        }
    };

    // --- Update Video (PUT) ---
    const handleUpdate = async (videoId, type, data) => {
        // ... (Yeh function same rahega)
        if (!token) { alert("Missing token."); return; }
        try {
            const API_URL = process.env.REACT_APP_API_URL;
            await fetch(`${API_URL}/api/videos/${type}/${videoId}`, {
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
    
    // ... (getEmbedUrl function same rahega)
    const getEmbedUrl = (url, publicId) => {
        if (publicId && publicId.length === 11) {
            return `https://www.youtube.com/embed/${publicId}?autoplay=0`;
        }
        return url; 
    };


    return (
        <div className="video-management-page">
            <h2>Video Management</h2>

            {/* --- ✅ Naya Form: Batch Import (Free) --- */}
            <div className="management-card batch-import-card">
                <h3>🚀 Batch Import Video URLs (100% Free)</h3>
                <p>Ek ya ek se zyada YouTube URLs paste karein (har URL nayi line par). Title apne aap aa jayega.</p>
                
                <form className="upload-form" onSubmit={handleBatchScrapeImport}>
                    <div className="form-group">
                        <label>YouTube Video URLs (One per line) *</label>
                        <textarea 
                            rows="7"
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            placeholder="httpsNext' paste your list of YouTube URLs here..."
                            required
                            className="batch-textarea"
                        />
                    </div>
                    <div className="form-group">
                        <label>Video Type *</label>
                        <select value={videoType} onChange={(e) => setVideoType(e.target.value)}>
                            <option value="leaders">Leader's Video</option>
                            <option value="products">Product's Video</option>
                        </select>
                    </div>
                    
                    <button type="submit" disabled={isImporting} className="upload-btn">
                        {isImporting ? 'Importing Videos...' : 'Import Videos'}
                    </button>
                    {importMessage && <p className={`status-message ${importMessageType}`}>{importMessage}</p>}
                </form>
            </div>

            {/* --- (Single Video Form hata diya gaya hai) --- */}

            {/* --- Video Lists --- */}
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