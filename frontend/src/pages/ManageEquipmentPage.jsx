// frontend/src/pages/ManageEquipmentPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import '../css/ManageEquipmentPage.css'; // Create this new CSS file

const EquipmentValidationSchema = Yup.object().shape({
    name: Yup.string().required('Equipment name is required'),
    description: Yup.string().nullable(),
    equipmentImageFile: Yup.mixed()
        .required('An image file is required') // For new additions
        .test("fileSize", "File too large (max 2MB)", value => value && value.size <= 2 * 1024 * 1024)
        .test("fileType", "Unsupported format (JPG/PNG)", value => value && ["image/jpeg", "image/png"].includes(value.type)),
});
// Separate schema for editing if image is optional during update
const EquipmentEditValidationSchema = Yup.object().shape({
    name: Yup.string().required('Equipment name is required'),
    description: Yup.string().nullable(),
    equipmentImageFile: Yup.mixed().nullable() // Image is optional on update
        .test("fileSize", "File too large (max 2MB)", value => !value || (value && value.size <= 2 * 1024 * 1024))
        .test("fileType", "Unsupported format (JPG/PNG)", value => !value || (value && ["image/jpeg", "image/png"].includes(value.type))),
});


function ManageEquipmentPage() {
    const [equipmentList, setEquipmentList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
    const [imagePreview, setImagePreview] = useState(null);
    const [editingEquipment, setEditingEquipment] = useState(null); // To hold equipment being edited

    const token = localStorage.getItem('accessToken');
    const navigate = useNavigate();

    const fetchEquipment = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:4000/equipment/');
            if (response.data.success) {
                setEquipmentList(response.data.data);
            } else {
                setError('Failed to load equipment.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Server error fetching equipment.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchEquipment();
    }, [fetchEquipment, token, navigate]);

    const handleAddSubmit = async (values, { setSubmitting, resetForm }) => {
        setServerMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        formData.append('equipmentImageFile', values.equipmentImageFile);

        try {
            const response = await axios.post('http://localhost:4000/equipment/add', formData, {
                headers: { accessToken: token, 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: 'Equipment added successfully!' });
                fetchEquipment(); // Refresh list
                resetForm();
                setImagePreview(null);
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to add equipment.' });
            }
        } catch (err) {
            setServerMessage({ type: 'error', text: err.response?.data?.message || 'Server error.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (values, { setSubmitting }) => {
        setServerMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        if (values.equipmentImageFile) { // Only append if a new image is chosen for update
            formData.append('equipmentImageFile', values.equipmentImageFile);
        }
        // If you want to allow removing image on update, add a flag:
        // else if (imagePreview === null && editingEquipment?.imageUrl) {
        //     formData.append('removeImage', 'true'); // Backend PUT needs to handle this
        // }


        try {
            const response = await axios.put(`http://localhost:4000/equipment/${editingEquipment.id}`, formData, {
                headers: { accessToken: token, 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: 'Equipment updated successfully!' });
                fetchEquipment();
                setEditingEquipment(null); // Exit edit mode
                setImagePreview(null);
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to update.' });
            }
        } catch (err) {
            setServerMessage({ type: 'error', text: err.response?.data?.message || 'Server error.' });
        } finally {
            setSubmitting(false);
        }
    };


    const handleDelete = async (equipmentId) => {
        if (!window.confirm("Are you sure you want to delete this equipment image?")) return;
        setServerMessage({ type: '', text: '' });
        try {
            const response = await axios.delete(`http://localhost:4000/equipment/${equipmentId}`, {
                headers: { accessToken: token },
            });
            if (response.data.success) {
                setServerMessage({ type: 'success', text: 'Equipment deleted successfully!' });
                fetchEquipment(); // Refresh list
            } else {
                setServerMessage({ type: 'error', text: response.data.message || 'Failed to delete.' });
            }
        } catch (err) {
            setServerMessage({ type: 'error', text: err.response?.data?.message || 'Server error.' });
        }
    };

    const startEdit = (equipment) => {
        setEditingEquipment(equipment);
        setImagePreview(equipment.imageUrl ? `http://localhost:4000${equipment.imageUrl}` : null);
        setServerMessage({ type: '', text: '' }); // Clear previous messages
        window.scrollTo(0, document.getElementById('edit-equipment-form-section').offsetTop - 80); // Scroll to form
    };


    if (isLoading) return <p className="loading-manage">Loading equipment...</p>;
    if (error) return <p className="error-manage" style={{color: 'red', textAlign: 'center'}}>{error}</p>;

    return (
        <div className="manage-equipment-container">
            <h1>Manage Campus Equipment</h1>

            {serverMessage.text && (
                <p className={`server-message ${serverMessage.type === 'error' ? 'error' : 'success'}`}>
                    {serverMessage.text}
                </p>
            )}

            {/* --- Add/Edit Equipment Form Section --- */}
            <div className="equipment-form-section" id="edit-equipment-form-section">
                <h2>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</h2>
                <Formik
                    initialValues={editingEquipment ? {
                        name: editingEquipment.name || '',
                        description: editingEquipment.description || '',
                        equipmentImageFile: null // Always null for file input on edit start
                    } : { name: '', description: '', equipmentImageFile: null }}
                    validationSchema={editingEquipment ? EquipmentEditValidationSchema : EquipmentValidationSchema}
                    onSubmit={editingEquipment ? handleEditSubmit : handleAddSubmit}
                    enableReinitialize // Important for switching between add and edit
                >
                    {({ setFieldValue, isSubmitting, resetForm }) => (
                        <Form className="equipment-form">
                            <div>
                                <label htmlFor="name">Equipment Name</label>
                                <Field id="name" name="name" type="text" placeholder="e.g., Lawn Mower XL200" />
                                <ErrorMessage name="name" component="div" className="error" />
                            </div>
                            <div>
                                <label htmlFor="description">Description (Optional)</label>
                                <Field id="description" name="description" as="textarea" placeholder="Brief description or model details" />
                                <ErrorMessage name="description" component="div" className="error" />
                            </div>
                            <div>
                                <label htmlFor="equipmentImageFile">Equipment Image</label>
                                <input
                                    id="equipmentImageFile"
                                    name="equipmentImageFile"
                                    type="file"
                                    accept="image/jpeg, image/png"
                                    onChange={(event) => {
                                        const file = event.currentTarget.files[0];
                                        setFieldValue("equipmentImageFile", file);
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setImagePreview(reader.result);
                                            reader.readAsDataURL(file);
                                        } else {
                                            setImagePreview(editingEquipment?.imageUrl ? `http://localhost:4000${editingEquipment.imageUrl}` : null);
                                        }
                                    }}
                                />
                                <ErrorMessage name="equipmentImageFile" component="div" className="error" />
                                {imagePreview && (
                                    <div className="image-preview-form">
                                        <img src={imagePreview} alt="Preview" />
                                        <button type="button" onClick={() => {
                                            setImagePreview(null);
                                            setFieldValue("equipmentImageFile", null);
                                        }}>Clear Selection</button>
                                    </div>
                                )}
                            </div>
                            <div className="form-actions">
                                <button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingEquipment ? 'Update Equipment' : 'Add Equipment')}
                                </button>
                                {editingEquipment && (
                                    <button type="button" onClick={() => { setEditingEquipment(null); resetForm(); setImagePreview(null); }}>
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>


            {/* --- List of Existing Equipment --- */}
            <div className="existing-equipment-section">
                <h3>Current Equipment List</h3>
                {equipmentList.length > 0 ? (
                    <div className="equipment-manage-grid">
                        {equipmentList.map(equip => (
                            <div key={equip.id} className="equipment-manage-card">
                                <img src={`http://localhost:4000${equip.imageUrl}`} alt={equip.name} />
                                <h4>{equip.name}</h4>
                                <p>{equip.description || 'No description.'}</p>
                                <div className="equipment-card-actions">
                                    <button onClick={() => startEdit(equip)} className="edit-btn">Edit</button>
                                    <button onClick={() => handleDelete(equip.id)} className="delete-btn">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No equipment has been added yet.</p>
                )}
            </div>
            <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <Link to="/admin/my-profile" className="profile-edit-toggle-button" style={{backgroundColor: '#777'}}>Back to Dashboard</Link>
            </div>
        </div>
    );
}

export default ManageEquipmentPage;