// routes/AdminProfile.js
const express = require("express");
const router = express.Router();
const { User, AdminProfile } = require("../models");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");
const upload = require("../middlewares/Upload");

router.post(
    "/setup",
    validateToken,
    authorizeRoles("admin"),
    upload.single("profileImage"),
    async (req, res) => {
        const userId = req.user.id;
        let adminProfile = null;
        let action = "setting up";

        try {
            const {
                contactNumber, publicEmail, linkedInUrl, department,
                subjectsTaught, qualifications, researchInterests, bioSummary,
                title, yearsOfExperience, officeLocation, publicationsUrl
            } = req.body;

            let profileImageUrl = req.body.existingImageUrl || undefined;
            if (req.file) {
                profileImageUrl = `/uploads/${req.file.filename}`;
            } else if (req.body.removeProfileImage === 'true') {
                profileImageUrl = null;
            }

            const parseToArrayOrNull = (value) => {
                if (!value) return null;
                if (Array.isArray(value)) return value.length > 0 ? value : null;
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
                } catch (e) {
                    const arr = value.split(',').map(s => s.trim()).filter(s => s);
                    return arr.length > 0 ? arr : null;
                }
            };

            const profileData = {
                userId,
                contactNumber: contactNumber || null,
                publicEmail: publicEmail || null,
                linkedInUrl: linkedInUrl || null,
                department: department || null,
                subjectsTaught: parseToArrayOrNull(subjectsTaught),
                qualifications: parseToArrayOrNull(qualifications),
                researchInterests: parseToArrayOrNull(researchInterests),
                bioSummary: bioSummary || null,
                title: title || null,
                yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
                officeLocation: officeLocation || null,
                publicationsUrl: publicationsUrl || null,
            };

            if (profileImageUrl !== undefined) { 
                profileData.profileImageUrl = profileImageUrl;
            }

            Object.keys(profileData).forEach(key => {
                if (profileData[key] === undefined) {
                    delete profileData[key];
                }
            });

            adminProfile = await AdminProfile.findByPk(userId);
            let created = false;

            if (adminProfile) {
                action = "updating";
                console.log(`[ADMIN PROFILE] ${action} profile for admin ${userId}`);
                await adminProfile.update(profileData);
            } else {
                action = "creating";
                console.log(`[ADMIN PROFILE] ${action} profile for admin ${userId}`);
                adminProfile = await AdminProfile.create(profileData);
                created = true;
            }

            res.status(created ? 201 : 200).json({
                success: true,
                message: `Admin profile ${created ? 'created' : 'updated'} successfully.`,
                data: adminProfile
            });

        } catch (error) {
            console.error(`[ADMIN PROFILE] Error ${action} profile for admin ${userId}:`, error.name, error.message);

            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
            }
            res.status(500).json({ success: false, message: "Server error while setting up admin profile." });
        }
    }
);

// GET /admin-profile/list-admins - Fetch all admin's profile as list
router.get("/list-admins", async (req, res) => {
    console.log("[ADMIN PROFILE] Request to list all admin profiles.");
    try {
        const adminsWithProfiles = await User.findAll({
            where: { role: 'admin' },
            attributes: ['id', 'name', 'username', 'email'], // Select basic user info
            include: [{
                model: AdminProfile,
                as: 'adminProfile', 
            }],
            order: [['name', 'ASC']]
        });

        res.status(200).json({ success: true, data: adminsWithProfiles });
    } catch (error) {
        console.error("[ADMIN PROFILE] Error fetching list of admin profiles:", error);
        res.status(500).json({ success: false, message: "Server error fetching admin profiles." });
    }
});

// GET /admin-profile/:userId - Fetch a specific admin's profile
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const adminProfile = await AdminProfile.findOne({
            where: { userId: userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'username', 'email', 'role']
            }]
        });

        if (!adminProfile) {
            return res.status(404).json({ success: false, message: "Admin profile not found." });
        }

        res.status(200).json({ success: true, data: adminProfile });
    } catch (error) {
        console.error(`[ADMIN PROFILE] Error fetching profile for user ${userId}:`, error);
        res.status(500).json({ success: false, message: "Server error fetching admin profile." });
    }
});

// GET /admin-profile/ - Get current logged-in admin's profile (convenience route)
router.get("/", validateToken, authorizeRoles("admin"), async (req, res) => {
    const userId = req.user.id;
    try {
        const adminProfile = await AdminProfile.findOne({
            where: { userId: userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'username', 'email', 'role']
            }]
        });

        if (!adminProfile) {
            return res.status(200).json({ success: true, message: "Admin profile not yet set up.", data: null, user: req.user });
        }
        res.status(200).json({ success: true, data: adminProfile });
    } catch (error) {
        console.error(`[ADMIN PROFILE] Error fetching own profile for admin ${userId}:`, error);
        res.status(500).json({ success: false, message: "Server error fetching admin profile." });
    }
});


module.exports = router;