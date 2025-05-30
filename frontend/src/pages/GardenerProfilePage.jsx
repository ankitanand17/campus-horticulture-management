// frontend/src/pages/GardenerProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import '../css/GardenerProfilePage.css';

// Helper for formatting date
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A';

// Helper for formatting date for input type="date"
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
        return ''; // Handle invalid date strings gracefully for input
    }
};

// Helper for formatting date and time
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (e) {
        return 'Invalid Date';
    }
};


const GardenerProfileValidationSchema = Yup.object().shape({
    contactNumber: Yup.string().matches(/^[0-9+\-().\s]*$/, "Invalid phone number format").required("Contact number is required"),
    address: Yup.string().max(500, "Address too long").nullable(),
    dateOfJoining: Yup.date().typeError("Invalid date format").nullable().max(new Date(), "Date of joining cannot be in the future"),
    specialization: Yup.string().max(255, "Specialization too long").nullable(),
    profileImage: Yup.mixed().nullable()
        .test("fileSize", "File too large (max 2MB)", value => !value || (value && value.size <= 2 * 1024 * 1024))
        .test("fileType", "Unsupported format (JPG/PNG)", value => !value || (value && ["image/jpeg", "image/png"].includes(value.type))),
});

const TaskLogValidationSchema = Yup.object().shape({
    taskType: Yup.string().required("Task type is required"),
    dateOfTask: Yup.date().required("Date is required").default(() => new Date()).max(new Date(), "Task date cannot be in the future"),
    areaDescription: Yup.string().when("taskType", {
        is: (val) => ['watered', 'gazed_grass', 'cut_plant'].includes(val),
        then: (schema) => schema.required("Area description is required for this task").max(500, "Area description too long"),
        otherwise: (schema) => schema.nullable().max(500, "Area description too long"),
    }),
    plantId: Yup.number().integer("Must be a whole number").positive("Must be a positive number").nullable().typeError("Plant ID must be a number"),
    notes: Yup.string().when("taskType", {
        is: 'reported_dead',
        then: (schema) => schema.required("Notes are required for reporting dead plants").min(10, "Notes too short").max(1000, "Notes too long"),
        otherwise: (schema) => schema.nullable().max(1000, "Notes too long"),
    }),
});


