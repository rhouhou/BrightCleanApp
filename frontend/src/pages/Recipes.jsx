import React, { useState, useEffect } from "react";
import { FaPlus, FaSave, FaMinus, FaSearch } from "react-icons/fa"; // Icons for buttons
import DropdownWithAddNew from "../components/DropDownWithAddNew.jsx";
import Filters from "../components/Filters.jsx";
import Pagination from "../components/Pagination.jsx";
import {
  fetchItems,
  saveEdit,
  cancelEdit,
  handleDelete,
  applyFilters,
} from "../utils/generalUtils.js";
import ItemsTable from "../components/ItemsTable";

const Sales = () => {
  const initialSale = () => ({
    transactions: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    dateOfPurchase: "",
    businessType: "",
    productname: "",
    isWithBottle: "",
    quantity: 0,
    unitprice: 0,
    totalamount: 0,
  });

  const [newSale, setNewSale] = useState(initialSale());
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSales, setNewSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [productNames, setProductNames] = useState([]);
  const [withBottles, setWithBottles] = useState(["yes", "no"]);
  const [businesstypes, setBusinesstypes] = useState(["B2B", "B2C"]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 5,
  });
  const [originalItems, setOriginalItems] = useState({});

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
        setSales(
          salesData.map((sale) => ({
            ...sale,

            isEditing: false,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  const isValidSale = (sale) => {
    return (
      sale.dateOfPurchase &&
      sale.businessType &&
      sale.productname &&
      sale.isWithBottle !== null &&
      sale.quantity
    );
  };

  const confirmDelete = (idOrIndex, isNewSale) => {
    console.log(
      `Confirm delete: ID or Index: ${idOrIndex}, isNew: ${isNewSale}`
    );
    setDeleteTarget({ idOrIndex, isNewSale });
  };

  // Filters
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    selectedBusinessType: "",
    selectedIsWithBottle: "",
    searchName: "",
  });

  const handleResetFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      selectedBusinessType: "",
      selectedIsWithBottle: "",
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
      name: "selectedIsWithBottle",
      label: "With Bottle",
      type: "select",
      options: ["yes", "no"],
    },
    { name: "searchName", label: "Name", type: "search", icon: FaSearch },
  ];

  const filteredSales = applyFilters(sales, filters);

  // Handle Change, Edit, Save, Cancel, and add functions
  const handleSaleChange = (fieldName, value) => {
    console.log(`Updating ${fieldName} with value: ${value}`);
    setNewSale((prevSale) => {
      const updatedSale = { ...prevSale, [fieldName]: value };

      console.log("Updated Sale:", updatedSale);

      // Update unit price if productname or isWithBottle changes
      if (fieldName === "productname" || fieldName === "isWithBottle") {
        const selectedProduct = products.find(
          (product) => product.productname === updatedSale.productname
        );
        console.log("Selected Product:", selectedProduct);

        if (selectedProduct) {
          updatedSale.unitprice =
            updatedSale.isWithBottle === "yes" ||
            updatedSale.isWithBottle === "no"
              ? selectedProduct.sellPriceLLwithBottle
              : selectedProduct.sellPriceLLwithoutBottle;

          // Debug: Log updated unitprice
          console.log("Updated Unit Price:", updatedSale.unitprice);
        }
      }

      // Recalculate total amount if quantity, unitprice, or isWithBottle changes
      if (["quantity", "unitprice"].includes(fieldName)) {
        const quantity = parseFloat(updatedSale.quantity) || 0;
        const unitprice = parseFloat(updatedSale.unitprice) || 0;
        updatedSale.totalamount = (quantity * unitprice).toFixed(2);
      }

      return updatedSale;
    });
  };

  const handleEditChange = (index, field, value, isNew) => {
    if (isNew) {
      const updatedNewSales = [...newSales];
      updatedNewSales[index] = { ...updatedNewSales[index], [field]: value };

      // Recalculate dependent fields for new sales
      if (field === "isWithBottle" || field === "productname") {
        const selectedProduct = products.find(
          (product) =>
            product.productname === updatedNewSales[index].productname
        );
        if (selectedProduct) {
          updatedNewSales[index].unitprice =
            value === "yes"
              ? selectedProduct.sellPriceLLwithBottle
              : selectedProduct.sellPriceLLwithoutBottle;
        }
      }
      // Recalculate totalamount when quantity, unitprice, or isWithBottle changes
      if (["quantity", "unitprice", "isWithBottle"].includes(field)) {
        const quantity = parseFloat(updatedNewSales[index].quantity) || 0;
        const unitprice = parseFloat(updatedNewSales[index].unitprice) || 0;
        updatedNewSales[index].totalamount = (quantity * unitprice).toFixed(2);
      }

      setNewSales(updatedNewSales);
    } else {
      const updatedSales = [...sales];
      updatedSales[index] = { ...updatedSales[index], [field]: value };

      // Recalculate dependent fields for existing sales
      if (field === "isWithBottle" || field === "productname") {
        const selectedProduct = products.find(
          (product) => product.productname === updatedSales[index].productname
        );
        if (selectedProduct) {
          updatedSales[index].unitprice =
            value === "yes"
              ? selectedProduct.sellPriceLLwithBottle
              : selectedProduct.sellPriceLLwithoutBottle;
        }
      }
      if (["quantity", "unitprice", "isWithBottle"].includes(field)) {
        const quantity = parseFloat(updatedSales[index].quantity) || 0;
        const unitprice = parseFloat(updatedSales[index].unitprice) || 0;
        updatedSales[index].totalamount = (quantity * unitprice).toFixed(2);
      }

      setSales(updatedSales);
    }
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
    const { productname, isWithBottle, quantity } = newSale;

    const selectedProduct = products.find(
      (product) => product.productname === productname
    );

    if (!selectedProduct) {
      console.error("Product not found. Please select a valid product.");
      setShowValidationError(true);
      return;
    }

    // Calculate unitprice based on isWithBottle
    const unitprice =
      isWithBottle === "yes" || isWithBottle === "no"
        ? selectedProduct.sellPriceLLwithBottle
        : selectedProduct.sellPriceLLwithoutBottle;

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
        isWithBottle: "",
        quantity: "",
        unitprice: "",
        totalamount: "",
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
      header: "With Bottle",
      accessor: "isWithBottle",
      isEditable: true,
      type: "select",
      options: ["yes", "no"],
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

  // pagination
  const { currentPage, rowsPerPage } = pagination;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedSales = filteredSales.slice(
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
          onEdit={handleEditChange}
          onDelete={(idOrIndex, isNewSale) => {
            if (idOrIndex !== undefined && idOrIndex !== null) {
              handleDelete(idOrIndex, isNewSale, "sales", setSales);
            } else {
              console.error("Delete target is not properly set:", idOrIndex);
            }
          }}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={(index, isNew) =>
            cancelEdit({
              index,
              isNew,
              newItems: newSales,
              setNewItems: setNewSales,
              items: sales,
              setItems: setSales,
              originalItems,
              setOriginalItems,
            })
          }
          onToggleEditMode={handleToggleEditMode}
        />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={Math.ceil(filteredSales.length / pagination.rowsPerPage)}
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
                type="iswithBottle"
                options={withBottles}
                setOptions={setWithBottles}
                selectedOption={newSale.isWithBottle}
                setSelectedOption={(value) =>
                  setNewSale((prev) => ({ ...prev, isWithBottle: value }))
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
