const jwt = require("jsonwebtoken");
const { comparePassword, hashPassword } = require("../helper/passwordHash.js");
const UserModel = require("../model/userModel.js");
const dotenv = require("dotenv");

dotenv.config();

// ---------------------------
// User Registration Controller
// ---------------------------

const registerUserByAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (role === undefined) {
      return res.status(400).json({ error: "Role is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await UserModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email is already taken" });
    }
    const hashedPassword = await hashPassword("12345678");

    const newUser = new UserModel({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      mustChangePassword: true,
    });

    await newUser.save(); // pre("save") will hash automatically

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// ---------------------------
// User Login Controller
// ---------------------------

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email: normalizedEmail });
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.JWT_SECURE,
      {
        expiresIn: "12h",
      },
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 🔒 Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // 🔒 Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMs = user.lockUntil - Date.now();

      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

      return res.status(423).json({
        success: false,
        message: "Account temporarily locked",
        remainingTime: {
          minutes: remainingMinutes,
          seconds: remainingSeconds,
        },
      });
    }

    // 🔑 Compare password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      // Increase login attempts
      user.loginAttempts += 1;

      // Lock after 5 failed attempts (example)
      if (user.loginAttempts >= 3) {
        user.lockUntil = Date.now() + 5 * 60 * 1000; // 15 minutes lock
        user.loginAttempts = 0;
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = null;

    // 🔁 Force password change check
    if (user.mustChangePassword) {
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Password change required",
        forcePasswordChange: true,
        token,
      });
    }

    // 🕒 Check password expiry (7 days rule)
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - user.passwordChangedAt > sevenDays) {
      return res.status(403).json({
        success: false,
        message: "Password expired. Please change it.",
        forcePasswordChange: true,
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // ❌ New password cannot be same as current
    const sameAsCurrent = await comparePassword(newPassword, user.password);
    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be same as current password",
      });
    }

    // ❌ Cannot use name or email
    const lowerNewPass = newPassword.toLowerCase();

    if (
      lowerNewPass.includes(user.name.toLowerCase()) ||
      lowerNewPass.includes(user.email.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Password cannot contain your name or email",
      });
    }

    // 🔒 Prevent reuse of last 3 passwords
    for (let oldHash of user.passwordHistory) {
      const reused = await comparePassword(newPassword, oldHash);
      if (reused) {
        return res.status(400).json({
          success: false,
          message: "You cannot reuse last 3 passwords",
        });
      }
    }

    // Save current password to history
    if (user.passwordHistory.length >= 3) {
      user.passwordHistory.shift();
    }

    user.passwordHistory.push(user.password);

    // Hash new password
    const hashed = await hashPassword(newPassword);

    user.password = hashed;
    user.mustChangePassword = false;
    user.passwordChangedAt = Date.now();
    user.loginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const userList = async (req, res) => {
  try {
    const user = await UserModel.find({});
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const removeUser = async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.userId);
    res.json(user);
  } catch (err) {
    return res.status(400).json({ error: "Access Denied!" });
  }
};

const privateRoute = async (req, res) => {
  res.json({ currentUser: req.user });
};

const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const hashedPassword = await hashPassword("123456");

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password has been reset to '123456'" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  registerUserByAdmin,
  loginUser,
  userList,
  removeUser,
  privateRoute,
  changePassword,
  resetPassword,
};
