const express = require("express");
const router = express.Router();
const { User, Event, EventParticipant } = require("../models");
const { Op } = require("sequelize");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");
const upload = require("../middlewares/Upload");

// POST /event/create - Create a new event
router.post("/create", validateToken, authorizeRoles("admin"), upload.single("image"), async (req, res) => {
    console.log("[EVENT CREATE] Received request to create event.");
    try {
        const { title, description, location, date, time } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        if (!req.user || !req.user.id) {
            console.error("[EVENT CREATE] Error: User not authenticated or user ID missing.");
            return res.status(401).json({ success: false, message: "User not authenticated or user ID missing." });
        }

        if (!title || !description || !location || !date || !time) {
            console.warn("[EVENT CREATE] Warning: Missing required fields in request body:", req.body);
            return res.status(400).json({ success: false, message: "Missing required event information. All fields (title, description, location, date, time) are necessary." });
        }

        const newEvent = await Event.create({
            title,
            description,
            location,
            date,
            time,
            imageUrl,
            createdBy: req.user.id
        });

        console.log("[EVENT CREATE] Event created successfully:", newEvent.id);
        res.status(201).json({ success: true, event: newEvent });

    } catch (error) {
        console.error("[EVENT CREATE] Error while creating event:", error.name, error.message);
        if (error.errors) {
             error.errors.forEach(e => console.error(`  - Validation: ${e.path} - ${e.message}`));
        }
        return res.status(500).json({ success: false, message: "Error creating event. Please check server logs." });
    }
});

// GET /event/ - Fetch all events, separating upcoming and past
router.get("/", async (req, res) => {
    console.log("[EVENT GET_ALL] Received request to fetch events.");
    try {
        const now = new Date();
        const upcomingEvents = await Event.findAll({
            where: {
                date: { [Op.gte]: now },
                completed: false
            },
            order: [["date", "ASC"], ["time", "ASC"]],
            include: [{ model: User, as: "creator", attributes: ["id", "name", "username"] }]
        });

        const completedEvents = await Event.findAll({
            where: {
                completed: true
            },
            order: [["date", "DESC"], ["time", "DESC"]],
            include: [{ model: User, as: "creator", attributes: ["id", "name", "username"] }]
        });
        
        // Optionally, you could fetch past but not yet marked completed events
        const pastUncompletedEvents = await Event.findAll({
            where: {
                date: { [Op.lt]: now },
                completed: false
            },
            order: [["date", "DESC"]],
            include: [{ model: User, as: "creator", attributes: ["id", "name", "username"] }]
        });


        console.log(`[EVENT GET_ALL] Found ${upcomingEvents.length} upcoming, ${completedEvents.length} completed, ${pastUncompletedEvents.length} past-uncompleted.`);
        res.status(200).json({
            success: true,
            data: {
                upcoming: upcomingEvents,
                completed: completedEvents,
                pastUncompleted: pastUncompletedEvents
            }
        });

    } catch (error) {
        console.error("[EVENT GET_ALL] Error fetching events:", error.name, error.message);
        res.status(500).json({ success: false, message: "Server error while fetching events." });
    }
});

