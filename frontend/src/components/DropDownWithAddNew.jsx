import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";

const DropdownWithAddNew = ({ type, options, setOptions, selectedOption, setSelectedOption }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions((prev) => [...prev, newOption.trim()]);
      setSelectedOption(newOption.trim());
    }
    setIsAdding(false);
    setNewOption("");
  };

  const handleDeleteSelectedOption = () => {
    if (selectedOption) {
      setOptions((prev) => prev.filter((item) => item !== selectedOption));
      setSelectedOption(""); // Clear the selected option
    }
  };
  return (
    <div  style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #ccc",
        borderRadius: "5px",
        padding: "10px",
        backgroundColor: "#fff",
        width: "450px",
        gap: "10px",
      }}>
      <label htmlFor={type} 
      className="text-gray-600"
      style={{fontWeight: "bold", margin: "0"}}>{`${type.charAt(0).toUpperCase() + type.slice(1)}:`}</label>
      <select
        id={type}
        value={isAdding ? `add-new-${type}` : selectedOption}
        onChange={(e) => {
          if (e.target.value === `add-new-${type}`) {
            setIsAdding(true);
          } else {
            setSelectedOption(e.target.value);
            setIsAdding(false);
          }
        }}
        style={{ outline: "none", border: "none", flex: 1, backgroundColor: "transparent", color: selectedOption.type ? "#008CBA": "#888", }}
      >
        <option value="" disabled>
          Select a {type.charAt(0).toUpperCase() + type.slice(1)}
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
        <option value={`add-new-${type}`}>+ Add New {type.charAt(0).toUpperCase() + type.slice(1)}</option>
      </select>

      {isAdding ? (
        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder={`Enter new ${type}`}
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            style={{
              padding: "8px",
              marginRight: "5px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button
            onClick={handleAddOption}
            style={{
              padding: "8px 12px",
              backgroundColor: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      ):(
        selectedOption && (
          <button
            onClick={handleDeleteSelectedOption}
            className="button button-delete"
          >
            <FaTrashAlt />
          </button>

        )  
      )}
    </div>
  );
};

export default DropdownWithAddNew;
