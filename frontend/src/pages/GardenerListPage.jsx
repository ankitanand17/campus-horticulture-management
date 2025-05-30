// frontend/src/pages/GardenerListPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import '../css/CommitteePage.css'; // Reuse CommitteePage styles for now, or create GardenerListPage.css

// Helper for formatting date
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

const GardenerCard = ({ gardener }) => {
    const profile = gardener.gardenerProfile; // Profile might be null

    return (
        <div className="committee-member-card"> {/* Using committee styles */}
            {profile?.profileImageUrl ? (
                <img src={`http://localhost:4000${profile.profileImageUrl}`} alt={gardener.name} className="committee-member-photo" />
            ) : (
                <div className="committee-member-photo-placeholder">No Photo</div>
            )}
            <h3>{gardener.name || 'N/A'}</h3>
            <p className="member-title">{profile?.specialization || 'Gardener Staff'}</p>
            <div className="member-contact">
                {profile?.contactNumber && <p><strong>Phone:</strong> {profile.contactNumber}</p>}
                {gardener.email && <p><strong>Email:</strong> {gardener.email}</p>}
                {profile?.dateOfJoining && <p><strong>Joined:</strong> {formatDate(profile.dateOfJoining)}</p>}
            </div>
        </div>
        // </Link>
    );
};

function GardenerListPage() {
    const [gardeners, setGardeners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('accessToken');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGardeners = async () => {
            if (!token) {
                navigate('/login');
                return;
            }
            setIsLoading(true);
            try {
                // Adjust API endpoint if you chose a different one
                const response = await axios.get('http://localhost:4000/admin-actions/gardeners', {
                    headers: { accessToken: token }
                });
                if (response.data.success) {
                    setGardeners(response.data.data);
                } else {
                    setError('Failed to load gardeners list.');
                }
            } catch (err) {
                console.error('Error fetching gardeners:', err);
                setError(err.response?.data?.message || 'Server error fetching gardeners.');
                 if (err.response?.status === 403) {
                    setError("Access Denied: You do not have permission to view this page.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchGardeners();
    }, [token, navigate]);

    if (isLoading) return <p className="loading-committee">Loading gardeners list...</p>; // Reuse class
    if (error) return <p className="error-committee">{error}</p>; // Reuse class

    return (
        <div className="committee-page-container"> {/* Reuse class */}
            <h1>Registered Gardeners</h1>
            {gardeners.length > 0 ? (
                <div className="committee-grid"> {/* Reuse class */}
                    {gardeners.map(gardener => (
                        <GardenerCard key={gardener.id} gardener={gardener} />
                    ))}
                </div>
            ) : (
                <p style={{textAlign: 'center'}}>No gardeners found.</p>
            )}
            <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <Link to="/admin/my-profile" className="profile-edit-toggle-button" style={{backgroundColor: '#777'}}>
                    Back to Admin Dashboard
                </Link>
            </div>
        </div>
    );
}

export default GardenerListPage;