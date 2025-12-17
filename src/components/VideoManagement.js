import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    Plus, Trash2, Youtube, ArrowRight, Package, Users, 
    Search, Filter, Edit3, Eye, MoreVertical, X, CheckCircle, Loader2 
} from 'lucide-react';
import './VideoManagement.css';

// --- Constants ---
const PRODUCT_CATEGORIES = [
    "Health Care", "Men's Fashion", "Women's Fashion", "Kid's Fashion",
    "Footwears", "Bags & Accessories", "Bedsheets & Towels", "Personal Care",
    "Household", "Electronics", "Foods & Grocery", "Home & Kitchen",
    "Paint & Construction", "Agriculture", "Stationery"
];

// --- Helper: Extract YouTube ID ---
const getYouTubeID = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// ==========================================
// 1. SMART URL INPUT ENGINE (The Feature You Asked For)
// ==========================================
const UrlImportModule = ({ onImport, isImporting, category, setCategory }) => {
    const [inputs, setInputs] = useState(['']);

    // Handle typing
    const updateInput = (index, value) => {
        const newInputs = [...inputs];
        newInputs[index] = value;
        setInputs(newInputs);
    };

    // Handle Smart Paste (Paste list -> Create boxes)
    const handlePaste = (e, index) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const urls = pasteData.split(/\s+/).filter(u => u.length > 0);

        if (urls.length > 1) {
            const currentInputs = [...inputs];
            // Remove current empty box if pasting multiple
            if (currentInputs[index] === '') currentInputs.splice(index, 1);
            setInputs([...currentInputs, ...urls]);
        } else {
            updateInput(index, pasteData);
        }
    };

    const addRow = () => setInputs([...inputs, '']);
    const removeRow = (index) => {
        const newInputs = inputs.filter((_, i) => i !== index);
        setInputs(newInputs.length ? newInputs : ['']);
    };

    const handleSubmit = () => {
        const validUrls = inputs.filter(u => u.trim() !== '');
        if (validUrls.length > 0) onImport(validUrls);
    };

    return (
        <div className="import-module-container">
            <div className="import-header">
                <h3>Batch Import</h3>
                <div className="category-select-wrapper">
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="glass-select"
                    >
                        <option value="leaders">Leaders' Videos</option>
                        <optgroup label="Product Categories">
                            {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* Scrollable Input Area */}
            <div className="url-scroll-area">
                {inputs.map((url, index) => (
                    <div key={index} className="url-input-row animate-slide-in">
                        <div className="input-number">{index + 1}</div>
                        <div className="input-wrapper">
                            <Youtube size={16} className={`yt-icon ${url ? 'active' : ''}`} />
                            <input 
                                type="text" 
                                placeholder="Paste YouTube URL..." 
                                value={url}
                                onChange={(e) => updateInput(index, e.target.value)}
                                onPaste={(e) => handlePaste(e, index)}
                            />
                        </div>
                        <button className="icon-btn danger" onClick={() => removeRow(index)}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                
                <button className="add-row-btn" onClick={addRow}>
                    <Plus size={18} /> Add Another URL
                </button>
            </div>

            {/* Sticky Footer */}
            <div className="import-footer">
                <div className="count-badge">
                    {inputs.filter(u => u).length} URLs Ready
                </div>
                <button 
                    className="submit-import-btn" 
                    onClick={handleSubmit} 
                    disabled={isImporting || !inputs.some(u => u)}
                >
                    {isImporting ? <Loader2 className="spin" /> : 'Start Import Process'}
                </button>
            </div>
        </div>
    );
};

// ==========================================
// 2. PRO VIDEO CARD (Mobile Optimized)
// ==========================================
const VideoCard = ({ video, onEdit, onDelete }) => {
    const thumbUrl = video.publicId 
        ? `https://img.youtube.com/vi/${video.publicId}/mqdefault.jpg`
        : null;

    return (
        <div className="pro-video-card">
            <div className="video-thumb">
                {thumbUrl ? (
                    <img src={thumbUrl} alt="thumbnail" loading="lazy" />
                ) : (
                    <div className="no-thumb"><Youtube size={32} /></div>
                )}
                <span className="category-tag">{video.category || 'General'}</span>
            </div>
            
            <div className="video-info">
                <h4 title={video.title}>{video.title || "Untitled Video"}</h4>
                <p>{video.description ? video.description.substring(0, 60) + '...' : "No description provided."}</p>
                
                <div className="card-actions">
                    <button onClick={() => window.open(video.videoUrl, '_blank')} className="action-chip view">
                        <Eye size={14} /> View
                    </button>
                    <button onClick={() => onEdit(video)} className="action-chip edit">
                        <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={() => onDelete(video.id)} className="action-chip delete">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
function VideoManagement() {
    const [view, setView] = useState('import'); // 'import' | 'leaders' | 'products'
    const [selectedCategory, setSelectedCategory] = useState('leaders');
    
    // Data States
    const [leaderVideos, setLeaderVideos] = useState([]);
    const [productVideos, setProductVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Edit Modal State
    const [editingVideo, setEditingVideo] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', category: '' });

    const token = localStorage.getItem('token');
    const API_URL = process.env.REACT_APP_API_URL;

    // --- API Handlers ---
    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [lRes, pRes] = await Promise.all([
                fetch(`${API_URL}/api/videos/leaders?page=1&limit=500`, { headers }),
                fetch(`${API_URL}/api/videos/products?page=1&limit=500`, { headers })
            ]);
            const lData = await lRes.json();
            const pData = await pRes.json();
            
            if (lData.success) setLeaderVideos(lData.data || []);
            if (pData.success) setProductVideos(pData.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);

    const handleImport = async (urls) => {
        setIsImporting(true);
        const videoType = selectedCategory === 'leaders' ? 'leaders' : 'products';
        const cat = selectedCategory === 'leaders' ? null : selectedCategory;

        try {
            const res = await fetch(`${API_URL}/api/videos/batch-scrape-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ urls, videoType, category: cat }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Success! Imported ${data.data?.length || 0} videos.`);
                fetchVideos();
                setView(videoType === 'leaders' ? 'leaders' : 'products');
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (e) {
            alert("Network Error");
        } finally {
            setIsImporting(false);
        }
    };

    const handleDelete = async (id, type) => {
        if(!window.confirm("Delete this video permanently?")) return;
        try {
            await fetch(`${API_URL}/api/videos/${type}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchVideos();
        } catch(e) { alert("Delete failed"); }
    };

    const openEditModal = (video) => {
        setEditingVideo(video);
        setEditForm({ 
            title: video.title, 
            description: video.description, 
            category: video.category || 'General' 
        });
    };

    const saveEdit = async () => {
        const type = editingVideo.type || (leaderVideos.find(v => v.id === editingVideo.id) ? 'leaders' : 'products');
        try {
            await fetch(`${API_URL}/api/videos/${type}/${editingVideo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });
            setEditingVideo(null);
            fetchVideos();
        } catch(e) { alert("Update failed"); }
    };

    // --- Search Logic ---
    const [searchTerm, setSearchTerm] = useState('');
    const currentList = view === 'leaders' ? leaderVideos : productVideos;
    const filteredList = currentList.filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="vm-layout">
            {/* 1. Mobile-First Navigation Header */}
            <div className="vm-header">
                <button 
                    className={`vm-tab ${view === 'import' ? 'active' : ''}`} 
                    onClick={() => setView('import')}
                >
                    <Plus size={18} /> Import
                </button>
                <button 
                    className={`vm-tab ${view === 'leaders' ? 'active' : ''}`} 
                    onClick={() => setView('leaders')}
                >
                    <Users size={18} /> Leaders
                </button>
                <button 
                    className={`vm-tab ${view === 'products' ? 'active' : ''}`} 
                    onClick={() => setView('products')}
                >
                    <Package size={18} /> Products
                </button>
            </div>

            {/* 2. Main Content Area */}
            <div className="vm-viewport">
                
                {/* VIEW: IMPORT */}
                {view === 'import' && (
                    <UrlImportModule 
                        onImport={handleImport} 
                        isImporting={isImporting}
                        category={selectedCategory}
                        setCategory={setSelectedCategory}
                    />
                )}

                {/* VIEW: LISTS */}
                {(view === 'leaders' || view === 'products') && (
                    <div className="video-list-container">
                        <div className="list-toolbar">
                            <div className="search-pill">
                                <Search size={16} />
                                <input 
                                    placeholder="Search videos..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="count-label">
                                {filteredList.length} Videos
                            </div>
                        </div>

                        <div className="video-grid">
                            {loading ? (
                                <div className="loader-center"><Loader2 className="spin" size={32}/></div>
                            ) : filteredList.length > 0 ? (
                                filteredList.map(video => (
                                    <VideoCard 
                                        key={video.id} 
                                        video={video} 
                                        onEdit={openEditModal}
                                        onDelete={(id) => handleDelete(id, view)}
                                    />
                                ))
                            ) : (
                                <div className="empty-state">No videos found.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. EDIT MODAL (Overlay) */}
            {editingVideo && (
                <div className="modal-backdrop" onClick={() => setEditingVideo(null)}>
                    <div className="edit-modal-glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Video</h3>
                            <button onClick={() => setEditingVideo(null)}><X size={20}/></button>
                        </div>
                        <div className="modal-body">
                            <label>Video Title</label>
                            <input 
                                value={editForm.title} 
                                onChange={e => setEditForm({...editForm, title: e.target.value})} 
                            />
                            
                            <label>Category</label>
                            <select 
                                value={editForm.category}
                                onChange={e => setEditForm({...editForm, category: e.target.value})}
                            >
                                <option value="General">General</option>
                                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <label>Description</label>
                            <textarea 
                                rows={4}
                                value={editForm.description}
                                onChange={e => setEditForm({...editForm, description: e.target.value})} 
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="save-btn" onClick={saveEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoManagement;