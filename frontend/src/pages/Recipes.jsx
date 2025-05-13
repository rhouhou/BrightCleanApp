import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Table,
  Button,
  InputGroup,
  Pagination,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import { FaPlus, FaTrashAlt, FaSave, FaBookmark } from "react-icons/fa";
import { fetchItems } from "../utils/generalUtils.js";
import { PencilSquare, Trash } from "react-bootstrap-icons";

const Recipes = () => {
  // “new recipe” card state
  const initialRecipe = () => ({
    name: "",
    productId: "",
    volumeLitres: 1,
    ingredients: [
      {
        materialId: "",
        materialname: "",
        quantity: 0,
        totalPrice: 0,
      },
    ],
    totalCost: 0,
    isFinal: false,
  });

  const [newRecipe, setNewRecipe] = useState(initialRecipe());
  const [recipes, setRecipes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showValidationError, setShowValidationError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(initialRecipe());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productData, materialData, recipesData] = await Promise.all([
          fetchItems("/api/products"),
          fetchItems("/api/materials"),
          fetchItems("/api/recipes"),
        ]);

        setProducts(productData);
        setMaterials(materialData);
        setRecipes(recipesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  const updateIngredient = (idx, field, value) => {
    setNewRecipe((prev) => {
      const updated = { ...prev };
      updated.ingredients = [...prev.ingredients];
      updated.ingredients[idx] = {
        ...updated.ingredients[idx],
        [field]: value,
      };
      return updated;
    });
  };

  const addIngredientRow = () => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { materialId: "", materialname: "", quantity: 0, totalPrice: 0 },
      ],
      totalCost: prev.ingredients
        .reduce((sum, ing) => sum + ing.totalPrice, 0)
        .toFixed(2),
    }));
  };

  const removeIngredientRow = (idx) => {
    setNewRecipe((prev) => {
      const updatedIngs = prev.ingredients.filter((_, i) => i !== idx);
      return {
        ...prev,
        ingredients: updatedIngs,
        totalCost: updatedIngs
          .reduce((sum, ing) => sum + ing.totalPrice, 0)
          .toFixed(2),
      };
    });
  };
  // Compute costs
  const costPerLitre = newRecipe.ingredients.reduce(
    (sum, ing) => sum + ing.totalPrice,
    0
  );
  const costForVolume = costPerLitre * newRecipe.volumeLitres;
  // compute pagination
  const totalPages = Math.ceil(recipes.length / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage;
  const currentRecipes = recipes.slice(startIdx, startIdx + rowsPerPage);

  const handleStartEdit = (recipe) => {
    setEditingId(recipe._id);
    setEditData({
      name: recipe.name,
      productId: recipe.productId,
      ingredients: recipe.ingredients.map((i) => ({ ...i })),
      totalCost: recipe.totalCost,
      isFinal: recipe.isFinal,
    });
  };
  const handleCancelEdit = () => setEditingId(null);

  const updateEditField = (idx, field, value) => {
    setEditData((prev) => {
      const list = [...prev.ingredients];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, ingredients: list };
    });
  };

  const handleSaveEdit = async (id) => {
    // calculate new totalCost
    const totalCost = editData.ingredients.reduce(
      (sum, i) => sum + i.totalPrice,
      0
    );
    const payload = { ...editData, totalCost };
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setRecipes((prev) => prev.map((r) => (r._id === id ? updated : r)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleToggleFinal = async (id) => {
    const recipe = recipes.find((r) => r._id === id);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFinal: !recipe.isFinal }),
      });
      if (!res.ok) throw new Error("Toggle final failed");
      const updated = await res.json();
      setRecipes((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch (err) {
      console.error(err);
    }
  };

  const saveNewRecipe = async () => {
    const { name, productId, volumeLitres, ingredients } = newRecipe;
    const validIngs = ingredients.filter(
      (ing) => ing.materialId && ing.quantity > 0
    );
    if (!name.trim() || !productId || validIngs.length === 0) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000);
      return;
    }

    const formattedIngs = validIngs.map((ing) => ({
      materialId: ing.materialId,
      materialname: ing.materialname,
      quantity: ing.quantity,
      totalPrice: ing.totalPrice,
    }));
    const payload = {
      name: name.trim(),
      productId,
      ingredients: formattedIngs,
      totalCost: costPerLitre,
      isFinal: false,
      volumeLitres,
      totalForVolume: costForVolume,
    };
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setRecipes((prev) => [saved, ...prev]);
      setSuccessMessage("Recipe saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setNewRecipe(initialRecipe());
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/recipes/${deleteTarget}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");

      setRecipes((prev) =>
        prev.filter((recipe) => recipe._id !== deleteTarget)
      );
      setDeleteTarget(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
      alert("Could not delete recipe");
    }
  };

  return (
    <Container className="py-4">
      <h1 className="page-title">Recipes Overview</h1>
      {showValidationError && (
        <Alert variant="danger">Please fill out all required fields.</Alert>
      )}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Filter by product */}
      <Form.Group as={Row} className="align-items-center mb-4">
        <Form.Label column sm="2">
          Filter by product:
        </Form.Label>
        <Col sm="6">
          <Form.Select
            value={newRecipe.productId}
            onChange={(e) =>
              setNewRecipe((prev) => ({ ...prev, productId: e.target.value }))
            }
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.productId}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Form.Group>

      {/* ── NEW RECIPE CARD ─────────────────────────────────────── */}
      <Card className="mb-4 border-primary">
        <Card.Header>
          <strong>Add New Recipe</strong>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3" controlId="newRecipeName">
            <Form.Label>Recipe Name</Form.Label>
            <Form.Control
              type="text"
              value={newRecipe.name}
              placeholder="Enter recipe name"
              onChange={(e) =>
                setNewRecipe((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="newRecipeProduct">
            <Form.Label>Choose Product ID</Form.Label>
            <Form.Select
              value={newRecipe.productId}
              onChange={(e) =>
                setNewRecipe((prev) => ({ ...prev, productId: e.target.value }))
              }
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.productId}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="d-block text-center mb-3">Ingredients</Form.Label>
            <Form.Group className="mb-2" controlId="newRecipeVolume">
              <Form.Label>Volume to Cook (L)</Form.Label>
              <Form.Control
                type="number"
                value={newRecipe.volumeLitres}
                min={0.1}
                step={0.1}
                onChange={(e) =>
                  setNewRecipe((prev) => ({
                    ...prev,
                    volumeLitres: Number(e.target.value) || 1,
                  }))
                }
                style={{ maxWidth: "200px" }}
              />
            </Form.Group>
            {/* Column headers */}
            <Row className="mb-2 gx-3 align-items-center">
              <Col xs={3} className="text-center">
                <strong>Materials</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Qty/L (g)</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Cost/L ($)</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Qty/Vm (g)</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Cost/Vm ($)</strong>
              </Col>
              <Col xs={1} />
            </Row>
            {/* Rows */}
            {newRecipe.ingredients.map((ing, idx) => {
              const qtyPerL = ing.quantity;
              const costPerL = ing.totalPrice;
              const qtyForVol = qtyPerL * newRecipe.volumeLitres;
              const costForVol = costPerL * newRecipe.volumeLitres;
              return (
                <Row className="mb-2 gx-2 align-items-center" key={idx}>
                  <Col xs={3} className="text-center">
                    <Form.Select
                      value={ing.materialId}
                      onChange={(e) => {
                        const mat = materials.find(
                          (m) => m._id === e.target.value
                        );
                        updateIngredient(idx, "materialId", e.target.value);
                        updateIngredient(idx, "materialname", mat.materialname);
                        updateIngredient(
                          idx,
                          "totalPrice",
                          ing.quantity * (mat.priceInGramsInUSD || 0)
                        );
                      }}
                    >
                      <option value="">Select material</option>
                      {materials.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.materialname}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs={2} className="text-center">
                    <Form.Control
                      type="number"
                      value={ing.quantity}
                      onChange={(e) => {
                        const q = Number(e.target.value) || 0;
                        const mat = materials.find(
                          (m) => m._id === ing.materialId
                        );
                        const price = mat ? mat.priceInGramsInUSD : 0;
                        updateIngredient(idx, "quantity", q);
                        updateIngredient(idx, "totalPrice", q * price);
                      }}
                    />
                  </Col>
                  <Col xs={2} className="text-center">
                    <Form.Control readOnly value={costPerL.toFixed(2)} />
                  </Col>
                  <Col xs={2} className="text-center">
                    <Form.Control readOnly value={qtyForVol.toFixed(2)} />
                  </Col>
                  <Col xs={2} className="text-center">
                    <Form.Control readOnly value={costForVol.toFixed(2)} />
                  </Col>
                  <Col xs={1} xs="auto">
                    {newRecipe.ingredients.length > 1 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeIngredientRow(idx)}
                      >
                        <FaTrashAlt />
                      </Button>
                    )}
                  </Col>
                </Row>
              );
            })}
          </Form.Group>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <Button
              variant="outline-success"
              onClick={addIngredientRow}
              className="d-inline-flex align-items-center"
            >
              <FaPlus className="me-2" /> Add Row
            </Button>
            <div style={{ textAlign: "right" }}>
              <div>
                <strong>Cost /1L:</strong> ${costPerLitre.toFixed(2)}
              </div>
              <div>
                <strong>Cost /{newRecipe.volumeLitres}L:</strong> $
                {costForVolume.toFixed(2)}
              </div>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="text-end">
          <Button
            variant="primary"
            onClick={saveNewRecipe}
            className="d-inline-flex align-items-center"
          >
            <FaSave className="me-2" /> Save Recipe
          </Button>
        </Card.Footer>
      </Card>

      {/* ── RECIPES LIST ──────────────────────────────────────── */}
      <h2 className="mb-3">All Recipes</h2>
      <Row xs={3} className="g-4">
        {currentRecipes.map((recipe) => (
          <Col key={recipe._id} className="d-flex">
            <Card className="h-100 w-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>{recipe.name}</span>
                <FaBookmark
                  size={20}
                  style={{
                    cursor: "pointer",
                    color: recipe.isFinal ? "gold" : "grey",
                  }}
                  onClick={() => handleToggleFinal(recipe._id)}
                />
              </Card.Header>
              {editingId === recipe._id ? (
                <>
                  <Card.Body>
                    {/* inline edit form (reuse existing edit UI) */}
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Product</Form.Label>
                      <Form.Select
                        disabled
                        value={editData.productId}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            productId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.productId}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    {editData.ingredients.map((ing, idx) => (
                      <InputGroup
                        className="mb-2"
                        key={idx}
                        style={{ alignItems: "center" }}
                      >
                        <Form.Select
                          value={ing.materialname}
                          onChange={(e) => {
                            const matId = e.target.value;
                            const price =
                              materials.find((m) => m._id === matId)
                                ?.priceInGramsInUSD || 0;
                            updateEditField(idx, "materialname", matId);
                            updateEditField(idx, "quantity", 0);
                            updateEditField(idx, "totalPrice", 0);
                          }}
                        >
                          <option value="">Select material</option>
                          {materials.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.materialname}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control
                          type="number"
                          placeholder="Qty g"
                          value={ing.quantity}
                          onChange={(e) => {
                            const q = +e.target.value;
                            const price =
                              materials.find((m) => m._id === ing.materialname)
                                ?.priceInGramsInUSD || 0;
                            updateEditField(idx, "quantity", q);
                            updateEditField(idx, "totalPrice", q * price);
                          }}
                          style={{ maxWidth: "100px" }}
                        />
                        <InputGroup.Text>g</InputGroup.Text>
                        <Form.Control
                          type="number"
                          readOnly
                          value={ing.totalPrice.toFixed(2)}
                          style={{ maxWidth: "80px" }}
                        />
                        {editData.ingredients.length > 1 && (
                          <Button
                            variant="outline-danger"
                            onClick={() => {
                              const newIngs = editData.ingredients.filter(
                                (_, i) => i !== idx
                              );
                              setEditData((prev) => ({
                                ...prev,
                                ingredients: newIngs,
                              }));
                            }}
                          >
                            <FaTrashAlt />
                          </Button>
                        )}
                      </InputGroup>
                    ))}
                  </Card.Body>

                  <Card.Footer className="d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveEdit(recipe._id)}
                    >
                      Save
                    </Button>
                  </Card.Footer>
                </>
              ) : (
                <Card.Body>
                  <p>
                    <strong>Product:</strong>{" "}
                    {products.find((p) => p._id === recipe.productId)
                      ?.productname || "—"}
                  </p>
                  <Table size="sm" className="table-fixed w-100">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Qty (g)</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients.map((ing, i) => (
                        <tr key={i}>
                          <td>{ing.materialname}</td>
                          <td>{ing.quantity}</td>
                          <td>${ing.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              )}
              {editingId !== recipe._id && (
                <Card.Footer className="d-flex justify-content-between align-items-center">
                  <div>
                    <div>
                      <strong>Cost /L:</strong> ${recipe.totalCost.toFixed(2)}
                    </div>
                    {recipe.volumeLitres != null && (
                      <div>
                        <strong>Cost /{recipe.volumeLitres}L:</strong> $
                        {(recipe.totalCost * recipe.volumeLitres).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => handleStartEdit(recipe)}
                    >
                      <PencilSquare />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => {
                        setDeleteTarget(recipe._id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash />
                    </Button>
                  </div>
                </Card.Footer>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination Controls */}
      <div className="d-flex justify-content-center mt-4">
        <Pagination>
          {[...Array(totalPages)].map((_, i) => (
            <Pagination.Item
              key={i + 1}
              active={i + 1 === page}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      </div>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Delete this recipe?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Recipes;
