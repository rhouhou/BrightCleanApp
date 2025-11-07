export const fetchItems = async (endpoint) => {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Failed to fetch data");
  return response.json();
};

export const saveEdit = async ({
  item,
  index,
  isNew,
  newItems,
  setNewItems,
  items,
  setItems,
  apiEndpoint,
  setSuccessMessage,
}) => {
  if (isNew) {
    if (!newItems) {
      console.error("newItems is undefined in saveEdit");
      return;
    }
    const updatedNewItems = [...newItems];
    updatedNewItems[index].isEditing = false;
    setNewItems(updatedNewItems);
  } else {
    if (!items) {
      console.error("items is undefined in saveEdit");
      return;
    }
    try {
      const response = await fetch(`${apiEndpoint}/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Failed to save changes");
      const updatedItems = items.map((it) =>
        it._id === item._id ? { ...item, isEditing: false } : it
      );
      setItems(updatedItems);
      if (setSuccessMessage) {
        setSuccessMessage("Changes saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving item:", error);
    }
  }
};

export const cancelEdit = ({
  index,
  isNew,
  newItems,
  setNewItems,
  items,
  setItems,
  originalItems,
  setOriginalItems,
}) => {
  if (isNew) {
    const updatedNewItems = [...newItems];
    updatedNewItems[index].isEditing = false;
    setNewItems(updatedNewItems);
  } else {
    const updatedItems = [...items];
    if (originalItems[index]) {
      updatedItems[index] = { ...originalItems[index], isEditing: false };
    } else {
      updatedItems[index].isEditing = false;
    }
    setItems(updatedItems);
    setOriginalItems((prev) => {
      const updatedOriginalItems = { ...prev };
      delete updatedOriginalItems[index];
      return updatedOriginalItems;
    });
  }
};

export const handleDelete = async (
  idOrIndex,
  isNewItem = false,
  type = "sales",
  setItems
) => {
  if (isNewItem) {
    // Handle deletion of a new item (client-side only)
    setItems((prevItems) => prevItems.filter((_, i) => i !== idOrIndex));
  } else {
    try {
      if (!idOrIndex) {
        console.error("Invalid ID provided for deletion:", idOrIndex);
        return;
      }

      const response = await fetch(`/api/${type}/${idOrIndex}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type} from the database`);
      }

      setItems((prevItems) =>
        prevItems.filter((item) => item._id !== idOrIndex)
      );
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  }
};

export const handleDeleteAndCleanup = async ({
  idOrIndex,
  isNewItem = false,
  type = "sales",
  items,
  setItems,
  newItems = [],
  setNewItems = () => {},
  cleanupConfig = [],
}) => {
  let updatedItems = items;
  let updatedNewItems = newItems;

  if (isNewItem) {
    // Handle deletion of a new item (client-side only)
    updatedNewItems = newItems.filter((_, i) => i !== idOrIndex);
    setNewItems(updatedNewItems);
  } else {
    try {
      if (!idOrIndex) {
        console.error("Invalid ID provided for deletion:", idOrIndex);
        return;
      }
      const response = await fetch(`/api/${type}/${idOrIndex}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type} from the database`);
      }
      updatedItems = items.filter((item) => item._id !== idOrIndex);
      setItems(updatedItems);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      return;
    }
  }
  // Cleanup related items
  cleanupConfig.forEach(({ setter, getValue }) => {
    const used = new Set([
      ...updatedItems.map(getValue),
      ...updatedNewItems.map(getValue),
    ]);
    setter((prev) => prev.filter((v) => used.has(v)));
  });
};

export const applyFilters = (sales, filters) => {
  const {
    fromDate,
    toDate,
    selectedBusinessType,
    selectedPriceTier,
    searchName,
  } = filters;

  // Apply filters
  return sales.filter((sale) => {
    // Check date range filter
    const matchesDateRange = (() => {
      if (!fromDate && !toDate) return true;
      const saleDate = new Date(sale.dateOfPurchase);
      if (fromDate && toDate) {
        return saleDate >= new Date(fromDate) && saleDate <= new Date(toDate);
      } else if (fromDate) {
        return saleDate >= new Date(fromDate);
      } else if (toDate) {
        return saleDate <= new Date(toDate);
      }
    })();

    // Check business type filter
    const matchesBusinessType = selectedBusinessType
      ? sale.businessType === selectedBusinessType
      : true;

    // Check "Price Tier" filter
    const matchesPriceTier = selectedPriceTier
      ? sale.priceTier === selectedPriceTier
      : true;

    // Check product name filter
    const matchesName = searchName
      ? sale.productname.toLowerCase().includes(searchName.toLowerCase())
      : true;

    // Return true if all filters match
    return (
      matchesDateRange &&
      matchesBusinessType &&
      matchesPriceTier &&
      matchesName
    );
  });
};

export const applyExpenseFilters = (expenses, filters) => {
  const { fromDate, toDate, selectedCategory, searchName } = filters;

  // Apply filters
  return expenses.filter((expense) => {
    // Check date range filter
    const matchesDateRange = (() => {
      if (!fromDate && !toDate) return true;
      const expenseDate = new Date(expense.dateOfExpense);
      if (fromDate && toDate) {
        return (
          expenseDate >= new Date(fromDate) && expenseDate <= new Date(toDate)
        );
      } else if (fromDate) {
        return expenseDate >= new Date(fromDate);
      } else if (toDate) {
        return expenseDate <= new Date(toDate);
      }
    })();

    // Check business type filter
    const matchesCategory = selectedCategory
      ? expense.category === selectedCategory
      : true;

    // Check product name filter
    const matchesName = searchName
      ? expense.description.toLowerCase().includes(searchName.toLowerCase())
      : true;

    // Return true if all filters match
    return matchesDateRange && matchesCategory && matchesName;
  });
};

export const applyProductFilters = (products, filters) => {
  const { selectedCategory, selectedScent, selectedColor, searchName } =
    filters;

  // Apply filters
  return products.filter((product) => {
    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;

    const matchesScent = selectedScent ? product.scent === selectedScent : true;

    const matchesColor = selectedColor ? product.color === selectedColor : true;

    // Check product name filter
    const matchesName = searchName
      ? product.productname.toLowerCase().includes(searchName.toLowerCase())
      : true;

    // Return true if all filters match
    return matchesCategory && matchesScent && matchesColor && matchesName;
  });
};

export const applyMaterialFilters = (materials, filters) => {
  const { searchName } = filters;

  // Apply filters
  return materials.filter((material) => {
    // Check material name filter
    const matchesName = searchName
      ? material.IDmaterial.toLowerCase().includes(searchName.toLowerCase())
      : true;

    // Return true if all filters match
    return matchesName;
  });
};
