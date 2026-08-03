import React, { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import apiClient from '../services/apiClient';

const AdminSync = () => {
    const [progress, setProgress] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [health, setHealth] = useState({ total: 0, missingImages: 0 });

    useEffect(() => {
        fetchHealth();
        socketService.onSyncProgress((data) => {
            setProgress(data);
            if (data.status === 'complete') {
                setIsSyncing(false);
                fetchHealth();
            }
        });

        return () => socketService.disconnect();
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await apiClient.get('/utils/inventory-health');
            if (res.data.success) setHealth(res.data);
        } catch (error) {
            console.error("Health Check Failed", error);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await apiClient.get('/utils/fill-data');
        } catch (error) {
            console.error("Sync Trigger Failed", error);
            setIsSyncing(false);
        }
    };

    return (
        <div className="admin-sync-container">
            <h2>Unified Inventory Sync</h2>
            
            <div className="inventory-health">
                <div className="stat-card">
                    <h4>Total Products</h4>
                    <p>{health.total}</p>
                </div>
                <div className="stat-card missing">
                    <h4>Missing Images</h4>
                    <p>{health.missingImages}</p>
                </div>
            </div>

            <button 
                onClick={handleSync} 
                disabled={isSyncing}
                className="sync-button"
            >
                {isSyncing ? 'Syncing...' : 'Start Master Sync'}
            </button>

            {progress && (
                <div className="sync-console">
                    <h3>Live Sync Console</h3>
                    <div className="console-log">
                        <p>Status: <span className="status">{progress.status}</span></p>
                        {progress.productName && <p>Processing: <strong>{progress.productName}</strong></p>}
                        {progress.processed && (
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar-fill" 
                                    style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                                ></div>
                                <span>{progress.processed} / {progress.total}</span>
                            </div>
                        )}
                        {progress.message && <p className="message">{progress.message}</p>}
                        <div className="sync-flags">
                            {progress.cloudinary !== undefined && <span>Cloudinary: {progress.cloudinary ? '✅' : '❌'}</span>}
                            {progress.db !== undefined && <span>TiDB: {progress.db ? '✅' : '❌'}</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSync;