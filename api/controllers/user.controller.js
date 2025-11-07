import User from '../models/user.model.js';
import { errorHandler } from "../utils/error.js";

export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedSale);
  } catch (error) {
    console.error("Error saving user:", error.message);
    res
      .status(500)
      .json({ message: "Failed to save user", error: error.message });
  }
};