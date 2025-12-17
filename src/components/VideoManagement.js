import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './VideoManagement.css'; 
// ✅ Naye icons import karein
import { Users, Package, ArrowLeft } from 'lucide-react'; 

// --- Category List (Unchanged) ---
const productCategories = [
    "Health Care", "Men's Fashion", "Women's Fashion", "Kid's Fashion",
    "Footwears", "Bags & Accessories", "Bedsheets & Towels", "Personal Care",
    "Household", "Electronics", "Foods & Grocery", "Home & Kitchen",
    "Paint & Construction", "Agriculture", "Stationery"
];

// =======================================================
// EditModal Component (Unchanged)
// =======================================================
function EditModal({ video, onClose, onSave }) {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description);
    const [category, setCategory] = useState(video.category || 'General');

    const handleSave = () => {
        const dataToSave = { title, description };
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
                {video.type === 'products' && (
                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {productCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
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
// Reusable Component: VideoListManager (Unchanged)
// =======================================================
function VideoListManager({ title, videos, videoType, categories = [], onEdit, onDelete, getEmbedUrl }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    const filteredVideos = useMemo(() => {
        return videos.filter(video => {
            const matchesCategory = (categories.length === 0 || filterCategory === 'All') 
                ? true 
                : video.category === filterCategory;
            const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [videos, searchTerm, filterCategory, categories]);

    return (
        <div className="management-card video-list-manager">
            <h3>{title} ({filteredVideos.length} / {videos.length})</h3>

            <div className="list-filters">
                {categories.length > 0 && (
                    <div className="form-group">
                        <label htmlFor={`${videoType}-category-filter`}>Filter by Category</label>
                        <select 
                            id={`${videoType}-category-filter`}
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="form-group search-group">
                    <label htmlFor={`${videoType}-search`}>Search by Title</label>
                    <input
                        type="text"
                        id={`${videoType}-search`}
                        placeholder="Type to search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="video-table-wrapper">
                <table className="video-data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            {categories.length > 0 && <th>Category</th>}
                            <th className="actions-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVideos.length > 0 ? (
                            filteredVideos.map(video => (
                                <tr key={video.id}>
                                    <td data-label="Title">{video.title}</td>
                                    {categories.length > 0 && (
                                        <td data-label="Category">
                                            <span className='video-category-badge'>{video.category || 'N/A'}</span>
                                        </td>
                                    )}
                                    <td data-label="Actions" className="actions-cell">
                                        <button onClick={() => window.open(getEmbedUrl(video.videoUrl, video.publicId), '_blank')} className="view-btn">View</button>
                                        <button onClick={() => onEdit({ ...video, type: videoType })} className="edit-btn">Edit</button>
                                        <button onClick={() => onDelete(video.id, videoType)} className="delete-btn">Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={categories.length > 0 ? 3 : 2} style={{ textAlign: 'center', padding: '20px' }}>
                                    No videos found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// =======================================================
// Main Video Management Component (✅ NAYA LAYOUT)
// =======================================================
function VideoManagement() {
    // --- States (Unchanged) ---
    const [urls, setUrls] = useState(''); 
    const [selectedCategory, setSelectedCategory] = useState('leaders');
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');
    const [importMessageType, setImportMessageType] = useState('');
    const [leaderVideos, setLeaderVideos] = useState([]);
    const [productVideos, setProductVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState(null);
    
    // --- ✅ NAYA STATE: View Management ---
    // 'main' = Hub page (Import + Nav Cards)
    // 'leaders' = Leaders list view
    // 'products' = Products list view
    const [view, setView] = useState('main'); 

    const token = localStorage.getItem('token'); 
    const API_URL = process.env.REACT_APP_API_URL;

    // --- Logic & Handlers (Unchanged) ---
    const fetchVideos = useCallback(async () => {
        setLoading(true);
        setImportMessage('');
        if (!token) { /* ... error handling ... */ setLoading(false); return; }
        
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            if (!API_URL) throw new Error("API URL not configured");

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

    const handleBatchScrapeImport = async (e) => {
        e.preventDefault();
        const urlList = urls.split('\n').filter(url => url.trim() !== ''); 
        if (urlList.length === 0) { /* ... error handling ... */ return; }
        if (!token) { return; }

        setIsImporting(true);
        setImportMessage(`Importing ${urlList.length} video(s)...`);
        setImportMessageType('info');

        const videoType = (selectedCategory === 'leaders') ? 'leaders' : 'products';
        const category = (selectedCategory === 'leaders') ? null : selectedCategory;

        try {
            const importResponse = await fetch(`${API_URL}/api/videos/batch-scrape-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ urls: urlList, videoType: videoType, category: category }),
            });

            const data = await importResponse.json();
            if (!importResponse.ok || !data.success) { throw new Error(data.message); }

            setImportMessage(data.message); 
            setImportMessageType('success');
            fetchVideos(); // Refresh lists
            setUrls('');
        } catch (error) {
            setImportMessage(`Import Failed: ${error.message}`);
            setImportMessageType('error');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDelete = async (videoId, type) => {
        if (!window.confirm("Are you sure?")) return;
        if (!token) { return; }
        try {
            await fetch(`${API_URL}/api/videos/${type}/${videoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchVideos(); // Refresh lists
        } catch (error) { alert("Failed to delete video."); }
    };

    const handleUpdate = async (videoId, type, data) => {
        if (!token) { return; }
        try {
            await fetch(`${API_URL}/api/videos/${type}/${videoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // ✅ YEH LINE FIX KI GAYI HAI
                body: JSON.stringify(data),
            });
            setIsModalOpen(false);
            fetchVideos(); // Refresh lists
        } catch (error) { alert("Failed to update video."); }
    };
    const handleEditClick = (video) => {
        setCurrentVideo(video);
        setIsModalOpen(true);
    };
    
    const getEmbedUrl = (url, publicId) => {
        if (publicId && publicId.length === 11) {
            return `https://www.youtube.com/embed/${publicId}?autoplay=0`;
        }
        return url; 
    };

    // --- ✅ NAYA: Render Function for Main Hub ---
    const renderMainView = () => (
        <>
            {/* --- Batch Import Card (Pehle jaisa) --- */}
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

            {/* --- ✅ NAYA: Navigation Cards --- */}
            <h2>Manage Existing Videos</h2>
            <div className="nav-cards-container">
                {/* --- Leader Videos Nav Card --- */}
                <div className="nav-card">
                    <div className="nav-card-icon">
                        <Users size={40} />
                    </div>
                    <div className="nav-card-body">
                        <h4 className="nav-card-title">Leaders' Videos</h4>
                        <p className="nav-card-count">Total: {loading ? '...' : leaderVideos.length}</p>
                    </div>
                    <button className="nav-card-btn" onClick={() => setView('leaders')}>
                        Manage &rarr;
                    </button>
                </div>

                {/* --- Product Videos Nav Card --- */}
                <div className="nav-card">
                    <div className="nav-card-icon">
                        <Package size={40} />
                    </div>
                    <div className="nav-card-body">
                        <h4 className="nav-card-title">Products' Videos</h4>
                        <p className="nav-card-count">Total: {loading ? '...' : productVideos.length}</p>
                    </div>
                    <button className="nav-card-btn" onClick={() => setView('products')}>
                        Manage &rarr;
                    </button>
                </div>
            </div>
        </>
    );

    // --- ✅ NAYA: Main Render Logic ---
    return (
        <div className="video-management-page">
            <h2>Video Management</h2>

            {/* Modal ko top level par rakhein */}
            {isModalOpen && <EditModal video={currentVideo} onClose={() => setIsModalOpen(false)} onSave={handleUpdate} />}
            
            {/* View ke hisaab se content dikhayein */}
            {view === 'main' && (
                loading ? <p>Loading...</p> : renderMainView()
            )}

            {view === 'leaders' && (
                <>
                    <button className="back-btn" onClick={() => setView('main')}>
                        <ArrowLeft size={16} /> Back to Main
                    </button>
                    <VideoListManager
                        title="Manage Leaders' Videos"
                        videos={leaderVideos}
                        videoType="leaders"
                        onEdit={handleEditClick}
                        onDelete={handleDelete}
                        getEmbedUrl={getEmbedUrl}
                    />
                </>
            )}

            {view === 'products' && (
                <>
                    <button className="back-btn" onClick={() => setView('main')}>
                        <ArrowLeft size={16} /> Back to Main
                    </button>
                    <VideoListManager
                        title="Manage Products' Videos"
                        videos={productVideos}
                        videoType="products"
                        categories={productCategories}
                        onEdit={handleEditClick}
                        onDelete={handleDelete}
                        getEmbedUrl={getEmbedUrl}
                    />
                </>
            )}
        </div>
    );
}

export default VideoManagement;