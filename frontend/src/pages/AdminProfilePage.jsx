// frontend/src/pages/AdminProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import '../css/AdminProfilePage.css'; // Create this CSS file

// Helper to parse array-like fields for display
const displayList = (items) => {
    if (!items || items.length === 0) return 'N/A';
    if (Array.isArray(items)) return <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    return <p>{items}</p>; // Fallback for single string
};

// Validation Schema for the form
const ProfileValidationSchema = Yup.object().shape({
    contactNumber: Yup.string().matches(/^[0-9+-]*$/, "Invalid phone number").nullable(),
    publicEmail: Yup.string().email("Invalid email address").nullable(),
    linkedInUrl: Yup.string().url("Invalid URL").nullable(),
    department: Yup.string().nullable(),
    title: Yup.string().nullable(),
    subjectsTaught: Yup.string().nullable(), // Handled as comma-separated string in form
    qualifications: Yup.string().nullable(), // Handled as comma-separated string in form
    researchInterests: Yup.string().nullable(), // Handled as comma-separated string in form
    publicationsUrl: Yup.string().url("Invalid URL").nullable(),
    bioSummary: Yup.string().max(1000, "Summary too long (max 1000 chars)").nullable(),
    yearsOfExperience: Yup.number().min(0, "Years cannot be negative").integer().nullable(),
    profileImage: Yup.mixed().nullable()
        .test("fileSize", "File too large (max 2MB)", value => !value || (value && value.size <= 2 * 1024 * 1024))
        .test("fileType", "Unsupported file format (JPG/PNG)", value => !value || (value && ["image/jpeg", "image/png"].includes(value.type))),
});


