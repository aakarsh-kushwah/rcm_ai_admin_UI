import React, { useState, useEffect, useCallback } from 'react';
import './VideoManagement.css'; 

// --- ✅ NAYI Category List (Aapke dwara pradaan ki gayi) ---
const productCategories = [
    "Health Care", "Men's Fashion", "Women's Fashion", "Kid's Fashion",
    "Footwears", "Bags & Accessories", "Bedsheets & Towels", "Personal Care",
    "Household", "Electronics", "Foods & Grocery", "Home & Kitchen",
    "Paint & Construction", "Agriculture", "Stationery"
];

// =======================================================
// EditModal Component (✅ UPDATED)
// Edit karte samay ab text input ke bajaaye dropdown dikhega
// =======================================================
function EditModal({ video, onClose, onSave }) {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description);
    // ✅ Edit modal mein bhi category add karein
    const [category, setCategory] = useState(video.category || 'General');

    const handleSave = () => {
        const dataToSave = { title, description };
        // ✅ Category ko bhi save karein
        if (video.type === 'products') {
            dataToSave.category = category;
        }
        onSave(video.id, video.type, dataToSave);
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
                
                {/* ✅ Naya Category Dropdown (sirf products ke liye) */}
                {video.type === 'products' && (
                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {/* Product categories ki list yahaan map karein */}
                            {productCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            {/* Agar koi puraani category hai jo list mein nahi, usse bhi dikhayein */}
                            {!productCategories.includes(category) && (
                                <option key={category} value={category}>{category}</option>
                            )}
                        </select>
                    </div>
                )}
                
                <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">Cancel</button>
                    <button onClick={handleSave} className="save-btn">Save Changes</button>
                </div>
            </div>
        </div>
    );
}


// =======================================================
// Main Video Management Component (✅ UPDATED)
// =======================================================
function VideoManagement() {
    const [urls, setUrls] = useState(''); 
    // ✅ NAYA STATE: 'videoType' aur 'category' ko ek hi state mein manage karein
    const [selectedCategory, setSelectedCategory] = useState('leaders'); // Default 'leaders'
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
    const API_URL = process.env.REACT_APP_API_URL;

    // --- Fetch Videos (GET) ---
    const fetchVideos = useCallback(async () => {
        setLoading(true);
        if (!token) { /* ... (error handling - unchanged) ... */ return; }
        
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            if (!API_URL) throw new Error("API URL not configured in .env file");

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
    }, [token, API_URL]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    // --- Batch Scrape Import (✅ UPDATED) ---
    const handleBatchScrapeImport = async (e) => {
        e.preventDefault();
        
        const urlList = urls.split('\n').filter(url => url.trim() !== ''); 
        if (urlList.length === 0) {
            setImportMessage('Please paste at least one YouTube URL.');
            setImportMessageType('error');
            return;
        }
        
        if (!token) { /* ... (auth error - unchanged) ... */ return; }

        setIsImporting(true);
        setImportMessage(`Importing ${urlList.length} video(s)... This may take a moment.`);
        setImportMessageType('info');

        // ✅ Logic: API ke liye data taiyaar karein
        const videoType = (selectedCategory === 'leaders') ? 'leaders' : 'products';
        const category = (selectedCategory === 'leaders') ? null : selectedCategory;

        try {
            const importResponse = await fetch(`${API_URL}/api/videos/batch-scrape-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    urls: urlList, 
                    videoType: videoType,
                    category: category // ✅ Category ko API par bhejein
                }),
            });

            const data = await importResponse.json();
            if (!importResponse.ok || !data.success) {
                throw new Error(data.message || 'Failed to import videos.');
            }

            setImportMessage(data.message); 
            setImportMessageType('success');
            fetchVideos(); // List ko refresh karein
            setUrls(''); // Text area saaf karein
            // setSelectedCategory('leaders'); // Dropdown ko default par reset karein
        } catch (error) {
            console.error("Batch import error:", error);
            setImportMessage(`Import Failed: ${error.message}`);
            setImportMessageType('error');
        } finally {
            setIsImporting(false);
        }
    };


    // --- Delete Video (Unchanged) ---
    const handleDelete = async (videoId, type) => {
        if (!window.confirm("Are you sure?")) return;
        if (!token) { alert("Missing token."); return; }
        try {
            await fetch(`${API_URL}/api/videos/${type}/${videoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchVideos();
        } catch (error) {
            alert("Failed to delete video.");
        }
    };

    // --- Update Video (Unchanged) ---
    const handleUpdate = async (videoId, type, data) => {
        if (!token) { alert("Missing token."); return; }
        try {
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
    
    // --- Helper function (Unchanged) ---
    const getEmbedUrl = (url, publicId) => {
        if (publicId && publicId.length === 11) {
            return `https://www.youtube.com/embed/${publicId}?autoplay=0`;
        }
        return url; 
    };


    return (
        <div className="video-management-page">
            <h2>Video Management</h2>

            {/* --- Batch Import Form (✅ UPDATED) --- */}
            <div className="management-card batch-import-card">
                <h3>🚀 Batch Import Video URLs</h3>
                <p>URLs paste karein (har URL nayi line par) aur category chunein.</p>
                
                <form className="upload-form" onSubmit={handleBatchScrapeImport}>
                    <div className="form-group">
                        <label>YouTube Video URLs (One per line) *</label>
                        <textarea 
                            rows="7"
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                            className="batch-textarea"
                        />
                    </div>
                    
                    {/* ✅ NAYA Dropdown: Video Type + Category */}
                    <div className="form-group">
                        <label>Category *</label>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            <option value="leaders">Leader's Video</option>
                            <optgroup label="Product Categories">
                                {productCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    
                    <button type="submit" disabled={isImporting} className="upload-btn">
                        {isImporting ? 'Importing Videos...' : 'Import Videos'}
                    </button>
                    {importMessage && <p className={`status-message ${importMessageType}`}>{importMessage}</p>}
                </form>
            </div>

            {/* --- Video Lists (Category badge ke saath updated) --- */}
            <div className="video-lists-container">
                {/* Leaders Videos (Unchanged) */}
                <div className="management-card">
                    <h3>Manage Leaders' Videos ({leaderVideos.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="video-list">
                            {leaderVideos.map(video => (
                                <li key={video.id}>
                                    <span className='video-title-admin'>{video.title}</span>
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
                {/* Products Videos (Category badge ke saath) */}
                <div className="management-card">
                    <h3>Manage Products' Videos ({productVideos.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="video-list">
                            {productVideos.map(video => (
                                <li key={video.id}>
                                    <span className='video-title-admin'>{video.title}</span>
                                    <span className='video-category-badge'>{video.category || 'General'}</span>
              _                     <div className="actions">
                                        <button onClick={() => window.open(getEmbedUrl(video.videoUrl, video.publicId), '_blank')} className="edit-btn">View</button>
                                        <button onClick={() => { setCurrentVideo({ ...video, type: 'products' }); setIsModalOpen(true); }} className="edit-btn">Edit</button>
                      _                 <button onClick={() => handleDelete(video.id, 'products')} className="delete-btn">Delete</button>
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