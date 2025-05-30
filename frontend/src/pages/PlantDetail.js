import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as Yup from "yup";
import { Formik, Form, Field, ErrorMessage } from "formik";
import "../css/PlantDetail.css";

const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const role = localStorage.getItem("role")?.toLowerCase();

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/plant/${id}`);
        setPlant(res.data.data);
        setImagePreview(`http://localhost:4000${res.data.data.imageUrl}`);
      } catch (err) {
        console.error("Failed to load plant:", err);
      }
    };
    fetchPlant();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this plant?")) return;

    try {
      await axios.delete(`http://localhost:4000/plant/${id}`, {
        headers: { accessToken: localStorage.getItem("accessToken") },
      });
      alert("Plant deleted successfully.");
      navigate("/gallery");
    } catch (error) {
      console.error("Error while deleting plant:", error);
      alert("Failed to delete plant!");
    }
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    scientificName: Yup.string().required("Scientific name is required"),
    description: Yup.string(),
    area: Yup.string().required("Area is required"),
    quantity: Yup.number()
      .required("Quantity is required")
      .min(1, "Minimum 1 plant required")
      .integer("Must be a whole number"),
    image: Yup.mixed()
      .test("fileSize", "File too large (max 5MB)", (value) => {
        if (!value) return true; // Optional
        return value.size <= 5 * 1024 * 1024;
      })
      .test("fileType", "Unsupported format", (value) => {
        if (!value) return true; // Optional
        return ["image/jpeg", "image/png"].includes(value.type);
      }),
  });

  if (!plant) return <p>Loading...</p>;

  return (
    <div className="plant-detail-container">
      {!editMode ? (
        <>
          <h2>{plant.name}</h2>
          <p><strong>Scientific Name:</strong> <em>{plant.scientificName}</em></p>
          <img src={`http://localhost:4000${plant.imageUrl}`} alt={plant.name} className="plant-detail-img" />
          <p><strong>Description:</strong> {plant.description || "N/A"}</p>
          <p><strong>Area:</strong> {plant.area}</p>
          <p><strong>Quantity:</strong> {plant.quantity}</p>

          {(role === "gardener" || role === "admin") && (
            <div style={{ marginTop: "10px" }}>
              <button onClick={() => setEditMode(true)}>Edit</button>
              <button onClick={handleDelete} className="delete-btn" style={{ marginLeft: "10px" }}>Delete</button>
            </div>
          )}
        </>
      ) : (
        <Formik
          initialValues={{
            name: plant.name,
            scientificName: plant.scientificName,
            description: plant.description,
            area: plant.area,
            quantity: plant.quantity,
            image: null,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("scientificName", values.scientificName);
            formData.append("description", values.description);
            formData.append("area", values.area);
            formData.append("quantity", values.quantity);
            if (values.image) formData.append("image", values.image);

            try {
              await axios.put(`http://localhost:4000/plant/${id}`, formData, {
                headers: { accessToken: localStorage.getItem("accessToken") },
              });
              alert("Plant updated successfully.");
              setEditMode(false);
              navigate(0); // refresh to re-fetch plant
            } catch (error) {
              console.error("Error updating plant:", error);
              alert("Failed to update plant.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form encType="multipart/form-data" className="plant-edit-form">
              <div>
                <label htmlFor="name">Name</label>
                <Field id="name" name="name" type="text" />
                <ErrorMessage name="name" component="p" className="error" />
              </div>

              <div>
                <label htmlFor="scientificName">Scientific Name</label>
                <Field id="scientificName" name="scientificName" type="text" />
                <ErrorMessage name="scientificName" component="p" className="error" />
              </div>

              <div>
                <label htmlFor="description">Description</label>
                <Field id="description" name="description" as="textarea" />
                <ErrorMessage name="description" component="p" className="error" />
              </div>

              <div>
                <label htmlFor="area">Area</label>
                <Field id="area" name="area" type="text" />
                <ErrorMessage name="area" component="p" className="error" />
              </div>

              <div>
                <label htmlFor="quantity">Quantity</label>
                <Field id="quantity" name="quantity" type="number" />
                <ErrorMessage name="quantity" component="p" className="error" />
              </div>

              <div>
                <label htmlFor="image">Image</label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={(event) => {
                    const file = event.currentTarget.files[0];
                    setFieldValue("image", file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setImagePreview(reader.result);
                      reader.readAsDataURL(file);
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

              <div style={{ marginTop: "15px" }}>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Plant"}
                </button>
                <button type="button" onClick={() => setEditMode(false)} style={{ marginLeft: "10px" }}>
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default PlantDetail;