function AdminProfilePage() {
    const [profile, setProfile] = useState(null);
    const [userData, setUserData] = useState(null); // To store basic user info like name, email
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
    const [imagePreview, setImagePreview] = useState(null); // For form image upload

    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const fetchAdminProfile = useCallback(async () => {
        setIsLoading(true);
        setServerMessage({ type: '', text: '' });
        try {
            // Endpoint to get the logged-in admin's own profile
            const response = await axios.get('http://localhost:4000/admin-profile/', {
                headers: { accessToken: token },
            });
            if (response.data.success) {
                setProfile(response.data.data); 
                setUserData(response.data.user || { name: localStorage.getItem("Name"), email: 'N/A - fetch failed' }); // Fallback for basic user data
                if (response.data.data?.profileImageUrl) {
                    setImagePreview(`http://localhost:4000${response.data.data.profileImageUrl}`);
                } else {
                    setImagePreview(null);
                }
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to load profile.' });
                setUserData({ name: localStorage.getItem("Name"), email: 'N/A - fetch failed' });
            }
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error fetching profile.' });
            setUserData({ name: localStorage.getItem("Name"), email: 'N/A - fetch failed' });
             if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login'); // Redirect if not authorized
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchAdminProfile();
    }, [fetchAdminProfile, token, navigate]);

    const handleFormSubmit = async (values, { setSubmitting }) => {
        setServerMessage({ type: '', text: '' });
        const formData = new FormData();

        // Helper to convert comma-separated string to array for backend if needed by model
       // const stringToArray = (str) => str ? str.split(',').map(s => s.trim()).filter(s => s) : null;

        formData.append('contactNumber', values.contactNumber || '');
        formData.append('publicEmail', values.publicEmail || '');
        formData.append('linkedInUrl', values.linkedInUrl || '');
        formData.append('department', values.department || '');
        formData.append('title', values.title || '');
        formData.append('subjectsTaught', values.subjectsTaught || '');
        formData.append('qualifications', values.qualifications || '');
        formData.append('researchInterests', values.researchInterests || '');
        formData.append('publicationsUrl', values.publicationsUrl || '');
        formData.append('bioSummary', values.bioSummary || '');
        formData.append('yearsOfExperience', values.yearsOfExperience || '');


        if (values.profileImage) {
            formData.append('profileImage', values.profileImage);
        } else if (imagePreview === null && profile?.profileImageUrl) {
            formData.append('removeProfileImage', 'true');
        }
        // If no new image and not removed, existing image URL will be kept by backend (or send current URL)
        // formData.append('existingImageUrl', profile?.profileImageUrl || '');


        try {
            const response = await axios.post('http://localhost:4000/admin-profile/setup', formData, {
                headers: {
                    accessToken: token,
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: response.data.message });
                setIsEditing(false);
                fetchAdminProfile(); // Refresh profile data
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to update profile.' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error updating profile.' });
        } finally {
            setSubmitting(false);
        }
    };

     // --- ADD LOGOUT HANDLER ---
    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
        window.location.reload();
    };

    if (isLoading) {
        return <p className="loading-profile">Loading profile...</p>;
    }

    // Initial values for Formik, derived from fetched profile or defaults
    const initialFormValues = {
        contactNumber: profile?.contactNumber || '',
        publicEmail: profile?.publicEmail || '',
        linkedInUrl: profile?.linkedInUrl || '',
        department: profile?.department || '',
        title: profile?.title || '',
        subjectsTaught: Array.isArray(profile?.subjectsTaught) ? profile.subjectsTaught.join(', ') : (profile?.subjectsTaught || ''),
        qualifications: Array.isArray(profile?.qualifications) ? profile.qualifications.join(', ') : (profile?.qualifications || ''),
        researchInterests: Array.isArray(profile?.researchInterests) ? profile.researchInterests.join(', ') : (profile?.researchInterests || ''),
        publicationsUrl: profile?.publicationsUrl || '',
        bioSummary: profile?.bioSummary || '',
        yearsOfExperience: profile?.yearsOfExperience || '',
        profileImage: null, // Always null initially for file input
    };


    return (
        <div className="admin-profile-container">
            <h1>Admin Profile</h1>

            {serverMessage.text && (
                <p className={serverMessage.type === 'error' ? 'profile-error-message' : 'profile-success-message'}>
                    {serverMessage.text}
                </p>
            )}

            {!isEditing ? (
                // VIEW MODE
                <div className="profile-view">
                    <div className="profile-header">
                        {profile?.profileImageUrl ? (
                            <img src={`http://localhost:4000${profile.profileImageUrl}`} alt="Admin" className="profile-image-view" />
                        ) : (
                            <div className="profile-image-placeholder">No Photo</div>
                        )}
                        <div className="profile-header-info">
                            <h2>{userData?.name || 'Admin User'}</h2>
                            <p>{profile?.title || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="profile-section"><h3>Contact Information</h3>
                        <p><strong>Phone:</strong> {profile?.contactNumber || 'N/A'}</p>
                        <p><strong>Public Email:</strong> {profile?.publicEmail || 'N/A'}</p>
                        <p><strong>LinkedIn:</strong> {profile?.linkedInUrl ? <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer">{profile.linkedInUrl}</a> : 'N/A'}</p>
                    </div>

                    {/* --- ADMIN ACTION CARDS --- */}
                    <div className="admin-actions-grid-container profile-section">
                        <h3>Quick Actions</h3>
                        <div className="admin-actions-grid">
                            <Link to="/admin/create-user" className="admin-action-card">
                                <h4>Create New User</h4>
                                <p>Register a new student, gardener, or admin.</p>
                            </Link>
                            <Link to="/event/create" className="admin-action-card">
                                <h4>Create New Event</h4>
                                <p>Schedule and manage campus events and workshops.</p>
                            </Link>
                            <Link to="/addPlant" className="admin-action-card">
                                <h4>Add New Plant</h4>
                                <p>Update the campus horticulture gallery with new plant species.</p>
                            </Link>
                            <Link to="/admin/plant-inventory" className="admin-action-card">
                                <h4>Plant Inventory & Counts</h4>
                                <p>View plant list and quantities.</p>
                            </Link>
                            <Link to="/admin/gardener-logs" className="admin-action-card">
                                <h4>Gardeners' Work Logs</h4>
                                <p>Review all gardening activities.</p>
                            </Link>
                            <Link to="/admin/gardener-list" className="admin-action-card">
                                <h4>View Gardeners List</h4>
                                <p>See all registered gardener staff.</p>
                            </Link>
                            <Link to="/admin/view-feedback" className="admin-action-card">
                                <h4>View Feedback</h4>
                                <p>Review user feedback.</p>
                            </Link>
                            <Link to="/admin/view-complaints" className="admin-action-card"> {/* Placeholder Link */}
                                <h4>Manage Complaints</h4>
                                <p>Address and manage user complaints and issues.</p>
                            </Link>
                            <Link to="/admin/manage-equipment" className="admin-action-card">
                                <h4>Add/Manage Equipment</h4>
                                <p>Update the list of campus equipment.</p>
                            </Link>
                        </div>
                    </div>


                    {/* Profile Details Section - can be a collapsible section or separate tab later if dashboard grows */}

                     <div className="profile-section"><h3>Academic Details</h3>
                        <p><strong>Department:</strong> {profile?.department || 'N/A'}</p>
                        <p><strong>Qualifications:</strong> {displayList(profile?.qualifications)}</p>
                        <p><strong>Subjects Taught:</strong> {displayList(profile?.subjectsTaught)}</p>
                        <p><strong>Years of Experience:</strong> {profile?.yearsOfExperience !== null && profile?.yearsOfExperience !== undefined ? profile.yearsOfExperience : 'N/A'}</p>
                    </div>
                    <div className="profile-section"><h3>Research & Publications</h3>
                        <p><strong>Research Interests:</strong> {displayList(profile?.researchInterests)}</p>
                        <p><strong>Publications:</strong> {profile?.publicationsUrl ? <a href={profile.publicationsUrl} target="_blank" rel="noopener noreferrer">{profile.publicationsUrl}</a> : 'N/A'}</p>
                    </div>
                    <div className="profile-section"><h3>About Me</h3>
                        <p>{profile?.bioSummary || 'No summary provided.'}</p>
                    </div>

                    <div className="profile-actions-view"> {/* Added a wrapper for buttons */}
                        <button onClick={() => setIsEditing(true)} className="profile-edit-toggle-button">
                            {profile ? 'Edit Profile' : 'Setup Profile'}
                        </button>
                        <button onClick={handleLogout} className="profile-logout-button">
                            Logout
                        </button>
                    </div>
                </div>
            ) : (
                // EDIT MODE
                <div className="profile-edit-form">
                    <h2>{profile ? 'Edit Your Profile' : 'Setup Your Profile'}</h2>
                    <Formik
                        initialValues={initialFormValues}
                        validationSchema={ProfileValidationSchema}
                        onSubmit={handleFormSubmit}
                        enableReinitialize
                    >
                        {({ setFieldValue, isSubmitting }) => ( // Removed errors, touched from here as ErrorMessage handles it
                            <Form className="admin-profile-form">
                                <div>
                                    <label htmlFor="title">Title (e.g., Professor, Admin Manager)</label>
                                    <Field id="title" type="text" name="title" placeholder="Your Title" />
                                    <ErrorMessage name="title" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="contactNumber">Contact Number</label>
                                    <Field id="contactNumber" type="text" name="contactNumber" placeholder="Your Phone Number" />
                                    <ErrorMessage name="contactNumber" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="publicEmail">Public Contact Email</label>
                                    <Field id="publicEmail" type="email" name="publicEmail" placeholder="A Public Email Address" />
                                    <ErrorMessage name="publicEmail" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="linkedInUrl">LinkedIn Profile URL</label>
                                    <Field id="linkedInUrl" type="url" name="linkedInUrl" placeholder="https://linkedin.com/in/yourprofile" />
                                    <ErrorMessage name="linkedInUrl" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="officeLocation">Office Location</label>
                                    <Field id="officeLocation" type="text" name="officeLocation" placeholder="Building, Room Number" />
                                    <ErrorMessage name="officeLocation" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="department">Department</label>
                                    <Field id="department" type="text" name="department" placeholder="Your Department" />
                                    <ErrorMessage name="department" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="yearsOfExperience">Years of Experience</label>
                                    <Field id="yearsOfExperience" type="number" name="yearsOfExperience" placeholder="e.g., 5" />
                                    <ErrorMessage name="yearsOfExperience" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="qualifications">Qualifications (comma-separated)</label>
                                    <Field id="qualifications" as="textarea" name="qualifications" placeholder="e.g., PhD in Horticulture, MSc Botany" />
                                    <ErrorMessage name="qualifications" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="subjectsTaught">Subjects Taught (comma-separated)</label>
                                    <Field id="subjectsTaught" as="textarea" name="subjectsTaught" placeholder="e.g., Plant Physiology, Soil Science" />
                                    <ErrorMessage name="subjectsTaught" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="researchInterests">Research Interests (comma-separated)</label>
                                    <Field id="researchInterests" as="textarea" name="researchInterests" placeholder="e.g., Urban Greening, Plant Pathology" />
                                    <ErrorMessage name="researchInterests" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="publicationsUrl">Link to Publications/Profile (e.g., Google Scholar)</label>
                                    <Field id="publicationsUrl" type="url" name="publicationsUrl" placeholder="URL to your publications or research profile" />
                                    <ErrorMessage name="publicationsUrl" component="div" className="error" />
                                </div>

                                <div>
                                    <label htmlFor="bioSummary">Brief Bio/Summary</label>
                                    <Field id="bioSummary" as="textarea" name="bioSummary" placeholder="A short paragraph about yourself" />
                                    <ErrorMessage name="bioSummary" component="div" className="error" />
                                </div>
                                

                                {/* Profile Image */}
                                <div>
                                    <label htmlFor="profileImage">Profile Image</label>
                                    <input
                                        id="profileImage"
                                        name="profileImage" // Important for Formik to associate via setFieldValue
                                        type="file"
                                        accept="image/jpeg, image/png"
                                        onChange={(event) => {
                                            const file = event.currentTarget.files[0];
                                            setFieldValue("profileImage", file); // Update Formik's value
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImagePreview(reader.result);
                                                reader.readAsDataURL(file);
                                            } else {
                                                // Revert to original or clear preview if file is deselected
                                                setImagePreview(profile?.profileImageUrl ? `http://localhost:4000${profile.profileImageUrl}` : null);
                                            }
                                        }}
                                    />
                                    <ErrorMessage name="profileImage" component="div" className="error" />
                                    {imagePreview && (
                                        <div className="image-preview-edit">
                                            <img src={imagePreview} alt="Preview" />
                                            <button type="button" className="clear-image-button" onClick={() => {
                                                setImagePreview(null);
                                                setFieldValue("profileImage", null); // Also clear the file in Formik
                                            }}>Clear/Remove Image</button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : 'Save Profile'}
                                    </button>
                                    <button type="button" onClick={() => {
                                        setIsEditing(false);
                                        fetchAdminProfile(); // Reset form and fetch fresh data, including image preview
                                    }}>
                                        Cancel
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}
        </div>
    );
}

export default AdminProfilePage;