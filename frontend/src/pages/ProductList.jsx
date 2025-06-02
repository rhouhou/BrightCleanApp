import React, { useState, useEffect } from "react";
import { FaPlus, FaSave, FaMinus, FaSearch } from "react-icons/fa"; // Icons for buttons
import DropdownWithAddNew from "../components/DropDownWithAddNew";
import Filters from "../components/Filters.jsx";
import Pagination from "../components/Pagination";
import {
  fetchItems,
  saveEdit,
  cancelEdit,
  handleDeleteAndCleanup,
  applyProductFilters,
} from "../utils/generalUtils.js";
import ItemsTable from "../components/ItemsTable.jsx";

// Define your price tiers in one place:
const priceTierOptions = [
  {
    value: "retail_with_bottle",
    label: "Retail w/ Bottle (LL)",
    currency: "LL",
  },
  {
    value: "retail_without_bottle",
    label: "Retail w/o Bottle (LL)",
    currency: "LL",
  },
  {
    value: "wholesale_schools",
    label: "Wholesale (Schools) (LL) per Litre",
    currency: "LL",
  },
  {
    value: "wholesale_restaurants",
    label: "Wholesale (Restaurants) (LL) per Litre",
    currency: "LL",
  },
];

const ProductList = () => {
  const initialProduct = () => ({
    productId: "",
    category: "",
    scent: "",
    color: "",
    productname: "",
    bottlesize: "",
    bottlecost: "",
    cost: "",
    totalcost: "",
    prices: priceTierOptions.map(({ value, currency }) => ({
      tier: value,
      amount: "",
      currency,
    })),
  });

  const [newProduct, setNewProduct] = useState(initialProduct());
  const [products, setProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [categories, setCategories] = useState([
    "Handwash",
    "Laundry Detergent",
    "Floor Cleaner",
    "Dish Soap",
    "Odex Cleaner",
    "Flash Cleaner",
  ]);
  const [scents, setScents] = useState([
    "Amarij",
    "Apple",
    "Lavender",
    "Bubble",
  ]);
  const [colors, setColors] = useState([
    "Red",
    "Green",
    "Violet",
    "Pink",
    "blue",
    "colorless",
  ]);
  const [filters, setFilters] = useState({
    selectedCategory: "",
    selectedScent: "",
    selectedColor: "",
    searchName: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 5,
  });
  const [originalItems, setOriginalItems] = useState({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState();

  useEffect(() => {
    const c = parseFloat(newProduct.cost) || 0;
    const bc = parseFloat(newProduct.bottlecost) || 0;
    const sum = (c + bc).toFixed(2);
    setNewProduct((prev) => ({ ...prev, totalcost: sum }));
  }, [newProduct.cost, newProduct.bottlecost]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const productData = await fetchItems("/api/products");
        console.log("Fetched Products Data:", productData);

        const formattedProducts = productData.map((product) => ({
          ...product,
          isEditing: false,
          prices: priceTierOptions.map(({ value, currency }) => {
            const existing = product.prices?.find((p) => p.tier === value);
            return existing
              ? { ...existing, currency }
              : { tier: value, amount: 0, currency };
          }),
        }));

        setProducts((prevProducts) => {
          const updatedProducts = formattedProducts.map((mat) => {
            const prevItem = prevProducts.find((prev) => prev._id === mat._id);
            return prevItem ? { ...mat, isEditing: prevItem.isEditing } : mat;
          });

          // Reset Pagination
          setPagination((prev) => ({
            ...prev,
            totalItems: updatedProducts.length,
            totalPages: Math.ceil(updatedProducts.length / prev.rowsPerPage),
            currentPage: 1, // Reset to first page
          }));
          return updatedProducts;
        });
      } catch (err) {
        console.error("Error fetching products data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isValidProduct = (product) => {
    return (
      product.productId.trim() &&
      product.category.trim() &&
      product.scent.trim() &&
      product.color.trim() &&
      parseFloat(product.bottlesize) > 0 &&
      parseFloat(product.bottlecost) > 0 &&
      parseFloat(product.cost) > 0 &&
      parseFloat(product.totalcost) > 0 &&
      product.prices.every((p) => parseFloat(p.amount) > 0)
    );
  };

  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  const handleResetFilters = () => {
    setFilters({
      selectedCategory: "",
      selectedScent: "",
      selectedColor: "",
      searchName: "",
    });
  };

  const productsFiltersConfig = [
    {
      name: "selectedCategory",
      label: "Category",
      type: "select",
      options: categories,
    },
    {
      name: "selectedScent",
      label: "Scent",
      type: "select",
      options: scents,
    },
    {
      name: "selectedColor",
      label: "Color",
      type: "select",
      options: colors,
    },
    { name: "searchName", label: "Name", type: "search", icon: FaSearch },
  ];

  const filteredProducts = applyProductFilters(products, filters);

  const handleProductChange = (fieldName, value) => {
    setNewProduct((prevProduct) => {
      const updatedProduct = { ...prevProduct, [fieldName]: value };

      const clampNonNeg = (val) => {
        const n = parseFloat(val);
        if (isNaN(n)) return "";
        return Math.max(0, n);
      };

      if (
        [
          "cost",
          "bottlecost",
          "bottlesize",
          "retail_with_bottle",
          "retail_without_bottle",
          "wholesale_schools",
          "wholesale_restaurants",
        ].includes(fieldName)
      ) {
        // Clamp non-negative values for cost, bottlecost, and bottlesize
        updatedProduct[fieldName] = clampNonNeg(value);
        // Recalculate totalcost if cost or bottlecost changes
        if (fieldName === "cost" || fieldName === "bottlecost") {
          const c = parseFloat(updatedProduct.cost) || 0;
          const b = parseFloat(updatedProduct.bottlecost) || 0;
          updatedProduct.totalcost = (c + b).toFixed(2);
        }
      } else if (
        fieldName === "bottlesize" ||
        fieldName === "category" ||
        fieldName === "scent" ||
        fieldName === "color"
      ) {
        updatedProduct.productname = `${updatedProduct.category || ""}_${
          updatedProduct.scent || ""
        }_${updatedProduct.color || ""}_${updatedProduct.bottlesize}L`.trim();
      }
      return updatedProduct;
    });
  };

  const handlePriceChange = (index, rawValue) => {
    const raw = parseFloat(rawValue);
    const amount = isNaN(raw) ? 0 : Math.max(0, raw);

    setNewProduct((prev) => {
      const prices = [...prev.prices];
      prices[index] = {
        ...prices[index],
        amount,
      };
      return { ...prev, prices };
    });
  };

  const handleEditChange = (index, field, value, isNew) => {
    const updateList = isNew ? [...newProducts] : [...products];
    const itemToEdit = updateList[index];

    if (!itemToEdit) {
      console.error("Item to edit not found:", index);
      return;
    }

    const item = {
      ...itemToEdit,
      prices: itemToEdit.prices.map((p) => ({ ...p })),
    };

    if (field === "prices") {
      // ─── price-tier column ───────────────────────────────
      item.prices = item.prices.map((p) =>
        p.tier === value.tier ? { ...p, amount: value.amount } : p
      );
    } else if (
      ["bottlesize", "bottlecost", "cost", "totalcost"].includes(field)
    ) {
      const num = Math.max(0, parseFloat(value) || 0);
      item[field] = num;

      if (field === "cost" || field === "bottlecost") {
        item.totalcost = (
          parseFloat(item.cost) + parseFloat(item.bottlecost)
        ).toFixed(2);
      }

      // no need for bottlesize here to re-compute productname, we’ll do that below
    } else if (["category", "scent", "color"].includes(field)) {
      item[field] = value;
    }

    item.productname = `${item.category || ""}_${item.scent || ""}_${
      item.color || ""
    }_${item.bottlesize}L`.trim();

    updateList[index] = item;
    if (isNew) setNewProducts(updateList);
    else setProducts(updateList);
  };

  const handleSaveEdit = (product, index, isNew) => {
    saveEdit({
      item: product,
      index,
      isNew,
      newItems: newProducts,
      items: products,
      setItems: setProducts,
      setNewItems: setNewProducts,
      apiEndpoint: "/api/products",
      setSuccessMessage,
    });
  };

  const handleToggleEditMode = (index, isNew) => {
    if (isNew) {
      const updatedNewItems = [...newProducts];
      if (!updatedNewItems[index])
        return console.error("No new item at:", index);

      updatedNewItems[index].isEditing = true;
      setNewProducts(updatedNewItems);
    } else {
      const updatedItems = [...products];
      if (!updatedItems[index]) return console.error("No product at:", index);

      // Save the original value before setting edit mode
      setOriginalItems((prev) => ({
        ...prev,
        [index]: { ...updatedItems[index] },
      }));

      updatedItems[index].isEditing = true;
      setProducts(updatedItems);
    }
  };

  const handleAddAndSaveProduct = async () => {
    const { category, scent, color, bottlesize } = newProduct;

    const generatedProduct = {
      ...newProduct,
      productname: `${category || ""}_${scent || ""}_${color || ""}_${
        bottlesize || ""
      }L`.trim(),
      isNew: true,
    };

    if (!isValidProduct(generatedProduct)) {
      console.log(generatedProduct);
      console.error("Validation failed. Please fill all required fields.");
      setShowValidationError(true);
      return;
    }

    try {
      // Save to the backend
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedProduct),
      });

      if (!response.ok) {
        throw new Error("Failed to save the product to the backend");
      }

      const savedProduct = await response.json();
      savedProduct.prices = newProduct.prices.map((p) => ({
        tier: p.tier,
        amount: Math.max(0, parseFloat(p.amount) || 0),
        currency: p.currency,
      }));

      // Update the product list with the saved product from the backend
      setProducts((prev) => [savedProduct, ...prev]);

      // Reset the form
      setNewProduct({
        productId: "",
        category: "",
        scent: "",
        color: "",
        productname: "",
        bottlesize: "",
        bottlecost: "",
        cost: "",
        totalcost: "",
      });

      setShowValidationError(false);
      setIsFormVisible(false); // Collapse the form after saving
      console.log("Product added and saved successfully:", savedProduct);

      // Optionally show a success message
      setSuccessMessage("Product added and saved successfully!");
      console.log("Success message:", successMessage);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const baseColumns = [
    {
      id: "productId",
      header: "Product ID",
      accessor: "productId",
      type: "text",
      isEditable: false,
    },
    {
      id: "category",
      header: "Category",
      accessor: "category",
      type: "text",
      isEditable: false,
    },
    {
      id: "scent",
      header: "Scent",
      accessor: "scent",
      type: "text",
      isEditable: false,
    },
    {
      id: "color",
      header: "Color",
      accessor: "color",
      type: "text",
      isEditable: false,
    },
    {
      id: "productname",
      header: "Product Name",
      accessor: "productname",
      type: "text",
      isEditable: false,
    },
    {
      id: "bottlesize",
      header: "Bottle Size (L)",
      accessor: "bottlesize",
      type: "number",
      isEditable: true,
      min: 0,
      step: 1,
    },
    {
      id: "bottlecost",
      header: "Bottle Cost ($)",
      accessor: "bottlecost",
      type: "number",
      isEditable: true,
      min: 0,
      step: 1,
    },
    {
      id: "cost",
      header: "Cost ($)",
      accessor: "cost",
      type: "number",
      isEditable: true,
      min: 0,
      step: 1,
    },
    {
      id: "totalcost",
      header: "Total Cost ($)",
      accessor: "totalcost",
      type: "number",
      isEditable: false,
    },
  ];

  const priceColumns = priceTierOptions.map(({ value, label }) => {
    const [main, suffix] = label.split(/( per Litre)/);
    return {
      id: value,
      header: (
        <>
          {main}
          {suffix && (
            <>
              <br />
              <span className="italic font-semibold text-gray-400">
                {suffix.trim()}
              </span>
            </>
          )}
        </>
      ),
      accessor: (row) => {
        const tier = row.prices?.find((p) => p.tier === value);
        return tier ? tier.amount : "";
      },
      type: "number",
      isEditable: true,
      onEdit: (rowIndex, _, newVal, isNew) =>
        handleEditChange(
          rowIndex,
          "prices",
          { tier: value, amount: newVal },
          isNew
        ),
    };
  });

  const productColumns = [
    ...baseColumns,
    {
      header: "Prices",
      columns: priceColumns,
    },
  ];

  const onPageEdit = (pageIndex, column, rawValue, isNew) => {
    const activeList = filters.searchName ? filteredProducts : products;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    if (!activeItem) return console.error("No item at pageIndex", pageIndex);

    // 3) find its index in the **full** array
    const fullList = isNew ? newProducts : products;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.productId === activeItem.productId
    );
    if (originalIndex === -1)
      return console.error("Can’t find original item", activeItem);

    if (priceTierOptions.some((o) => o.value === column)) {
      // price-tier column
      const amount = Math.max(0, parseFloat(rawValue) || 0);
      handleEditChange(
        originalIndex,
        "prices",
        { tier: column, amount },
        isNew
      );
    } else {
      const isNumfield = [
        "bottlesize",
        "bottlecost",
        "cost",
        "totalcost",
      ].includes(column);
      const value = isNumfield
        ? Math.max(0, parseFloat(rawValue) || 0)
        : rawValue;
      handleEditChange(originalIndex, column, value, isNew);
    }
  };

  const onPageToggle = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredProducts : products;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newProducts : products;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.productId === activeItem.productId
    );

    handleToggleEditMode(originalIndex, isNew);
  };

  const onPageSave = (item, pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredProducts : products;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    if (!activeItem) return console.error("No item at pageIndex", pageIndex);

    const fullList = isNew ? newProducts : products;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.productId === activeItem.productId
    );

    if (originalIndex === -1) {
      console.error("Could not find original item to save", activeItem);
      return;
    }
    handleSaveEdit(item, originalIndex, isNew);
  };

  const onPageCancel = (pageIndex, isNew) => {
    const activeList = filters.searchName ? filteredProducts : products;
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const activeItem = activeList[start + pageIndex];
    const fullList = isNew ? newProducts : products;
    const originalIndex = fullList.findIndex(
      (m) => m._id === activeItem._id || m.productId === activeItem.productId
    );

    cancelEdit({
      index: originalIndex,
      isNew,
      newItems: newProducts,
      setNewItems: setNewProducts,
      items: products,
      setItems: setProducts,
      originalItems,
      setOriginalItems,
    });
  };

  // pagination
  const { currentPage, rowsPerPage } = pagination;
  const activeProducts = filteredProducts;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = activeProducts.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const formFields = [
    { name: "productId", label: "Product ID", type: "text", readOnly: false },
    {
      name: "bottlesize",
      label: "Bottle Size (L)",
      type: "number",
      readOnly: false,
    },
    {
      name: "bottlecost",
      label: "Bottle Cost ($)",
      type: "number",
      readOnly: false,
    },
    { name: "cost", label: "Cost ($)", type: "number", readOnly: false },
    {
      name: "totalcost",
      label: "Total Cost ($)",
      type: "number",
      readOnly: true,
    },
  ];

  return (
    <div>
      {/* Section 1 */}
      <div>
        <div>
          <h1 className="page-title">Products Overview</h1>
        </div>

        {/* Filters */}
        <Filters
          filtersConfig={productsFiltersConfig}
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
          columns={productColumns}
          items={paginatedProducts}
          onEdit={onPageEdit}
          onDelete={(idOrIndex, isNewProduct) => {
            if (idOrIndex !== undefined && idOrIndex !== null) {
              handleDeleteAndCleanup({
                idOrIndex,
                isNewItem: isNewProduct,
                type: "products",
                items: products,
                setItems: setProducts,
                newItems: newProducts,
                setNewItems: setNewProducts,
                cleanupConfig: [
                  { setter: setCategories, getValue: (p) => p.category },
                  { setter: setScents, getValue: (p) => p.scent },
                  { setter: setColors, getValue: (p) => p.color },
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
          totalPages={Math.ceil(activeProducts.length / pagination.rowsPerPage)}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, currentPage: page }))
          }
        />
      </div>

      {/* Section 2: Add New Product */}
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

        {/* Product Form */}
        {isFormVisible && (
          <div>
            <h1 className="page-title" style={{ marginTop: "5px" }}>
              Add New Product
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
                selectedOption={newProduct.category}
                setSelectedOption={(value) =>
                  setNewProduct((prev) => ({ ...prev, category: value }))
                }
              />

              <DropdownWithAddNew
                type="scent"
                options={scents}
                setOptions={setScents}
                selectedOption={newProduct.scent}
                setSelectedOption={(value) =>
                  setNewProduct((prev) => ({ ...prev, scent: value }))
                }
              />

              <DropdownWithAddNew
                type="color"
                options={colors}
                setOptions={setColors}
                selectedOption={newProduct.color}
                setSelectedOption={(value) =>
                  setNewProduct((prev) => ({ ...prev, color: value }))
                }
              />

              {formFields.map(({ name, label, type, readOnly }) => (
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
                  key={name}
                >
                  <label
                    className="text-gray-600"
                    style={{ fontWeight: "bold", margin: "0" }}
                  >
                    {label}:
                  </label>
                  <input
                    type={type}
                    placeholder={readOnly ? undefined : `Enter ${label}`}
                    style={{
                      outline: "none",
                      border: "none",
                      flex: 1,
                      color: readOnly ? "#555" : "#888",
                    }}
                    value={newProduct[name]}
                    readOnly={readOnly}
                    onChange={(e) =>
                      !readOnly && handleProductChange(name, e.target.value)
                    }
                  />
                </div>
              ))}

              {/* Dynamic price tiers */}
              {newProduct.prices.map((p, i) => {
                const { label } = priceTierOptions.find(
                  (o) => o.value === p.tier
                );
                return (
                  <div
                    key={p.tier}
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
                      className="text-gray-600"
                      style={{ fontWeight: "bold", margin: "0" }}
                    >
                      {label}:
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Enter price"
                      value={p.amount}
                      onChange={(e) => handlePriceChange(i, e.target.value)}
                      style={{
                        outline: "none",
                        border: "none",
                        flex: 1,
                        color: "#888",
                      }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </div>
                );
              })}
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
                  Please fill in all required fields before adding the product.
                </div>
              )}

              <button
                className="button-savetb"
                onClick={handleAddAndSaveProduct}
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

export default ProductList;
