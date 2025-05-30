// frontend/src/pages/AboutUsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Removed Link from here if not used elsewhere on this page
import '../css/AboutUsPage.css';

function AboutUsPage() {
    const [equipmentList, setEquipmentList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // userRole is no longer needed here if the add button is removed

    useEffect(() => {
        const fetchEquipment = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('http://localhost:4000/equipment/');
                if (response.data.success) {
                    setEquipmentList(response.data.data);
                } else {
                    setError('Failed to load equipment images.');
                }
            } catch (err) {
                setError('Server error while fetching equipment images.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEquipment();
    }, []);

    return (
        <div className="about-us-container">
            <div><h1>About the Horticulture Section</h1></div>
            <section className="about-section">
                <h2>Our Activities</h2>
                <p>
                    The Horticultural activities for landscaping and beautification of Tezpur University, Napaam
                    was started as and when a Landscaping Committee was constituted on 1995.
                    The section is involved in following activities:
                </p>
                <ul>
                    <li>Carrying out plantation program in different locations of the University campus.</li>
                    <li>Landscaping and gardening in the premises of newly constructed administrative and academic buildings and in other locations of the University campus.</li>
                    <li>Maintenance of gardens and landscape.</li>
                    <li>Maintenance of plantations.</li>
                    <li>Maintenance of vermicompost unit.</li>
                    <li>Maintenance of departmental nursery.</li>
                    <li>Maintenance of house plant pots for indoor decoration of different Offices, Academic buildings, Guest House, Library, Auditorium and other amenity centers.</li>
                </ul>
                <p>
                    The University boasts of a lush green campus despite considerable construction activities,
                    due to the consistent efforts of Horticulture Section.
                </p>
            </section>
            <section className="about-section">
                <h2>Infrastructural Facilities</h2>
                 <p>The office building of Horticulture Section is adjacent to Community hall.</p>
                <p><strong>Horticultural Machineries:</strong> Tractor along with accessories, Ride on Lawn Mower, Lawn Mower, Wheeled String Trimmer, Brush Cutter, Chain Saw Machine etc.</p>
                <p><strong>Equipment:</strong> Hedge Shear, Pruning Secateurs, Pruning-budding-grafting Knife, Thinning Scissor, Spade, Garden Rake, Belcha, Dao, Khurpi, Saw, Axe, Sprayer etc.</p>
                <div className="equipment-gallery-section">
                    <h3>Our Equipment & Tools</h3>
                    {isLoading && <p className="loading-about">Loading equipment images...</p>}
                    {error && <p className="error-about">{error}</p>}
                    {!isLoading && !error && equipmentList.length > 0 && (
                        <div className="equipment-grid">
                            {equipmentList.map(equip => (
                                <div key={equip.id} className="equipment-card">
                                    {equip.imageUrl ? (
                                        <img src={`http://localhost:4000${equip.imageUrl}`} alt={equip.name} />
                                    ) : (
                                        <div className="equipment-image-placeholder">No Image</div>
                                    )}
                                    <h4 className="equipment-name">{equip.name}</h4>
                                    {equip.description && <p className="equipment-description">{equip.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {!isLoading && !error && equipmentList.length === 0 && (
                        <p style={{textAlign: 'center'}}>No equipment images have been uploaded yet.</p>
                    )}
                </div>
            </section>
            {/* "Add Equipment" button removed from here */}
        </div>
    );
}

export default AboutUsPage;