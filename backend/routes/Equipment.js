// backend/routes/Equipment.js
const express = require("express");
const router = express.Router();
const { EquipmentImage, User } = require("../models");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");
const upload = require("../middlewares/Upload");

// POST /equipment/add - Admin adds new equipment image and details
router.post(
    "/add",
    validateToken,
    authorizeRoles("admin"),
    upload.single("equipmentImageFile"), 
    async (req, res) => {
        const addedByUserId = req.user.id;
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, message: "Equipment name is required." });
            }
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Equipment image is required." });
            }

            const imageUrl = `/uploads/${req.file.filename}`;

            const newEquipment = await EquipmentImage.create({
                name,
                imageUrl,
                description: description || null,
                addedByUserId
            });

            res.status(201).json({ success: true, message: "Equipment image added successfully.", data: newEquipment });

        } catch (error) {
            console.error(`[EQUIPMENT ADD] Error by admin ${addedByUserId}:`, error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
            }
            res.status(500).json({ success: false, message: "Server error while adding equipment image." });
        }
    }
);

// GET /equipment/ - Fetch all equipment images
router.get("/", async (req, res) => {
    try {
        const equipmentList = await EquipmentImage.findAll({
            include: [{ 
                model: User,
                as: 'adder',
                attributes: ['id', 'name', 'username']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: equipmentList });
    } catch (error) {
        console.error("[EQUIPMENT GET_ALL] Error fetching equipment:", error);
        res.status(500).json({ success: false, message: "Server error fetching equipment images." });
    }
});

// DELETE /equipment/:id - Admin deletes an equipment image
router.delete(
    "/:id",
    validateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        const equipmentId = req.params.id;
        try {
            const equipment = await EquipmentImage.findByPk(equipmentId);
            if (!equipment) {
                return res.status(404).json({ success: false, message: "Equipment image not found." });
            }
            await equipment.destroy();
            res.status(200).json({ success: true, message: "Equipment image deleted successfully." });

        } catch (error) {
            console.error(`[EQUIPMENT DELETE] Error deleting equipment ${equipmentId}:`, error);
            res.status(500).json({ success: false, message: "Server error while deleting equipment image." });
        }
    }
);

// Optional: PUT /equipment/:id - Admin updates equipment details
router.put(
    "/:id",
    validateToken,
    authorizeRoles("admin"),
    upload.single("equipmentImageFile"),
    async (req, res) => {
        const equipmentId = req.params.id;
        try {
            const equipment = await EquipmentImage.findByPk(equipmentId);
            if (!equipment) {
                return res.status(404).json({ success: false, message: "Equipment image not found." });
            }

            const { name, description } = req.body;
            let imageUrl = equipment.imageUrl;

            if (req.file) {
                imageUrl = `/uploads/${req.file.filename}`;
            }

            equipment.name = name || equipment.name;
            equipment.description = description !== undefined ? description : equipment.description;
            equipment.imageUrl = imageUrl;

            await equipment.save();
            res.status(200).json({ success: true, message: "Equipment details updated.", data: equipment });

        } catch (error) {
            console.error(`[EQUIPMENT UPDATE] Error updating equipment ${equipmentId}:`, error);
            res.status(500).json({ success: false, message: "Server error updating equipment." });
        }
    }
);

module.exports = router;