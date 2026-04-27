const ReferralUser = require("../model/referralUserModel.js");

const generateReferralId = () => {
  const prefix = "MINT";

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let randomPart = "";

  for (let i = 0; i < 12; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return prefix + randomPart;
};

const normalizeAndValidateBDPhone = (phone) => {
  if (!phone) return null;

  phone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");

  if (phone.startsWith("+880")) {
    // ok
  } else if (phone.startsWith("880")) {
    phone = "+" + phone;
  } else if (phone.startsWith("0") && phone.length === 11) {
    phone = "+88" + phone;
  } else if (phone.startsWith("1") && phone.length === 10) {
    phone = "+880" + phone;
  } else {
    return null;
  }

  const bdRegex = /^\+8801[3-9]\d{8}$/;

  if (!bdRegex.test(phone)) {
    return null;
  }

  return phone;
};
exports.createOrGetReferralUser = async (req, res) => {
  try {
    let { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // normalize phone
    phone = normalizeAndValidateBDPhone(phone);
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }
    // 🔍 check if already exists
    let existingUser = await ReferralUser.findOne({ phone });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "Existing referral user",
        data: {
          referralId: existingUser.referralId,
          name: existingUser.name,
          phone: existingUser.phone,
        },
      });
    }

    // 🔐 generate unique referralId
    let referralId;
    let isUnique = false;

    while (!isUnique) {
      referralId = generateReferralId();

      const exists = await ReferralUser.findOne({ referralId });
      if (!exists) isUnique = true;
    }

    // ✅ create new user
    const newUser = await ReferralUser.create({
      name,
      phone,
      referralId,
    });

    return res.status(201).json({
      success: true,
      message: "Referral user created",
      data: {
        referralId: newUser.referralId,
        name: newUser.name,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error("Referral Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getAllReferralUsers = async (req, res) => {
  try {
    const users = await ReferralUser.find().sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching referral users:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
