import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Lock, UserCheck, AlertTriangle, 
  XCircle, Terminal, EyeOff, Activity 
} from 'lucide-react';
import './AdminManagement.css';

function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAdmins = async () => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token'); 
        if (!token) {
            setError('ACCESS DENIED: Auth Token Missing.');
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/admins`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Security Handshake Failed.');
            const result = await response.json();
            setAdmins(result.data || []); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAdmins(); }, []);

    // Format ID like a secret code
    const formatID = (id) => `OP-ID-${id.toString().padStart(4, '0')}`;

    return (
        <div className="cyber-wrapper">
            {/* Background Effects */}
            <div className="cyber-grid-bg"></div>
            <div className="scanner-line"></div>

            <div className="secure-terminal">
                
                {/* === HINDI MOVING WARNING (MARQUEE) === */}
                <div className="danger-marquee">
                    <div className="marquee-content">
                        ⚠️ <span className="highlight-text">अत्यंत महत्वपूर्ण चेतावनी:</span> यह एक सुरक्षित एडमिन पैनल है। कृपया अपना पासवर्ड और OTP किसी के साथ साझा न करें। 
                        <span className="divider">///</span> 
                        यदि एडमिन की लापरवाही से कोई डेटा लीक या सिस्टम में खराबी आती है, तो इसके लिए <span className="highlight-text">डेवलपमेंट टीम जिम्मेदार नहीं होगी।</span> 
                        <span className="divider">///</span> 
                        सतर्क रहें, सुरक्षित रहें।
                    </div>
                </div>

                {/* === HEADER === */}
                <header className="terminal-header">
                    <div className="header-brand">
                        <div className="holo-icon">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h1>MASTER CONTROL</h1>
                            <div className="live-status">
                                <span className="pulse-dot"></span> SYSTEM SECURE
                            </div>
                        </div>
                    </div>
                    <div className="header-badge">
                        <Lock size={14} /> ENCRYPTED V.2.0
                    </div>
                </header>

                {/* === STATIC ENGLISH WARNING === */}
                <div className="protocol-box">
                    <div className="protocol-icon"><AlertTriangle size={20} /></div>
                    <div className="protocol-text">
                        <h4>STRICT SECURITY PROTOCOL</h4>
                        <p>Unauthorized access attempts are monitored and logged. Keep your credentials offline.</p>
                    </div>
                </div>

                {/* === DATA LIST (RESPONSIVE) === */}
                <div className="data-viewport">
                    {/* Headers (Desktop Only) */}
                    <div className="viewport-header">
                        <div><UserCheck size={14}/> OPERATOR</div>
                        <div><Terminal size={14}/> CONTACT LINK</div>
                        <div><Activity size={14}/> ACCESS LEVEL</div>
                        <div>TIMESTAMP</div>
                    </div>

                    <div className="viewport-body">
                        {loading ? (
                             <div className="loading-state">
                                <span className="loader-glitch">DECRYPTING DATABASE...</span>
                             </div>
                        ) : error ? (
                            <div className="error-state">
                                <XCircle size={32} />
                                <span>{error}</span>
                            </div>
                        ) : admins.length > 0 ? (
                            admins.map(admin => (
                                <div key={admin.id} className="data-row">
                                    <div className="col-main" data-label="Identity">
                                        <div className="avatar-frame">
                                            {admin.fullName.charAt(0)}
                                        </div>
                                        <div className="info-block">
                                            <span className="name">{admin.fullName}</span>
                                            <span className="code">{formatID(admin.id)}</span>
                                        </div>
                                    </div>

                                    <div className="col-data" data-label="Contact">
                                        <span className="mono-text">{admin.email}</span>
                                    </div>

                                    <div className="col-data" data-label="Authority">
                                        <span className={`role-pill ${admin.rcmId ? 'role-super' : 'role-std'}`}>
                                            {admin.rcmId ? 'SUPER ADMIN' : 'STANDARD'}
                                        </span>
                                    </div>

                                    <div className="col-data" data-label="Registered">
                                        <span className="time-text">
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-log"><EyeOff size={24}/> NO RECORDS FOUND</div>
                        )}
                    </div>
                </div>

                <div className="terminal-footer">
                    <span>SECURE CONNECTION ESTABLISHED</span>
                    <span>IP MASKED</span>
                </div>
            </div>
        </div>
    );
}

export default AdminManagement;