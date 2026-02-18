const Brand = require("../model/brandModel.js");
require("dotenv").config(); // Load env vars
const path = require("path");
const fs = require("fs");

// Add brand data with image upload

const brandDataHandler = async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!req.file && !id)
      return res.status(400).json({ error: "Image is required" });

    const storagePath = process.env.STORAGE_PATH || "./uploads";
    const baseUrl = process.env.BASE_URL || "http://localhost:8000";
    const FOLDER = "brands";

    // Build public URL
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${baseUrl}/mint-media-storage/${FOLDER}/${req.file.filename}`;
    }

    if (id) {
      // UPDATE
      const brand = await Brand.findById(id);
      if (!brand) return res.status(404).json({ error: "brand not found" });

      // delete old image if new uploaded
      if (req.file && brand.image?.url) {
        const oldFile = brand.image.url.split("/mint-media-storage/")[1];
        const oldPath = path.join(storagePath, oldFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      brand.name = name;
      if (imageUrl) brand.image.url = imageUrl;

      await brand.save();
      return res.status(200).json({ message: "brand updated", brand });
    }

    // CREATE
    const brand = await Brand.create({ name, image: { url: imageUrl } });
    return res.status(201).json({ message: "brand added", brand });
  } catch (error) {
    console.error("brand save failed:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all clients
const getAllBrands = async (req, res) => {
  try {
    const brand = await Brand.find().sort({ createdAt: 1 });
    res.status(200).json(brand);
  } catch (error) {
    console.error("Fetch all brand failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single client by ID
const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({ error: "brand not found" });
    }

    res.status(200).json(brand);
  } catch (error) {
    console.error("Fetch brand by ID failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete client by ID (and remove image from Cloudinary)
const deleteBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ error: "brand not found" });
    }

    // Delete image file from VPS/local storage
    if (brand.image?.url) {
      const storagePath = process.env.STORAGE_PATH || "./uploads";
      const filename = brand.image.url.split("/mint-media-storage/")[1];
      const filePath = path.join(storagePath, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // deletes the file
      }
    }

    // Delete client record from MongoDB
    await Brand.findByIdAndDelete(id);

    res.status(200).json({ message: "brand deleted successfully" });
  } catch (error) {
    console.error("Delete brand failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  brandDataHandler,
  getAllBrands,
  getBrandById,
  deleteBrandById,
};
