import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import "../css/AddPlant.css";

function AddPlant() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const initialValues = {
    name: "",
    scientificName: "",
    description: "",
    area: "",
    quantity: 1,
    image: null,
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    scientificName: Yup.string().required("Scientific name is required"),
    description: Yup.string().optional(),
    area: Yup.string().required("Area is required"),
    quantity: Yup.number()
      .required("Quantity is required")
      .min(1, "Minimum 1 plant required")
      .integer("Quantity must be a whole number"),
    image: Yup.mixed()
      .required("Image is required")
      .test(
        "fileSize",
        "File too large (max 5MB)",
        (value) => value && value.size <= 5 * 1024 * 1024 // 5MB example limit
      )
      .test(
        "fileType",
        "Unsupported file format (only JPG/PNG)",
        (value) => value && ["image/jpeg", "image/png"].includes(value.type)
      ),
  });

  const onSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
    setServerError("");
    setSuccessMessage("");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setServerError("You are not logged in. Please login to add a plant.");
      setSubmitting(false);
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("scientificName", values.scientificName);
    formData.append("description", values.description);
    formData.append("area", values.area);
    formData.append("quantity", values.quantity);
    formData.append("image", values.image);

    try {
      const response = await axios.post(
        "http://localhost:4000/plant/addPlant",
        formData,
        {
          headers: {
            accessToken: token,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage("Plant added successfully!");
        resetForm();
        setImagePreview(null);
        setTimeout(() => {
          navigate("/gallery");
        }, 1500);
      } else {
        setServerError(response.data.error || "Failed to add plant. Please try again.");
      }
    } catch (err) {
      console.error("Error while adding plant:", err);
      alert("Unable to add plant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="addplant-container"> 
      <h2>Add New Plant</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ setFieldValue, isSubmitting, errors, touched }) => (
          <Form encType="multipart/form-data"> {/* encType is good practice for file uploads */}
            {serverError && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{serverError}</p>}
            {successMessage && <p className="success-message" style={{color: 'green', marginBottom: '10px'}}>{successMessage}</p>}

            <div>
              <label htmlFor="name">Name</label>
              <Field id="name" type="text" name="name" />
              <ErrorMessage name="name" component="p" className="error" />
            </div>

            <div>
              <label htmlFor="scientificName">Scientific Name</label>
              <Field id="scientificName" type="text" name="scientificName" />
              <ErrorMessage name="scientificName" component="p" className="error" />
            </div>
            
            <div>
              <label htmlFor="description">Description</label>
              <Field id="description" as="textarea" name="description" />
              <ErrorMessage name="description" component="p" className="error" />
            </div>

            <div>
              <label htmlFor="area">Area</label>
              <Field id="area" type="text" name="area" />
              <ErrorMessage name="area" component="p" className="error" />
            </div>

            <div>
              <label htmlFor="quantity">Quantity</label>
              <Field id="quantity" type="number" name="quantity" />
              <ErrorMessage name="quantity" component="p" className="error" />
            </div>

            <div>
              <label htmlFor="image">Image</label>
              <input
                id="image"
                type="file"
                name="image"
                accept="image/jpeg, image/png"
                onChange={(event) => {
                  const file = event.currentTarget.files[0];
                  if (file) {
                    setFieldValue("image", file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setFieldValue("image", null);
                    setImagePreview(null);
                  }
                }}
              />
              <ErrorMessage name="image" component="p" className="error" />
            </div>

            {imagePreview && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                />
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Plant"}
            </button>
            <p className="addplant-back-link" style={{marginTop: "15px"}}> {/* Use correct class from AddPlant.css */}
              <Link to="/gallery">Back to Gallery</Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AddPlant;