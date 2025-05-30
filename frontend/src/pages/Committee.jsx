// frontend/src/pages/CommitteePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../css/CommitteePage.css'; // Create this CSS file

const CommitteeMemberCard = ({ member }) => {
    const profile = member.adminProfile; // adminProfile might be null if not set up

    return (
        <Link to={`/committee/member/${member.id}`} className="committee-member-card">
            {profile?.profileImageUrl ? (
                <img src={`http://localhost:4000${profile.profileImageUrl}`} alt={member.name} className="committee-member-photo" />
            ) : (
                <div className="committee-member-photo-placeholder">No Photo</div>
            )}
            <h3>{member.name || 'N/A'}</h3>
            <p className="member-title">{profile?.title || 'Admin Staff'}</p>
            <div className="member-contact">
                {profile?.contactNumber && <p><strong>Phone:</strong> {profile.contactNumber}</p>}
                {profile?.publicEmail && <p><strong>Email:</strong> {profile.publicEmail}</p>}
                {/* Show primary email if publicEmail isn't set in profile */}
                {!profile?.publicEmail && member.email && <p><strong>Email:</strong> {member.email}</p>}
            </div>
        </Link>
    );
};

function CommitteePage() {
    const [committeeMembers, setCommitteeMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCommitteeMembers = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('http://localhost:4000/admin-profile/list-admins');
                if (response.data.success) {
                    setCommitteeMembers(response.data.data);
                } else {
                    setError('Failed to load committee members.');
                }
            } catch (err) {
                console.error('Error fetching committee members:', err);
                setError(err.response?.data?.message || 'Server error fetching committee members.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommitteeMembers();
    }, []);

    if (isLoading) return <p className="loading-committee">Loading committee members...</p>;
    if (error) return <p className="error-committee">{error}</p>;

    return (
        <div className="committee-page-container">
            <h1>Our Committee / Administrative Staff</h1>
            {committeeMembers.length > 0 ? (
                <div className="committee-grid">
                    {committeeMembers.map(member => (
                        <CommitteeMemberCard key={member.id} member={member} />
                    ))}
                </div>
            ) : (
                <p style={{textAlign: 'center'}}>No committee members found or profile information available.</p>
            )}
        </div>
    );
}

export default CommitteePage;