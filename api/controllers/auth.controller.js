import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcryptjs.hashSync(password, 10);
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    }
    catch (error) {
        console.error("Error creating user:", error.message);
        res.status(500).json({ message: "Failed to create user", error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const validUser = await User.findOne({ email });
        if (!validUser) {
            return res.status(400).json({ message: "Invalid email!" });
        }
        const isPasswordValid = await bcryptjs.compareSync(password, validUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Wrong credentials!" });
        }
        const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
        const { password: pass, ...rest } = validUser._doc;
        res.cookie("access_token", token, {
            httpOnly: true,
        }).status(200).json(rest);
    } catch (error) {
        console.error("Error logging in user:", error.message);
        res.status(500).json({ message: "Failed to log in user", error: error.message });
    }
};

export const google =async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET);
            const { password: pass, ...rest } = existingUser._doc;
            res.cookie("access_token", token, {
                httpOnly: true,
            }).status(200).json(rest);
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = await bcryptjs.hashSync(generatedPassword, 10);
            const newUser = new User({ username: req.body.name.split(" ").join("").toLowerCase() + Math.random().toString(36).slice(-4), 
                email: req.body.email, password: hashedPassword, avatar: req.body.photo });
            await newUser.save();
            const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
            const { password: pass, ...rest } = newUser._doc;
            res.cookie("access_token", token, {
                httpOnly: true,
            }).status(200).json(rest);
        }
    }
    catch (error) {
        console.error("Error creating user:", error.message);
        res.status(500).json({ message: "Failed to create user", error: error.message });
    }
}
