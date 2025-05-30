// backend/routes/GardeningLog.js
const express = require("express");
const router = express.Router();
const { User, GardeningLog, Plant } = require("../models");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");

// POST /gardening-log/log-task - Gardener logs a task
router.post(
    "/log-task",
    validateToken,
    authorizeRoles("gardener", "admin"),
    async (req, res) => {
        const gardenerUserId = req.user.id;
        try {
            const {
                taskType,    // 'watered', 'gazed_grass', 'cut_plant', 'reported_dead', 'other'
                dateOfTask,  // Expects YYYY-MM-DD, defaults in model if not provided
                areaDescription,
                plantId,     // Optional
                notes
            } = req.body;

            if (!taskType) {
                return res.status(400).json({ success: false, message: "Task type is required." });
            }
            if (taskType === 'reported_dead' && !notes) {
                 return res.status(400).json({ success: false, message: "Notes are required when reporting a dead/expired plant." });
            }
            if ((taskType === 'watered' || taskType === 'cut_plant') && !areaDescription && !plantId) {
                 return res.status(400).json({ success: false, message: "Area description or Plant ID is required for watering/cutting tasks." });
            }
             if (taskType === 'gazed_grass' && !areaDescription) {
                 return res.status(400).json({ success: false, message: "Area description is required for grass gazing task." });
            }


            const logData = {
                gardenerUserId,
                taskType,
                dateOfTask: dateOfTask || new Date(),
                areaDescription: areaDescription || null,
                plantId: plantId ? parseInt(plantId) : null,
                notes: notes || null,
            };

            const newLog = await GardeningLog.create(logData);
            res.status(201).json({ success: true, message: "Gardening task logged successfully.", data: newLog });

        } catch (error) {
            console.error(`[GARDENING LOG] Error logging task for gardener ${gardenerUserId}:`, error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(400).json({ success: false, message: "Validation or Data Error", errors: error.errors ? error.errors.map(e => e.message) : error.message });
            }
            res.status(500).json({ success: false, message: "Server error while logging task." });
        }
    }
);

// GET /gardening-log/my-logs - Gardener gets their own task logs
router.get("/my-logs", validateToken, authorizeRoles("gardener", "admin"), async (req, res) => {
    const gardenerUserId = req.user.id;
    try {
        const logs = await GardeningLog.findAll({
            where: { gardenerUserId: gardenerUserId },
            include: [
                { model: Plant, as: 'plant', attributes: ['id', 'name', 'imageUrl'], required: false }
            ],
            order: [['dateOfTask', 'DESC'], ['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error(`[GARDENING LOG] Error fetching logs for gardener ${gardenerUserId}:`, error);
        res.status(500).json({ success: false, message: "Server error fetching gardening logs." });
    }
});


// GET /gardening-log/all-logs - Admin gets all task logs (Optional)
router.get("/all-logs", validateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const logs = await GardeningLog.findAll({
            include: [
                { model: User, as: 'gardener', attributes: ['id', 'name', 'username'] },
                { model: Plant, as: 'plant', attributes: ['id', 'name', 'imageUrl'], required: false }
            ],
            order: [['dateOfTask', 'DESC'], ['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error(`[GARDENING LOG] Error fetching all logs for admin:`, error);
        res.status(500).json({ success: false, message: "Server error fetching all gardening logs." });
    }
});


module.exports = router;