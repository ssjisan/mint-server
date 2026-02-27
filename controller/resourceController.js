const Resource = require("../model/resourceModel.js");

// controllers/resourceController.js

exports.createResource = async (req, res) => {
  try {
    const { title, slug, path, icon, isGroup, parentId, order } = req.body;
    const pid = parentId || null;

    // 🛑 Check for duplicate order at the same level
    const existingOrder = await Resource.findOne({ parentId: pid, order });
    if (existingOrder) {
      return res.status(400).json({
        message: `Order ${order} is already taken at this level. Please use a different number.`,
      });
    }

    const newResource = new Resource({
      title,
      slug,
      path,
      icon,
      isGroup,
      parentId: pid,
      order: order || 0,
    });

    await newResource.save();
    res
      .status(201)
      .json({ message: "Resource created successfully", data: newResource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResources = async (req, res) => {
  try {
    // 🔗 Populate parentId to get the Parent's Title in the list
    const resources = await Resource.find()
      .populate("parentId", "title")
      .sort({ order: 1 });
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
