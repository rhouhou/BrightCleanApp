import Recipe from "../models/recipe.model.js";
import Material from "../models/material.model.js";
import {
  getMaterialCostPerGramAtDate,
} from "./purchaseCost.js";

export const calculateRecipeCostAtDate = async ({
  recipeId,
  date,
}) => {
  const recipe = await Recipe.findById(recipeId);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const ingredientResults = [];
  const missingPurchases = [];

  let costPerLitreUSD = 0;

  for (const ingredient of recipe.ingredients) {
    const material = await Material.findById(
      ingredient.materialId
    );

    if (!material) {
      missingPurchases.push({
        materialId: ingredient.materialId,
        materialname: ingredient.materialname,
        reason: "Material not found",
      });

      continue;
    }

    // Purchase records use the stable BrightClean material code,
    // e.g. SLES-1234, rather than MongoDB's internal _id.
    const costInfo =
      await getMaterialCostPerGramAtDate({
        materialId: material.IDmaterial,
        date,
      });

    if (!costInfo) {
      missingPurchases.push({
        materialId: material.IDmaterial,
        materialname: material.materialname,
        reason: `No purchase recorded on or before ${date}`,
      });

      continue;
    }

    const quantityGramsPerLitre =
      parseFloat(ingredient.quantity) || 0;

    const ingredientCostPerLitreUSD =
      quantityGramsPerLitre *
      costInfo.costPerGramUSD;

    costPerLitreUSD += ingredientCostPerLitreUSD;

    ingredientResults.push({
      materialId: material.IDmaterial,
      materialname: material.materialname,

      quantityGramsPerLitre,

      costPerGramUSD:
        costInfo.costPerGramUSD,

      ingredientCostPerLitreUSD,

      purchaseDate:
        costInfo.purchaseDate,

      purchaseUnit:
        costInfo.unit,

      purchaseUnitCostUSD:
        costInfo.unitCostUSD,
    });
  }

  const volumeLitres =
    parseFloat(recipe.volumeLitres) || 1;

  const totalRecipeCostUSD =
    costPerLitreUSD * volumeLitres;

  return {
    recipeId: recipe._id,
    recipeName: recipe.name,
    productId: recipe.productId,

    calculationDate: date,

    volumeLitres,

    costPerLitreUSD,
    totalRecipeCostUSD,

    ingredients: ingredientResults,

    missingPurchases,

    isComplete:
      missingPurchases.length === 0,
  };
};