// backend/routes/Complaint.js
const express = require("express");
const router = express.Router();
const { User, Complaint } = require("../models");
const { Op } = require("sequelize");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");

// POST /complaint/submit - Any logged-in user submits a complaint
router.post("/submit", validateToken, async (req, res) => {
    const submittedByUserId = req.user.id;
    try {
        const { complaintText, category, locationDescription, priority } = req.body;

        if (!complaintText) {
            return res.status(400).json({ success: false, message: "Complaint details cannot be empty." });
        }

        const newComplaint = await Complaint.create({
            complaintText,
            category: category || null,
            locationDescription: locationDescription || null,
            priority: priority || 'medium',
            submittedByUserId,
            status: 'new'
        });

        res.status(201).json({ success: true, message: "Complaint submitted successfully. We will look into it shortly.", data: newComplaint });

    } catch (error) {
        console.error(`[COMPLAINT SUBMIT] Error for user ${submittedByUserId}:`, error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ success: false, message: "Server error while submitting complaint." });
    }
});

// GET /complaint/my-complaints - User views their own submitted complaints
router.get("/my-complaints", validateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const myComplaints = await Complaint.findAll({
            where: { submittedByUserId: userId },
            include: [
                { model: User, as: 'assignee', attributes: ['id', 'name'], required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: myComplaints });
    } catch (error) {
        console.error(`[MY COMPLAINTS] Error fetching complaints for user ${userId}:`, error);
        res.status(500).json({ success: false, message: "Server error fetching your complaints." });
    }
});


// GET /complaint/all - Admin views all complaints
router.get("/all", validateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const { status, category, priority, sortBy = 'createdAt', order = 'DESC' } = req.query;
        let whereClause = {};
        if (status) whereClause.status = status;
        if (category) whereClause.category = category;
        if (priority) whereClause.priority = priority;

        const allComplaints = await Complaint.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'complainant', attributes: ['id', 'name', 'username', 'email', 'role'] },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'username'], required: false }
            ],
            order: [[sortBy, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']]
        });
        res.status(200).json({ success: true, data: allComplaints });
    } catch (error) {
        console.error("[COMPLAINT GET_ALL] Error fetching complaints for admin:", error);
        res.status(500).json({ success: false, message: "Server error fetching complaints." });
    }
});

// PUT /complaint/:id/manage - Admin updates status, assigns, or adds resolution
router.put("/:id/manage", validateToken, authorizeRoles("admin"), async (req, res) => {
    const complaintId = req.params.id;
    const adminUserId = req.user.id;
    try {
        const { status, assignedToUserId, resolutionDetails, priority } = req.body;

        const complaintItem = await Complaint.findByPk(complaintId);
        if (!complaintItem) {
            return res.status(404).json({ success: false, message: "Complaint not found." });
        }

        if (status) complaintItem.status = status;
        if (priority) complaintItem.priority = priority;
        if (assignedToUserId !== undefined) complaintItem.assignedToUserId = assignedToUserId ? parseInt(assignedToUserId) : null;
        if (resolutionDetails !== undefined) complaintItem.resolutionDetails = resolutionDetails;

        await complaintItem.save();
        const updatedComplaint = await Complaint.findByPk(complaintId, {
             include: [
                { model: User, as: 'complainant', attributes: ['id', 'name', 'username', 'email', 'role'] },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'username'], required: false }
            ]
        });

        res.status(200).json({ success: true, message: "Complaint updated successfully.", data: updatedComplaint });

    } catch (error) {
        console.error(`[COMPLAINT MANAGE] Error for complaint ${complaintId} by admin ${adminUserId}:`, error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ success: false, message: "Server error updating complaint." });
    }
});

// GET /complaint/assigned-to-me - Gardener views complaints assigned to them
router.get("/assigned-to-me", validateToken, authorizeRoles("gardener", "admin"), async (req, res) => {
    const assigneeId = req.user.id;
    try {
        const assignedComplaints = await Complaint.findAll({
            where: { 
                assignedToUserId: assigneeId,
                status: {
                    [Op.notIn]: ['resolved', 'closed', 'rejected', 'pending review', 'new', 'under investigation']
                }
            },
            include: [
                { model: User, as: 'complainant', attributes: ['id', 'name', 'username'] }
            ],
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
        });
        res.status(200).json({ success: true, data: assignedComplaints });
    } catch (error) {
        console.error(`[ASSIGNED COMPLAINTS] Error fetching complaints for assignee ${assigneeId}:`, error);
        res.status(500).json({ success: false, message: "Server error fetching your assigned complaints." });
    }
});

module.exports = router;