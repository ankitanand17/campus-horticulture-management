// frontend/src/pages/FeedbackFormPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import '../css/FeedbackFormPage.css'; // Link the CSS

const FeedbackValidationSchema = Yup.object().shape({
    feedbackText: Yup.string()
        .min(10, 'Feedback is too short (minimum 10 characters)')
        .max(2000, 'Feedback is too long (maximum 2000 characters)')
        .required('Feedback text is required'),
    rating: Yup.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5')
        .integer()
        .nullable(),
    category: Yup.string().nullable(),
});

function FeedbackFormPage() {
    const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const initialValues = {
        feedbackText: '',
        rating: '', // Will be number or empty string
        category: '',
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        if (!token) {
            setServerMessage({ type: 'error', text: 'You must be logged in to submit feedback.' });
            navigate('/login');
            setSubmitting(false);
            return;
        }
        setServerMessage({ type: '', text: '' });

        const payload = {
            feedbackText: values.feedbackText,
            rating: values.rating ? Number(values.rating) : null,
            category: values.category || null,
        };

        try {
            const response = await axios.post('http://localhost:4000/feedback/submit', payload, {
                headers: { accessToken: token },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: 'Feedback submitted successfully! Thank you.' });
                resetForm();
                // Optionally navigate away or show message for a few seconds
                // setTimeout(() => navigate('/'), 3000); // Example: navigate to home
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to submit feedback.' });
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error while submitting feedback.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="feedback-form-container">
            <h1>Provide Your Feedback</h1>
            <p style={{textAlign: 'center', marginBottom: '1.5rem', color: '#555'}}>
                We value your input! Please let us know your thoughts, suggestions, or concerns.
            </p>

            {serverMessage.text && (
                <p className={`server-message ${serverMessage.type}`}>
                    {serverMessage.text}
                </p>
            )}

            <Formik
                initialValues={initialValues}
                validationSchema={FeedbackValidationSchema}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form className="feedback-form">
                        <div>
                            <label htmlFor="feedbackText">Your Feedback / Suggestion</label>
                            <Field
                                id="feedbackText"
                                name="feedbackText"
                                as="textarea"
                                placeholder="Please describe your feedback in detail..."
                            />
                            <ErrorMessage name="feedbackText" component="div" className="error" />
                        </div>

                        <div>
                            <label htmlFor="category">Category (Optional)</label>
                            <Field as="select" id="category" name="category">
                                <option value="">Select a category...</option>
                                <option value="Website/App">Website/App Experience</option>
                                <option value="Events">Events & Workshops</option>
                                <option value="Horticulture">Horticulture/Campus Greenery</option>
                                <option value="GardenerService">Gardener Service</option>
                                <option value="AdminService">Administrative Service</option>
                                <option value="General">General Suggestion</option>
                                <option value="Other">Other</option>
                            </Field>
                            <ErrorMessage name="category" component="div" className="error" />
                        </div>

                        <div>
                            <label htmlFor="rating">Overall Rating (Optional, 1-5 stars)</label>
                            <Field
                                id="rating"
                                name="rating"
                                type="number"
                                placeholder="e.g., 4"
                                min="1"
                                max="5"
                            />
                            <ErrorMessage name="rating" component="div" className="error" />
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
            <p style={{textAlign: 'center', marginTop: '2rem'}}>
                <Link to="/">Back to Home</Link>
            </p>
        </div>
    );
}

export default FeedbackFormPage;