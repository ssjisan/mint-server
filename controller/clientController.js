const Client = require("../model/clientModel.js");
require("dotenv").config(); // Load env vars
const path = require("path");
const fs = require("fs");

// Add client data with image upload

const clientDataHandler = async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!req.file && !id)
      return res.status(400).json({ error: "Image is required" });

    const storagePath = process.env.STORAGE_PATH || "./uploads";
    const baseUrl = process.env.BASE_URL || "http://localhost:8000";
    const FOLDER = "clients";

    // Build public URL
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${baseUrl}/mint-media-storage/${FOLDER}/${req.file.filename}`;
    }

    if (id) {
      // UPDATE
      const client = await Client.findById(id);
      if (!client) return res.status(404).json({ error: "Client not found" });

      // delete old image if new uploaded
      if (req.file && client.image?.url) {
        const oldFile = client.image.url.split("/mint-media-storage/")[1];
        const oldPath = path.join(storagePath, oldFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      client.name = name;
      if (imageUrl) client.image.url = imageUrl;

      await client.save();
      return res.status(200).json({ message: "Client updated", client });
    }

    // CREATE
    const client = await Client.create({ name, image: { url: imageUrl } });
    return res.status(201).json({ message: "Client added", client });
  } catch (error) {
    console.error("Client save failed:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 }); // Optional: sorted by newest
    res.status(200).json(clients);
  } catch (error) {
    console.error("Fetch all clients failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single client by ID
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(200).json(client);
  } catch (error) {
    console.error("Fetch client by ID failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete client by ID (and remove image from Cloudinary)
const deleteClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Delete image file from VPS/local storage
    if (client.image?.url) {
      const storagePath = process.env.STORAGE_PATH || "./uploads";
      const filename = client.image.url.split("/mint-media-storage/")[1];
      const filePath = path.join(storagePath, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // deletes the file
      }
    }

    // Delete client record from MongoDB
    await Client.findByIdAndDelete(id);

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Delete client failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  clientDataHandler,
  getAllClients,
  getClientById,
  deleteClientById,
};
