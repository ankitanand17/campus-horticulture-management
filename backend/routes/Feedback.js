// backend/routes/Feedback.js
const express = require("express");
const router = express.Router();
const { User, Feedback } = require("../models");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");

// POST /feedback/submit - Any logged-in user submits feedback
router.post("/submit", validateToken, async (req, res) => {
    const submittedByUserId = req.user.id;
    try {
        const { feedbackText, rating, category } = req.body;

        if (!feedbackText) {
            return res.status(400).json({ success: false, message: "Feedback text cannot be empty." });
        }

        const newFeedback = await Feedback.create({
            feedbackText,
            rating: rating ? parseInt(rating) : null,
            category: category || null,
            submittedByUserId,
            status: 'new'
        });

        res.status(201).json({ success: true, message: "Feedback submitted successfully! Thank you.", data: newFeedback });

    } catch (error) {
        console.error(`[FEEDBACK SUBMIT] Error for user ${submittedByUserId}:`, error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ success: false, message: "Server error while submitting feedback." });
    }
});

// GET /feedback/ - Admin views all feedback
router.get("/", validateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const { status, category, sortBy = 'createdAt', order = 'DESC' } = req.query;
        let whereClause = {};
        if (status) whereClause.status = status;
        if (category) whereClause.category = category;

        const allFeedback = await Feedback.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'submitter', attributes: ['id', 'name', 'username', 'email', 'role'] },
                { model: User, as: 'resolver', attributes: ['id', 'name', 'username'], required: false }
            ],
            order: [[sortBy, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']]
        });

        res.status(200).json({ success: true, data: allFeedback });
    } catch (error) {
        console.error("[FEEDBACK GET_ALL] Error fetching feedback for admin:", error);
        res.status(500).json({ success: false, message: "Server error fetching feedback." });
    }
});

// PUT /feedback/:id/status - Admin updates feedback status and adds notes
router.put("/:id/status", validateToken, authorizeRoles("admin"), async (req, res) => {
    const feedbackId = req.params.id;
    const adminUserId = req.user.id;
    try {
        const { status, adminNotes } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "New status is required." });
        }

        const feedbackItem = await Feedback.findByPk(feedbackId);
        if (!feedbackItem) {
            return res.status(404).json({ success: false, message: "Feedback item not found." });
        }

        feedbackItem.status = status;
        feedbackItem.adminNotes = adminNotes || feedbackItem.adminNotes;
        feedbackItem.resolvedByAdminId = adminUserId; 
        feedbackItem.updatedAt = new Date(); 

        await feedbackItem.save();

        res.status(200).json({ success: true, message: "Feedback status updated successfully.", data: feedbackItem });

    } catch (error) {
        console.error(`[FEEDBACK UPDATE_STATUS] Error for feedback ${feedbackId} by admin ${adminUserId}:`, error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ success: false, message: "Server error updating feedback status." });
    }
});


module.exports = router;