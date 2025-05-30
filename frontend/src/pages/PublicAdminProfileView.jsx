// frontend/src/pages/PublicAdminProfileViewPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link as RouterLink } from 'react-router-dom'; // Renamed Link to avoid conflict
import '../css/AdminProfilePage.css'; // Can reuse styles for viewing

// Helper to parse array-like fields for display
const displayList = (items) => {
    if (!items || items.length === 0) return 'N/A';
    if (Array.isArray(items)) return <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    return <p>{items}</p>;
};

function PublicAdminProfileViewPage() {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null); // This will hold AdminProfile data
    const [userData, setUserData] = useState(null); // This will hold User data
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPublicAdminProfile = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Use the existing endpoint to get a specific admin's profile by userId
            const response = await axios.get(`http://localhost:4000/admin-profile/${userId}`);
            if (response.data.success && response.data.data) {
                setProfile(response.data.data); // The main profile data
                setUserData(response.data.data.user); // The nested user data
            } else {
                setError(response.data.message || 'Admin profile not found or failed to load.');
            }
        } catch (err) {
            console.error('Error fetching public admin profile:', err);
            setError(err.response?.data?.message || 'Server error fetching admin profile.');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchPublicAdminProfile();
    }, [fetchPublicAdminProfile]);

    if (isLoading) {
        return <p className="loading-profile">Loading profile...</p>;
    }

    if (error || !profile) {
        return <p className="profile-error-message" style={{textAlign: 'center'}}>{error || 'Profile not available.'}</p>;
    }

    return (
        <div className="admin-profile-container"> {/* Reusing main container style */}
            {/* Reusing profile-view styles from AdminProfilePage.css */}
            <div className="profile-view">
                <div className="profile-header">
                    {profile.profileImageUrl ? (
                        <img src={`http://localhost:4000${profile.profileImageUrl}`} alt={userData?.name} className="profile-image-view" />
                    ) : (
                        <div className="profile-image-placeholder">No Photo</div>
                    )}
                    <div className="profile-header-info">
                        <h2>{userData?.name || 'N/A'}</h2>
                        <p>{profile.title || 'Admin Staff'}</p>
                        <p>Email: {userData?.email || 'N/A'}</p>
                    </div>
                </div>

                <div className="profile-section"><h3>Contact Information</h3>
                    <p><strong>Phone:</strong> {profile.contactNumber || 'N/A'}</p>
                    <p><strong>Public Email:</strong> {profile.publicEmail || 'N/A'}</p>
                    <p><strong>LinkedIn:</strong> {profile.linkedInUrl ? <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer">{profile.linkedInUrl}</a> : 'N/A'}</p>
                    <p><strong>Office:</strong> {profile.officeLocation || 'N/A'}</p>
                </div>
                <div className="profile-section"><h3>Academic Details</h3>
                    <p><strong>Department:</strong> {profile.department || 'N/A'}</p>
                    <p><strong>Qualifications:</strong> {displayList(profile.qualifications)}</p>
                    <p><strong>Subjects Taught:</strong> {displayList(profile.subjectsTaught)}</p>
                    <p><strong>Years of Experience:</strong> {profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined ? profile.yearsOfExperience : 'N/A'}</p>
                </div>
                <div className="profile-section"><h3>Research & Publications</h3>
                    <p><strong>Research Interests:</strong> {displayList(profile.researchInterests)}</p>
                    <p><strong>Publications:</strong> {profile.publicationsUrl ? <a href={profile.publicationsUrl} target="_blank" rel="noopener noreferrer">{profile.publicationsUrl}</a> : 'N/A'}</p>
                </div>
                <div className="profile-section"><h3>About</h3>
                    <p>{profile.bioSummary || 'No summary provided.'}</p>
                </div>
                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                    <RouterLink to="/committee" className="profile-edit-toggle-button" style={{display: 'inline-block', margin: 'auto', backgroundColor: '#555'}}>
                        Back to Committee List
                    </RouterLink>
                </div>
            </div>
        </div>
    );
}

export default PublicAdminProfileViewPage;