// GET /event/:id - Fetch a single event by ID
router.get("/:id", async (req, res) => {
    const eventId = req.params.id;
    console.log(`[EVENT GET_ONE] Received request to fetch event ${eventId}.`);
    try {
        const event = await Event.findByPk(eventId, {
            include: [{
                model: User,
                as: "creator",
                attributes: ["id", "name", "username"]
            },
            { // Optional: Include participants if you want to show them on a detail page
                model: User,
                as: "participants",
                attributes: ["id", "username", "name"],
                through: { attributes: [] }
            }]
        });

        if (!event) {
            console.warn(`[EVENT GET_ONE] Event not found: ${eventId}`);
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        console.log(`[EVENT GET_ONE] Found event: ${event.id}`);
        res.status(200).json({ success: true, data: event });

    } catch (error) {
        console.error(`[EVENT GET_ONE] Error fetching event ${eventId}:`, error.name, error.message);
        res.status(500).json({ success: false, message: "Server error while fetching event details." });
    }
});

// PUT /event/:id - Update an event
router.put("/:id", validateToken, authorizeRoles("admin"), upload.single("image"), async (req, res) => {
    const eventId = req.params.id;
    console.log(`[EVENT UPDATE] Admin ${req.user.id} attempting to update event ${eventId}`);
    try {
        const event = await Event.findByPk(eventId);
        if (!event) {
            console.warn(`[EVENT UPDATE] Event not found: ${eventId}`);
            return res.status(404).json({ success: false, message: "Event not found." });
        }

        const { title, description, location, date, time, completed } = req.body;
        
        let imageUrlToUpdate = event.imageUrl;
        if (req.file) {
            imageUrlToUpdate = `/uploads/${req.file.filename}`;
        } else if (req.body.imageUrl === '' || req.body.removeImage === 'true') {
            imageUrlToUpdate = null;
        }

        let completedStatus = event.completed;
        if (completed !== undefined && completed !== null) {
            completedStatus = String(completed).toLowerCase() === 'true';
        }


        await event.update({
            title: title || event.title,
            description: description || event.description,
            location: location || event.location,
            date: date || event.date,
            time: time || event.time,
            imageUrl: imageUrlToUpdate,
            completed: completedStatus,
        });

        console.log(`[EVENT UPDATE] Event ${eventId} updated successfully by admin ${req.user.id}.`);
        res.status(200).json({ success: true, message: "Event updated successfully.", data: event });

    } catch (error) {
        console.error(`[EVENT UPDATE] Error updating event ${eventId} by admin ${req.user?.id}:`, error.name, error.message);
        if (error.errors) {
            error.errors.forEach(e => console.error(`  - Validation: ${e.path} - ${e.message}`));
        }
        res.status(500).json({ success: false, message: "Internal server error while updating event." });
    }
});

// DELETE /event/:id - Delete an event
router.delete("/:id", validateToken, authorizeRoles("admin"), async (req, res) => {
    const eventId = req.params.id;
    console.log(`[EVENT DELETE] Admin ${req.user.id} attempting to delete event ${eventId}`);
    try {
        const event = await Event.findByPk(eventId);
        if (!event) {
            console.warn(`[EVENT DELETE] Event not found: ${eventId}`);
            return res.status(404).json({ success: false, message: "Event not found." });
        }

        await event.destroy();
        
        console.log(`[EVENT DELETE] Event ${eventId} deleted successfully by admin ${req.user.id}.`);
        res.status(200).json({ success: true, message: "Event deleted successfully." });

    } catch (error) {
        console.error(`[EVENT DELETE] Error deleting event ${eventId} by admin ${req.user?.id}:`, error.name, error.message);
        res.status(500).json({ success: false, message: "Internal server error while deleting event." });
    }
});

// POST /event/:id/join - Join an event
router.post("/:id/join", validateToken, async (req, res) => {
    const eventId = req.params.id;
    const authenticatedUserId = req.user?.id;

    console.log(`[EVENT JOIN] User ${authenticatedUserId} attempt to join event ${eventId}.`);

    if (!authenticatedUserId) {
        return res.status(401).json({ error: "User not authenticated." });
    }
    if (!eventId || isNaN(parseInt(eventId))) {
        return res.status(400).json({error: "Invalid event ID."});
    }
    try {
        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({ error: "Event not found." });
        }

        const alreadyJoined = await EventParticipant.findOne({
            where: { eventId: eventId, userId: authenticatedUserId },
        });

        if (alreadyJoined) {
            return res.status(400).json({ error: "Already joined this event." });
        }

        await EventParticipant.create({ eventId: eventId, userId: authenticatedUserId });
        console.log(`[EVENT JOIN] User ${authenticatedUserId} record created for event ${eventId}.`);

        event.participantCount = (parseInt(event.participantCount, 10) || 0) + 1;
        await event.save();
        console.log(`[EVENT JOIN] Event ${eventId} participantCount updated to ${event.participantCount}.`);

        res.status(200).json({ success: true, message: "Successfully joined the event." });

    } catch (error) {
        console.error(`[EVENT JOIN] Error for user ${authenticatedUserId} joining event ${eventId}:`, error.name, error.message);
        res.status(500).json({ error: "Internal server error while joining event." });
    }
});

// POST /event/:id/complete - Mark an event as complete
router.post("/:id/complete", validateToken, authorizeRoles("admin"), upload.single("image"), async (req, res) => {
    const eventId = req.params.id;
    console.log(`[EVENT COMPLETE] Admin ${req.user.id} attempting to complete event ${eventId}`);
    try {
        const event = await Event.findByPk(eventId);
        if (!event) {
            console.warn(`[EVENT COMPLETE] Event not found: ${eventId}`);
            return res.status(404).json({ error: "Event not found." });
        }

        const newImageUrl = req.file ? `/uploads/${req.file.filename}` : event.imageUrl;

        await event.update({ completed: true, imageUrl: newImageUrl });

        console.log(`[EVENT COMPLETE] Event ${eventId} marked as completed by admin ${req.user.id}.`);
        return res.status(200).json({ success: true, message: "Event marked as completed." });

    } catch (error) {
        console.error(`[EVENT COMPLETE] Error completing event ${eventId} by admin ${req.user?.id}:`, error.name, error.message);
        return res.status(500).json({ error: "Internal server error while completing event." });
    }
});

module.exports = router;