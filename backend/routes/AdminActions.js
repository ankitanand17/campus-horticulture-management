// backend/routes/AdminActions.js (or a new UsersExtended.js)
const express = require("express");
const router = express.Router();
const { User, GardenerProfile } = require("../models");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");

// GET /admin-actions/gardeners - Fetch a list of all gardener users and their profiles
router.get(
    "/gardeners",
    validateToken,
    authorizeRoles("admin"), // Only admins can view this list
    async (req, res) => {
        console.log("[ADMIN ACTIONS] Request to list all gardeners.");
        try {
            const gardeners = await User.findAll({
                where: { role: 'gardener' },
                attributes: ['id', 'name', 'username', 'email', 'createdAt'],
                include: [{
                    model: GardenerProfile,
                    as: 'gardenerProfile',
                    attributes: ['contactNumber', 'specialization', 'profileImageUrl', 'dateOfJoining'],
                    required: false
                }],
                order: [['name', 'ASC']]
            });

            res.status(200).json({ success: true, data: gardeners });
        } catch (error) {
            console.error("[ADMIN ACTIONS] Error fetching list of gardeners:", error);
            res.status(500).json({ success: false, message: "Server error fetching gardeners." });
        }
    }
);

module.exports = router;