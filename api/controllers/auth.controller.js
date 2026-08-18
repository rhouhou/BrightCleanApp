import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const setAuthCookie = (res, user) => {
  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const validUser = await User.findOne({
      email,
    });

    if (!validUser) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    if (validUser.isActive === false) {
      return res.status(403).json({
        message: "This account is disabled",
      });
    }

    const passwordValid =
      bcryptjs.compareSync(
        password,
        validUser.password
      );

    if (!passwordValid) {
      return res.status(400).json({
        message: "Wrong credentials",
      });
    }

    // Automatically make your existing account Admin.
    if (
      process.env.ADMIN_EMAIL &&
      validUser.email.toLowerCase() ===
        process.env.ADMIN_EMAIL.toLowerCase()
    ) {
      if (validUser.role !== "admin") {
        validUser.role = "admin";
        await validUser.save();
      }
    }

    setAuthCookie(res, validUser);

    const {
      password: ignoredPassword,
      ...safeUser
    } = validUser._doc;

    return res.status(200).json(safeUser);
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Failed to log in",
      error: error.message,
    });
  }
};

export const me = async (req, res) => {
  return res.status(200).json(req.user);
};

export const logout = async (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
};