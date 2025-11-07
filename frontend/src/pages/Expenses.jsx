import React, { useState, useEffect } from "react";
import { FaPlus, FaSave, FaMinus, FaSearch } from "react-icons/fa";
import DropdownWithAddNew from "../components/DropDownWithAddNew";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters.jsx";
import {
  fetchItems,
  saveEdit,
  cancelEdit,
  handleDeleteAndCleanup,
  applyExpenseFilters,
} from "../utils/generalUtils.js";
import ItemsTable from "../components/ItemsTable.jsx";

const Expenses = () => {
  const initialExpense = () => ({
    transactionsEXP: `EXP-TX-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`,
    dateOfExpense: "",
    category: "",
    description: "",
    weightInGrams: "",
    paidInLL: "",
    exchangeRate: "",
    paidInUSD: "",
    unitPriceInUSD: "",
  });
  const [newExpense, setNewExpense] = useState(initialExpense());
  const [expenses, setExpenses] = useState([]);
  const [newExpenses, setNewExpenses] = useState([]); // Array to store multiple new expenses
  const [categories, setCategories] = useState([
    "Purchases & Supplies",
    "Travel & Transportation",
    "Course & Consultation Fees",
    "Regular Facility Expenses",
    "Irregular Facility Expenses",
  ]);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    selectedCategory: "",
    searchName: "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 5,
  });
  const [originalItems, setOriginalItems] = useState({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [loading, setLoading] = useState();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const expensesData = await fetchItems("/api/expenses");
        console.log("Fetched Expenses Data:", expensesData);

        const formattedExpenses = expensesData.map((expense) => ({
          ...expense,
          isEditing: false,
        }));

        setExpenses((prevExpenses) => {
          const updatedExpenses = formattedExpenses.map((mat) => {
            const prevItem = prevExpenses.find((prev) => prev._id === mat._id);
            return prevItem ? { ...mat, isEditing: prevItem.isEditing } : mat;
          });

          // Reset Pagination
          setPagination((prev) => ({
            ...prev,
            totalItems: updatedExpenses.length,
            totalPages: Math.ceil(updatedExpenses.length / prev.rowsPerPage),
            currentPage: 1, // Reset to first page
          }));

          return updatedExpenses;
        });
      } catch (error) {
        console.error("Error fetching expenses data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isValidExpense = (expense) => {
    return (
      expense.dateOfExpense &&
      expense.category &&
      expense.description &&
      expense.weightInGrams &&
      expense.paidInLL &&
      expense.exchangeRate &&
      expense.paidInUSD
    );
  };

  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  const handleResetFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      selectedCategory: "",
      searchName: "",
    });
  };

  const expensesFiltersConfig = [
    { name: "fromDate", label: "From:", type: "date" },
    { name: "toDate", label: "To:", type: "date" },
    {
      name: "selectedCategory",
      label: "Category",
      type: "select",
      options: categories,
    },
    { name: "searchName", label: "Name", type: "search", icon: FaSearch },
  ];

  const filteredExpenses = applyExpenseFilters(expenses, filters);

  const handleExpenseChange = (fieldName, value) => {
    setNewExpense((prevExpense) => {
      const updatedExpense = { ...prevExpense, [fieldName]: value };

      const ll = parseFloat(updatedExpense.paidInLL);
      const rate = parseFloat(updatedExpense.exchangeRate);
      const usd = parseFloat(updatedExpense.paidInUSD);

      if (
        (fieldName === "paidInLL" || fieldName === "exchangeRate") &&
        !isNaN(ll) &&
        !isNaN(rate) &&
        rate != 0
      ) {
        updatedExpense.paidInUSD = (ll / rate).toFixed(2);
      }

      if (fieldName === "paidInUSD") {
        updatedExpense.paidInLL = "0";
      }

      const weight = parseFloat(updatedExpense.weightInGrams);
      const base = !isNaN(usd) ? usd : 0;
      if (!isNaN(weight) && weight > 0) {
        updatedExpense.unitPriceInUSD = (base / weight).toFixed(5);
      }

      return updatedExpense;
    });
  };

  const handleEditChange = (index, field, value, isNew) => {
    const updateList = isNew ? [...newExpenses] : [...expenses];
    const original = updateList[index];
    if (!original) return console.error("No item to edit at", index);
    const item = { ...original };
    item[field] = value;

    const ll = parseFloat(item.paidInLL);
    const rate = parseFloat(item.exchangeRate);
    let usd = parseFloat(item.paidInUSD);

    if (
      (field === "paidInLL" || field === "exchangeRate") &&
      !isNaN(ll) &&
      !isNaN(rate) &&
      rate !== 0
    ) {
      usd = ll / rate;
      item.paidInUSD = usd.toFixed(2);
    }

    if (field === "paidInUSD") {
      item.paidInLL = "0";
      usd = parseFloat(item.paidInUSD);
    }

    // 5️⃣ recompute unitPriceInUSD
    const weight = parseFloat(item.weightInGrams);
    if (!isNaN(weight) && weight > 0) {
      item.unitPriceInUSD = (usd / weight).toFixed(5);
    }

    updateList[index] = item;

    if (isNew) {
      setNewExpenses(updateList);
    } else {
      setExpenses(updateList);
    }
  };

  const handleSaveEdit = (expense, index, isNew) => {
    saveEdit({
      item: expense,
      index,
      isNew,
      newItems: newExpenses,
      items: expenses,
      setItems: setExpenses,
      setNewItems: setNewExpenses,
      apiEndpoint: "/api/expenses",
      setSuccessMessage,
    });
  };

  const handleToggleEditMode = (index, isNew) => {
    if (isNew) {
      const updatedNewItems = [...newExpenses];
      if (!updatedNewItems[index])
        return console.error("No new item at:", index);
      updatedNewItems[index].isEditing = true;
      setNewExpenses(updatedNewItems);
    } else {
      const updatedItems = [...expenses];
      if (!updatedItems[index]) return console.error("No product at:", index);
      // Save the original value before setting edit mode
      setOriginalItems((prev) => ({
        ...prev,
        [index]: { ...updatedItems[index] },
      }));

      updatedItems[index].isEditing = true;
      setExpenses(updatedItems);
    }
  };

  const handleAddAndSaveExpense = async () => {
    const { paidInUSD, weightInGrams } = newExpense;
    const parsedPaidInUSD = parseFloat(paidInUSD);
    const parsedWeightInGrams = parseFloat(weightInGrams);

    if (
      isNaN(parsedPaidInUSD) ||
      isNaN(parsedWeightInGrams) ||
      parsedWeightInGrams === 0
    ) {
      console.error(
        "Invalid values for paidInUSD or weightInGrams. Please provide valid numbers."
      );
      setShowValidationError(true);
      return;
    }

    const unitPriceInUSD = Number(
      (parsedPaidInUSD / parsedWeightInGrams).toFixed(5)
    );

    const generatedExpense = {
      ...newExpense,
      unitPriceInUSD,
      isNew: true,
    };

    if (!isValidExpense(generatedExpense)) {
      console.log(generatedExpense);
      console.error("Validation failed. Please fill all required fields.");
      setShowValidationError(true);
      return;
    }

    try {
      // Save to the backend
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedExpense),
      });

      if (!response.ok) {
        throw new Error("Failed to save the expense to the backend");
      }

      const savedExpense = await response.json();

      // Update the save list with the saved expense from the backend
      setExpenses((prev) => [savedExpense, ...prev]);

      // Reset the form
      setNewExpense({
        transactionsEXP: `EXP-TX-${Date.now()}-${Math.floor(
          Math.random() * 10000
        )}`,
        dateOfExpense: "",
        category: "",
        description: "",
        weightInGrams: "",
        paidInLL: "",
        exchangeRate: "",
        paidInUSD: "",
        unitPriceInUSD: "",
      });

      setShowValidationError(false);
      setIsFormVisible(false); // Collapse the form after saving
      console.log("Expense added and saved successfully:", savedExpense);

      // Optionally show a success message
      setSuccessMessage("Expense added and saved successfully!");
      console.log("Success message:", successMessage);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving expense:", error.message);
    }
  };

  const expensesColumns = [
    {
      header: "Transactions",
      accessor: "transactionsEXP",
      id: "transactionsEXP",
      isEditable: false,
    },
    {
      header: "Expense date",
      accessor: "dateOfExpense",
      id: "dateOfExpense",
      type: "date",
      isEditable: true,
    },
    {
      header: "Category",
      accessor: "category",
      id: "category",
      isEditable: true,
      type: "select",
      options: categories,
    },
    {
      header: "Description",
      accessor: "description",
      id: "description",
      isEditable: true,
      type: "text",
    },
    {
      header: "Weight In Grams",
      accessor: "weightInGrams",
      id: "weightInGrams",
      isEditable: true,
      type: "number",
    },
    {
      header: "Paid in LL",
      accessor: "paidInLL",
      id: "paidInLL",
      isEditable: true,
      type: "number",
    },
    {
      header: "Exchange Rate",
      accessor: "exchangeRate",
      id: "exchangeRate",
      isEditable: true,
      type: "number",
    },
    {
      header: "Paid ($)",
      accessor: "paidInUSD",
      id: "paidInUSD",
      isEditable: true,
      type: "number",
    },
    {
      header: "Unit Price ($)",
      accessor: "unitPriceInUSD",
      id: "unitPriceInUSD",
      isEditable: true,
      type: "number",
    },
  ];

  const onPageEdit = (pageIndex, column, rawValue, isNew) => {
    const activeList = filters.searchName ? filteredExpenses : expenses;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    if (!activeItem) return console.error("No item at pageIndex", pageIndex);

    // 3) find its index in the **full** array
    const fullList = isNew ? newExpenses : expenses;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id //|| m.description === activeItem.description
    );
    if (originalIndex === -1)
      return console.error("Can’t find original item", activeItem);

    handleEditChange(originalIndex, column, rawValue, isNew);
  };

  const onPageToggle = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredExpenses : expenses;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newExpenses : expenses;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id //|| m.description === activeItem.description
    );

    handleToggleEditMode(originalIndex, isNew);
  };

  const onPageSave = (item, pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredExpenses : expenses;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    if (!activeItem) return console.error("No item at pageIndex", pageIndex);

    const fullList = isNew ? newExpenses : expenses;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id //|| m.description === activeItem.description
    );

    if (originalIndex === -1) {
      console.error("Could not find original item to save", activeItem);
      return;
    }
    handleSaveEdit(item, originalIndex, isNew);
  };

  const onPageCancel = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredExpenses : expenses;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newExpenses : expenses;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id //|| m.transactionsEXP === activeItem.transactionsEXP
    );

    cancelEdit({
      index: originalIndex,
      isNew,
      newItems: newExpenses,
      setNewItems: setNewExpenses,
      items: expenses,
      setItems: setExpenses,
      originalItems,
      setOriginalItems,
    });
  };

  // pagination
  const { currentPage, rowsPerPage } = pagination;
  const activeExpenses = filteredExpenses;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedExpenses = activeExpenses.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  return (
    <div>
      {/*Section 1*/}
      <div>
        <div>
          <h1 className="page-title">Expenses Overview</h1>
        </div>

        {/* Filters */}
        <Filters
          filtersConfig={expensesFiltersConfig}
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

      {/* Table to display expenses */}
      <div className="table-panel">
        <ItemsTable
          columns={expensesColumns}
          items={paginatedExpenses}
          onEdit={onPageEdit}
          onDelete={(idOrIndex, isNewExpense) => {
            if (idOrIndex !== undefined && idOrIndex !== null) {
              handleDeleteAndCleanup({
                idOrIndex,
                isNewItem: isNewExpense,
                type: "expenses",
                items: expenses,
                setItems: setExpenses,
                newItems: newExpenses,
                setNewItems: setNewExpenses,
                cleanupConfig: [
                  { setter: setCategories, getValue: (p) => p.category },
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
          totalPages={Math.ceil(activeExpenses.length / pagination.rowsPerPage)}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, currentPage: page }))
          }
        />
      </div>

      {/*Section 2: Add New Expense*/}
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

        {/* Expense Form */}

        {isFormVisible && (
          <div>
            <h1 className="page-title" style={{ marginTop: "5px" }}>
              Add New Expense
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "15px",
              }}
            >
              <DropdownWithAddNew
                type="category"
                options={categories}
                setOptions={setCategories}
                selectedOption={newExpense.category}
                setSelectedOption={(value) =>
                  setNewExpense((prev) => ({ ...prev, category: value }))
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
                  htmlFor="dateOfExpense"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Expense Date:
                </label>
                <input
                  id="dateOfExpense"
                  type="date"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newExpense.dateOfExpense}
                  onChange={(e) =>
                    handleExpenseChange("dateOfExpense", e.target.value)
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
                  htmlFor="description"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Description:
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newExpense.description}
                  onChange={(e) =>
                    handleExpenseChange("description", e.target.value)
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
                  htmlFor="weightInGrams"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Weight in Grams:
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
                  value={newExpense.weightInGrams}
                  onChange={(e) =>
                    handleExpenseChange("weightInGrams", e.target.value)
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
                  htmlFor="paidInLL"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Paid in LL:
                </label>
                <input
                  id="paidInLL"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newExpense.paidInLL}
                  onChange={(e) =>
                    handleExpenseChange("paidInLL", e.target.value)
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
                  htmlFor="exchangeRate"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Exchange Rate:
                </label>
                <input
                  id="exchangeRate"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newExpense.exchangeRate}
                  onChange={(e) =>
                    handleExpenseChange("exchangeRate", e.target.value)
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
                  Paid ($):
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
                  value={newExpense.paidInUSD}
                  onChange={(e) =>
                    handleExpenseChange("paidInUSD", e.target.value)
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
                  Please fill in all required fields before adding the expense.
                </div>
              )}

              <button
                className="button-savetb"
                onClick={handleAddAndSaveExpense}
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

export default Expenses;
