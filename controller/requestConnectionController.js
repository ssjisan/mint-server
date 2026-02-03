const ConnectionRequest = require("../model/requestConnectionModel.js");
const mongoose = require("mongoose");

// CREATE: Add a new connection request
const createConnectionRequest = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      packageId,
      packageType,
      companyName,
      remarks,
    } = req.body;

    // Basic validation
    if (!name || !phone || !email || !address || !packageId || !packageType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (packageType === "corporate" && !companyName) {
      return res
        .status(400)
        .json({ error: "Company name is required for corporate packages." });
    }

    // Check unique phone/email
    const existingPhone = await ConnectionRequest.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ error: "Phone number already exists." });
    }

    const existingEmail = await ConnectionRequest.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists." });
    }

    const newRequest = new ConnectionRequest({
      name,
      phone,
      email,
      address,
      packageId,
      packageType,
      companyName: companyName || "",
      remarks: remarks || "",
    });

    const savedRequest = await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Connection request created successfully.",
      data: savedRequest,
    });
  } catch (error) {
    console.error("Error creating connection request:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// READ: Get all connection requests with optional filters
const getAllConnectionRequests = async (req, res) => {
  try {
    const { status, package: pkg, startDate, endDate } = req.query;

    const query = {};

    /* ---------- Status filter ---------- */
    if (status) {
      query.status = status;
    }

    /* ---------- Package filter ---------- */
    if (pkg && mongoose.Types.ObjectId.isValid(pkg)) {
      query.packageId = new mongoose.Types.ObjectId(pkg);
    }

    /* ---------- Date filter ---------- */
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    query.createdAt = {
      $gte: start,
      $lte: end,
    };

    /* ---------- Fetch ---------- */
    const requests = await ConnectionRequest.find(query)
      .populate("packageId", "packageName price speedMbps type")
      .sort({ createdAt: -1 });

    /* ---------- Return array (frontend friendly) ---------- */
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// UPDATE: Update connection request status + remarks
const updateConnectionRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedStatus = [
      "pending",
      "connected",
      "cancelled",
      "currently not possible",
    ];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updatedRequest = await ConnectionRequest.findByIdAndUpdate(
      id,
      { status, remarks: remarks || "" },
      { new: true },
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Connection request not found." });
    }

    res.status(200).json({
      success: true,
      message: "Connection request updated successfully.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating connection request status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating status.",
    });
  }
};

module.exports = {
  createConnectionRequest,
  getAllConnectionRequests,
  updateConnectionRequestStatus,
};
