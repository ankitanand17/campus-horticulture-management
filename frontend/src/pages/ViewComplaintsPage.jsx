// frontend/src/pages/ViewComplaintsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import '../css/ViewComplaintsPage.css'; // Link the CSS

const formatDateTime = (dateString) => new Date(dateString).toLocaleString(); // Or your preferred format

function ViewComplaintsPage() {
    const [complaintList, setComplaintList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ status: '', category: '', priority: '', sortBy: 'createdAt', order: 'DESC' });
    const [updateData, setUpdateData] = useState({}); // { [complaintId]: { status, assignedToUserId, resolutionDetails, priority } }
    const [assignableStaff, setAssignableStaff] = useState([]);

    const token = localStorage.getItem('accessToken');
    const navigate = useNavigate();

    const fetchComplaintsAndStaff = useCallback(async () => {
        if (!token) { setError("Authentication required."); setIsLoading(false); navigate('/login'); return; }
        setIsLoading(true);
        try {
            // Fetch Complaints
            const complaintRes = await axios.get('http://localhost:4000/complaint/all', {
                headers: { accessToken: token },
                params: filters
            });
            if (complaintRes.data.success) {
                setComplaintList(complaintRes.data.data);
                const initialUpdateData = {};
                complaintRes.data.data.forEach(item => {
                    initialUpdateData[item.id] = {
                        status: item.status,
                        assignedToUserId: item.assignedToUserId || '',
                        resolutionDetails: item.resolutionDetails || '',
                        priority: item.priority || 'medium'
                    };
                });
                setUpdateData(initialUpdateData);
            } else {
                setError('Failed to load complaints.');
            }

            // Fetch Assignable Staff (Gardeners and Admins)
            const staffRes = await axios.get('http://localhost:4000/auth/assignable-staff', { // Adjust endpoint if different
                headers: { accessToken: token }
            });
            if (staffRes.data.success) {
                setAssignableStaff(staffRes.data.data);
            } else {
                console.warn("Could not fetch assignable staff for complaints.");
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Server error.');
        } finally {
            setIsLoading(false);
        }
    }, [token, filters, navigate]);

    useEffect(() => {
        fetchComplaintsAndStaff();
    }, [fetchComplaintsAndStaff]);


    // const fetchComplaints = useCallback(async () => {
    //     if (!token) { setError("Authentication required."); setIsLoading(false); navigate('/login'); return; }
    //     setIsLoading(true);
    //     try {
    //         const response = await axios.get('http://localhost:4000/complaint/all', {
    //             headers: { accessToken: token },
    //             params: {
    //                 status: filters.status || undefined,
    //                 category: filters.category || undefined,
    //                 priority: filters.priority || undefined,
    //                 sortBy: filters.sortBy,
    //                 order: filters.order
    //             }
    //         });
    //         if (response.data.success) {
    //             setComplaintList(response.data.data);
    //             const initialUpdateData = {};
    //             response.data.data.forEach(item => {
    //                 initialUpdateData[item.id] = {
    //                     status: item.status,
    //                     assignedToUserId: item.assignedToUserId || '',
    //                     resolutionDetails: item.resolutionDetails || '',
    //                     priority: item.priority || 'medium'
    //                 };
    //             });
    //             setUpdateData(initialUpdateData);
    //         } else {
    //             setError('Failed to load complaints.');
    //         }
    //     } catch (err) {
    //         setError(err.response?.data?.message || 'Server error fetching complaints.');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }, [token, filters, navigate]);

    // useEffect(() => {
    //     fetchComplaints();
    //     // fetchAssignableUsers(); // Call if you implement user fetching for assignment
    // }, [fetchComplaints, fetchAssignableUsers]); // fetchAssignableUsers if used


    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleUpdateDataChange = (complaintId, field, value) => {
        setUpdateData(prev => ({
            ...prev,
            [complaintId]: { ...prev[complaintId], [field]: value }
        }));
    };

    const submitComplaintUpdate = async (complaintId) => {
        const payload = updateData[complaintId];
        if (!payload || !payload.status) { alert("Please select a status."); return; }
        try {
            const response = await axios.put(`http://localhost:4000/complaint/${complaintId}/manage`, payload, {
                headers: { accessToken: token }
            });
            if (response.data.success) {
                alert("Complaint updated successfully!");
                fetchComplaintsAndStaff(); // Refresh
            } else {
                alert(`Failed to update complaint: ${response.data.message}`);
            }
        } catch (err) {
            alert(`Error updating complaint: ${err.response?.data?.message || 'Server error'}`);
        }
    };

    if (isLoading) return <p className="loading-profile">Loading complaints...</p>;
    if (error) return <p className="profile-error-message">{error}</p>;

    const availableStatuses = ['new', 'pending_review', 'under_investigation', 'resolved', 'closed', 'rejected'];
    const availablePriorities = ['low', 'medium', 'high'];
    const complaintCategories = [
        "Maintenance Issue (e.g., broken bench, pathway damage)",
        "Horticulture Concern (e.g., diseased plant, pests)",
        "Safety Hazard (e.g., poor lighting, obstruction)",
        "Cleanliness/Waste Management",
        "Watering/Irrigation Problem",
        "Suggestions for Improvement",
        "Staff Conduct (Admin/Gardener)", // Sensitive, ensure proper handling
        "Event Related Issue",
        "Other"
    ];


    return (
        <div className="view-complaints-container">
            <h1>Manage User Complaints</h1>
            <div className="complaint-filters">
                {/* Status Filter */}
                <label htmlFor="statusFilter">Status:</label>
                <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">All</option>
                    {availableStatuses.map(s=><option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
                </select>
                {/* Category Filter */}
                <label htmlFor="categoryFilter">Category:</label>
                <select id="categoryFilter" name="category" value={filters.category} onChange={handleFilterChange}>
                     <option value="">All</option>
                     {complaintCategories.map(c => <option key={c} value={c.split(' (')[0]}>{c}</option>)} {/* Use actual value if different from display */}
                </select>
                {/* Priority Filter */}
                <label htmlFor="priorityFilter">Priority:</label>
                <select id="priorityFilter" name="priority" value={filters.priority} onChange={handleFilterChange}>
                     <option value="">All</option>
                     {availablePriorities.map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
            </div>

            {complaintList.length > 0 ? (
                <ul className="complaint-list">
                    {complaintList.map(item => (
                        <li key={item.id} className={`complaint-item status-${item.status.replace(/_/g,'-')}`}>
                            <h4>Complaint ID: {item.id} {item.category && `(${item.category})`}</h4>
                            <div className="complaint-meta">
                                <span><strong>Complainant:</strong> {item.complainant?.name || 'N/A'} ({item.complainant?.role})</span>
                                <span><strong>Date:</strong> {formatDateTime(item.createdAt)}</span>
                                <span><strong>Current Status:</strong> {item.status.replace('_',' ').toUpperCase()}</span>
                                {item.priority && <span><strong>Priority:</strong> {item.priority.toUpperCase()}</span>}
                            </div>
                            {item.locationDescription && <p><strong>Location:</strong> {item.locationDescription}</p>}
                            <div className="complaint-text">{item.complaintText}</div>

                            <div className="complaint-admin-section">
                                <label htmlFor={`status-update-${item.id}`}>Update Status:</label>
                                <select id={`status-update-${item.id}`} value={updateData[item.id]?.status || item.status}
                                    onChange={(e) => handleUpdateDataChange(item.id, 'status', e.target.value)}>
                                    {availableStatuses.map(s=><option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
                                </select>

                                <label htmlFor={`priority-update-${item.id}`}>Update Priority:</label>
                                <select id={`priority-update-${item.id}`} value={updateData[item.id]?.priority || item.priority}
                                    onChange={(e) => handleUpdateDataChange(item.id, 'priority', e.target.value)}>
                                    {availablePriorities.map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>

                                <label htmlFor={`assign-to-${item.id}`}>Assign To:</label>
                                <select
                                    id={`assign-to-${item.id}`}
                                    value={updateData[item.id]?.assignedToUserId || ''}
                                    onChange={(e) => handleUpdateDataChange(item.id, 'assignedToUserId', e.target.value)}
                                >
                                    <option value="">Unassigned / Select Staff</option>
                                    {assignableStaff.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.role}) - ID: {staff.id}
                                        </option>
                                    ))}
                                </select>
                                {item.assignee && <small>Currently assigned to: {item.assignee.name} (ID: {item.assignedToUserId})</small>}


                                <label htmlFor={`resolution-${item.id}`}>Resolution/Admin Notes:</label>
                                <textarea id={`resolution-${item.id}`} value={updateData[item.id]?.resolutionDetails || ''}
                                    onChange={(e) => handleUpdateDataChange(item.id, 'resolutionDetails', e.target.value)}
                                    placeholder="Details on action taken or resolution..." />
                                {item.resolutionDetails && !updateData[item.id]?.resolutionDetails && <p><small>Existing Resolution: {item.resolutionDetails}</small></p>}

                                <button onClick={() => submitComplaintUpdate(item.id)}>Update Complaint</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-complaints-message">No complaints match the current filters.</p>
            )}
             <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <Link to="/admin/my-profile" className="profile-edit-toggle-button" style={{backgroundColor: '#777'}}>Back to Dashboard</Link>
            </div>
        </div>
    );
}

export default ViewComplaintsPage;