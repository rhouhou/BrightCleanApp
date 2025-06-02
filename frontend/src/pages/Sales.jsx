import React, { useState, useEffect } from "react";
import { FaPlus, FaSave, FaMinus, FaSearch } from "react-icons/fa"; // Icons for buttons
import DropdownWithAddNew from "../components/DropDownWithAddNew.jsx";
import Filters from "../components/Filters.jsx";
import Pagination from "../components/Pagination.jsx";
import {
  fetchItems,
  saveEdit,
  cancelEdit,
  handleDeleteAndCleanup,
  applyFilters,
} from "../utils/generalUtils.js";
import ItemsTable from "../components/ItemsTable";
import { parse } from "dotenv";

const Sales = () => {
  const initialSale = () => ({
    transactions: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    dateOfPurchase: "",
    businessType: "",
    productname: "",
    priceTier: "",
    quantity: 0,
    unitprice: 0,
    totalamount: 0,
  });

  const [newSale, setNewSale] = useState(initialSale());
  const [sales, setSales] = useState([]);
  const [newSales, setNewSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [businesstypes, setBusinesstypes] = useState(["B2B", "B2C"]);
  const [priceTierOptions, setPriceTierOptions] = useState([
    "retail_with_bottle",
    "retail_without_bottle",
    "Wholesale_schools",
    "wholesale_restaurants",
  ]);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    selectedBusinessType: "",
    selectedPriceTier: "",
    searchName: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 5,
  });
  const [originalItems, setOriginalItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch products and sales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productData, salesData] = await Promise.all([
          fetchItems("/api/products"),
          fetchItems("/api/sales"),
        ]);

        // Verify the format of the fetched data
        console.log("Fetched Product Data:", productData);
        console.log("Fetched Sales Data:", salesData);

        // Assuming productData is an array of product objects with a productname property
        setProductNames(productData.map((product) => product.productname));
        setProducts(productData);

        const formattedSales = salesData.map((sale) => ({
          ...sale,
          isEditing: false,
        }));
        setSales((prevSales) => {
          const updatedSales = formattedSales.map((mat) => {
            const prevItem = prevSales.find((prev) => prev._id === mat._id);
            return prevItem ? { ...mat, isEditing: prevItem.isEditing } : mat;
          });

          setPagination((prev) => ({
            ...prev,
            totalItems: updatedSales.length,
            totalPages: Math.ceil(updatedSales.length / prev.rowsPerPage),
            currentPage: 1, // Reset to first page
          }));
          return updatedSales;
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isValidSale = (sale) => {
    return (
      sale.dateOfPurchase &&
      sale.businessType &&
      sale.productname &&
      sale.priceTier &&
      sale.quantity
    );
  };

  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  const handleResetFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      selectedBusinessType: "",
      selectedPriceTier: "",
      searchName: "",
    });
  };

  const salesFiltersConfig = [
    { name: "fromDate", label: "From:", type: "date" },
    { name: "toDate", label: "To:", type: "date" },
    {
      name: "selectedBusinessType",
      label: "Business Type",
      type: "select",
      options: ["B2B", "B2C"],
    },
    {
      name: "selectedPriceTier",
      label: "Price Tier",
      type: "select",
      options: priceTierOptions,
    },
    { name: "searchName", label: "Name", type: "search", icon: FaSearch },
  ];

  const filteredSales = applyFilters(sales, filters);

  // Handle Change, Edit, Save, Cancel, and add functions
  const handleSaleChange = (fieldName, value) => {
    setNewSale((prevSale) => {
      const updatedSale = { ...prevSale, [fieldName]: value };
      // Update unit price if productname or priceTier changes
      if (fieldName === "productname" || fieldName === "priceTier") {
        const selectedProduct = products.find(
          (product) => product.productname === updatedSale.productname
        );
        if (selectedProduct) {
          const tierObj = selectedProduct.prices.find(
            (p) => p.tier === updatedSale.priceTier
          );
          updatedSale.unitprice = tierObj ? tierObj.amount : 0;
        }
      }
      // Recalculate total amount if quantity, unitprice
      if (["quantity"].includes(fieldName)) {
        const quantity = parseFloat(updatedSale.quantity) || 0;
        updatedSale.totalamount = (quantity * updatedSale.unitprice).toFixed(2);
      }
      return updatedSale;
    });
  };

  const handleEditChange = (absoluteIndex, field, value, isNew) => {
    const updateList = isNew ? [...newSales] : [...sales];
    const itemToEdit = updateList[absoluteIndex];
    if (!itemToEdit) {
      console.error("No item at absolute index:", absoluteIndex);
      return;
    }
    const updated = { ...itemToEdit, [field]: value };

      // Recalculate dependent fields for new sales
      if (field === "priceTier" || field === "productname") {
        const selectedProduct = products.find(
          (p) => p.productname === sale.productname
        );

        if (selectedProduct) {
          const tierObj = selectedProduct.prices.find(
            (p) => p.tier === updated.priceTier
          );
          updated.unitprice = tierObj ? tierObj.amount : 0;
          const qty = parseFloat(updated.quantity) || 0;
          updated.totalamount = (qty * updated.unitprice).toFixed(2);
        }
      }
      // Recalculate totalamount when quantity, unitprice
      if (["quantity"].includes(field)) {
        const quantity = parseFloat(updated.quantity) || 0;
        updated.totalamount = (quantity * updated.unitprice).toFixed(2);
      }

      updateList[absoluteIndex] = updated;
      isNew ? setNewSales(updateList) : setSales(updateList);
      setNewSales(updatedNewSales);
  };

  const handleSaveEdit = (sale, index, isNew) => {
    saveEdit({
      item: sale,
      index,
      isNew,
      newItems: newSales,
      items: sales,
      setItems: setSales,
      setNewItems: setNewSales,
      apiEndpoint: "/api/sales",
      setSuccessMessage,
    });
  };

  const handleToggleEditMode = (index, isNew) => {
    if (isNew) {
      const updatedNewItems = [...newSales];
      updatedNewItems[index].isEditing = true;
      setNewSales(updatedNewItems);
    } else {
      const updatedItems = [...sales];
      // Save the original value before setting edit mode
      setOriginalItems((prev) => ({
        ...prev,
        [index]: { ...updatedItems[index] },
      }));
      updatedItems[index].isEditing = true;
      setSales(updatedItems);
    }
  };

  const handleAddAndSaveSale = async () => {
    const { productname, quantity } = newSale;

    const selectedProduct = products.find(
      (product) => product.productname === productname
    );

    if (!selectedProduct) {
      console.error("Product not found. Please select a valid product.");
      setShowValidationError(true);
      return;
    }

    // Calculate unitprice based on priceTier
    const tierObj = selectedProduct.prices.find(
      (p) => p.tier === newSale.priceTier
    );

    // newSale.priceTier (or priceTier) holds one of those keys:
    const unitprice = tierObj ? tierObj.amount : 0;

    const generatedSale = {
      ...newSale,
      unitprice: unitprice,
      totalamount: (quantity * unitprice).toFixed(2),
      isNew: true,
    };

    if (!isValidSale(generatedSale)) {
      console.log(generatedSale);
      console.error("Validation failed. Please fill all required fields.");
      setShowValidationError(true);
      return;
    }

    try {
      // Save to the backend
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedSale),
      });

      if (!response.ok) {
        throw new Error("Failed to save the sale to the backend");
      }

      const savedSale = await response.json();

      // Update the save list with the saved sale from the backend
      setSales((prev) => [savedSale, ...prev]);

      // Reset the form
      setNewSale({
        transactions: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        dateOfPurchase: "",
        businessType: "",
        productname: "",
        priceTier: "",
        quantity: 0,
        unitprice: 0,
        totalamount: 0,
      });

      setShowValidationError(false);
      setIsFormVisible(false); // Collapse the form after saving
      console.log("Sale added and saved successfully:", savedSale);

      // Optionally show a success message
      setSuccessMessage("Sale added and saved successfully!");
      console.log("Success message:", successMessage);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving sale:", error.message);
    }
  };

  // Define Columns for Sales
  const salesColumns = [
    { header: "Transactions", accessor: "transactions", isEditable: false },
    {
      header: "Date of Purchase",
      accessor: "dateOfPurchase",
      type: "date",
      isEditable: true,
    },
    {
      header: "Business Type",
      accessor: "businessType",
      isEditable: true,
      type: "select",
      options: ["B2B", "B2C"],
    },
    {
      header: "Product Name",
      accessor: "productname",
      isEditable: true,
      type: "text",
    },
    {
      header: "Price Tier",
      accessor: "priceTier",
      isEditable: true,
      type: "select",
      options: priceTierOptions,
    },
    {
      header: "Quantity",
      accessor: "quantity",
      isEditable: true,
      type: "number",
    },
    {
      header: "Unit Price",
      accessor: "unitprice",
      isEditable: false,
      type: "number",
    },
    {
      header: "Total Amount",
      accessor: "totalamount",
      isEditable: false,
      type: "number",
    },
  ];

  const onPageEdit = (pageIndex, column, rawValue, isNew) => {
    const activeList = filters.searchName ? filteredSales : sales;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    if (!activeItem) return console.error("No item at pageIndex", pageIndex);
    const fullList = isNew ? newSales : sales;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id
    );
    if (originalIndex === -1)
      return console.error("Could not find original item", activeItem);

    handleEditChange(originalIndex, column, rawValue, isNew);
  };

  const onPageToggle = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredSales : sales;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newSales : sales;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id
    );

    handleToggleEditMode(originalIndex, isNew);
  };

  const onPageSave = (item, pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredSales : sales;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    if (!activeItem) return console.error("No item at pageIndex", pageIndex);
    const fullList = isNew ? newSales : sales;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id
    );

    if (originalIndex === -1) {
      console.error("Could not find original item to save", activeItem);
      return;
    }
    handleSaveEdit(item, originalIndex, isNew);
  };

  const onPageCancel = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredSales : sales;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newSales : sales;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id 
    );

    cancelEdit({
      index: originalIndex,
      isNew,
      newItems: newSales,
      setNewItems: setNewSales,
      items: sales,
      setItems: setSales,
      originalItems,
      setOriginalItems,
    });
  };

  // pagination
  const { currentPage, rowsPerPage } = pagination;
  //const activeSales = filters.searchName ? filteredSales : sales;
  const activeSales = filters.searchName ? filteredSales : sales;;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedSales = activeSales.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  return (
    <div>
      {/* Section 1 */}
      <div>
        <div>
          <h1 className="page-title">Sales Overview</h1>
        </div>

        {/* Filters */}
        <Filters
          filtersConfig={salesFiltersConfig}
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
          columns={salesColumns}
          items={paginatedSales}
          onEdit={onPageEdit}
          onDelete={(idOrIndex, isNewSale) => {
            if (idOrIndex !== undefined && idOrIndex !== null) {
              handleDeleteAndCleanup({
                idOrIndex,
                isNewItem: isNewSale,
                type: "sales",
                items: sales,
                setItems: setSales,
                newItems: newSales,
                setNewItems: setNewSales,
                cleanupConfig: [
                  { setter: setProductNames, getValue: (p) => p.productname },
                  { setter: setBusinesstypes, getValue: (p) => p.businessType },
                ],
              });
              setDeleteTarget(null);
            } else {
              console.error("Delete target is not properly set:", idOrIndex);
            }
          }}
          onSaveEdit={onPageSave}
          onCancelEdit={onPageCancel}
          onToggleEditMode={onPageToggle}
        />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={Math.ceil(activeSales.length / pagination.rowsPerPage)}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, currentPage: page }))
          }
        />
      </div>

      {/* Section 2: Add New Sale */}

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

        {/* Sale Form */}
        {isFormVisible && (
          <div>
            <h1 className="page-title" style={{ marginTop: "5px" }}>
              Add New Sale
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "15px",
              }}
            >
              <DropdownWithAddNew
                type="productname"
                options={productNames}
                setOptions={setProductNames}
                selectedOption={newSale.productname}
                setSelectedOption={(value) =>
                  setNewSale((prev) => ({ ...prev, productname: value }))
                }
              />

              <DropdownWithAddNew
                type="businesstype"
                options={businesstypes}
                setOptions={setBusinesstypes}
                selectedOption={newSale.businessType}
                setSelectedOption={(value) =>
                  setNewSale((prev) => ({ ...prev, businessType: value }))
                }
              />

              <DropdownWithAddNew
                type="priceTier"
                options={priceTierOptions}
                setOptions={setPriceTierOptions}
                selectedOption={newSale.priceTier}
                setSelectedOption={(value) =>
                  setNewSale((prev) => ({ ...prev, priceTier: value }))
                }
              />

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
                  Date of Purchase:
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
                  value={newSale.dateOfPurchase}
                  onChange={(e) =>
                    handleSaleChange("dateOfPurchase", e.target.value)
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
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newSale.quantity}
                  onChange={(e) => handleSaleChange("quantity", e.target.value)}
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
                  Please fill in all required fields before adding the sale.
                </div>
              )}

              <button
                className="button-savetb"
                onClick={handleAddAndSaveSale}
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

export default Sales;
