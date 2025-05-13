import React, { useState, useEffect } from "react";
import { FaPlus, FaSave, FaMinus, FaSearch } from "react-icons/fa"; // Icons for buttons
import DropdownWithAddNew from "../components/DropDownWithAddNew";
import Filters from "../components/Filters.jsx";
import Pagination from "../components/Pagination";
import { fetchItems, saveEdit, cancelEdit, handleDelete, applyProductFilters } from "../utils/generalUtils.js";
import ItemsTable from "../components/ItemsTable.jsx";

const ProductList = () => {

  const initialProduct = () => ({
    productId: "",
    category: "",
    scent: "",
    color: "",
    productname: "",
    botlesize: "",
    cost: "",
    totalcost: "",
    sellPriceLLwithBottle: "",
    sellPriceUSDwithBottle: "",
    sellPriceLLwithoutBottle: "",
    sellPriceUSDwithoutBottle: "",
  });

  const [newProduct, setNewProduct] = useState(initialProduct()); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState();
  const [newProducts, setNewProducts] = useState([]); 
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
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
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 5,
  });
  const [originalItems, setOriginalItems] = useState({});
 
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const productData = await fetchItems("/api/products");
        console.log("Fetched Products Data:", productData);

        setProducts(
          productData.map((product) => ({
            ...product,
            isEditing: false,
          }))
        );
      } catch (err) {
        console.error("Error fetching products data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  const isValidProduct = (product) => {
    return (
      product.productId.trim() &&
    product.category.trim() &&
    product.scent.trim() &&
    product.color.trim() &&
    parseFloat(product.botlesize) > 0 &&
    parseFloat(product.cost) > 0 &&
    parseFloat(product.totalcost) > 0 &&
    parseFloat(product.sellPriceLLwithBottle) > 0 &&
    parseFloat(product.sellPriceLLwithoutBottle) > 0
    );
  };

  const confirmDelete = (idOrIndex, isNewProduct) => {
    console.log(
      `Confirm delete: ID or Index: ${idOrIndex}, isNew: ${isNewProduct}`
    );
    setDeleteTarget({ idOrIndex, isNewProduct });
  };

  const [filters, setFilters] = useState({
    selectedCategory: "",
    selectedScent: "",
    selectedColor: "",
    searchName: "",
  });

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
      options: ["Handwash", "Laundry Detergent", "Floor Cleaner", "Dish Soap", "Odex Cleaner", "Flash Cleaner",],
    },
    {
      name: "selectedScent",
      label: "Scent",
      type: "select",
      options: [ "Amarij", "Apple", "Lavender", "Bubble",],
    },
    {
      name: "selectedColor",
      label: "Color",
      type: "select",
      options: ["Red", "Green", "Violet", "Pink", "blue", "colorless",],
    },
    { name: "searchName", label: "Name", type: "search", icon: FaSearch },
  ];

  const filteredProducts = applyProductFilters(products, filters);

  const handleProductChange = (fieldName, value) => {
    console.log(`Updating ${fieldName} with value: ${value}`);
    setNewProduct((prevProduct) => {
      const updatedProduct = { ...prevProduct, [fieldName]: value };
      return updatedProduct;
    });
  };

  const handleEditChange = (index, field, value, isNew) => {
    const updateProduct = (product, isNew) => {
      // Update the changed field
      const updatedProduct = { ...product, [field]: value };

      // Recalculate `productname` if category, scent, or color changes
      if (["category", "scent", "color"].includes(field)) {
        updatedProduct.productname = `${updatedProduct.category || ""}_${
          updatedProduct.scent || ""
        }_${updatedProduct.color || ""}`.trim();
      }

      // Recalculate `sellPriceUSDwithBottle` and `sellPriceUSDwithoutBottle` if relevant fields change
      if (
        ["sellPriceLLwithBottle", "sellPriceLLwithoutBottle"].includes(field)
      ) {
        if (field === "sellPriceLLwithBottle") {
          updatedProduct.sellPriceUSDwithBottle = (value / 90000).toFixed(2);
        }
        if (field === "sellPriceLLwithoutBottle") {
          updatedProduct.sellPriceUSDwithoutBottle = (value / 90000).toFixed(2);
        }
      }

      return updatedProduct;
    };

    if (isNew) {
      // Handle edits for new products
      const updatedNewProducts = [...newProducts];
      updatedNewProducts[index] = updateProduct(
        updatedNewProducts[index],
        true
      );
      setNewProducts(updatedNewProducts);
    } else {
      // Handle edits for existing products
      const updatedProducts = [...products];
      updatedProducts[index] = updateProduct(updatedProducts[index], false);
      setProducts(updatedProducts);
    }
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
      updatedNewItems[index].isEditing = true;
      setNewProducts(updatedNewItems);
    } else {
      const updatedItems = [...products];

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
    const {
      category,
      scent,
      color,
      sellPriceLLwithBottle,
      sellPriceLLwithoutBottle,
    } = newProduct;

    const generatedProduct = {
      ...newProduct,
      productname: `${category || ""}_${scent || ""}_${color || ""}`.trim(),
      sellPriceUSDwithBottle: sellPriceLLwithBottle
        ? (sellPriceLLwithBottle / 90000).toFixed(2)
        : "",
      sellPriceUSDwithoutBottle: sellPriceLLwithoutBottle
        ? (sellPriceLLwithoutBottle / 90000).toFixed(2)
        : "",
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

      // Update the product list with the saved product from the backend
      setProducts((prev) => [savedProduct, ...prev]);

      // Reset the form
      setNewProduct({
        productId: "",
        category: "",
        scent: "",
        color: "",
        productname: "",
        botlesize: "",
        cost: "",
        totalcost: "",
        sellPriceLLwithBottle: "",
        sellPriceUSDwithBottle: "",
        sellPriceLLwithoutBottle: "",
        sellPriceUSDwithoutBottle: "",
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

  const productsColumns = [
    {
      header: "Product ID",
      accessor: "productId",
      type: "text",
      isEditable: false,
    },
    {
      header: "Category",
      accessor: "category",
      isEditable: false,
      type: "select",
      options: ["Handwash",
    "Laundry Detergent",
    "Floor Cleaner",
    "Dish Soap",
    "Odex Cleaner",
    "Flash Cleaner",],
    },
    {
      header: "Scent",
      accessor: "scent",
      isEditable: false,
      type: "select",
      options: [ "Amarij",
        "Apple",
        "Lavender",
        "Bubble",],
    },
    {
      header: "Color",
      accessor: "color",
      isEditable: false,
      type: "select",
      options: ["Red",
    "Green",
    "Violet",
    "Pink",
    "blue",
    "colorless",],
    },
    {
      header: "Product Name",
      accessor: "productname",
      isEditable: false,
      type: "text",
    },
    {
      header: "Bottle Size",
      accessor: "botlesize",
      isEditable: true,
      type: "number",
    },
    {
      header: "Cost ($)",
      accessor: "cost",
      isEditable: true,
      type: "number",
    },
    {
      header: "Total Cost",
      accessor: "totalcost",
      isEditable: true,
      type: "number",
    },
    {
      header: "Price with Bottle (LL)",
      accessor: "sellPriceLLwithBottle",
      isEditable: true,
      type: "number",
    },
    {
      header: "Price with Bottle ($)",
      accessor: "sellPriceUSDwithBottle",
      isEditable: false,
      type: "number",
    },
    {
      header: "Price without Bottle (LL)",
      accessor: "sellPriceLLwithoutBottle",
      isEditable: false,
      type: "number",
    },
    {
      header: "Price without Bottle ($)",
      accessor: "sellPriceUSDwithoutBottle",
      isEditable: false,
      type: "number",
    },
  ];


 // pagination
 const { currentPage, rowsPerPage } = pagination;
 const startIndex = (currentPage - 1) * rowsPerPage;
 const paginatedProducts = filteredProducts.slice(
   startIndex,
   startIndex + rowsPerPage
 );


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
          columns={productsColumns}
          items={paginatedProducts}
          onEdit={handleEditChange}
          onDelete={(idOrIndex, isNewProduct) => {
            if (idOrIndex !== undefined && idOrIndex !== null) {
              handleDelete(idOrIndex, isNewProduct, "products", setProducts);
              setDeleteTarget(null)
            } else {
              console.error("Delete target is not properly set:", idOrIndex);
            }
          }}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={(index, isNew) =>
            cancelEdit({
              index,
              isNew,
              newItems: newProducts,
              setNewItems: setNewProducts,
              items: products,
              setItems: setProducts,
              originalItems,
              setOriginalItems,
            })
          }
          onToggleEditMode={handleToggleEditMode}
        />

          {/* Pagination */}
          <Pagination
          currentPage={pagination.currentPage}
          totalPages={Math.ceil(filteredProducts.length / pagination.rowsPerPage)}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, currentPage: page }))
          }
        />
      </div>

      {/* Section 2: Add New Product */}
      <div style={{
        margin: "20px auto", // Center the section horizontally
        maxWidth: "95%", // Aligns with table width
        display: "flex",
        flexDirection: "column", // Stack elements vertically
        gap: "15px", // Adds space between button and table
      }}>
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
                  htmlFor="productId"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Product ID:
                </label>
                <input
                  id="productId"
                  type="text"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newProduct.productId}
                  onChange={(e) =>
                    handleProductChange("productId", e.target.value)
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
                  htmlFor="botlesize"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Bottle Size:
                </label>
                <input
                  id="botlesize"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newProduct.botlesize}
                  min={0}
                  onChange={(e) =>
                    handleProductChange("botlesize", e.target.value)
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
                  htmlFor="cost"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Cost ($):
                </label>
                <input
                  id="cost"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newProduct.cost}
                  min={0}
                  onChange={(e) => handleProductChange("cost", e.target.value)}
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
                  htmlFor="totalcost"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Total Cost ($):
                </label>
                <input
                  id="totalcost"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newProduct.totalcost}
                  min={0}
                  onChange={(e) =>
                    handleProductChange("totalcost", e.target.value)
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
                  htmlFor="sellPriceLLwithBottle"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Price with Bottle (LL):
                </label>
                <input
                  id="sellPriceLLwithBottle"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newProduct.sellPriceLLwithBottle}
                  min={0}
                  onChange={(e) =>
                    handleProductChange("sellPriceLLwithBottle", e.target.value)
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
                  htmlFor="sellPriceLLwithoutBottle"
                  className="text-gray-600"
                  style={{ fontWeight: "bold", margin: "0" }}
                >
                  Price without Bottle (LL):
                </label>
                <input
                  id="sellPriceLLwithoutBottle"
                  type="number"
                  placeholder="Enter Value"
                  style={{
                    outline: "none",
                    border: "none",
                    flex: 1,
                    color: "#888",
                  }}
                  value={newProduct.sellPriceLLwithoutBottle}
                  min={0}
                  onChange={(e) =>
                    handleProductChange(
                      "sellPriceLLwithoutBottle",
                      e.target.value
                    )
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
