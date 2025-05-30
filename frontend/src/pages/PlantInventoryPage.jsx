// frontend/src/pages/PlantInventoryPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../css/PlantInventoryPage.css'; // Create this CSS file

function PlantInventoryPage() {
    const [plants, setPlants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // Add state for search/filter if needed later

    useEffect(() => {
        const fetchPlants = async () => {
            setIsLoading(true);
            try {
                // Using the existing endpoint that shows plant details including quantity
                const response = await axios.get('http://localhost:4000/plant/show');
                if (response.data.success) {
                    const detailedPlants = [];
                    if (response.data.data && Array.isArray(response.data.data)) {
                        for (const plantStub of response.data.data) {
                            try {
                                const detailRes = await axios.get(`http://localhost:4000/plant/${plantStub.id}`);
                                if (detailRes.data.success) {
                                    detailedPlants.push(detailRes.data.data);
                                }
                            } catch (detailErr) {
                                console.warn(`Could not fetch details for plant ${plantStub.id}`, detailErr);
                            }
                        }
                    }
                    setPlants(detailedPlants);

                } else {
                    setError('Failed to load plant data.');
                }
            } catch (err) {
                console.error('Error fetching plant data:', err);
                setError('Server error while fetching plant data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlants();
    }, []);

    // Calculate total counts if needed (after fetching plants with quantity)
    const totalPlantCount = plants.reduce((sum, plant) => sum + (plant.quantity || 0), 0);
    const uniqueSpeciesCount = new Set(plants.map(p => p.scientificName.toLowerCase())).size;


    if (isLoading) return <p className="loading-inventory">Loading plant inventory...</p>;
    if (error) return <p className="error-inventory" style={{color: 'red', textAlign: 'center'}}>{error}</p>;

    return (
        <div className="plant-inventory-container">
            <h1>Plant Inventory & Counts</h1>
            <div className="inventory-summary">
                <p><strong>Total Individual Plants:</strong> {totalPlantCount}</p>
                <p><strong>Unique Species:</strong> {uniqueSpeciesCount}</p>
            </div>
            {/* Add search/filter inputs here later */}
            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Scientific Name</th>
                        <th>Area</th>
                        <th>Quantity</th>
                        <th>View</th>
                    </tr>
                </thead>
                <tbody>
                    {plants.length > 0 ? plants.map(plant => (
                        <tr key={plant.id}>
                            <td>
                                {plant.imageUrl ? (
                                    <img src={`http://localhost:4000${plant.imageUrl}`} alt={plant.name} className="inventory-plant-image" />
                                ) : (
                                    <div className="inventory-image-placeholder">No Image</div>
                                )}
                            </td>
                            <td>{plant.name}</td>
                            <td><em>{plant.scientificName}</em></td>
                            <td>{plant.area || 'N/A'}</td>
                            <td>{plant.quantity || 0}</td>
                            <td><Link to={`/plant/${plant.id}`} className="inventory-view-link">Details</Link></td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="7" style={{textAlign: 'center'}}>No plants found in inventory. <Link to="/addPlant">Add a new plant?</Link></td>
                        </tr>
                    )}
                </tbody>
            </table>
             <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <Link to="/admin/my-profile" className="profile-edit-toggle-button" style={{backgroundColor: '#777'}}>Back to Dashboard</Link>
            </div>
        </div>
    );
}

export default PlantInventoryPage;