function GardenerProfilePage() {
    const [profileData, setProfileData] = useState(null);
    const [gardeningLogs, setGardeningLogs] = useState([]);
    const [assignedComplaints, setAssignedComplaints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showTaskLogForm, setShowTaskLogForm] = useState(false);
    const [currentTaskTypeForLog, setCurrentTaskTypeForLog] = useState('');

    const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
    const [imagePreview, setImagePreview] = useState(null);

    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setServerMessage({ type: '', text: '' });
        try {
            const [profileRes, logsRes, complaintsRes] = await Promise.all([
                axios.get('http://localhost:4000/gardener-profile/', { headers: { accessToken: token } }),
                axios.get('http://localhost:4000/gardening-log/my-logs', { headers: { accessToken: token } }),
                axios.get('http://localhost:4000/complaint/assigned-to-me', { headers: { accessToken: token } })
            ]);

            if (profileRes.data.success) {
                setProfileData(profileRes.data.data);
                if (profileRes.data.data.profile?.profileImageUrl) {
                    setImagePreview(`http://localhost:4000${profileRes.data.data.profile.profileImageUrl}`);
                } else { setImagePreview(null); }
            } else { setServerMessage({ type: 'error', text: profileRes.data.message || 'Failed to load profile.' }); }

            if (logsRes.data.success) { setGardeningLogs(logsRes.data.data); }
            else { console.error("Failed to load gardening logs:", logsRes.data.message); }

            if (complaintsRes.data.success) { setAssignedComplaints(complaintsRes.data.data); }
            else { console.warn("Could not fetch assigned complaints:", complaintsRes.data.message); }

        } catch (error) {
            console.error('Error fetching gardener data:', error);
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error.' });
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchData();
    }, [fetchData]); 

    const handleProfileFormSubmit = async (values, { setSubmitting }) => {
        setServerMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('contactNumber', values.contactNumber || '');
        formData.append('address', values.address || '');
        formData.append('dateOfJoining', values.dateOfJoining || '');
        formData.append('specialization', values.specialization || '');

        if (values.profileImage) {
            formData.append('profileImage', values.profileImage);
        } else if (imagePreview === null && profileData?.profile?.profileImageUrl) {
            formData.append('removeProfileImage', 'true');
        }

        try {
            const response = await axios.post('http://localhost:4000/gardener-profile/setup', formData, {
                headers: { accessToken: token, 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: response.data.message });
                setIsEditingProfile(false);
                fetchData();
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to update profile.' });
            }
        } catch (error) {
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error updating profile.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
        window.location.reload();
    };
    const handleTaskLogSubmit = async (values, { setSubmitting, resetForm }) => {
        setServerMessage({ type: '', text: ''});
        try {
            const response = await axios.post('http://localhost:4000/gardening-log/log-task', values, {
                headers: { accessToken: token }
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: 'Task logged successfully!'});
                setShowTaskLogForm(false);
                setCurrentTaskTypeForLog('');
                fetchData(); // Refresh logs
                resetForm();
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to log task.'});
            }
        } catch (error) {
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error logging task.'});
        } finally {
            setSubmitting(false);
        }
    };
    const openTaskLogForm = (taskType) => {
        setCurrentTaskTypeForLog(taskType);
        setShowTaskLogForm(true);
    };

    if (isLoading) return <p className="loading-profile">Loading Gardener Dashboard...</p>;

    const user = profileData?.user;
    const profile = profileData?.profile;

    const initialProfileFormValues = {
        contactNumber: profile?.contactNumber || '',
        address: profile?.address || '',
        dateOfJoining: profile?.dateOfJoining ? formatDateForInput(profile.dateOfJoining) : '',
        specialization: profile?.specialization || '',
        profileImage: null,
    };

    const initialTaskLogValues = {
        taskType: currentTaskTypeForLog || '',
        dateOfTask: formatDateForInput(new Date()),
        areaDescription: '',
        plantId: '',
        notes: '',
    };

    return (
        <div className="gardener-profile-container">
            <h1>Gardener Dashboard</h1>
            {serverMessage.text && <p className={`profile-server-message ${serverMessage.type}`}>{serverMessage.text}</p>} {/* Consistent class name */}

            {/* Profile View & Edit Toggle */}
            {!isEditingProfile && (
                <div className="profile-view profile-section">
                    <div className="profile-header">
                        {profile?.profileImageUrl ? (
                            <img src={`http://localhost:4000${profile.profileImageUrl}`} alt={user?.name || 'Gardener'} className="profile-image-view" />
                        ) : (
                            <div className="profile-image-placeholder">No Photo</div>
                        )}
                        <div className="profile-header-info">
                            <h2>{user?.name || 'Gardener'}</h2>
                            <p>Email: {user?.email || 'N/A'}</p>
                            <p>Joined: {profile?.dateOfJoining ? formatDate(profile.dateOfJoining) : 'N/A'}</p>
                        </div>
                    </div>
                    <p><strong>Contact:</strong> {profile?.contactNumber || 'Not set'}</p>
                    <p><strong>Address:</strong> {profile?.address || 'Not set'}</p>
                    <p><strong>Specialization:</strong> {profile?.specialization || 'Not set'}</p>
                    <div className="profile-page-actions">
                        <button onClick={() => { setIsEditingProfile(true); setServerMessage({type:'', text:''}); /* Clear messages when opening edit */}} className="profile-edit-toggle-button">
                            {profile ? 'Edit My Profile' : 'Setup My Profile'}
                        </button>
                        <button onClick={handleLogout} className="profile-logout-button">Logout</button>
                    </div>
                </div>
            )}

            {/* Profile Edit Form */}
            {isEditingProfile && (
                <div className="profile-edit-form profile-section">
                    <h2>{profile ? 'Edit My Profile' : 'Setup My Profile'}</h2>
                    <Formik initialValues={initialProfileFormValues} validationSchema={GardenerProfileValidationSchema} onSubmit={handleProfileFormSubmit} enableReinitialize>
                        {({ setFieldValue, isSubmitting }) => (
                            <Form className="profile-form">
                                <div>
                                    <label htmlFor="contactNumber">Contact Number</label>
                                    <Field id="contactNumber" name="contactNumber" type="text" /> <ErrorMessage name="contactNumber" component="div" className="error"/>
                                </div>
                                <div>
                                    <label htmlFor="address">Address</label>
                                    <Field id="address" name="address" as="textarea" /> <ErrorMessage name="address" component="div" className="error"/>
                                </div>
                                <div>
                                    <label htmlFor="dateOfJoining">Date of Joining</label>
                                    <Field id="dateOfJoining" name="dateOfJoining" type="date" /> <ErrorMessage name="dateOfJoining" component="div" className="error"/>
                                </div>
                                <div>
                                    <label htmlFor="specialization">Specialization</label>
                                    <Field id="specialization" name="specialization" type="text" placeholder="e.g., Rose care, Pest control"/> <ErrorMessage name="specialization" component="div" className="error"/>
                                </div>
                                <div>
                                    <label htmlFor="profileImage">Profile Image</label>
                                    <input id="profileImage" name="profileImage" type="file" accept="image/jpeg,image/png"
                                        onChange={(event) => {
                                            const file = event.currentTarget.files[0];
                                            setFieldValue("profileImage", file || null);
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImagePreview(reader.result);
                                                reader.readAsDataURL(file);
                                            } else {
                                                setImagePreview(profileData?.profile?.profileImageUrl ? `http://localhost:4000${profileData.profile.profileImageUrl}` : null);
                                            }
                                        }}
                                    />
                                    <ErrorMessage name="profileImage" component="div" className="error"/>
                                    {imagePreview && (
                                        <div className="image-preview-edit">
                                            <img src={imagePreview} alt="Preview" />
                                            <button type="button" className="clear-image-button" onClick={() => {
                                                setImagePreview(null); setFieldValue("profileImage", null);
                                            }}>Clear/Remove Image</button>
                                        </div>
                                    )}
                                </div>
                                <div className="form-actions">
                                    <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</button>
                                    <button type="button" onClick={() => { setIsEditingProfile(false); fetchData(); /* Re-fetch to reset any form changes & image preview */}}>Cancel</button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}

            {/* Gardener Action Cards */}
            {!isEditingProfile && !showTaskLogForm && (
                 <div className="profile-section">
                    <h3>Quick Actions</h3>
                    <div className="gardener-actions-grid">
                        <Link to="/addPlant" className="gardener-action-card"><h4>Add New Plant</h4></Link>
                        <a href="#assigned-complaints-section" className="gardener-action-card" onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('assigned-complaints-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            <h4>View Assigned Complaints</h4>
                            <p>Tasks requiring your attention.</p>
                        </a>
                        <div onClick={() => openTaskLogForm('watered')} className="gardener-action-card"><h4>Log Watering</h4></div>
                        <div onClick={() => openTaskLogForm('gazed_grass')} className="gardener-action-card"><h4>Log Grass Gazing</h4></div>
                        <div onClick={() => openTaskLogForm('cut_plant')} className="gardener-action-card"><h4>Log Plant Cutting</h4></div>
                        <div onClick={() => openTaskLogForm('reported_dead')} className="gardener-action-card"><h4>Report Dead/Expired Plant</h4></div>
                    </div>
                </div>
            )}

            {/* Task Logging Form */}
            {showTaskLogForm && (
                <div className="profile-edit-form profile-section"> {/* Re-use .profile-edit-form or create .task-log-form */}
                    <h3>Log New Task: {currentTaskTypeForLog.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <Formik initialValues={{...initialTaskLogValues, taskType: currentTaskTypeForLog}} validationSchema={TaskLogValidationSchema} onSubmit={handleTaskLogSubmit} enableReinitialize>
                        {({ isSubmitting }) => (
                            <Form className="profile-form">
                                {/* Task Type is set via initialValues, no need for visible field unless you want to change it here */}
                                <div>
                                    <label htmlFor="dateOfTask">Date of Task</label>
                                    <Field id="dateOfTask" name="dateOfTask" type="date"/> <ErrorMessage name="dateOfTask" component="div" className="error"/>
                                </div>
                                {['watered', 'gazed_grass', 'cut_plant'].includes(currentTaskTypeForLog) && (
                                    <div>
                                        <label htmlFor="areaDescription">Area/Description</label>
                                        <Field id="areaDescription" name="areaDescription" as="textarea" placeholder="e.g., Rose garden near block A, Sector 2 lawn"/>
                                        <ErrorMessage name="areaDescription" component="div" className="error"/>
                                    </div>
                                )}
                                {['watered', 'cut_plant'].includes(currentTaskTypeForLog) && ( // Only show for watered and cut_plant
                                    <div>
                                        <label htmlFor="plantId">Plant ID (Optional)</label>
                                        <Field id="plantId" name="plantId" type="number" placeholder="Enter Plant ID if applicable"/>
                                        <ErrorMessage name="plantId" component="div" className="error"/>
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="notes">Notes / Details {currentTaskTypeForLog === 'reported_dead' && '(Required for report)'}</label>
                                    <Field id="notes" name="notes" as="textarea" placeholder="Any additional details..."/>
                                    <ErrorMessage name="notes" component="div" className="error"/>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging...' : 'Log Task'}</button>
                                    <button type="button" onClick={() => { setShowTaskLogForm(false); setCurrentTaskTypeForLog(''); }}>Cancel</button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}

            {/* Assigned Complaints Display */}
            {!isEditingProfile && !showTaskLogForm && (
                <div className="profile-section" id="assigned-complaints-section">
                    <h3>Complaints Assigned to You ({assignedComplaints.length})</h3>
                    {assignedComplaints.length > 0 ? (
                        <ul className="complaint-list">
                            {assignedComplaints.map(complaint => (
                                <li key={complaint.id} className={`complaint-item status-${complaint.status.replace(/_/g,'-')}`}>
                                    <div className="complaint-item-header">
                                        <span>ID: {complaint.id} - Priority: {complaint.priority?.toUpperCase() || 'N/A'}</span>
                                        <span className="complaint-status">Status: {complaint.status.replace('_',' ').toUpperCase()}</span>
                                    </div>
                                    {complaint.category && <p><strong>Category:</strong> {complaint.category}</p>}
                                    {complaint.complainant && <p><strong>Submitted By:</strong> {complaint.complainant.name}</p>}
                                    <p><strong>Submitted On:</strong> {formatDateTime(complaint.createdAt)}</p>
                                    {complaint.locationDescription && <p><strong>Location:</strong> {complaint.locationDescription}</p>}
                                    <p className="complaint-text"><strong>Details:</strong> {complaint.complaintText}</p>
                                    {complaint.resolutionDetails && (
                                        <div className="complaint-resolution-details">
                                            <strong>Admin/Resolution Notes:</strong>
                                            <p>{complaint.resolutionDetails}</p>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : ( <p>No complaints currently assigned to you.</p> )}
                </div>
            )}

            {/* Gardening Log Display */}
            {!isEditingProfile && !showTaskLogForm && (
                <div className="profile-section">
                    <h3>My Recent Activity Logs</h3>
                    {gardeningLogs.length > 0 ? (
                        <ul className="gardening-log-list">
                            {gardeningLogs.slice(0, 10).map(log => (
                                <li key={log.id} className="gardening-log-item">
                                    <p><span className="log-date">{formatDate(log.dateOfTask)}</span> - <span className="log-task">{log.taskType.replace(/_/g, ' ')}</span></p>
                                    {log.areaDescription && <p>Area: {log.areaDescription}</p>}
                                    {log.plant && <p>Plant: {log.plant.name} (ID: {log.plantId})</p>}
                                    {log.notes && <p className="log-notes">Notes: {log.notes}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : ( <p>No gardening activities logged yet.</p> )}
                    {gardeningLogs.length > 10 && <Link to="/gardener/my-full-logs" className="view-all-link">View All My Logs</Link>}
                </div>
            )}
        </div>
    );
}

export default GardenerProfilePage;