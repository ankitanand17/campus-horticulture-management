// frontend/src/pages/EventDetail.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import '../css/EventDetail.css'; // Create this CSS file

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const [hour, minute] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hour, 10));
  date.setMinutes(parseInt(minute, 10));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const EventDetail = () => {
  const { id: eventId } = useParams(); // Renamed for clarity
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [serverError, setServerError] = useState("");
  const [joinStatus, setJoinStatus] = useState({ message: '', type: '' }); // For join event feedback
  const [isJoined, setIsJoined] = useState(false); // Track if current user has joined

  const userId = localStorage.getItem("userId"); // Assuming you store userId upon login
  const userRole = localStorage.getItem("role")?.toLowerCase();
  const token = localStorage.getItem("accessToken");

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setJoinStatus({ message: '', type: '' });
      const response = await axios.get(`http://localhost:4000/event/${eventId}`);
      if (response.data.success) {
        const fetchedEvent = response.data.data;
        setEvent(fetchedEvent);
        if (fetchedEvent.imageUrl) {
          setImagePreview(`http://localhost:4000${fetchedEvent.imageUrl}`);
        } else {
          setImagePreview(null);
        }
        // Check if current user is among participants
        if (userId && fetchedEvent.participants?.some(p => p.id === parseInt(userId))) {
            setIsJoined(true);
        } else {
            setIsJoined(false);
        }

      } else {
        setError('Failed to load event details.');
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError(err.response?.data?.message || 'Server error while fetching event details.');
    } finally {
      setLoading(false);
    }
  }, [eventId, userId]); // Added userId as dependency for isJoined check

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`http://localhost:4000/event/${eventId}`, {
        headers: { accessToken: token },
      });
      alert("Event deleted successfully.");
      navigate("/events");
    } catch (err) {
      console.error("Error deleting event:", err);
      alert(err.response?.data?.message || "Failed to delete event.");
    }
  };

  const validationSchema = Yup.object({
    title: Yup.string().min(3).required("Title is required"),
    description: Yup.string().min(10).required("Description is required"),
    location: Yup.string().required("Location is required"),
    date: Yup.date().required("Date is required"),
    time: Yup.string().required("Time is required"),
    completed: Yup.boolean(),
    image: Yup.mixed().nullable() // Optional: add file size/type validation if needed
        .test("fileSize", "File too large (max 5MB)", (value) => {
             if (!value) return true; // Optional
             return value.size <= 5 * 1024 * 1024;
         })
         .test("fileType", "Unsupported format (JPG/PNG)", (value) => {
             if (!value) return true; // Optional
             return ["image/jpeg", "image/png"].includes(value.type);
         }),
  });

  const handleUpdate = async (values, { setSubmitting }) => {
    setServerError("");
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("location", values.location);
    formData.append("date", values.date);
    formData.append("time", values.time);
    formData.append("completed", values.completed);
    if (values.image) {
      formData.append("image", values.image);
    } else if (imagePreview === null && event.imageUrl) {
      // If imagePreview is nullified (meaning user wants to remove image)
      // and there was an existing image.
      formData.append("removeImage", "true"); // Signal to backend to remove image
    }


    try {
      const response = await axios.put(`http://localhost:4000/event/${eventId}`, formData, {
        headers: {
          accessToken: token,
          // 'Content-Type': 'multipart/form-data' is set by browser for FormData
        },
      });
      if (response.data.success) {
        alert("Event updated successfully!");
        setEditMode(false);
        fetchEvent(); // Re-fetch to show updated data
      } else {
        setServerError(response.data.message || "Failed to update event.");
      }
    } catch (err) {
      console.error("Error updating event:", err);
      setServerError(err.response?.data?.message || "Server error while updating event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!token) {
      setJoinStatus({ message: 'You must be logged in to join an event.', type: 'error' });
      navigate('/login');
      return;
    }
    try {
      setJoinStatus({ message: 'Joining...', type: 'info' });
      const response = await axios.post(`http://localhost:4000/event/${eventId}/join`, {}, {
        headers: { accessToken: token },
      });
      if (response.data.success) {
        setJoinStatus({ message: response.data.message || 'Successfully joined the event!', type: 'success' });
        setIsJoined(true);
        // Optionally, re-fetch event to update participant count if displayed dynamically
        fetchEvent();
      } else {
        setJoinStatus({ message: response.data.error || 'Failed to join event.', type: 'error' });
      }
    } catch (err) {
      console.error("Error joining event:", err);
      setJoinStatus({ message: err.response?.data?.error || 'Server error while trying to join.', type: 'error' });
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading event details...</p>;
  if (error || !event) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error || 'Event not found.'}</p>;

  // --- Logic for "Join Event" button visibility ---
  const canJoinEvent = () => {
    if (!token || userRole === 'admin') return false; // Not logged in or is admin
    if (event.completed) return false; // Event is completed
    if (isJoined) return false; // Already joined

    // Check if event date/time has passed
    const eventDateTime = new Date(`${event.date.split('T')[0]}T${event.time}`); // Combine date and time
    const now = new Date();
    if (eventDateTime < now) return false; // Event is in the past

    return true;
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading event details...</p>;
  if (error || !event) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error || 'Event not found.'}</p>;

  return (
    <div className="event-detail-container">
      {!editMode ? (
        <>
          <h1>{event.title}</h1>
          {event.imageUrl ? (
            <img src={`http://localhost:4000${event.imageUrl}`} alt={event.title} className="event-detail-image" />
          ) : (
            <div className="event-detail-placeholder-image">No Image Provided</div>
          )}
          <div className="event-info">
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Date:</strong> {formatDate(event.date)}</p>
            <p><strong>Time:</strong> {formatTime(event.time)}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Status:</strong> {event.completed ? 'Completed' : 'Upcoming/Ongoing'}</p>
            {event.creator && <p><strong>Created by:</strong> {event.creator.name || event.creator.username}</p>}
            <p><strong>Participants:</strong> {event.participantCount || 0}</p>
          </div>

          {joinStatus.message && (
            <p style={{
              textAlign: 'center',
              color: joinStatus.type === 'error' ? 'red' : (joinStatus.type === 'success' ? 'green' : 'blue'),
              margin: '10px 0'
            }}>
              {joinStatus.message}
            </p>
          )}
          {canJoinEvent() && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button onClick={handleJoinEvent} className="join-event-button">
                Want to Join this Event?
              </button>
            </div>
          )}
          {isJoined && !event.completed && (
             <p style={{ textAlign: 'center', color: 'green', fontWeight: 'bold', margin: '10px 0' }}>
                You have joined this event!
             </p>
          )}

          {userRole === 'admin' && (
            <div className="event-admin-actions">
              <button onClick={() => {
                  setEditMode(true);
                  // Ensure imagePreview is set correctly from current event.imageUrl when entering edit mode
                  if (event.imageUrl) setImagePreview(`http://localhost:4000${event.imageUrl}`);
                  else setImagePreview(null);
                  setServerError(""); // Clear previous edit errors
              }} className="event-edit-button">Edit Event</button>
              <button onClick={handleDelete} className="event-delete-button">Delete Event</button>
            </div>
          )}
        </>
      ) : (
        // --- Edit Form ---
        <div className="event-edit-form">
          <h2>Edit Event</h2>
          <Formik
            initialValues={{
              title: event.title || '',
              description: event.description || '',
              location: event.location || '',
              date: formatDateForInput(event.date) || '',
              time: event.time || '',
              completed: event.completed || false,
              image: null, // File input is initially null
            }}
            validationSchema={validationSchema}
            onSubmit={handleUpdate}
            enableReinitialize // Important to reinitialize form when 'event' data changes
          >
            {({ setFieldValue, isSubmitting, dirty, isValid }) => ( // dirty and isValid can be used for button state
              <Form encType="multipart/form-data">
                {serverError && <p className="error-message-detail">{serverError}</p>}
                <div>
                  <label htmlFor="title">Title</label>
                  <Field id="title" name="title" type="text" />
                  <ErrorMessage name="title" component="p" className="error" />
                </div>
                <div>
                  <label htmlFor="description">Description</label>
                  <Field id="description" name="description" as="textarea" />
                  <ErrorMessage name="description" component="p" className="error" />
                </div>
                <div>
                  <label htmlFor="location">Location</label>
                  <Field id="location" name="location" type="text" />
                  <ErrorMessage name="location" component="p" className="error" />
                </div>
                <div>
                  <label htmlFor="date">Date</label>
                  <Field id="date" name="date" type="date" />
                  <ErrorMessage name="date" component="p" className="error" />
                </div>
                <div>
                  <label htmlFor="time">Time</label>
                  <Field id="time" name="time" type="time" />
                  <ErrorMessage name="time" component="p" className="error" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Field id="completed" name="completed" type="checkbox" />
                  <label htmlFor="completed" style={{ marginBottom: 0 }}>Mark as Completed</label>
                </div>
                <div>
                  <label htmlFor="image">Event Image (leave blank to keep current)</label>
                  <input
                    id="image"
                    name="image" // This name attribute is important for HTML but Formik uses setFieldValue
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={(e) => {
                      const file = e.currentTarget.files[0];
                      setFieldValue("image", file || null); // Set Formik field value
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result); // Update visual preview
                        reader.readAsDataURL(file);
                      } else {
                        // If file is deselected, reset preview to original or clear it
                        // If you want to revert to original image if user deselects:
                        // setImagePreview(event.imageUrl ? `http://localhost:4000${event.imageUrl}` : null);
                        // For now, just clearing it:
                         setImagePreview(null);
                      }
                    }}
                  />
                  <ErrorMessage name="image" component="p" className="error" />
                </div>
                {imagePreview && (
                  <div className="image-preview-edit">
                    <p>Image Preview:</p>
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" onClick={() => {
                        setImagePreview(null); // Clear visual preview
                        setFieldValue("image", null); // Clear file from Formik
                    }} style={{display: 'block', margin: '5px 0', fontSize: '0.8em', cursor: 'pointer'}}>
                        Clear Selected Image
                    </button>
                  </div>
                )}
                <div className="form-actions">
                  <button type="submit" disabled={isSubmitting || !dirty || !isValid} className="update-event-button">
                    {isSubmitting ? "Updating..." : "Update Event"}
                  </button>
                  <button type="button" onClick={() => {
                      setEditMode(false);
                      setServerError("");
                      // Reset image preview to the original event image when cancelling edit
                      if (event.imageUrl) setImagePreview(`http://localhost:4000${event.imageUrl}`);
                      else setImagePreview(null);
                  }} className="cancel-edit-button" style={{ marginLeft: '10px' }}>
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
      <Link to="/events" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>Back to Events List</Link>
    </div>
  );
};

export default EventDetail;