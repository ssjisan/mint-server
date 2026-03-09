const ConnectionRequest = require("../model/requestConnectionModel.js");
const mongoose = require("mongoose");
const { verifyCaptcha } = require("../helper/captchaStore");

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
      referral,
      captchaId,
      captchaAnswer,
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

    // 2️⃣ Captcha Validation
    if (!captchaId || !captchaAnswer) {
      return res.status(400).json({
        success: false,
        message: "Captcha is required.",
      });
    }

    const isCaptchaValid = verifyCaptcha(captchaId, captchaAnswer);

    if (!isCaptchaValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired captcha.",
      });
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
      referral: referral ?? false,
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

const getConnectionRequestStats = async (req, res) => {
  try {
    const stats = await ConnectionRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    let result = {
      total: 0,
      pending: 0,
      connected: 0,
      cancelled: 0,
      notPossible: 0,
      percentage: {
        pending: 0,
        connected: 0,
        cancelled: 0,
        notPossible: 0,
      },
    };

    // Convert aggregation result
    stats.forEach((item) => {
      const status = item._id;
      const count = item.count;

      result.total += count;

      if (status === "pending") result.pending = count;
      if (status === "connected") result.connected = count;
      if (status === "cancelled") result.cancelled = count;
      if (status === "currently not possible") result.notPossible = count;
    });

    // Calculate percentages
    if (result.total > 0) {
      result.percentage.pending = (
        (result.pending / result.total) *
        100
      ).toFixed(2);
      result.percentage.connected = (
        (result.connected / result.total) *
        100
      ).toFixed(2);
      result.percentage.cancelled = (
        (result.cancelled / result.total) *
        100
      ).toFixed(2);
      result.percentage.notPossible = (
        (result.notPossible / result.total) *
        100
      ).toFixed(2);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting connection request stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getRecentPendingRequests = async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({ status: "pending" })
      .populate("packageId", "packageName price speedMbps type")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching recent pending requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createConnectionRequest,
  getAllConnectionRequests,
  updateConnectionRequestStatus,
  getConnectionRequestStats,
  getRecentPendingRequests,
};
