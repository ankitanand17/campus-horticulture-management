// routes/Plant.js
const express = require("express");
const router = express.Router();
const { Plant } = require("../models");
const { validateToken, authorizeRoles } = require("../middlewares/Authmiddleware");
const upload = require("../middlewares/Upload");

router.post(
    "/addPlant", 
    validateToken,
    authorizeRoles("gardener", "admin"),
    upload.single("image"), 
    async(req, res) => {
    const { name, scientificName, description, area, quantity } = req.body;
    
    const imageUrl = req.file ? `/uploads/${req.file.filename}`: null;

    if(!name || !scientificName || !area){
        return res.status(400).json({error: "Name, scientific name, and area are required."});
    }

    if(!req.user || !req.user.id){
        return res.status(401).json({error: "User not authenticated or user ID missing."});
    }

    try{
        const newPlant = await Plant.create({
            name,
            scientificName,
            description,
            imageUrl,
            area,
            quantity: quantity || 1,
            addedBy: req.user.id
        });
        return res.status(201).json({success: true, plant: newPlant});
    }catch(error){
        console.error("Error while creating Plants: ", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ error: "Validation error", messages });
        }
        return res.status(500).json({error: "Something went wrong while adding the plants"});
    }
});

router.get("/show", async(req, res) => {
    try{
        const plants = await Plant.findAll({
            attributes: ["id", "name", "scientificName", "imageUrl"],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({
            success: true,
            data: plants
        });
    }catch(error){
        console.error("Error while fetching plants for gallery: ", error);
        res.status(500).json({success:false, message: "Server error while fetching gallery data."});
    }
});

router.get("/:id", async(req, res) => {
    const { id } = req.params;
    try{
        const plant = await Plant.findByPk(id);

        if(!plant){
            return res.status(404).json({success: false, message: "Plant not found"});
        }

        res.status(200).json({success: true, data: plant});
    }catch(error){
        console.error("Error while fetching plant using id: ", error);
        res.status(500).json({success:false, message: "Server error while fetching plant."});
    }
});

router.delete("/:id", validateToken, authorizeRoles("gardener", "admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const plant = await Plant.findByPk(id);
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    await plant.destroy();
    return res.status(200).json({ success: true, message: "Plant deleted successfully" });
  } catch (error) {
    console.error("Error while deleting plant:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put(
  "/:id",
  validateToken,
  authorizeRoles("gardener", "admin"),
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const { name, scientificName, description, area, quantity } = req.body;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
      const plant = await Plant.findByPk(id);
      if (!plant) {
        return res.status(404).json({ success: false, message: "Plant not found" });
      }

      await plant.update({
        name,
        scientificName,
        description,
        area,
        quantity,
        imageUrl: imageUrl || plant.imageUrl,
      });

      return res.status(200).json({
        success: true,
        message: "Plant updated successfully",
        data: plant,
      });
    } catch (error) {
      console.error("Error while updating Plant: ", error);
      return res.status(500).json({success: false,message: "Internal server error!!"});
    }
  }
);

module.exports = router;