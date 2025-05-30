// frontend/src/pages/StudentProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import '../css/StudentProfilePage.css'; // Create/adapt this CSS
//import '../css/FeedbackItems.css';
// Helper for formatting date & time (can be moved to a utils.js)
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [h, m] = timeString.split(':');
    return new Date(0, 0, 0, h, m).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const StudentEventCard = ({ event }) => (
    <Link to={`/event/${event.id}`} className="student-event-mini-card">
        {event.imageUrl ? (
            <img src={`http://localhost:4000${event.imageUrl}`} alt={event.title} />
        ) : (
            <div style={{height: '120px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: '0.5rem'}}>No Image</div>
        )}
        <h5>{event.title}</h5>
        <p>Date: {formatDate(event.date)}</p>
        <p>Time: {formatTime(event.time)}</p>
    </Link>
);

const StudentProfileValidationSchema = Yup.object().shape({
    contactNumber: Yup.string().matches(/^[0-9+\-().\s]*$/, "Invalid phone number").nullable(),
    department: Yup.string().nullable(),
    semester: Yup.string().nullable(),
    yearOfJoining: Yup.number().min(1900).max(new Date().getFullYear() + 7).integer().typeError("Invalid year").nullable(),
    bio: Yup.string().max(500, "Bio too long (max 500 characters)").nullable(),
    profileImage: Yup.mixed().nullable()
        .test("fileSize", "File too large (max 2MB)", value => !value || (value && value.size <= 2 * 1024 * 1024))
        .test("fileType", "Unsupported (JPG/PNG)", value => !value || (value && ["image/jpeg", "image/png"].includes(value.type))),
});

function StudentProfilePage() {
    const [profileData, setProfileData] = useState({
        user: null, profile: null,
        events: { upcoming: [], completed: [] },
        feedback: [],
        complaints: [] // Add complaints
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
    const [imagePreview, setImagePreview] = useState(null);

    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const fetchStudentData = useCallback(async () => { 
        setIsLoading(true);
        setServerMessage({type: '', text: ''});
        try {
            const profileResponse = await axios.get('http://localhost:4000/student-profile/', {
                headers: { accessToken: token },
            });
            let fetchedProfileData = { user: null, profile: null, events: { upcoming: [], completed: [] }, feedback: [], complaints: [] };
            if (profileResponse.data.success) {
                fetchedProfileData = { ...fetchedProfileData, ...profileResponse.data.data }; // This has profile, user, events, feedback
                if (profileResponse.data.data.profile?.profileImageUrl) {
                    setImagePreview(`http://localhost:4000${profileResponse.data.data.profile.profileImageUrl}`);
                } else {
                    setImagePreview(null);
                }
            } else {
                setServerMessage({ type: 'error', text: profileResponse.data.message || 'Failed to load profile.' });
            }

            // Fetch student's own complaints separately
            const complaintsResponse = await axios.get('http://localhost:4000/complaint/my-complaints', {
                headers: { accessToken: token },
            });
            if (complaintsResponse.data.success) {
                fetchedProfileData.complaints = complaintsResponse.data.data || [];
            } else {
                console.warn("Could not fetch student's complaints:", complaintsResponse.data.message);
            }
            setProfileData(fetchedProfileData);

        } catch (error) {
            console.error('Error fetching student profile:', error);
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
        fetchStudentData();
    }, [fetchStudentData, token, navigate]);

    const handleFormSubmit = async (values, { setSubmitting }) => {
        setServerMessage({type: '', text: ''});
        const formData = new FormData();
        formData.append('contactNumber', values.contactNumber || '');
        formData.append('department', values.department || '');
        formData.append('semester', values.semester || '');
        formData.append('yearOfJoining', values.yearOfJoining || '');
        formData.append('bio', values.bio || '');

        if (values.profileImage) {
            formData.append('profileImage', values.profileImage);
        } else if (imagePreview === null && profileData?.profile?.profileImageUrl) {
            formData.append('removeProfileImage', 'true');
        }

        try {
            const response = await axios.post('http://localhost:4000/student-profile/setup', formData, {
                headers: { accessToken: token, 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: response.data.message });
                setIsEditing(false);
                fetchStudentData(); // Refresh
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to update.' });
            }
        } catch (error) {
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
        window.location.reload();
    };

    if (isLoading) return <p className="loading-profile">Loading your profile...</p>;

    const user = profileData?.user;
    const profile = profileData?.profile;
    const events = profileData?.events || { upcoming: [], completed: [] };
    const submittedFeedback = profileData?.feedback || [];
    const submittedComplaints = profileData?.complaints || [];
    

    const initialFormValues = {
        contactNumber: profile?.contactNumber || '',
        department: profile?.department || '',
        semester: profile?.semester || '',
        yearOfJoining: profile?.yearOfJoining || '',
        bio: profile?.bio || '',
        profileImage: null,
    };

    return (
        <div className="student-profile-container">
            <h1>My Student Profile</h1>
            {serverMessage.text && <p className={`profile-${serverMessage.type}-message`}>{serverMessage.text}</p>}

            {!isEditing ? (
                <div className="profile-view">
                    <div className="profile-header">
                        {profile?.profileImageUrl ? (
                            <img src={`http://localhost:4000${profile.profileImageUrl}`} alt={user?.name} className="profile-image-view" />
                        ) : (
                            <div className="profile-image-placeholder">No Photo</div>
                        )}
                        <div className="profile-header-info">
                            <h2>{user?.name || 'Student'}</h2>
                            <p>Email: {user?.email || 'N/A'}</p>
                            <p>Username: {user?.username || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="student-action-cards profile-section">
                        <Link to="/make-complaint" className="student-action-card"><h4>📝 Make a Complaint</h4></Link>
                        <Link to="/give-feedback" className="student-action-card"><h4>🌟 Give Feedback</h4></Link>
                    </div>

                    <div className="profile-details-section profile-section">
                        <h3>My Details</h3>
                        <p><strong>Contact:</strong> {profile?.contactNumber || 'Not set'}</p>
                        <p><strong>Department:</strong> {profile?.department || 'Not set'}</p>
                        <p><strong>Semester:</strong> {profile?.semester || 'Not set'}</p>
                        <p><strong>Year of Joining:</strong> {profile?.yearOfJoining || 'Not set'}</p>
                        <p><strong>Bio:</strong> {profile?.bio || 'Not set'}</p>
                    </div>

                    {/* --- Display Submitted Feedback --- */}
                    <div className="feedback-history-section profile-section">
                        <h3>My Submitted Feedback ({submittedFeedback.length})</h3>
                        {submittedFeedback.length > 0 ? (
                            <ul className="student-feedback-list"> {/* You'll need CSS for this */}
                                {submittedFeedback.map(fb => (
                                    <li key={fb.id} className={`student-feedback-item status-${fb.status.replace('_','-')}`}>
                                        <div className="feedback-item-header">
                                            <span className="feedback-date">Submitted: {formatDateTime(fb.createdAt)}</span>
                                            <span className="feedback-status">Status: {fb.status.toUpperCase()}</span>
                                        </div>
                                        {fb.category && <p><strong>Category:</strong> {fb.category}</p>}
                                        {fb.rating && <p><strong>My Rating:</strong> {fb.rating}/5</p>}
                                        <p className="feedback-item-text"><strong>My Feedback:</strong> {fb.feedbackText}</p>
                                        {fb.adminNotes && (
                                            <div className="feedback-admin-reply">
                                                <strong>Admin Reply (from {fb.resolver?.name || 'Admin'}):</strong>
                                                <p>{fb.adminNotes}</p>
                                                {fb.updatedAt && fb.createdAt !== fb.updatedAt && <small>Replied/Updated: {formatDateTime(fb.updatedAt)}</small>}
                                            </div>
                                        )}
                                        {fb.status === 'new' && !fb.adminNotes && <p><em>Awaiting review...</em></p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You haven't submitted any feedback yet.</p>
                        )}
                    </div>

                    {/* --- Display Submitted Complaints --- */}
                    <div className="complaint-history-section profile-section">
                        <h3>My Submitted Complaints ({submittedComplaints.length})</h3>
                        {submittedComplaints.length > 0 ? (
                            <ul className="student-complaint-list"> {/* Use CSS from previous step */}
                                {submittedComplaints.map(comp => (
                                    <li key={comp.id} className={`student-complaint-item status-${comp.status.replace(/_/g,'-')}`}>
                                        <div className="complaint-item-header">
                                            <span className="complaint-date">Submitted: {formatDateTime(comp.createdAt)}</span> {/* Assuming formatDateTime is defined */}
                                            <span className="complaint-status">Status: {comp.status.replace('_',' ').toUpperCase()}</span>
                                        </div>
                                        {comp.category && <p><strong>Category:</strong> {comp.category}</p>}
                                        {comp.locationDescription && <p><strong>Location:</strong> {comp.locationDescription}</p>}
                                        <p className="complaint-item-text"><strong>My Complaint:</strong> {comp.complaintText}</p>
                                        {comp.resolutionDetails && (
                                            <div className="complaint-resolution-details">
                                                <strong>Admin Resolution/Notes:</strong>
                                                <p>{comp.resolutionDetails}</p>
                                                {comp.updatedAt && comp.createdAt !== comp.updatedAt && <small>Updated: {formatDateTime(comp.updatedAt)}</small>}
                                            </div>
                                        )}
                                         {comp.assignee && <p><small>Assigned to: {comp.assignee.name}</small></p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You haven't submitted any complaints yet.</p>
                        )}
                    </div>

                    {events && (
                        <>
                            <div className="event-list-section profile-section">
                                <h3>Upcoming Joined Events ({events.upcoming?.length || 0})</h3>
                                {events.upcoming && events.upcoming.length > 0 ? (
                                    <div className="student-event-list">
                                        {events.upcoming.map(event => <StudentEventCard key={`upcoming-${event.id}`} event={event} />)}
                                    </div>
                                ) : <p>No upcoming events joined.</p>}
                            </div>

                            <div className="event-list-section profile-section">
                                <h3>Completed/Attended Events ({events.completed?.length || 0})</h3>
                                {events.completed && events.completed.length > 0 ? (
                                    <div className="student-event-list">
                                        {events.completed.map(event => <StudentEventCard key={`completed-${event.id}`} event={event} />)}
                                    </div>
                                ) : <p>No completed events attended.</p>}
                            </div>
                        </>
                    )}
                    <div className="profile-page-actions">
                        <button onClick={() => setIsEditing(true)} className="profile-edit-toggle-button">
                            {profile ? 'Edit My Profile' : 'Setup My Profile'}
                        </button>
                        <button onClick={handleLogout} className="profile-logout-button">Logout</button>
                    </div>
                </div>
            ) : (
                <div className="profile-edit-form">
                    <h2>{profile ? 'Edit My Profile' : 'Setup My Profile'}</h2>
                    <Formik initialValues={initialFormValues} validationSchema={StudentProfileValidationSchema} onSubmit={handleFormSubmit} enableReinitialize>
                        {({ setFieldValue, isSubmitting }) => (
                            <Form className="admin-profile-form"> {/* Consider renaming class to .profile-form */}
                                <div>
                                    <label htmlFor="contactNumber">Contact Number</label>
                                    <Field id="contactNumber" name="contactNumber" type="text" placeholder="Your phone number" />
                                    <ErrorMessage name="contactNumber" component="div" className="error" />
                                </div>
                                <div>
                                    <label htmlFor="department">Department</label>
                                    <Field id="department" name="department" type="text" placeholder="e.g., Computer Science" />
                                    <ErrorMessage name="department" component="div" className="error" />
                                </div>
                                <div>
                                    <label htmlFor="semester">Current Semester</label>
                                    <Field id="semester" name="semester" type="text" placeholder="e.g., Spring 2024 or 6th" />
                                    <ErrorMessage name="semester" component="div" className="error" />
                                </div>
                                <div>
                                    <label htmlFor="yearOfJoining">Year of Joining</label>
                                    <Field id="yearOfJoining" name="yearOfJoining" type="number" placeholder="e.g., 2021" />
                                    <ErrorMessage name="yearOfJoining" component="div" className="error" />
                                </div>
                                <div>
                                    <label htmlFor="bio">Short Bio (Optional)</label>
                                    <Field id="bio" name="bio" as="textarea" placeholder="Tell us a bit about yourself" />
                                    <ErrorMessage name="bio" component="div" className="error" />
                                </div>
                                <div>
                                    <label htmlFor="profileImage">Profile Image</label>
                                    <input id="profileImage" name="profileImage" type="file" accept="image/jpeg, image/png"
                                        onChange={(event) => {
                                            const file = event.currentTarget.files[0];
                                            setFieldValue("profileImage", file);
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImagePreview(reader.result);
                                                reader.readAsDataURL(file);
                                            } else {
                                                setImagePreview(profile?.profileImageUrl ? `http://localhost:4000${profile.profileImageUrl}` : null);
                                            }
                                        }}
                                    />
                                    <ErrorMessage name="profileImage" component="div" className="error" />
                                    {imagePreview && (
                                        <div className="image-preview-edit"> {/* Reuse admin CSS class or create new */}
                                            <img src={imagePreview} alt="Preview" />
                                            <button type="button" className="clear-image-button" onClick={() => {
                                                setImagePreview(null); setFieldValue("profileImage", null);
                                            }}>Clear Image</button>
                                        </div>
                                    )}
                                </div>
                                <div className="form-actions">
                                    <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</button>
                                    <button type="button" onClick={() => { setIsEditing(false); fetchStudentData(); }}>Cancel</button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}
        </div>
    );
}

export default StudentProfilePage;