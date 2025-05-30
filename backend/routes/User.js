// backend/routes/User.js
const express = require("express");
const router = express.Router();
const { User } = require("../models");
const { Op } = require("sequelize");   
const bcrypt =  require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables. Auth will not work.");
}

router.post("/register", async (req, res) => {
    const { role, name, username, email, password } = req.body;
    const creatingUserToken = req.header("accessToken");

    if (!role || !name || !username || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const targetRole = role.toLowerCase();
r
    if (targetRole === 'admin') {
        if (!creatingUserToken) {
            return res.status(401).json({ success: false, message: "Authentication required to create an admin user. Please log in as an admin." });
        }
        try {
            const validToken = jwt.verify(creatingUserToken, JWT_SECRET); 
            if (!validToken || validToken.role !== 'admin') {
                return res.status(403).json({ success: false, message: "Access Denied: Only administrators can create other admin users." });
            }
            console.log(`[REGISTER] Admin user (ID: ${validToken.id}) is attempting to create a new admin: ${username}`);
        } catch (err) {
            console.error("[REGISTER] Error verifying admin token for admin creation:", err.message);
            return res.status(403).json({ success: false, message: "Invalid or expired token for admin creation. Please re-login." });
        }
    }

    try {
        const existingUserEmail = await User.findOne({ where: { email } });
        if (existingUserEmail) {
            return res.status(409).json({ success: false, message: "Email already exists." });
        }

        const existingUserUsername = await User.findOne({ where: { username } });
        if (existingUserUsername) {
            return res.status(409).json({ success: false, message: "Username already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            role: targetRole,
            name,
            username,
            email,
            password: hashedPassword
        });

        const userResponse = {
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        };

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user: userResponse
        });

    } catch (error) {
        console.error("[REGISTER] SignUp error:", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ success: false, message: "Validation error", errors: messages });
        }
        res.status(500).json({ success: false, message: "Server error during registration." });
    }
});

router.post("/login", async (req, res) => {
    const { role, identifier, password } = req.body;

    if (!role || !identifier || !password) {
        return res.status(400).json({ success: false, message: "Role, identifier (email/username), and password are required." });
    }

    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        if (user.role !== role.toLowerCase()) {
            return res.status(403).json({ success: false, message: `Access denied. You are trying to log in as '${role}', but your account role is '${user.role}'. Please select the correct role.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        if (!JWT_SECRET) {
            console.error("[LOGIN] CRITICAL: JWT_SECRET is not available at login time.");
            return res.status(500).json({ success: false, message: "Server configuration error preventing login." });
        }

        const tokenPayload = {
            id: user.id,
            role: user.role,
            username: user.username,
            name: user.name
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" }); 

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error("[LOGIN] Login error:", error);
        res.status(500).json({ success: false, message: "Server error during login." });
    }
});

// GET /auth/assignable-staff - Get users eligible for task assignment (admins, gardeners)
router.get(
    "/assignable-staff",
    validateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        console.log("[USERS] Admin fetching assignable staff list.");
        try {
            const staff = await User.findAll({
                where: {
                    role: {
                        [Op.or]: ["gardener", "admin"] 
                    }
                },
                attributes: ['id', 'name', 'username', 'role'], 
                order: [['role', 'ASC'], ['name', 'ASC']]
            });
            res.status(200).json({ success: true, data: staff });
        } catch (error) {
            console.error("[USERS] Error fetching assignable staff:", error);
            res.status(500).json({ success: false, message: "Server error fetching assignable staff." });
        }
    }
);

module.exports = router;