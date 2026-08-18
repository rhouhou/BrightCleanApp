import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";

export const verifyStaff = async (req, res, next) => {
  try {

    const token = req.cookies?.brightclean_staff_token;

    if (!token) {
      return next(
        errorHandler(401, "Authentication required")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return next(
        errorHandler(401, "User no longer exists")
      );
    }

    if (user.isActive === false) {
      return next(
        errorHandler(403, "This account is disabled")
      );
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      access: user.access || [],
    };

    next();
  } catch (error) {
    return next(
      errorHandler(401, "Invalid or expired session")
    );
  }
};

export const requireSection = (section) => {
  return (req, res, next) => {
    // Admin sees everything.
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.access?.includes(section)) {
      return next();
    }

    return next(
      errorHandler(
        403,
        `You do not have access to ${section}`
      )
    );
  };
};