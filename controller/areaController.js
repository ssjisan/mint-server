const Area = require("../model/areaModel.js");
const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // Load env vars
const fs = require("fs");
const path = require("path");

const storagePath = process.env.STORAGE_PATH || "./uploads";
const baseUrl = process.env.BASE_URL || "http://localhost:8000";
const FOLDER = "coverage-area";

// ----------------------------------------------------------- //
// ---------------------Create or update area----------------- //
// ----------------------------------------------------------- //

const createOrUpdateArea = async (req, res) => {
  try {
    const { areaName, zone, address, polygons, id } = req.body;
    const file = req.file;

    if (!areaName || !zone || !address || !polygons) {
      return res.status(400).json({
        error: "Area name, zone, address, and map polygons are required",
      });
    }

    const parsedPolygons = JSON.parse(polygons);

    // Build file URL if uploaded
    let imageUrl = null;
    if (file) {
      imageUrl = `${baseUrl}/file-storage/${FOLDER}/${file.filename}`;
    }

    if (id) {
      const existing = await Area.findById(id);
      if (!existing) return res.status(404).json({ error: "Area not found" });

      // Delete old image if new uploaded
      if (file && existing.coverPhoto?.url) {
        const oldFile = existing.coverPhoto.url.split(`/${FOLDER}/`)[1];
        const oldPath = path.join(storagePath, FOLDER, oldFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      existing.areaName = areaName;
      existing.zone = zone;
      existing.address = address;
      existing.polygons = parsedPolygons;
      if (imageUrl) existing.coverPhoto = { url: imageUrl };

      const updated = await existing.save();
      return res.status(200).json({
        message: "Area updated successfully",
        area: updated,
      });
    }

    // Create new area
    const newArea = await Area.create({
      areaName,
      zone,
      address,
      polygons: parsedPolygons,
      ...(imageUrl && { coverPhoto: { url: imageUrl } }),
    });

    return res.status(201).json({
      message: "Area created successfully",
      area: newArea,
    });
  } catch (err) {
    console.error("Area save error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ----------------------------------------------------------- //
// ------------------------List of all area------------------- //
// ----------------------------------------------------------- //

const listAreas = async (req, res) => {
  try {
    const { zoneId } = req.query;
    let query = {};
    if (zoneId) query.zone = zoneId;

    const areas = await Area.find(query).sort({ createdAt: 1 });
    res.json(areas);
  } catch (err) {
    console.error("Area list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ----------------------------------------------------------- //
// ------------------------Read area by Id-------------------- //
// ----------------------------------------------------------- //

const readArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const area = await Area.findById(areaId);
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json(area);
  } catch (err) {
    console.error("Area read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete area
const deleteArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    const area = await Area.findById(areaId);
    if (!area) return res.status(404).json({ error: "Area not found" });

    // Delete image file from local storage
    if (area.coverPhoto?.url) {
      const fileName = area.coverPhoto.url.split(`/${FOLDER}/`)[1];
      const filePath = path.join(storagePath, FOLDER, fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete area from database
    await Area.findByIdAndDelete(areaId);

    res.json({ message: "Area deleted successfully" });
  } catch (err) {
    console.error("Area delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createOrUpdateArea,
  listAreas,
  readArea,
  deleteArea,
};
