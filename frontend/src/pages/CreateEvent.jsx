import React, { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from "yup";
import "../css/CreateEvent.css";

function CreateEvent() {
  const [imagePreview, setImagePreview] = useState(null);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const initialValues = {
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    image: null,
  };

  const validationSchema = Yup.object({
    title: Yup.string().min(3, "Enter a valid title.").required("Title is required."),
    description: Yup.string().min(10, "Description too short.").required("Description is required."),
    location: Yup.string().required("Location is required."),
    date: Yup.string().required("Date is required."),
    time: Yup.string().required("Time is required."),
  });

  const onSubmit = async (values, { setSubmitting, resetForm }) => {
    setServerError("");
    setSuccessMessage("");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setServerError("You are not logged in. Please login to add an event.");
      setSubmitting(false);
      navigate("/login");
      return;
    }

    const formData = new FormData();
    for (const key in values) {
      formData.append(key, values[key]);
    }

    try {
      const response = await axios.post("http://localhost:4000/event/create", formData, {
        headers: { accessToken: token },
      });

      if (response.data.success) {
        setSuccessMessage("✅ Event created successfully!");
        setImagePreview(null);
        resetForm();
        setTimeout(() => navigate("/events"), 1500); // optional delay
      } else {
        setServerError("❌ Failed to create event.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setServerError("❌ Server error while creating event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-event-container">
      <h1>Welcome</h1>
      <h2>Create Event</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, isSubmitting }) => (
          <Form className="create-event-form">

            <label>Title:</label>
            <Field name="title" type="text" placeholder="Event Title" />
            <ErrorMessage name="title" component="p" className="error" />

            <label>Description:</label>
            <Field name="description" as="textarea" placeholder="Event Description" />
            <ErrorMessage name="description" component="p" className="error" />

            <label>Location:</label>
            <Field name="location" type="text" placeholder="Event Location" />
            <ErrorMessage name="location" component="p" className="error" />

            <label>Date:</label>
            <Field name="date" type="date" />
            <ErrorMessage name="date" component="p" className="error" />

            <label>Time:</label>
            <Field name="time" type="time" />
            <ErrorMessage name="time" component="p" className="error" />

            <label>Event Image:</label>
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.currentTarget.files[0];
                setFieldValue("image", file);
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result);
                  reader.readAsDataURL(file);
                } else {
                  setImagePreview(null);
                }
              }}
            />
            {imagePreview && (
              <div className="image-preview">
                <p>Image Preview:</p>
                <img src={imagePreview} alt="Preview" width="200" />
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>Create Event</button>

            {serverError && <p className="error">{serverError}</p>}
            {successMessage && <p className="success">{successMessage}</p>}

            <p className='login-link'>
              Want to view events? <Link to="/events">Click here</Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default CreateEvent;
