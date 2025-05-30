// frontend/src/pages/EventsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../css/Events.css'; // Create this CSS file

// Helper to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper to format time
const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const [hour, minute] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hour, 10));
  date.setMinutes(parseInt(minute, 10));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


const EventCard = ({ event }) => (
  <Link to={`/event/${event.id}`} className="event-card">
    {event.imageUrl ? (
      <img src={`http://localhost:4000${event.imageUrl}`} alt={event.title} className="event-card-image" />
    ) : (
      <div className="event-card-placeholder-image">No Image</div>
    )}
    <div className="event-card-content">
      <h3>{event.title}</h3>
      <p>
        {/* Consider adding an icon library like react-icons */}
        🗓️ {formatDate(event.date)}
      </p>
      <p>
        ⏰ {formatTime(event.time)}
      </p>
      <p>
        📍 {event.location}
      </p>
      {event.creator && <p><small>Created by: {event.creator.name || event.creator.username}</small></p>}
    </div>
  </Link>
);

function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [pastUncompletedEvents, setPastUncompletedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = localStorage.getItem("role");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/event/');
        if (response.data.success) {
          setUpcomingEvents(response.data.data.upcoming || []);
          setCompletedEvents(response.data.data.completed || []);
          setPastUncompletedEvents(response.data.data.pastUncompleted || []);
        } else {
          setError('Failed to load events.');
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError('Server error while fetching events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading events...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error}</p>;

  return (
    <div className="events-page-container">
      <h1>Events & Workshops</h1>

      {userRole === "admin" && (
        <div className="create-event-link-container">
          <Link to="/event/create" className="create-event-button">Create New Event</Link>
        </div>
      )}

      <div className="events-section">
        <h2>Upcoming Events</h2>
        {upcomingEvents.length > 0 ? (
          <div className="events-grid">
            {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <p className="no-events-message">No upcoming events scheduled at the moment. Check back soon!</p>
        )}
      </div>

      <div className="events-section">
        <h2>Completed Events</h2>
        {completedEvents.length > 0 ? (
          <div className="events-grid">
            {completedEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <p className="no-events-message">No events have been marked as completed yet.</p>
        )}
      </div>

      {/* Optional: Display Past but Not Marked Completed Events */}
      {pastUncompletedEvents.length > 0 && (
         <div className="events-section">
           <h2>Past Events (Pending Completion Status)</h2>
           {pastUncompletedEvents.map(event => <EventCard key={event.id} event={event} />)}
         </div>
      )}
    </div>
  );
}

export default EventsPage;