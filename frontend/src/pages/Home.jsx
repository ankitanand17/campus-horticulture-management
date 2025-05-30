// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../css/HomePage.css'; // We'll create this CSS file

// You can import icons if you have react-icons installed
// import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaLink, FaUsers, FaInfoCircle, FaCalendarAlt, FaLeaf } from 'react-icons/fa';

function Home() {
  return (
    <div className="home-page">
      {/* --- Hero Section with Image and Welcome Text --- */}
      <header className="hero-section">
        <img
          src="/horticulture-banner.jpg" // Make sure this image is in your `public` folder
          alt="Tezpur University Horticulture Section"
          className="hero-image"
        />
        <div className="hero-text-overlay">
          <h1>Welcome To <br />The Horticulture Section</h1>
          <p className="hero-subtitle">Nurturing Greenery, Inspiring Minds at Tezpur University</p>
        </div>
      </header>

      {/* --- Introduction Section --- */}
      <section className="intro-section section-padding">
        <div className="container">
          <h2>About Our Green Campus</h2>
          <p className="intro-text">
            The Horticultural activities for landscaping and beautification of Tezpur University, Napaam
            were initiated with the constitution of a Landscaping Committee in 1995. Since then,
            our dedicated team has been committed to enhancing the aesthetic appeal and ecological
            balance of our campus, creating a serene and vibrant environment for students, faculty,
            and visitors alike.
          </p>
          <p className="intro-text">
            We manage diverse flora, maintain lush green lawns, and cultivate beautiful gardens that not only
            add to the scenic beauty but also contribute to biodiversity. Our efforts are aimed at
            promoting environmental awareness and providing a refreshing atmosphere conducive to learning
            and research.
          </p>
        </div>
      </section>

      {/* --- Key Features/Highlights Section (Optional) --- */}
      <section className="features-section section-padding-light">
        <div className="container">
          <h2>Highlights</h2>
          <div className="features-grid">
            <div className="feature-item">
              {/* <FaLeaf size={40} className="feature-icon" /> */}
              <h3>Botanical Richness</h3>
              <p>Explore a diverse collection of native and exotic plant species across our campus.</p>
            </div>
            <div className="feature-item">
              {/* <FaCalendarAlt size={40} className="feature-icon" /> */}
              <h3>Events & Workshops</h3>
              <p>Participate in engaging workshops and events related to horticulture and environment.</p>
              <Link to="/events" className="feature-link">View Events</Link>
            </div>
            <div className="feature-item">
              {/* <FaUsers size={40} className="feature-icon" /> */}
              <h3>Community Involvement</h3>
              <p>Opportunities for students and staff to contribute to campus green initiatives.</p>
            </div>
          </div>
        </div>
      </section>


      {/* --- Footer Section with Contact and Links --- */}
      <footer className="footer-section section-padding">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column contact-details">
              <h3>Contact Us</h3>
              <img
                src="/Tezpur_University_logo.png" // Your university logo in the public folder
                alt="Tezpur University Logo"
                className="footer-logo"
              />
              <p>
                {/* <FaMapMarkerAlt /> */} Tezpur University, Napaam, Tezpur, Assam, PIN - 784028
              </p>
              <p>
                {/* <FaPhone /> */} Phone: <a href="tel:03712275610">03712-27-5610</a>
              </p>
              <p>
                {/* <FaEnvelope /> */} Email: <a href="mailto:satya72@tezu.ernet.in">satya72@tezu.ernet.in</a> (Horticulture Section)
              </p>
              <p>
                {/* <FaLink /> */} University Website: <a href="http://www.tezu.ernet.in" target="_blank" rel="noopener noreferrer">www.tezu.ernet.in</a>
              </p>
            </div>

            <div className="footer-column useful-links">
              <h3>Useful Links</h3>
              <ul>
                <li><Link to="/gallery"> {/* <FaLeaf /> */} Plant Gallery</Link></li>
                <li><Link to="/committee"> {/* <FaUsers /> */} Committee</Link></li>
                <li><Link to="/about"> {/* <FaInfoCircle /> */} About Us</Link></li>
                <li><Link to="/events"> {/* <FaCalendarAlt /> */} Events & Workshops</Link></li>
              </ul>
            </div>

            <div className="footer-column quick-connect">
              <h3>Stay Connected</h3>
              <p>Follow Tezpur University's official channels for updates.</p>
              {/* Add social media links/icons here if available */}
              <div className="social-icons">
                 {/* Example:
                 <a href="#" target="_blank" rel="noopener noreferrer"><FaFacebookSquare size={30} /></a>
                 <a href="#" target="_blank" rel="noopener noreferrer"><FaTwitterSquare size={30} /></a>
                 <a href="#" target="_blank" rel="noopener noreferrer"><FaInstagramSquare size={30} /></a>
                 */}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Horticulture Section, Tezpur University. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;