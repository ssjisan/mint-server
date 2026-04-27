const ConnectionRequest = require("../model/requestConnectionModel.js");
const mongoose = require("mongoose");
const { verifyCaptcha } = require("../helper/captchaStore");
const ReferralUser = require("../model/referralUserModel.js");

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
      referralId,
      captchaId,
      captchaAnswer,
    } = req.body;

    let referralUser = null;

    if (referralId) {
      referralUser = await ReferralUser.findOne({ referralId });

      if (!referralUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral link",
        });
      }
    }

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
      referralId: referralUser?.referralId || null,
    });

    const savedRequest = await newRequest.save();
    if (referralUser) {
      await ReferralUser.findByIdAndUpdate(referralUser._id, {
        $inc: { totalRequests: 1 },
      });
    }
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
    const {
      status,
      package: pkg,
      startDate,
      endDate,
      referral,
      search,
    } = req.query;

    const match = {};

    /* ---------- Status ---------- */
    if (status) match.status = status;

    /* ---------- Referral ---------- */
    if (referral === "true") match.referral = true;
    if (referral === "false") match.referral = false;

    /* ---------- Package ---------- */
    if (pkg && mongoose.Types.ObjectId.isValid(pkg)) {
      match.packageId = new mongoose.Types.ObjectId(pkg);
    }

    /* ---------- Date ---------- */
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    match.createdAt = { $gte: start, $lte: end };

    /* ---------- Search ---------- */
    if (search) {
      const regex = new RegExp(search, "i");

      match.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { companyName: regex },
        { referralId: regex },
      ];
    }

    const requests = await ConnectionRequest.aggregate([
      { $match: match },

      /* join packages */
      {
        $lookup: {
          from: "packages",
          localField: "packageId",
          foreignField: "_id",
          as: "packageId",
        },
      },
      { $unwind: { path: "$packageId", preserveNullAndEmptyArrays: true } },

      /* 🔥 join referral user */
      {
        $lookup: {
          from: "referralusers",
          localField: "referralId",
          foreignField: "referralId",
          as: "referralUser",
        },
      },
      { $unwind: { path: "$referralUser", preserveNullAndEmptyArrays: true } },

      /* final shape */
      {
        $addFields: {
          referralName: "$referralUser.name",
          referralPhone: "$referralUser.phone",
        },
      },

      { $sort: { createdAt: -1 } },
    ]);

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

    // 🔍 get existing request FIRST
    const existingRequest = await ConnectionRequest.findById(id);

    if (!existingRequest) {
      return res.status(404).json({ error: "Connection request not found." });
    }

    const alreadyConnected = existingRequest.status === "connected";

    // ✅ update request
    existingRequest.status = status;
    existingRequest.remarks = remarks || "";
    await existingRequest.save();

    // 🔥 referral success increment
    if (
      status === "connected" &&
      !alreadyConnected &&
      existingRequest.referralId
    ) {
      await ReferralUser.findOneAndUpdate(
        { referralId: existingRequest.referralId },
        {
          $inc: { successfulConnections: 1 },
        },
      );
    }

    res.status(200).json({
      success: true,
      message: "Connection request updated successfully.",
      data: existingRequest,
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
