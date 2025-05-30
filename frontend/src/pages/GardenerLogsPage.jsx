// frontend/src/pages/GardenerLogsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../css/GardenerProfilePage.css'; // Can reuse some log item styles

// Helper for formatting date
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';


function GardenerLogsPage() {
    const [allLogs, setAllLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        const fetchAllLogs = async () => {
            if (!token) {
                setError("Authentication required.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await axios.get('http://localhost:4000/gardening-log/all-logs', {
                    headers: { accessToken: token }
                });
                if (response.data.success) {
                    setAllLogs(response.data.data);
                } else {
                    setError('Failed to load gardening logs.');
                }
            } catch (err) {
                console.error('Error fetching all gardening logs:', err);
                setError(err.response?.data?.message || 'Server error fetching logs.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllLogs();
    }, [token]);

    if (isLoading) return <p className="loading-profile">Loading all gardener logs...</p>;
    if (error) return <p className="profile-error-message" style={{textAlign: 'center'}}>{error}</p>;

    return (
        <div className="gardener-profile-container"> {/* Reusing container for consistent padding/width */}
            <h1>All Gardeners' Work Logs</h1>
            <div className="profile-section"> {/* Wrap list in a section for consistent styling */}
                {allLogs.length > 0 ? (
                    <ul className="gardening-log-list">
                        {allLogs.map(log => (
                            <li key={log.id} className="gardening-log-item">
                                <p>
                                    <span className="log-date">{formatDate(log.dateOfTask)}</span> -
                                    <span className="log-task"> {log.taskType.replace('_', ' ')}</span>
                                    {log.gardener && <span> by <strong>{log.gardener.name || log.gardener.username}</strong> (ID: {log.gardenerUserId})</span>}
                                </p>
                                {log.areaDescription && <p>Area: {log.areaDescription}</p>}
                                {log.plant && <p>Plant: {log.plant.name} (ID: {log.plantId})</p>}
                                {log.notes && <p className="log-notes">Notes: {log.notes}</p>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No gardening activities logged by any gardener yet.</p>
                )}
            </div>
            <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <Link to="/admin/my-profile" className="profile-edit-toggle-button" style={{backgroundColor: '#777'}}>Back to Dashboard</Link>
            </div>
        </div>
    );
}

export default GardenerLogsPage;