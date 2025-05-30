// routes/StudentProfile.js
const express = require("express");
const router = express.Router();
const { User, StudentProfile, Event, Feedback } = require("../models");
const { Op } = require("sequelize");
const { validateToken } = require("../middlewares/Authmiddleware");
const upload = require("../middlewares/Upload");

// POST /student-profile/setup - Create or Update Student Profile for the logged-in student
router.post(
    "/setup",
    validateToken,
    upload.single("profileImage"),
    async (req, res) => {
        const userId = req.user.id;

        // Optional: Ensure the user is actually a student
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: "Access denied. Only students can set up this profile." });
        }

        try {
            const {
                contactNumber, department, semester, yearOfJoining, bio
            } = req.body;

            let profileImageUrl = req.body.existingImageUrl || undefined;
            if (req.file) {
                profileImageUrl = `/uploads/${req.file.filename}`;
            } else if (req.body.removeProfileImage === 'true') {
                profileImageUrl = null;
            }

            const profileData = {
                userId,
                contactNumber: contactNumber || null,
                department: department || null,
                semester: semester || null,
                yearOfJoining: yearOfJoining ? parseInt(yearOfJoining) : null,
                bio: bio || null,
            };
            if (profileImageUrl !== undefined) {
                profileData.profileImageUrl = profileImageUrl;
            }
            Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);


            let studentProfile = await StudentProfile.findByPk(userId);
            let created = false;

            if (studentProfile) {
                await studentProfile.update(profileData);
            } else {
                studentProfile = await StudentProfile.create(profileData);
                created = true;
            }

            res.status(created ? 201 : 200).json({
                success: true,
                message: `Student profile ${created ? 'created' : 'updated'} successfully.`,
                data: studentProfile
            });

        } catch (error) {
            console.error(`[STUDENT PROFILE] Error ${studentProfile ? 'updating' : 'creating'} profile for student ${userId}:`, error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors.map(e => e.message) });
            }
            res.status(500).json({ success: false, message: "Server error while setting up student profile." });
        }
    }
);

// GET /student-profile/ - Get current logged-in student's profile (and their events)
router.get("/", validateToken, async (req, res) => { 
    const userId = req.user.id;

    if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, message: "This profile is for students." });
    }

    try {
        const studentProfileData = await StudentProfile.findOne({
            where: { userId: userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'username', 'email', 'role']
            }]
        });

        const userWithDetails = await User.findByPk(userId, {
            attributes: ['id', 'name', 'username', 'email', 'role'],
            include: [
                {
                    model: StudentProfile,
                    as: 'studentProfile',
                    required: false 
                },
                {
                    model: Event,
                    as: 'joinedEvents',
                    attributes: ['id', 'title', 'date', 'time', 'imageUrl', 'completed', 'location'],
                    through: { attributes: [] },
                    required: false
                },
                {
                    model: Feedback,
                    as: 'submittedFeedback',
                    attributes: ['id', 'feedbackText', 'rating', 'category', 'status', 'adminNotes', 'createdAt', 'updatedAt'],
                    include: [{
                        model: User,
                        as: 'resolver',
                        attributes: ['id', 'name'],
                        required: false
                    }],
                    order: [['createdAt', 'DESC']],
                    required: false 
                }
            ]
        });

        if (!userWithDetails) {
            return res.status(404).json({ success: false, message: "Student user not found." });
        }

        // Fetch student's joined events
        const now = new Date();
        const userWithEvents = await User.findByPk(userId, {
            include: [
                {
                    model: Event,
                    as: 'joinedEvents',
                    attributes: ['id', 'title', 'date', 'time', 'imageUrl', 'completed', 'location'],
                    through: { attributes: [] },
                    required: false 
                }
            ]
        });

        let upcomingJoinedEvents = [];
        let completedAttendedEvents = [];

        if (userWithEvents && userWithEvents.joinedEvents) {
            userWithEvents.joinedEvents.forEach(event => {
                if (!event || !event.date || !event.time) { 
                    console.warn(`[STUDENT PROFILE] Event ID ${event?.id} has missing date or time. Skipping categorization.`);
                    return; 
                }
                
                if (event.completed) {
                    completedAttendedEvents.push(event);
                } else {
                    let eventDatePart;
                    if (typeof event.date === 'string') {
                        eventDatePart = event.date.split('T')[0];
                    } else if (event.date instanceof Date) {
                        // If it's already a Date object, format it to YYYY-MM-DD
                        const year = event.date.getFullYear();
                        const month = (event.date.getMonth() + 1).toString().padStart(2, '0');
                        const day = event.date.getDate().toString().padStart(2, '0');
                        eventDatePart = `${year}-${month}-${day}`;
                    } else {
                        console.warn(`[STUDENT PROFILE] Event ID ${event.id} has an unexpected date format. Skipping categorization.`);
                        return;
                    }

                    try {
                        const eventDateTime = new Date(`${eventDatePart}T${event.time}`);
                        if (isNaN(eventDateTime.getTime())) {
                             console.warn(`[STUDENT PROFILE] Event ID ${event.id} resulted in an invalid combined DateTime: ${eventDatePart}T${event.time}. Skipping.`);
                             return;
                        }

                        if (eventDateTime >= now) {
                            upcomingJoinedEvents.push(event);
                        } else {
                            // Past but not marked completed could go into another category or completed
                            completedAttendedEvents.push(event);
                        }
                    } catch (e) {
                        console.error(`[STUDENT PROFILE] Error processing date/time for event ID ${event.id}:`, e);
                    }
                }
            });
             // Sort events
            upcomingJoinedEvents.sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time));
            completedAttendedEvents.sort((a, b) => new Date(b.date) - new Date(a.date) || b.time.localeCompare(a.time));
        }


        if (!studentProfileData && !userWithEvents) {
             return res.status(404).json({ success: false, message: "User not found." });
        }
        
        // User exists, profile might not
        const responseData = {
            profile: studentProfileData,
            user: studentProfileData ? studentProfileData.user : (userWithEvents || req.user), 
            events: {
                upcoming: upcomingJoinedEvents,
                completed: completedAttendedEvents
            },
            feedback: userWithDetails.submittedFeedback || []
        };


        res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error(`[STUDENT PROFILE] Error fetching own profile for student ${userId}:`, error);
        res.status(500).json({ success: false, message: "Server error fetching student profile." });
    }
});

module.exports = router;