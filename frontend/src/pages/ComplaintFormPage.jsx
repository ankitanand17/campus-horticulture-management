// frontend/src/pages/ComplaintFormPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import '../css/ComplaintFormPage.css'; // Link the CSS

const ComplaintValidationSchema = Yup.object().shape({
    complaintText: Yup.string()
        .min(15, 'Complaint details are too short (minimum 15 characters)')
        .max(3000, 'Complaint details are too long (maximum 3000 characters)')
        .required('Complaint details are required'),
    category: Yup.string().nullable(),
    locationDescription: Yup.string().max(255, 'Location description too long').nullable(),
    priority: Yup.string().oneOf(['low', 'medium', 'high']).nullable(),
});

function ComplaintFormPage() {
    const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const initialValues = {
        complaintText: '',
        category: '',
        locationDescription: '',
        priority: 'medium', // Default priority
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        if (!token) {
            setServerMessage({ type: 'error', text: 'You must be logged in to submit a complaint.' });
            navigate('/login');
            setSubmitting(false);
            return;
        }
        setServerMessage({ type: '', text: '' });

        try {
            const response = await axios.post('http://localhost:4000/complaint/submit', values, {
                headers: { accessToken: token },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: 'Complaint submitted successfully. We will review it shortly.' });
                resetForm();
                // Optionally navigate or show message for a few seconds
                // setTimeout(() => navigate('/student/my-profile'), 3000); // Example
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to submit complaint.' });
            }
        } catch (error) {
            console.error('Error submitting complaint:', error);
            setServerMessage({ type: 'error', text: error.response?.data?.message || 'Server error while submitting complaint.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Define categories for the dropdown
    const complaintCategories = [
        "Maintenance Issue (e.g., broken bench, pathway damage)",
        "Horticulture Concern (e.g., diseased plant, pests)",
        "Safety Hazard (e.g., poor lighting, obstruction)",
        "Cleanliness/Waste Management",
        "Watering/Irrigation Problem",
        "Suggestions for Improvement",
        "Staff Conduct (Admin/Gardener)", // Sensitive, ensure proper handling
        "Event Related Issue",
        "Other"
    ];

    return (
        <div className="complaint-form-container">
            <h1>Submit a Complaint</h1>
            <p style={{textAlign: 'center', marginBottom: '1.5rem', color: '#555'}}>
                Please provide as much detail as possible so we can address your concern effectively.
            </p>

            {serverMessage.text && (
                <p className={`server-message ${serverMessage.type}`}>
                    {serverMessage.text}
                </p>
            )}

            <Formik
                initialValues={initialValues}
                validationSchema={ComplaintValidationSchema}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form className="complaint-form">
                        <div>
                            <label htmlFor="complaintText">Complaint Details</label>
                            <Field
                                id="complaintText"
                                name="complaintText"
                                as="textarea"
                                placeholder="Clearly describe the issue, including when and where it occurred if applicable..."
                            />
                            <ErrorMessage name="complaintText" component="div" className="error" />
                        </div>

                        <div>
                            <label htmlFor="category">Category (Optional)</label>
                            <Field as="select" id="category" name="category">
                                <option value="">Select a category...</option>
                                {complaintCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </Field>
                            <ErrorMessage name="category" component="div" className="error" />
                        </div>

                        <div>
                            <label htmlFor="locationDescription">Specific Location (if applicable)</label>
                            <Field
                                id="locationDescription"
                                name="locationDescription"
                                type="text"
                                placeholder="e.g., Near Library, Sector B fountain, Plant ID 123"
                            />
                            <ErrorMessage name="locationDescription" component="div" className="error" />
                        </div>
                        
                        <div>
                            <label htmlFor="priority">Priority (Optional)</label>
                            <Field as="select" id="priority" name="priority">
                                <option value="medium">Medium (Default)</option>
                                <option value="low">Low</option>
                                <option value="high">High</option>
                            </Field>
                            <ErrorMessage name="priority" component="div" className="error" />
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
            <p style={{textAlign: 'center', marginTop: '2rem'}}>
                {/* Link back to user's specific profile or a general dashboard */}
                <Link to={localStorage.getItem('role') === 'admin' ? '/admin/my-profile' : (localStorage.getItem('role') === 'student' ? '/student/my-profile' : (localStorage.getItem('role') === 'gardener' ? '/gardener/my-profile' : '/'))}>
                    Back to My Profile
                </Link>
            </p>
        </div>
    );
}

export default ComplaintFormPage;