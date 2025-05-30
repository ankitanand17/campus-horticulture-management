import React, { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage} from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import "../css/SignUp.css";

function SignUp() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  const initialValues = {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
  };

  const validationSchema = Yup.object({
      name: Yup.string().min(3, "Enter your full name.").required("Name is required."),
      username: Yup.string()
          .min(3, "Username must be atleast 3 characters long.")
          .max(20, "Username can't exceed 20 characters")
          .matches(/^[a-zA-Z0-9_]+$/, "Username only contain letters, numbers and underscore(_)")
          .required("Username is required."),
      email: Yup.string()
          .email("Invalid Email fromat!!!")
          .required("Email is Required."),
      password: Yup.string().min(6, "Password must be 6 characters long.").required("Password is required."),
      confirmPassword: Yup.string()
          .oneOf([Yup.ref("password"), null], "Password must be same")
          .required("Password is required.")
  });

  const onSubmit = async (data, { setSubmitting, resetForm, setFieldError, setStatus }) => {
      if (!role) {
        setStatus("Please select the role before signup.");
        setSubmitting(false);
        return;
      }
      if (role.toLowerCase() === 'admin') {
        setStatus("Admin registration is not allowed through this form.");
        setSubmitting(false);
        return;
      }

      try {
        const response = await axios.post("http://localhost:4000/auth/register", { ...data, role: role.toLowerCase() });

        if (response.data.success) {
          setServerMessage({ type: 'success', text: "Account created successfully! Redirecting to login..."});
            resetForm();
            setRole("");
            setTimeout(() => navigate("/login"), 2500)
        } else {
                // Use setFieldError for specific fields if backend provides, otherwise setStatus
                if (response.data.errors && response.data.errors.some(e => e.path === 'email' || e.path === 'username')) {
                     setFieldError("email", response.data.message || "Signup failed. Email or Username may already exist.");
                } else {
                    setStatus(response.data.message || "Signup failed. Please try again.");
                }
            }
        } catch (error) {
            console.error("SignUp error:", error);
            const errMsg = error.response?.data?.message || "Server error occurred during registration.";
            setStatus(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

  return (
    <div className="signup-container">
      <h1>Welcome</h1>
      <h2>Registration</h2>

      <Formik 
        initialValues={initialValues} 
        onSubmit={onSubmit} 
        validationSchema={validationSchema}
      >
        {({ isSubmitting }) => (
          <Form>
            <label>Role:</label>
            <Field as="select" name="role" onChange={(e) => setRole(e.target.value)}>
              <option value="">Select a role</option>
              <option value="Student">Student - Can adopt plants and join events.</option>
              <option value="gardener">Gardener - Manages plants and assists students.</option>
            </Field>
            <ErrorMessage name="role" component="p" className="error" />

            <label>Name:</label>
            <Field type="text" name="name" />
            <ErrorMessage name="name" component="p" className="error" />

            <label>Username:</label>
            <Field type="text" name="username" />
            <ErrorMessage name="username" component="p" className="error" />

            <label>Email:</label>
            <Field type="email" name="email" />
            <ErrorMessage name="email" component="p" className="error" />

            <label>Password:</label>
            <Field type="password" name="password" />
            <ErrorMessage name="password" component="p" className="error" />

            <label>Confirm Password:</label>
            <Field type="password" name="confirmPassword" />
            <ErrorMessage name="confirmPassword" component="p" className="error" />

            <button type="submit" disabled={isSubmitting}>Sign Up</button>

            <p className='login-link'>
              Already have Account?? <Link to="/login">Click here to</Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default SignUp;