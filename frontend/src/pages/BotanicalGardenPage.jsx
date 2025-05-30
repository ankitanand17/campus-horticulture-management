// frontend/src/pages/BotanicalGardenPage.jsx
import React from 'react';
import '../css/BotanicalGardenPage.css'; // Link the CSS

function BotanicalGardenPage() {
  return (
    <div className="botanical-garden-container">
      <div> {/* Wrapper for H1 */}
        <h1>Tezpur University Botanical Garden</h1>
      </div>

      <img
        src="/botanical.jpg" 
        alt="Tezpur University Botanical Garden Entrance"
        className="garden-banner-image"
      />

      <section className="garden-section">
        <h2>Introduction</h2>
        <p>
          There is a Botanical garden in about 13,125 sq. m (9.8 bigha) of land within the
          University campus. Ministry of Forest, Environment and Climate change, Govt. of India
          had granted an amount of Rs.25.296 lakhs for development of this garden.
          Developmental work of the garden was started on 2013 and completed on 2017.
          The Botanical garden is now becoming a point of attraction for the inhabitants of
          the campus as well as outside visitors.
        </p>
      </section>

      <section className="garden-section">
        <h2>Different Infrastructures of the Garden</h2>
        <ul>
          <li>An Orchidarium</li>
          <li>A Fern House</li>
          <li>A Nursery Shed</li>
          <li>Boundary with chain linked fencing</li>
          <li>Concrete approach road and inside track</li>
          <li>A visitors cum office room</li>
        </ul>
        <p>
          About 300 nos. of different plant species (like Medicinal plants, Palm, Bamboo,
          Economically Important plant, Fruit, Beverage and spices, Tarul, Ferns, Orchid,
          Gymnosperm, RET and other species) are available in the garden.
        </p>
      </section>

      <section className="garden-section">
        <h2>Maintenance</h2>
        <p>
          The maintenance of the garden is done by the Horticulture Section in collaboration
          with Engineering cell of the University under the guidance of the Campus
          Horticultural Committee, Tezpur University.
        </p>
      </section>

      <section className="garden-section">
        <h2>People Behind the Project: "Development of Tezpur University Botanical Garden"</h2>
        <div className="investigators-list">
          <p><strong>1. Principal Investigators:</strong></p>
          <p>
            (i). Dr. Alak Kumar Buragohain
            <i>(w.e.f. 16.8.2013 to 8.1.2014)</i>
            Ex-Professor, Dept of Molecular Biology and Biotechnology, Tezpur University
          </p>
          <p>
            (ii). Dr Satya Sundar Bhattacharya
            <i>(w.e.f. 9.1.2014 till completion of the Project)</i>
            Assistant Professor, Department of Environmental Science, Tezpur University
          </p>
        </div>
        <div className="investigators-list">
          <p><strong>2. Co-Principal Investigator I:</strong></p>
          <p>
            Dr. Jintu Sarma
            <br />
            Ex-UDC, Department of Environmental Science, Tezpur University
          </p>
        </div>
        <div className="investigators-list">
          <p><strong>3. Co-Principal Investigator II:</strong></p>
          <p>
            Sri Girindra Hazarika
            <br />
            Assistant Horticulturist, Horticulture Section, Tezpur University
          </p>
        </div>
      </section>
    </div>
  );
}

export default BotanicalGardenPage;