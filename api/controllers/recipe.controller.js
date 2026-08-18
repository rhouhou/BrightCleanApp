import Recipe from "../models/recipe.model.js";
import {
  calculateRecipeCostAtDate,
} from "../utils/recipeCost.js";
import { errorHandler } from "../utils/error.js";

export const createRecipe = async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    const savedRecipe = await recipe.save();
    res.status(201).json(savedRecipe);
  } catch (error) {
    console.error("Error saving recipe:", error.message);
    res
      .status(500)
      .json({ message: "Failed to save recipe", error: error.message });
  }
};

export const deleteRecipe = async (req, res, next) => {
  const existingRecipe = await Recipe.findById(req.params.id);

  if (!existingRecipe) return next(errorHandler(404, "Recipe not found"));

  try {
    await Recipe.findByIdAndDelete(req.params.id);
    return res.status(200).json("Recipe has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) return next(errorHandler(404, "Recipe not found"));

  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(updatedRecipe);
  } catch (error) {
    next(error);
  }
};

export const getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecipeCostAtDate = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const result =
      await calculateRecipeCostAtDate({
        recipeId: id,
        date,
      });

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error calculating recipe cost:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to calculate recipe cost",
      error: error.message,
    });
  }
};