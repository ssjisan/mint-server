const Zone = require("../model/zoneModel.js");

// Create Zone
exports.createZone = async (req, res) => {
  try {
    const { name, officeLocation } = req.body;
    if (!name || !officeLocation) {
      return res
        .status(400)
        .json({ error: "Name and office location are required." });
    }

    const zone = new Zone({ name, officeLocation });
    await zone.save();
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ error: "Server error while creating zone." });
  }
};

// Get All Zones
exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: 1 });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching zones." });
  }
};

// Update Zone
exports.updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, officeLocation } = req.body;

    if (!name || !officeLocation) {
      return res
        .status(400)
        .json({ error: "Name and office location are required." });
    }

    const updatedZone = await Zone.findByIdAndUpdate(
      id,
      { name, officeLocation },
      { new: true }
    );

    if (!updatedZone) {
      return res.status(404).json({ error: "Zone not found." });
    }

    res.json(updatedZone);
  } catch (error) {
    res.status(500).json({ error: "Server error while updating zone." });
  }
};

// Delete Zone
exports.deleteZone = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedZone = await Zone.findByIdAndDelete(id);

    if (!deletedZone) {
      return res.status(404).json({ error: "Zone not found." });
    }

    res.json({ message: "Zone deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Server error while deleting zone." });
  }
};
