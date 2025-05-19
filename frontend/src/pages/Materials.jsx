import React, { useState, useEffect } from "react";
import { FaPlus, FaSave, FaMinus, FaSearch } from "react-icons/fa"; // Icons for buttons
import Filters from "../components/Filters.jsx";
import Pagination from "../components/Pagination.jsx";
import {
  fetchItems,
  saveEdit,
  cancelEdit,
  handleDelete,
  applyMaterialFilters,
} from "../utils/generalUtils.js";
import ItemsTable from "../components/ItemsTable";

const Materials = () => {
  const initialMaterial = () => ({
    IDmaterial: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    materialname: "",
    quantity: 1,
    totalpriceInUSD: 0,
    priceInGramsInUSD: 0,
  });

  const [newMaterial, setNewMaterial] = useState(initialMaterial());
  const [materials, setMaterials] = useState([]);
  const [newMaterials, setNewMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
  });
  const [originalItems, setOriginalItems] = useState({});

  // Fetch materials
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const materialData = await fetchItems("/api/materials");
        console.log("Fetched Materials Data:", materialData);

        const formattedMaterials = materialData.map((material) => ({
          ...material,
          isEditing: false,
        }));

        setMaterials((prevMaterials) => {
          const updatedMaterials = formattedMaterials.map((mat) => {
            const prevItem = prevMaterials.find((prev) => prev._id === mat._id);
            return prevItem ? { ...mat, isEditing: prevItem.isEditing } : mat;
          });

          // Reset Pagination
          setPagination((prev) => ({
            ...prev,
            totalItems: updatedMaterials.length,
            totalPages: Math.ceil(updatedMaterials.length / prev.rowsPerPage),
            currentPage: 1, // Reset to first page
          }));

          return updatedMaterials;
        });
      } catch (error) {
        console.error("Error fetching materials data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  const isValidMaterial = (material) => {
    return (
      material.IDmaterial && material.materialname && material.priceInGramsInUSD
    );
  };

  const confirmDelete = (idOrIndex, isNewMaterial) => {
    console.log(
      `Confirm delete: ID or Index: ${idOrIndex}, isNew: ${isNewMaterial}`
    );
    setDeleteTarget({ idOrIndex, isNewMaterial });
  };

  // Filters
  const [filters, setFilters] = useState({
    searchName: "",
  });

  const handleResetFilters = () => {
    setFilters({
      searchName: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page on filter reset
  };

  const materialsFiltersConfig = [
    { name: "searchName", label: "Name", type: "search", icon: FaSearch },
  ];

  const filteredMaterials = applyMaterialFilters(materials, filters);

  // Handle Change, Edit, Save, Cancel, and add functions
  const handleMaterialChange = (fieldName, value) => {
    setNewMaterial((prevMaterial) => {
      const updatedMaterial = { ...prevMaterial, [fieldName]: value };

      // If either quantity or totalPrice changes, recalc priceInGramsInUSD
      if (fieldName === "quantity" || fieldName === "totalPriceInUSD") {
        const q = parseFloat(updatedMaterial.quantity) || 0;
        const total = parseFloat(updatedMaterial.totalPriceInUSD) || 0;
        updatedMaterial.priceInGramsInUSD = q > 0 ? total / q : 0;
      }

      if (fieldName === "materialname") {
        const cleaned = value
          .trim()
          .toUpperCase()
          .replace(/[\s()%]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        const oldSuffix =
          extractSuffix(prevMaterial.IDmaterial) ||
          Math.floor(Math.random() * 10000);
        updatedMaterial.IDmaterial = `${cleaned}-${oldSuffix}`;
      }

      return updatedMaterial;
    });
  };

  // Now takes an absolute index directly, never re‐computes page offsets
  const handleEditChange = (absoluteIndex, field, value, isNew) => {
    // Pick the full list you’re editing: either newMaterials or materials
    const updateList = isNew ? [...newMaterials] : [...materials];

    // Grab the target item
    const itemToEdit = updateList[absoluteIndex];
    if (!itemToEdit) {
      console.error("No item at absolute index:", absoluteIndex);
      return;
    }

    // Make a shallow copy and apply the change
    const updated = { ...itemToEdit, [field]: value };

    if (field === "quantity" || field === "totalPriceInUSD") {
      const q = parseFloat(updated.quantity) || 0;
      const total = parseFloat(updated.totalPriceInUSD) || 0;
      updated.priceInGramsInUSD = q > 0 ? total / q : 0;
    }

    // Special ID‐rebuild logic when renaming
    if (field === "materialname") {
      const cleaned = value
        .trim()
        .toUpperCase()
        .replace(/[\s()%]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const oldSuffix =
        extractSuffix(updated.IDmaterial) || Math.floor(Math.random() * 10000);
      updated.IDmaterial = `${cleaned}-${oldSuffix}`;
    }

    // Put it back
    updateList[absoluteIndex] = updated;
    isNew ? setNewMaterials(updateList) : setMaterials(updateList);
  };

  const handleSaveEdit = (material, index, isNew) => {
    saveEdit({
      item: material,
      index,
      isNew,
      newItems: newMaterials,
      items: materials,
      setItems: setMaterials,
      setNewItems: setNewMaterials,
      apiEndpoint: "/api/materials",
      setSuccessMessage,
    });
  };

  // Also takes an absolute index—no more pageIndex math in here
  const handleToggleEditMode = (absoluteIndex, isNew) => {
    if (isNew) {
      const updated = [...newMaterials];
      if (!updated[absoluteIndex])
        return console.error("No new item at", absoluteIndex);
      updated[absoluteIndex].isEditing = true;
      setNewMaterials(updated);
    } else {
      const updated = [...materials];
      if (!updated[absoluteIndex])
        return console.error("No material at", absoluteIndex);

      // stash original before toggling
      setOriginalItems((o) => ({
        ...o,
        [absoluteIndex]: { ...updated[absoluteIndex] },
      }));

      updated[absoluteIndex].isEditing = true;
      setMaterials(updated);
    }
  };

  const handleAddAndSaveMaterial = async () => {
    const { materialname } = newMaterial;

    const generateMaterialId = (materialname) => {
      if (!materialname) return ""; // Handle empty material name
      const cleanName = materialname
        .trim()
        .toUpperCase()
        .replace(/[\s()/%]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const random = Math.floor(Math.random() * 10000);
      return `${cleanName}-${random}`;
    };

    const IDmaterial = generateMaterialId(materialname);

    const generatedMaterial = {
      ...newMaterial,
      IDmaterial,
      isNew: true,
    };

    if (!isValidMaterial(generatedMaterial)) {
      console.log(generatedMaterial);
      console.error("Validation failed. Please fill all required fields.");
      setShowValidationError(true);
      return;
    }

    try {
      // Save to the backend
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedMaterial),
      });

      if (!response.ok) {
        throw new Error("Failed to save the material to the backend");
      }

      const savedMaterial = await response.json();

      // Update the save list with the saved material from the backend
      setMaterials((prev) => [savedMaterial, ...prev]);

      // Reset the form
      setNewMaterial({
        materialname: "",
        priceInGramsInUSD: "",
      });

      setShowValidationError(false);
      setIsFormVisible(false); // Collapse the form after saving
      console.log("Material added and saved successfully:", savedMaterial);

      // Optionally show a success message
      setSuccessMessage("Material added and saved successfully!");
      console.log("Success message:", successMessage);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving material:", error.message);
    }
  };

  // Define Columns for Materials
  // always‐visible columns
  const defaultColumns = [
    {
      header: "Material ID",
      accessor: "IDmaterial",
      type: "text",
      isEditable: false,
    },
    {
      header: "Material Name",
      accessor: "materialname",
      type: "text",
      isEditable: false,
    },
    {
      header: "Price per Gram ($)",
      accessor: "priceInGramsInUSD",
      type: "number",
      isEditable: false,
    },
  ];

  // columns to show only when editing
  const editingColumns = [
    ...defaultColumns,
    {
      header: "Quantity",
      accessor: "quantity",
      type: "number",
      isEditable: true,
    },
    {
      header: "Total Price ($)",
      accessor: "totalPriceInUSD",
      type: "number",
      isEditable: true,
    },
  ];

  // Grab everything after the final dash as the suffix
  const extractSuffix = (id) => {
    const idx = id.lastIndexOf("-");
    return idx >= 0 ? id.slice(idx + 1) : null;
  };

  const onPageEdit = (pageIndex, column, value, isNew) => {
    // 1) which list we’re paging?
    const activeList = filters.searchName ? filteredMaterials : materials;

    // 2) pick the item in that list
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    if (!activeItem) return console.error("No item at pageIndex", pageIndex);

    // 3) find its index in the **full** array
    const fullList = isNew ? newMaterials : materials;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.IDmaterial === activeItem.IDmaterial
    );
    if (originalIndex === -1)
      return console.error("Can’t find original item", activeItem);

    // 4) call the core edit function with that index
    handleEditChange(originalIndex, column, value, isNew);
  };

  const onPageToggle = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredMaterials : materials;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newMaterials : materials;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.IDmaterial === activeItem.IDmaterial
    );

    handleToggleEditMode(originalIndex, isNew);
  };

  const onPageSave = (item, pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredMaterials : materials;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newMaterials : materials;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.IDmaterial === activeItem.IDmaterial
    );

    handleSaveEdit(item, originalIndex, isNew);
  };

  const onPageCancel = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredMaterials : materials;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newMaterials : materials;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.IDmaterial === activeItem.IDmaterial
    );

    cancelEdit({
      index: originalIndex,
      isNew,
      newItems: newMaterials,
      setNewItems: setNewMaterials,
      items: materials,
      setItems: setMaterials,
      originalItems,
      setOriginalItems,
    });
  };

  // pagination
  // Calculate active materials
  console.log("Applying Pagination...");
  const { currentPage, rowsPerPage } = pagination;
  const activeMaterials = filters.searchName ? filteredMaterials : materials;
  console.log("Active Materials:", activeMaterials);

  // Calculate the correct start index for the current page
  const startIndex = (currentPage - 1) * rowsPerPage;
  console.log("Start Index:", startIndex);

  // Slice the active materials based on the current page
  const paginatedMaterials = activeMaterials.slice(
    startIndex,
    startIndex + rowsPerPage
  );
  console.log("Paginated Materials:", paginatedMaterials);

  const isAnyEditing =
    materials.some((m) => m.isEditing) || newMaterials.some((m) => m.isEditing);

  // Choose the right columns
  const columnsToShow = isAnyEditing ? editingColumns : defaultColumns;

  return (
    <div>
      {/* Section 1 */}
      <div>
        <div>
          <h1 className="page-title">Materials Overview</h1>
        </div>

        {/* Filters */}
        <Filters
          filtersConfig={materialsFiltersConfig}
          filters={filters}
          setFilters={(updatedFilter) => {
            setFilters((prevFilters) => ({
              ...prevFilters,
              ...updatedFilter,
            }));
          }}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Table Section */}
      <div className="table-panel">
        <ItemsTable
          columns={columnsToShow}
          items={paginatedMaterials}
          onToggleEditMode={onPageToggle}
          onEdit={onPageEdit}
          onSaveEdit={onPageSave}
          onCancelEdit={onPageCancel}
          onDelete={(pageIndexOrId, isNew) => {
            if (isNew) {
              const updated = [...newMaterials];
              updated.splice(pageIndexOrId, 1);
              return setNewMaterials(updated);
            }
            handleDelete(pageIndexOrId, false, "materials", setMaterials);
            setDeleteTarget(null); // Reset delete target after deletion
          }}
        />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={Math.ceil(
            activeMaterials.length / pagination.rowsPerPage
          )}
          onPageChange={(page) => {
            setPagination((prev) => ({ ...prev, currentPage: page }));
            console.log("Pagination Changed to Page:", page);
          }}
        />
      </div>

      {/* Section 2: Add New Material */}

      {/* Add New and Close buttons*/}
      <div
        style={{
          margin: "20px auto", // Center the section horizontally
          maxWidth: "95%", // Aligns with table width
          display: "flex",
          flexDirection: "column", // Stack elements vertically
          gap: "15px", // Adds space between button and table
        }}
      >
        <button
          className={`button button-add ${isFormVisible ? "close" : "add"}`}
          onClick={toggleFormVisibility}
        >
          {isFormVisible ? (
            <>
              <FaMinus style={{ fontSize: "18px" }} />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                Close
              </span>
            </>
          ) : (
            <>
              <FaPlus style={{ fontSize: "18px" }} />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                Add New
              </span>
            </>
          )}
        </button>

        {/* Success Message */}
        {successMessage && (
          <div
            className="mb-4 p-2 bg-green-200 text-green-700 rounded-lg text-center"
            style={{
              width: "400px",
              marginLeft: "300px", // Add space between the button and the message
              marginTop: "5px",
              padding: "10px 15px",
              gap: "5px",
              backgroundColor: "#d4edda", // Success green background
              color: "#155724", // Success green text
              borderRadius: "5px",
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Material Form */}
        {isFormVisible && (
          <div>
            <h1 className="page-title" style={{ marginTop: "5px" }}>
              Add New Material
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  width: "450px",
                  gap: "10px",
                }}
              >
                <label
                  htmlFor="materialname"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Material Name:
                </label>
                <input
                  id="materialname"
                  type="text"
                  placeholder="Enter Text"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.materialname}
                  onChange={(e) =>
                    handleMaterialChange("materialname", e.target.value)
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  width: "450px",
                  gap: "10px",
                }}
              >
                <label
                  htmlFor="quantity"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Quantity:
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.quantity}
                  onChange={(e) =>
                    handleMaterialChange("quantity", e.target.value)
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  width: "450px",
                  gap: "10px",
                }}
              >
                <label
                  htmlFor="totalPriceInUSD"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Total Price ($):
                </label>
                <input
                  id="totalPriceInUSD"
                  type="number"
                  min="0"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.totalPriceInUSD}
                  onChange={(e) =>
                    handleMaterialChange("totalPriceInUSD", e.target.value)
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  width: "450px",
                  gap: "10px",
                }}
              >
                <label
                  htmlFor="priceInGramsInUSD"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Price In Grams ($):
                </label>
                <input
                  id="priceInGramsInUSD"
                  type="number"
                  step="0.00001"
                  min="0"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                    backgroundColor: "transparent",
                    cursor: "not-allowed",
                  }}
                  value={newMaterial.priceInGramsInUSD}
                  readOnly
                />
              </div>
            </div>

            <div
              className="actions-buttons"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: "5px",
                marginRight: "15px",
              }}
            >
              {showValidationError && (
                <div
                  className="error-message"
                  style={{
                    textAlign: "center",
                    margin: "0",
                    fontSize: "16px",
                    color: "red",
                  }}
                >
                  Please fill in all required fields before adding the material.
                </div>
              )}

              <button
                className="button-savetb"
                onClick={handleAddAndSaveMaterial}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  padding: "10px 10px",
                }}
              >
                <FaSave style={{ fontSize: "18px" }} />
                <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                  Save
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Materials;
