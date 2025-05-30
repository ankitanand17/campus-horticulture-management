import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import "../css/Gallery.css"

function Gallery() {
  const [ plants, setPlants ] = useState([]);

  useEffect(() => {
    const fetchPlants = async () => {
      try{
        const res = await axios.get("http://localhost:4000/plant/show");
        setPlants(res.data.data);
      }catch(error){
        console.error("Failed to load gallery!!");
      }
    };

    fetchPlants();
  }, []);

  return (
    <div className="gallery-container">
      <h2>Gallery</h2>
      <div className="gallery-grid">
        {plants.map((plant) => (
          <Link to={`/plant/${plant.id}`} key={plant.id} className="plant-card">
            <img
              src={`http://localhost:4000${plant.imageUrl}`}
              alt={plant.name}
              className="plant-image"
            />
            <div className="plant-info">
              <h3>{plant.name}</h3>
              <p><em>{plant.scientificName}</em></p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Gallery;