const CustomSupport = require("../model/customSupportModel.js");
const { verifyCaptcha } = require("../helper/captchaStore");

const createSupportRequest = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      officeName,
      address,
      serviceName,
      message,
      captchaId,
      captchaAnswer,
    } = req.body;

    // Basic validation
    if (!name || !phone || !email || !message) {
      return res.status(400).json({
        error: "Name, phone, email and message are required",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        error: "Message must be at least 10 characters",
      });
    }
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
    const newRequest = await CustomSupport.create({
      name,
      phone,
      email,
      officeName,
      address,
      serviceName,
      message,
    });

    res.status(201).json({
      message: "Support request submitted successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("Create Support Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateSupportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["pending", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status value",
      });
    }

    const support = await CustomSupport.findById(id);

    if (!support) {
      return res.status(404).json({
        error: "Support request not found",
      });
    }

    support.status = status;

    if (remarks) {
      support.remarks = remarks;
    }

    await support.save();

    res.status(200).json({
      message: "Support status updated successfully",
      data: support,
    });
  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllSupportRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const supports = await CustomSupport.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await CustomSupport.countDocuments(filter);

    res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: supports,
    });
  } catch (error) {
    console.error("Get Support Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
module.exports = {
  getAllSupportRequests,
  createSupportRequest,
  updateSupportStatus,
};
