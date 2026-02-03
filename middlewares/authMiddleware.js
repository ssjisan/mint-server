import jwt from "jsonwebtoken";
import UserModel from "../model/userModel.js";

export const requiredSignIn = (req, res, next) => {
  try {
    const decoded = jwt.verify(
      req.headers.authorization,
      process.env.JWT_SECURE
    );
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json("Unauthorized: " + err.message);
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (user.role !== 1) {
      return res.status(401).send("Unauthorized");
    } else {
      next();
    }
  } catch (err) {
    res.status(401).json(err.message)
  }
};
