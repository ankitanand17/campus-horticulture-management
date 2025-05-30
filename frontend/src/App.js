// frontend/src/App.js
import React from "react";
import { useNavigate, BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import AddPlant from "./pages/AddPlant";
import PlantDetail from "./pages/PlantDetail";
import CreateEvent from "./pages/CreateEvent";
import EventsPage from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import AdminProfilePage from "./pages/AdminProfilePage";
import CommitteePage from "./pages/Committee";
import PublicAdminProfileViewPage from "./pages/PublicAdminProfileView";
import StudentProfilePage from "./pages/StudentProfilePage";
import GardenerProfilePage from "./pages/GardenerProfilePage";
import PlantInventoryPage from "./pages/PlantInventoryPage";
import GardenerLogsPage from "./pages/GardenerLogsPage";
import FeedbackFormPage from "./pages/FeedbackFormPage";
import ViewFeedbackPage from "./pages/ViewFeedbackPage";
import ComplaintFormPage from "./pages/ComplaintFormPage";
import ViewComplaintsPage from "./pages/ViewComplaintsPage";
import GardenerListPage from "./pages/GardenerListPage";
import AboutUsPage from "./pages/AboutUsPage";
import ManageEquipmentPage from "./pages/ManageEquipmentPage";
import BotanicalGardenPage from "./pages/BotanicalGardenPage";
import CreateUserPage from "./pages/CreateUserPage";
import "./App.css";

const Navbar = () => {
  const userName = localStorage.getItem("Name");
  const userRole = localStorage.getItem("role")?.toLowerCase();
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    const initials = parts.map(part => part[0].toUpperCase()).join("");
    return initials.slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const renderUserAction = () => {
    if (userName) {
      let profileLink = "/"; // Default, should ideally not be used if role is unknown
      let title = `Logged in as ${userName}. Click to logout.`;

      if (userRole === "admin") {
        profileLink = "/admin/my-profile";
        title = `View Admin Profile: ${userName}`;
      } else if (userRole === "student") {
        profileLink = "/student/my-profile";
        title = `View Student Profile: ${userName}`;
      } else if (userRole === "gardener") {
        profileLink = "/gardener/my-profile"; // <-- Link for Gardener
        title = `View Gardener Profile: ${userName}`;
      }

      if (userRole === "admin" || userRole === "student" || userRole === "gardener") {
        return (
          <Link to={profileLink} title={title}>
            <div className="user-circle">
              {getInitials(userName)}
            </div>
          </Link>
        );
      } else { // Other logged-in users without a specific profile page yet
        return (
          <div
            className="user-circle"
            title={title} // Will show logout title
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          >
            {getInitials(userName)}
          </div>
        );
      }
    } else {
      return <Link to="/login">Login/Signup</Link>;
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">
          <img src="/Tezpur_University_logo.png" alt="Tezpur University Logo" className="logo-img" />
          <span className="logo-text">University Horticulture Section</span>
        </Link>
      </div>
      <ul>
        <li><Link to="/about">About Us</Link></li>
        <li><Link to="/committee">Committee</Link></li>
        <li><Link to="/garden">Botanical Garden</Link></li>
        <li><Link to="/events">Events & Workshops</Link></li>
        <li><Link to="/gallery">Gallery</Link></li>
        <li>
          {renderUserAction()}
        </li>
      </ul>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <Navbar />
      <div className="content-wrapper" style={{ paddingTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          {/* Commitee Routes */}
          <Route path="/committee" element={<CommitteePage />} />
          <Route path="/committee/member/:userId" element={<PublicAdminProfileViewPage />} />
          {/* Plant Routes */}
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/plant/:id" element={<PlantDetail />} />
          {/* Event Routes */}
          <Route path="/event/create" element={<CreateEvent />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event/:id" element={<EventDetail />} />
          {/* Admin Profile Route */}
          <Route path="/admin/my-profile" element={<AdminProfilePage />} />
          <Route path="/admin/create-user" element={<CreateUserPage />} />
          <Route path="/admin/view-feedback" element={<ViewFeedbackPage />} />
          <Route path="/admin/gardener-logs" element={<GardenerLogsPage />} />
          <Route path="/admin/gardener-list" element={<GardenerListPage />} />
          <Route path="/admin/plant-inventory" element={<PlantInventoryPage />} />
          <Route path="/admin/view-complaints" element={<ViewComplaintsPage />} />
          <Route path="/admin/manage-equipment" element={<ManageEquipmentPage />} />
          <Route path="/addPlant" element={<AddPlant />} />
          {/* Stident Profile Route */}
          <Route path="/student/my-profile" element={<StudentProfilePage />} />
          <Route path="/give-feedback" element={<FeedbackFormPage />} />
          <Route path="/make-complaint" element={<ComplaintFormPage />} />
          {/* Gardener Profile Route */}
          <Route path="/gardener/my-profile" element={<GardenerProfilePage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/garden" element={<BotanicalGardenPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;