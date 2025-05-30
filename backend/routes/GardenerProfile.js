// backend/routes/GardenerProfile.js
const express = require("express");
const router = express.Router();
const { User, GardenerProfile } = require("../models");
const { validateToken } = require("../middlewares/Authmiddleware");
const upload = require("../middlewares/Upload");

// POST /gardener-profile/setup - Create or Update Gardener Profile
router.post(
    "/setup",
    validateToken,
    upload.single("profileImage"),
    async (req, res) => {
        const userId = req.user.id;

        if (req.user.role !== 'gardener') {
            return res.status(403).json({ success: false, message: "Access denied. Only gardeners can set up this profile." });
        }

        let gardenerProfile = null;
        let action = "setting up";

        try {
            const {
                contactNumber, address, dateOfJoining, specialization
            } = req.body;

            let profileImageUrl = req.body.existingImageUrl || undefined;
            if (req.file) {
                profileImageUrl = `/uploads/${req.file.filename}`;
            } else if (req.body.removeProfileImage === 'true') {
                profileImageUrl = null;
            }

            const profileData = {
                userId,
                contactNumber, 
                address: address || null,
                dateOfJoining: dateOfJoining || null, 
                specialization: specialization || null,
            };
            if (profileImageUrl !== undefined) {
                profileData.profileImageUrl = profileImageUrl;
            }
            Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);


            gardenerProfile = await GardenerProfile.findByPk(userId);
            let created = false;

            if (gardenerProfile) {
                action = "updating";
                await gardenerProfile.update(profileData);
            } else {
                action = "creating";
                if (!profileData.contactNumber) {
                    return res.status(400).json({ success: false, message: "Contact number is required."});
                }
                gardenerProfile = await GardenerProfile.create(profileData);
                created = true;
            }

            res.status(created ? 201 : 200).json({
                success: true,
                message: `Gardener profile ${created ? 'created' : 'updated'} successfully.`,
                data: gardenerProfile
            });

        } catch (error) {
            console.error(`[GARDENER PROFILE] Error ${action} profile for gardener ${userId}:`, error.name, error.message);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
            }
            res.status(500).json({ success: false, message: "Server error while setting up gardener profile." });
        }
    }
);

// GET /gardener-profile/ - Get current logged-in gardener's profile
router.get("/", validateToken, async (req, res) => {
    const userId = req.user.id;

    if (req.user.role !== 'gardener') {
        return res.status(403).json({ success: false, message: "Access denied. This profile view is for gardeners." });
    }

    try {
        const gardenerProfileData = await GardenerProfile.findOne({
            where: { userId: userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'username', 'email', 'role']
            }]
        });
        
        const userDataForResponse = gardenerProfileData ? gardenerProfileData.user : req.user;

        res.status(200).json({
            success: true,
            data: {
                profile: gardenerProfileData,
                user: userDataForResponse
            }
        });

    } catch (error) {
        console.error(`[GARDENER PROFILE] Error fetching own profile for gardener ${userId}:`, error);
        res.status(500).json({ success: false, message: "Server error fetching gardener profile." });
    }
});

module.exports = router;