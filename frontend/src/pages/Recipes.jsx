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
import {
  FaPlus,
  FaTrashAlt,
  FaSave,
  FaFlag,
  FaHourglassHalf,
  FaCheckCircle,
  FaArchive,
} from "react-icons/fa";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { fetchItems } from "../utils/generalUtils.js";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import { set } from "mongoose";

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
  const [recipeFilter, setRecipeFilter] = useState("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(initialRecipe());

  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
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

    const prod = products.find((p) => p._id === newRecipe.productId);
    const code = prod ? prod.productId : newRecipe.productId;
    // now build a name using the human‐readable code
    const fullName = `${newRecipe.name.trim()}_productID:${code}`;

    const formattedIngs = validIngs.map((ing) => ({
      materialId: ing.materialId,
      materialname: ing.materialname,
      quantity: ing.quantity,
      totalPrice: ing.totalPrice,
    }));

    const payload = {
      name: fullName,
      productId,
      ingredients: formattedIngs,
      totalCost: costPerLitre,
      isFinal: newRecipe.isFinal,
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

  // Handlers for edit modal
  const handleStartEdit = (recipe) => {
    setEditData({ ...recipe });
    setShowEditModal(true);
  };
  const handleCloseEdit = () => setShowEditModal(false);

  const updateEditField = (idx, field, value) => {
    setEditData((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[idx] = { ...ingredients[idx], [field]: value };
      return { ...prev, ingredients };
    });
  };
  const addEditRow = () => {
    setEditData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { materialId: "", materialname: "", quantity: 0, totalPrice: 0 },
      ],
    }));
  };
  const removeEditRow = (idx) => {
    setEditData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };
  const handleSaveEdit = async () => {
    const { _id, name, productId, volumeLitres, ingredients } = editData;
    const validIngs = ingredients.filter(
      (ing) => ing.materialId && ing.quantity > 0
    );
    const totalCost = validIngs.reduce((sum, i) => sum + i.totalPrice, 0);
    const payload = {
      name,
      productId,
      volumeLitres,
      ingredients: validIngs,
      totalCost,
      isFinal: editData.isFinal,
      isArchived: editData.isArchived,
    };
    try {
      const res = await fetch(`/api/recipes/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setRecipes((prev) => prev.map((r) => (r._id === _id ? updated : r)));
      handleCloseEdit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/recipes/${deleteTarget}`, { method: "DELETE" });
      setRecipes((prev) => prev.filter((r) => r._id !== deleteTarget));
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = recipes.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(recipeFilter.toLowerCase());
    if (showArchived) {
      // only archived
      return nameMatch && r.isArchived;
    }
    if (showFinal) {
      // only final (and not archived)
      return nameMatch && r.isFinal && !r.isArchived;
    }
    // WIP (default): neither final nor archived
    return nameMatch && !r.isFinal && !r.isArchived;
  });
  // compute pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage;
  const currentRecipes = filtered.slice(startIdx, startIdx + rowsPerPage);

  return (
    <Container className="py-4">
      <h1 className="page-title">Recipes Overview</h1>
      {showValidationError && (
        <Alert variant="danger">Please fill out all required fields.</Alert>
      )}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* ── NEW RECIPE CARD ─────────────────────────────────────── */}
      <Card className="mb-4 border-primary">
        <Card.Header className="bg-primary text-white">
          <strong>Add New Recipe</strong>
        </Card.Header>
        <Card.Body>
          <Form.Group as={Row} className="mb-3" controlId="newRecipeName">
            <Form.Label column sm="2" className="text-end">
              Recipe Name:
            </Form.Label>
            <Col sm="10">
              <Form.Control
                type="text"
                value={newRecipe.name}
                placeholder="Enter recipe name"
                onChange={(e) =>
                  setNewRecipe((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3" controlId="newRecipeProduct">
            <Form.Label column sm="2" className="text-end">
              Choose Product:
            </Form.Label>
            <Col sm="10">
              <Form.Select
                value={newRecipe.productId}
                onChange={(e) =>
                  setNewRecipe((prev) => ({
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
            </Col>
          </Form.Group>

          <Form.Group
            as={Row}
            className="mb-2 align-items-center"
            controlId="newRecipeVolume"
          >
            <Form.Label column sm="2" className="text-end">
              Batch Size (L)
            </Form.Label>
            <Col sm={3}>
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
            </Col>
            <Col sm={3} />
            <Form.Label column sm="2" className="text-end">
              Final Recipe
            </Form.Label>
            <Col sm={2}>
              <Form.Check
                inline
                type="switch"
                checked={newRecipe.isFinal}
                onChange={(e) =>
                  setNewRecipe((prev) => ({
                    ...prev,
                    isFinal: e.target.checked,
                  }))
                }
              />
            </Col>
          </Form.Group>

          <Form.Group className="mb-3" controlId="newRecipeIngredients">
            <Form.Label className="d-block text-center mb-3">
              Ingredients
            </Form.Label>

            {/* Column headers */}
            <Row className="mb-2 gx-3 align-items-center">
              <Col xs={3} className="text-center">
                <strong>Materials</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Qty/L (g)</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Price/L</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Qty/V (g)</strong>
              </Col>
              <Col xs={2} className="text-center">
                <strong>Price/V</strong>
              </Col>
              <Col />
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
                      <option value="" className="text-center">
                        Select material
                      </option>
                      {materials.map((m) => (
                        <option
                          key={m._id}
                          value={m._id}
                          className="text-center"
                        >
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
                      className="text-center"
                    />
                  </Col>
                  <Col xs={2} className="text-center">
                    <Form.Control
                      readOnly
                      value={`$${costPerL.toFixed(2)}`}
                      className="text-center"
                    />
                  </Col>
                  <Col xs={2} className="text-center">
                    <Form.Control
                      readOnly
                      value={qtyForVol.toFixed(2)}
                      className="text-center"
                    />
                  </Col>
                  <Col xs={2} className="text-center">
                    <Form.Control
                      readOnly
                      value={`$${costForVol.toFixed(2)}`}
                      className="text-center"
                    />
                  </Col>
                  <Col xs="auto">
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
      {/* Filter by Recipe Name */}
      <Form.Group as={Row} className="align-items-center mb-4">
        <Form.Label column sm="2">
          Search recipes:
        </Form.Label>
        <Col sm="4">
          <Form.Control
            type="text"
            className="ms-2"
            style={{ width: "400px", height: "40px" }}
            placeholder="Type recipe name..."
            value={recipeFilter}
            onChange={(e) => {
              setRecipeFilter(e.target.value);
              setPage(1); // reset pagination back to page 1
            }}
          />
        </Col>
        <Col className="d-flex align-items-center justify-content-end gap-2">
          <Button
            variant={
              !showFinal && !showArchived ? "secondary" : "outline-secondary"
            }
            size="sm"
            className="me-1 d-flex align-items-center justify-content-center"
            style={{ width: "100px", height: "40px" }}
            onClick={() => {
              setShowArchived(false);
              setShowFinal(false);
              setPage(1);
            }}
          >
            <FaHourglassHalf />
            <span className="ms-1">Active</span>
          </Button>
          <Button
            variant={
              showFinal && !showArchived ? "secondary" : "outline-secondary"
            }
            size="sm"
            className="me-1 d-flex align-items-center justify-content-center"
            style={{ width: "100px", height: "40px" }}
            onClick={() => {
              setShowFinal(true);
              setShowArchived(false);
              setPage(1);
            }}
          >
            <FaCheckCircle />
            <span className="ms-1">Final</span>
          </Button>
          <Button
            variant={showArchived ? "secondary" : "outline-secondary"}
            size="sm"
            className="me-1 d-flex align-items-center justify-content-center"
            style={{ width: "100px", height: "40px" }}
            onClick={() => {
              setShowArchived(true);
              setPage(1);
            }}
          >
            <FaArchive />
            <span className="ms-1">Archived</span>
          </Button>
        </Col>
      </Form.Group>
      <Row xs={1} md={2} lg={3} className="g-4">
        {currentRecipes.map((recipe) => (
          <Col key={recipe._id} className="d-flex">
            <Card className="mb-4 border-primary">
              <Card.Header className="position-relative py-2">
                <div
                  className="position-absolute"
                  style={{
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "not-allowed",
                  }}
                >
                  {recipe.isFinal && (
                    <FaFlag color="#3CB371" size={14} title="Final recipe" />
                  )}
                </div>

                <div className="text-center w-100">
                  <strong>{recipe.name}</strong>
                </div>
                <div
                  className="position-absolute"
                  style={{
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="p-1"
                    style={{
                      backgroundColor: "transparent", // fully see-through
                      borderColor: "transparent", // light grey border
                      color: "#6c757d", // darker grey icon
                      minWidth: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                    }}
                    onClick={() =>
                      setExpandedId(
                        expandedId === recipe._id ? null : recipe._id
                      )
                    }
                  >
                    {expandedId === recipe._id ? (
                      <FiMinimize2 size={14} />
                    ) : (
                      <FiMaximize2 size={14} />
                    )}
                  </Button>
                </div>
              </Card.Header>

              <Card.Body>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    paddingRight: "1rem",
                  }}
                >
                  <p className="mb-2" style={{ fontSize: "0.83rem" }}>
                    <strong>Product:</strong>{" "}
                    {products.find((p) => p._id === recipe.productId)
                      ?.productname || "—"}
                  </p>
                  <Table size="sm" className="mb-2 table-fixed w-100">
                    <thead>
                      <tr>
                        <th style={{ fontSize: "0.83rem" }}>Materials</th>
                        <th style={{ fontSize: "0.83rem" }}>Qty/L (g)</th>
                        <th style={{ fontSize: "0.83rem" }}>Price/L</th>
                        <th style={{ fontSize: "0.83rem" }}>Qty/V (g)</th>
                        <th style={{ fontSize: "0.83rem" }}>Price/V</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients.map((ing, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: "0.83rem" }}>
                            {ing.materialname}
                          </td>
                          <td style={{ fontSize: "0.83rem" }}>
                            {ing.quantity}
                          </td>
                          <td style={{ fontSize: "0.83rem" }}>
                            ${ing.totalPrice.toFixed(2)}
                          </td>
                          <td style={{ fontSize: "0.83rem" }}>
                            {ing.quantity * recipe.volumeLitres}
                          </td>
                          <td style={{ fontSize: "0.83rem" }}>
                            ${(ing.totalPrice * recipe.volumeLitres).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>

              <Card.Footer className="d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ fontSize: "0.83rem" }}>
                    <strong>Cost /1L:</strong> ${recipe.totalCost.toFixed(2)}
                  </div>
                  {recipe.volumeLitres != null && (
                    <div style={{ fontSize: "0.83rem" }}>
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
            </Card>
          </Col>
        ))}
      </Row>
      {/* full-screen Modal for the expanded card */}
      {expandedId &&
        (() => {
          const r = recipes.find((r) => r._id === expandedId);
          return (
            <Modal show onHide={() => setExpandedId(null)} size="xl" centered>
              <Modal.Header closeButton>
                <Modal.Title className="mx-auto">{r.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Card>
                  <Card.Body>
                    <p>
                      <strong>Product:</strong>{" "}
                      {products.find((p) => p._id === r.productId)?.productname}
                    </p>
                    <p>
                      <strong>Batch Size (L):</strong> {r.volumeLitres}
                    </p>

                    <Table
                      responsive
                      size="sm"
                      className="mb-2 table-fixed w-100"
                    >
                      <thead>
                        <tr>
                          <th>Materials</th>
                          <th>Qty/L (g)</th>
                          <th>Price/L</th>
                          <th>Qty/V (g)</th>
                          <th>Price/V</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.ingredients.map((ing, i) => (
                          <tr key={i}>
                            <td>{ing.materialname}</td>
                            <td>{ing.quantity}</td>
                            <td>${ing.totalPrice.toFixed(2)}</td>
                            <td>{ing.quantity * r.volumeLitres}</td>
                            <td>
                              ${(ing.totalPrice * r.volumeLitres).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <div style={{ textAlign: "right" }}>
                      <div>
                        <strong>Cost /1L:</strong> ${r.totalCost.toFixed(2)}
                      </div>
                      {r.volumeLitres != null && (
                        <div>
                          <strong>Cost /{r.volumeLitres}L:</strong> $
                          {(r.totalCost * r.volumeLitres).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Modal.Body>
            </Modal>
          );
        })()}

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

      {/* Edit Recipe Modal */}
      <Modal show={showEditModal} onHide={handleCloseEdit} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Recipe: {editData?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group as={Row} className="mb-2">
              <Form.Label column sm="2" className="text-end">
                Recipe Name
              </Form.Label>
              <Form.Control
                value={editData.name}
                readOnly
                style={{ maxWidth: "250px", cursor: "not-allowed" }}
              />
            </Form.Group>
            <Form.Group as={Row} className="mb-2">
              <Form.Label column sm="2" className="text-end">
                Product
              </Form.Label>
              <Form.Control
                readOnly
                value={
                  products.find((p) => p._id === editData.productId)
                    ?.productname || "—"
                }
                style={{ maxWidth: "250px", cursor: "not-allowed" }}
              ></Form.Control>
            </Form.Group>
            <Form.Group as={Row} className="mb-2">
              <Form.Label column sm="2" className="text-end">
                Batch Size (L)
              </Form.Label>
              <Form.Control
                type="number"
                value={editData.volumeLitres}
                min={0.1}
                step={0.1}
                onChange={(e) =>
                  setEditData((d) => ({
                    ...d,
                    volumeLitres: Number(e.target.value) || 1,
                  }))
                }
                style={{ maxWidth: "250px" }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="d-block text-center mb-3">
                Ingredients
              </Form.Label>
              <Row className="mb-2 gx-2 align-items-center">
                <Col xs={3} className="text-center">
                  <strong>Material</strong>
                </Col>
                <Col xs={2} className="text-center">
                  <strong>Qty/L (g)</strong>
                </Col>
                <Col xs={2} className="text-center">
                  <strong>Price/L</strong>
                </Col>
                <Col xs={2} className="text-center">
                  <strong>Qty/V (g)</strong>
                </Col>
                <Col xs={2} className="text-center">
                  <strong>Price/V</strong>
                </Col>
                <Col xs={1} />
              </Row>
              {editData.ingredients.map((ing, idx) => {
                const qtyPerL = ing.quantity;

                const costPerL = ing.totalPrice;
                const qtyForVol = qtyPerL * editData.volumeLitres;
                const costForVol = costPerL * editData.volumeLitres;
                return (
                  <Row key={idx} className="mb-2 gx-2 align-items-center">
                    <Col xs={3}>
                      <Form.Select
                        value={ing.materialId}
                        onChange={(e) => {
                          const mat = materials.find(
                            (m) => m._id === e.target.value
                          );
                          updateEditField(idx, "materialId", e.target.value);
                          updateEditField(
                            idx,
                            "materialname",
                            mat.materialname
                          );
                          updateEditField(
                            idx,
                            "totalPrice",
                            ing.quantity * (mat.priceInGramsInUSD || 0)
                          );
                        }}
                      >
                        <option value="" className="text-center">
                          Select material
                        </option>
                        {materials.map((m) => (
                          <option
                            key={m._id}
                            value={m._id}
                            className="text-center"
                          >
                            {m.materialname}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={2}>
                      <Form.Control
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => {
                          const q = Number(e.target.value) || 0;
                          const mat = materials.find(
                            (m) => m._id === ing.materialId
                          );
                          const price = mat ? mat.priceInGramsInUSD : 0;
                          updateEditField(idx, "quantity", q);
                          updateEditField(idx, "totalPrice", q * price);
                        }}
                        className="text-center"
                      />
                    </Col>
                    <Col xs={2}>
                      <Form.Control
                        readOnly
                        value={`$${costPerL.toFixed(2)}`}
                        className="text-center"
                      />
                    </Col>
                    <Col xs={2}>
                      <Form.Control
                        readOnly
                        value={qtyForVol.toFixed(2)}
                        className="text-center"
                      />
                    </Col>
                    <Col xs={2}>
                      <Form.Control
                        readOnly
                        value={`$${costForVol.toFixed(2)}`}
                        className="text-center"
                      />
                    </Col>
                    <Col xs={1}>
                      {editData.ingredients.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
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
                    </Col>
                  </Row>
                );
              })}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Button
                  variant="outline-success"
                  className="d-inline-flex align-items-center"
                  onClick={() => {
                    setEditData((prev) => ({
                      ...prev,
                      ingredients: [
                        ...prev.ingredients,
                        {
                          materialId: "",
                          materialname: "",
                          quantity: 0,
                          totalPrice: 0,
                        },
                      ],
                    }));
                  }}
                >
                  <FaPlus className="me-2" /> Add Row
                </Button>
              </div>
            </Form.Group>

            <div
              className="d-inline-flex border rounded align-items-center p-2"
              style={{ backgroundColor: "#f8f9fa", whiteSpace: "nowrap" }}
            >
              <Form.Label className="mb-0 me-2">Final Recipe</Form.Label>
              <Form.Check
                inline
                type="switch"
                checked={editData.isFinal}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    isFinal: e.target.checked,
                  }))
                }
              />
            </div>
            <div
              className="d-inline-flex border rounded align-items-center p-2 ms-3"
              style={{ backgroundColor: "#f8f9fa", whiteSpace: "nowrap" }}
            >
              <Form.Label className="mb-0 me-2">Archived</Form.Label>
              <Form.Check
                inline
                type="switch"
                checked={editData.isArchived}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    isArchived: e.target.checked,
                  }))
                }
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <div>
                <strong>Cost /1L:</strong> ${editData.totalCost.toFixed(2)}
              </div>
              <div>
                <strong>Cost /{editData.volumeLitres}L:</strong> $ $
                {(editData.totalCost * editData.volumeLitres).toFixed(2)}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={handleCloseEdit}>
            Cancel
          </Button>
          <Button
            className="d-inline-flex align-items-center"
            size="sm"
            variant="primary"
            onClick={handleSaveEdit}
          >
            <FaSave className="me-2" /> Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

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
