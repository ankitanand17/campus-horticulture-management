// frontend/src/pages/CreateUserPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import '../css/SignUp.css'; // Can reuse SignUp.css or create a new one

function CreateUserPage() {
    const [role, setRole] = useState(""); // Admin will select the role for the new user
    const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken'); // Admin's token

    const initialValues = {
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        // Role is handled by the 'role' state for this form
    };

    const validationSchema = Yup.object({
        name: Yup.string().min(3).required("Name is required."),
        username: Yup.string().min(3).max(20).matches(/^[a-zA-Z0-9_]+$/, "Invalid username format").required("Username is required."),
        email: Yup.string().email("Invalid email format").required("Email is Required."),
        password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required."),
        confirmPassword: Yup.string().oneOf([Yup.ref("password"), null], "Passwords must match").required("Confirm Password is required."),
    });

    const onSubmit = async (values, { setSubmitting, resetForm, setStatus, setFieldError }) => {
        if (!token) {
            setStatus("Admin authentication error. Please re-login.");
            setSubmitting(false);
            return;
        }
        if (!role) {
            setStatus("Please select a role for the new user.");
            setSubmitting(false);
            return;
        }
        setServerMessage({ type: '', text: '' });
        setStatus('');

        try {
            // Admin uses the same registration endpoint, but their token authorizes it
            const response = await axios.post("http://localhost:4000/auth/register",
                { ...values, role: role.toLowerCase() },
                { headers: { accessToken: token } } // Pass admin token
            );

            if (response.data.success) {
                setServerMessage({ type: 'success', text: `User '${values.username}' created successfully as ${role}!`});
                resetForm();
                setRole(""); // Reset role selection
                // No automatic navigation, admin stays on page to create more if needed
            } else {
                 if (response.data.errors && response.data.errors.some(e => e.path === 'email' || e.path === 'username')) {
                     setFieldError("email", response.data.message || "Creation failed. Email or Username may already exist.");
                } else {
                    setStatus(response.data.message || "User creation failed.");
                }
            }
        } catch (error) {
            console.error("Create User error:", error);
            setStatus(error.response?.data?.message || "Server error during user creation.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="signup-container"> {/* Reusing signup container style */}
            <h1>Create New User</h1>
            <h2>(Administrator Panel)</h2>

            {serverMessage.text && (
                <p className={`server-message ${serverMessage.type}`}>
                    {serverMessage.text}
                </p>
            )}

            <Formik
                initialValues={initialValues}
                onSubmit={onSubmit}
                validationSchema={validationSchema}
            >
                {({ isSubmitting, status }) => (
                    <Form>
                        {status && <p className="form-status-error">{status}</p>}
                        <div>
                            <label htmlFor="role-create">Assign Role:</label>
                            <Field
                                as="select"
                                name="role-create-field" // Unique name for this field instance
                                id="role-create"
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value);
                                }}
                            >
                                <option value="">Select a role</option>
                                <option value="Student">Student</option>
                                <option value="gardener">Gardener</option>
                                <option value="admin">Admin</option> {/* Admin can create other Admins */}
                            </Field>
                            {/* Error for role selection is handled by setStatus if role is empty */}
                        </div>

                        <div>
                            <label htmlFor="create-name">Name:</label>
                            <Field id="create-name" type="text" name="name" />
                            <ErrorMessage name="name" component="p" className="error" />
                        </div>
                        <div>
                            <label htmlFor="create-username">Username:</label>
                            <Field id="create-username" type="text" name="username" />
                            <ErrorMessage name="username" component="p" className="error" />
                        </div>
                        <div>
                            <label htmlFor="create-email">Email:</label>
                            <Field id="create-email" type="email" name="email" />
                            <ErrorMessage name="email" component="p" className="error" />
                        </div>
                        <div>
                            <label htmlFor="create-password">Password:</label>
                            <Field id="create-password" type="password" name="password" />
                            <ErrorMessage name="password" component="p" className="error" />
                        </div>
                        <div>
                            <label htmlFor="create-confirmPassword">Confirm Password:</label>
                            <Field id="create-confirmPassword" type="password" name="confirmPassword" />
                            <ErrorMessage name="confirmPassword" component="p" className="error" />
                        </div>

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating User...' : 'Create User'}
                        </button>

                         <p style={{textAlign: 'center', marginTop: '20px'}}>
                            <Link to="/admin/my-profile">Back to Admin Dashboard</Link>
                        </p>
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default CreateUserPage;