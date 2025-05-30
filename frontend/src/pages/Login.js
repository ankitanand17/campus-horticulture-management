import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import "../css/Login.css";
import { Formik, Form, Field, ErrorMessage } from 'formik';

function Login() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const initialValues = {
    role: "",
    identifier: "",
    password: "",
  };

  const validationSchema = Yup.object({
    role: Yup.string().required("Please select the role first."),
    identifier: Yup.string().required("Username or Email is required."),
    password: Yup.string().required("Password is required."),
  });

  const onSubmit = async (data, { setFieldError, setStatus }) => {
    try {
      const response = await axios.post("http://localhost:4000/auth/login", {
        ...data,
        role: data.role.toLowerCase(),
      });

      console.log("Login response:", response.data);

      if (response.data.success) {
        localStorage.setItem("accessToken", response.data.token);
        localStorage.setItem("Name", response.data.user.name);
        localStorage.setItem("role", response.data.user.role);
        localStorage.setItem("userId", response.data.user.id);
        navigate("/");
      } else {
        setStatus(response.data.message || "Login failed.");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Server error occurred.";
      console.error("Login error:", message);
      setStatus(message);
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome Back</h2>

      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
      >
        {({ isSubmitting, status, setFieldValue }) => (
          <Form>
            <label>Role:</label>
            <Field
              as="select"
              name="role"
              onChange={(e) => {
                setRole(e.target.value);
                setFieldValue("role", e.target.value);
              }}
            >
              <option value="">Select Role</option>
              <option value="Student">Student</option>
              <option value="gardener">Gardener</option>
              <option value="admin">Admin</option>
            </Field>
            <ErrorMessage name="role" component="p" className="error" />

            <label>Username or Email:</label>
            <Field type="text" name="identifier" />
            <ErrorMessage name="identifier" component="p" className="error" />

            <label>Password:</label>
            <Field type="password" name="password" />
            <ErrorMessage name="password" component="p" className="error" />

            {status && <div className="error-message">{status}</div>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <p className="signup-link">
              Don't have an account? <Link to="/signup">Click here for Registration</Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default Login;
