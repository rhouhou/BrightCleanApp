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
    priceInGramsInUSD: 0,
  });

  const [newMaterial, setNewMaterial] = useState(initialMaterial());
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMaterials, setNewMaterials] = useState([]);
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

        setMaterials(
          materialData.map((material) => ({
            ...material,
            isEditing: false,
          }))
        );
      } catch (err) {
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
  };

  const materialsFiltersConfig = [
    { name: "searchName", label: "Name", type: "search", icon: FaSearch },
  ];

  const filteredMaterials = applyMaterialFilters(materials, filters);

  // Handle Change, Edit, Save, Cancel, and add functions
  const handleMaterialChange = (fieldName, value) => {
    setNewMaterial((prevMaterial) => {
      const updatedMaterial = { ...prevMaterial, [fieldName]: value };

      const name =
        fieldName === "materialname" ? value : updatedMaterial.materialname;

      if (fieldName === "materialname") {
        const cleaned = value
          .trim()
          .toUpperCase()
          .replace(/[\s()%]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        const random = Math.floor(Math.random() * 10000);
        updatedMaterial.IDmaterial = `${cleaned}-${random}`;
      }

      return updatedMaterial;
    });
  };

  const handleEditChange = (itemId, field, value, isNew) => {
    const updateList = isNew ? [...newMaterials] : [...materials];
    const index = updateList.findIndex(
        (item) => item._id === itemId || item.IDmaterial === itemId
      );
    
      if (index === -1) {
        console.error("Could not find item with ID:", itemId);
        return;
      }
    
      const item = { ...updateList[index], [field]: value };
    
      if (field === "materialname") {
        const cleaned = value
          .trim()
          .toUpperCase()
          .replace(/[\s()%]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
    
        const random = Math.floor(Math.random() * 10000);
        item.IDmaterial = `${cleaned}-${random}`;
      }

    updateList[index] = item;

    if (isNew) {
      setNewMaterials(updateList);
    } else {
      setMaterials(updateList);
    }
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

  const handleToggleEditMode = (index, isNew) => {
    if (isNew) {
      const updatedNewItems = [...newMaterials];
      updatedNewItems[index].isEditing = true;
      setNewMaterials(updatedNewItems);
    } else {
      const updatedItems = [...materials];

      // Save the original value before setting edit mode
      setOriginalItems((prev) => ({
        ...prev,
        [index]: { ...updatedItems[index] },
      }));

      updatedItems[index].isEditing = true;
      setMaterials(updatedItems);
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
  const materialsColumns = [
    {
      header: "Material ID",
      accessor: "IDmaterial",
      type: "text",
      isEditable: false,
    },
    {
      header: "Material Name",
      accessor: "materialname",
      isEditable: true,
      type: "text",
    },
    {
      header: "Price In Grams ($)",
      accessor: "priceInGramsInUSD",
      isEditable: true,
      type: "number",
    },
  ];

  // pagination
  const { currentPage, rowsPerPage } = pagination;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMaterials = filteredMaterials.slice(
    startIndex,
    startIndex + rowsPerPage
  );

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
          columns={materialsColumns}
          items={paginatedMaterials}
          onEdit={handleEditChange}
          onDelete={(idOrIndex, isNewMaterial) => {
            if (idOrIndex !== undefined && idOrIndex !== null) {
              handleDelete(idOrIndex, isNewMaterial, "materials", setMaterials);
            } else {
              console.error("Delete target is not properly set:", idOrIndex);
            }
          }}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={(index, isNew) =>
            cancelEdit({
              index,
              isNew,
              newItems: newMaterials,
              setNewItems: setNewMaterials,
              items: materials,
              setItems: setMaterials,
              originalItems,
              setOriginalItems,
            })
          }
          onToggleEditMode={handleToggleEditMode}
        />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={Math.ceil(
            filteredMaterials.length / pagination.rowsPerPage
          )}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, currentPage: page }))
          }
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
                  htmlFor="priceInGramsInUSD"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Price In Grams ($):
                </label>
                <input
                  id="priceInGramsInUSD"
                  type="number"
                  placeholder="Enter Value"
                  step="0.00001"
                  min="0"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.priceInGramsInUSD}
                  onChange={(e) =>
                    handleMaterialChange("priceInGramsInUSD", e.target.value)
                  }
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
