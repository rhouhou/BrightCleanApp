import Material from "../models/material.model.js";
import { errorHandler } from "../utils/error.js";

export const createMaterial = async (req, res) => {
  try {
    const material = new Material(req.body);
    const savedMaterial = await material.save();
    res.status(201).json(savedMaterial);
  } catch (error) {
    console.error("Error saving material:", error.message);
    res
      .status(500)
      .json({ message: "Failed to save material", error: error.message });
  }
};

export const deleteMaterial = async (req, res, next) => {
  const existingMaterial = await Material.findById(req.params.id);

  if (!existingMaterial) return next(errorHandler(404, "Material not found"));

  try {
    await Material.findByIdAndDelete(req.params.id);
    return res.status(200).json("Material has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateMaterial = async (req, res, next) => {
  const material = await Material.findById(req.params.id);

  if (!material) return next(errorHandler(404, "Material not found"));

  try {
    const updatedMaterial = await Material.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(updatedMaterial);
  } catch (error) {
    next(error);
  }
};

export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find();
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
