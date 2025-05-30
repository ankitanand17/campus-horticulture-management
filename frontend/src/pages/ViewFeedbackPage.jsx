// frontend/src/pages/ViewFeedbackPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../css/ViewFeedbackPage.css'; // Link the CSS

const formatDate = (dateString) => new Date(dateString).toLocaleString();

function ViewFeedbackPage() {
    const [feedbackList, setFeedbackList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ status: '', category: '', sortBy: 'createdAt', order: 'DESC' });
    const [updateStatusData, setUpdateStatusData] = useState({}); // { [feedbackId]: { status: '', adminNotes: '' } }

    const token = localStorage.getItem('accessToken');
    const navigate = useNavigate(); // If needed for auth redirect

    const fetchFeedback = useCallback(async () => {
        if (!token) { setError("Authentication required."); setIsLoading(false); navigate('/login'); return; }
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:4000/feedback/', {
                headers: { accessToken: token },
                params: { // Send filters as query parameters
                    status: filters.status || undefined, // Send undefined if empty to ignore filter
                    category: filters.category || undefined,
                    sortBy: filters.sortBy,
                    order: filters.order
                }
            });
            if (response.data.success) {
                setFeedbackList(response.data.data);
                // Initialize updateStatusData for each item
                const initialStatusData = {};
                response.data.data.forEach(item => {
                    initialStatusData[item.id] = { status: item.status, adminNotes: item.adminNotes || '' };
                });
                setUpdateStatusData(initialStatusData);
            } else {
                setError('Failed to load feedback.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Server error fetching feedback.');
        } finally {
            setIsLoading(false);
        }
    }, [token, filters, navigate]); // Add filters to dependency array

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]); // fetchFeedback itself depends on filters, so this is fine

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    // Submit filters on button click or automatically (useEffect on filters)
    // For simplicity, we'll re-fetch when filters change via fetchFeedback dependency.

    const handleStatusUpdateChange = (feedbackId, field, value) => {
        setUpdateStatusData(prev => ({
            ...prev,
            [feedbackId]: { ...prev[feedbackId], [field]: value }
        }));
    };

    const submitStatusUpdate = async (feedbackId) => {
        const payload = updateStatusData[feedbackId];
        if (!payload || !payload.status) {
            alert("Please select a new status.");
            return;
        }
        try {
            const response = await axios.put(`http://localhost:4000/feedback/${feedbackId}/status`, payload, {
                headers: { accessToken: token }
            });
            if (response.data.success) {
                alert("Feedback status updated successfully!");
                fetchFeedback(); // Refresh the list
            } else {
                alert(`Failed to update status: ${response.data.message}`);
            }
        } catch (err) {
            alert(`Error updating status: ${err.response?.data?.message || 'Server error'}`);
        }
    };

    if (isLoading) return <p className="loading-profile">Loading feedback...</p>;
    if (error) return <p className="profile-error-message">{error}</p>;

    const availableStatuses = ['new', 'reviewed', 'in_progress', 'resolved', 'archived'];
    // Categories can be dynamic or hardcoded like in FeedbackFormPage
    const availableCategories = ["Website/App", "Events", "Horticulture", "GardenerService", "AdminService", "General", "Other"];


    return (
        <div className="view-feedback-container">
            <h1>Manage User Feedback</h1>

            <div className="feedback-filters">
                <label htmlFor="statusFilter">Status:</label>
                <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">All Statuses</option>
                    {availableStatuses.map(s => <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
                </select>

                <label htmlFor="categoryFilter">Category:</label>
                <select id="categoryFilter" name="category" value={filters.category} onChange={handleFilterChange}>
                    <option value="">All Categories</option>
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* Add Sort By / Order filters if desired */}
            </div>


            {feedbackList.length > 0 ? (
                <ul className="feedback-list">
                    {feedbackList.map(item => (
                        <li key={item.id} className={`feedback-item status-${item.status.replace('_','-')}`}>
                            <h4>Feedback ID: {item.id} {item.category && `(${item.category})`}</h4>
                            <div className="feedback-meta">
                                <span><strong>Submitted by:</strong> {item.submitter?.name || 'N/A'} ({item.submitter?.role || 'N/A'})</span>
                                <span><strong>Date:</strong> {formatDate(item.createdAt)}</span>
                                <span><strong>Current Status:</strong> {item.status.toUpperCase()}</span>
                                {item.rating && <span><strong>Rating:</strong> {item.rating}/5</span>}
                            </div>
                            <div className="feedback-text">
                                {item.feedbackText}
                            </div>
                            <div className="feedback-admin-section">
                                <label htmlFor={`status-update-${item.id}`}>Update Status:</label>
                                <select
                                    id={`status-update-${item.id}`}
                                    value={updateStatusData[item.id]?.status || item.status}
                                    onChange={(e) => handleStatusUpdateChange(item.id, 'status', e.target.value)}
                                >
                                   {availableStatuses.map(s => <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
                                </select>
                                <label htmlFor={`admin-notes-${item.id}`}>Admin Notes:</label>
                                <textarea
                                    id={`admin-notes-${item.id}`}
                                    placeholder="Add internal notes..."
                                    value={updateStatusData[item.id]?.adminNotes || ''}
                                    onChange={(e) => handleStatusUpdateChange(item.id, 'adminNotes', e.target.value)}
                                />
                                {item.resolver && <small>Last updated by: {item.resolver.name} on {formatDate(item.updatedAt)}</small>}
                                {item.adminNotes && !updateStatusData[item.id]?.adminNotes && <p><small>Existing Notes: {item.adminNotes}</small></p>}

                                <button onClick={() => submitStatusUpdate(item.id)}>Save Status Update</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-feedback-message">No feedback entries match the current filters.</p>
            )}
            <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <Link to="/admin/my-profile" className="profile-edit-toggle-button" style={{backgroundColor: '#777'}}>Back to Dashboard</Link>
            </div>
        </div>
    );
}

export default ViewFeedbackPage;