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
    IDmaterial: `MAT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    dateOfPurchase: "",
    materialname: "",
    weightInGrams: 0,
    paidInUSD: 0,
    unitpriceinUSD: 0,
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
    rowsPerPage: 5,
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
        material.IDmaterial &&
        material.dateOfPurchase &&
        material.materialname &&
        material.weightInGrams &&
        material.paidInUSD
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
    console.log(`Updating ${fieldName} with value: ${value}`);
    setNewMaterial((prevMaterial) => {
      const updatedMaterial = { ...prevMaterial, [fieldName]: value };
      return updatedMaterial;
    });
  };

  const handleEditChange = (index, field, value, isNew) => {
    if (isNew) {
        const updatedNewMaterials = [...newMaterials];
        updatedNewMaterials[index] = { ...updatedNewMaterials[index], [field]: value };
        setNewMaterials(updatedNewMaterials);
      } else {
        const updatedMaterials = [...materials];
        updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
        setMaterials(updatedMaterials);
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
    const { weightInGrams, paidInUSD } = newMaterial;
    const parsedPaidInUSD = parseFloat(paidInUSD);
    const parsedWeightInGrams = parseFloat(weightInGrams);

    if (isNaN(parsedPaidInUSD) || isNaN(parsedWeightInGrams) || parsedWeightInGrams === 0) {
        console.error("Invalid values for paidInUSD or weightInGrams. Please provide valid numbers.");
        setShowValidationError(true);
        return;
    }
  
    const unitpriceinUSD = (parsedPaidInUSD / parsedWeightInGrams).toFixed(2);

    const generatedMaterial = {
        ...newMaterial,
        unitpriceinUSD,
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
        IDmaterial: `MAT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        dateOfPurchase: "",
        materialname: "",
        weightInGrams: "",
        paidInUSD: "",
        unitpriceinUSD: "",
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
    { header: "Material ID", accessor: "IDmaterial", isEditable: false },
    {
        header: "Purchase Date",
        accessor: "dateOfPurchase",
        isEditable: true,
        type: "date",
    },
    {
      header: "Material Name",
      accessor: "materialname",
      isEditable: true,
      type: "text",
    },
    {
        header: "Weight (grams)",
        accessor: "weightInGrams",
        isEditable: true,
        type: "number",
    },
    {
        header: "Paid In ($)",
        accessor: "paidInUSD",
        isEditable: true,
        type: "number",
    },
    {
      header: "Unit Price ($)",
      accessor: "unitpriceinUSD",
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
          totalPages={Math.ceil(filteredMaterials.length / pagination.rowsPerPage)}
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
                  htmlFor="IDmaterial"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Material ID:
                </label>
                <input
                  id="IDmaterial"
                  type="text"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.IDmaterial}
                  onChange={(e) =>
                    handleMaterialChange("IDmaterial", e.target.value)
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
                  htmlFor="dateOfPurchase"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Purchase Date:
                </label>
                <input
                  id="dateOfPurchase"
                  type="date"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.dateOfPurchase}
                  onChange={(e) =>
                    handleMaterialChange("dateOfPurchase", e.target.value)
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
                  onChange={(e) => handleMaterialChange("materialname", e.target.value)}
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
                  htmlFor="weightInGrams"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Weight (grams):
                </label>
                <input
                  id="weightInGrams"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.weightInGrams}
                  onChange={(e) =>
                    handleMaterialChange("weightInGrams", e.target.value)
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
                  htmlFor="paidInUSD"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                 Paid In ($):
                </label>
                <input
                  id="paidInUSD"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newMaterial.paidInUSD}
                  onChange={(e) => handleMaterialChange("paidInUSD", e.target.value)}
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
