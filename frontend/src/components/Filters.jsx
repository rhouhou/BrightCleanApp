import React from "react";
import { FaUndo } from "react-icons/fa";

const Filters = ({ filtersConfig, filters, setFilters, onResetFilters  }) => {
  return (
    <div className="filter-panel">
      {filtersConfig.map((filter) => {
        switch (filter.type) {
          case "select":
            return (
                <select
                  key={filter.name}
                  id={filter.name}
                  value={filters[filter.name]}
                  onChange={(e) => {
                    const newFilters = {
                      ...filters,
                      [filter.name]: e.target.value,
                    };
                    console.log("Updated Filters (Select):", newFilters); // Debug Log
                    setFilters(newFilters);
                  }}
                  className="text-slate-400 px-3 py-2 border rounded-md w-46 sm:w-60 bg-white h-[38px]"
                >
                  <option value="">{`Select ${filter.label}`}</option>
                  {filter.options.map((option, index) => (
                    <option 
                    key={index} 
                    value={option}
                    className="text-slate-600 bg-gray-100 hover:bg-blue-50">
                      {option}
                    </option>
                  ))}
                </select>
            );

          case "text":
            return (
              <div key={filter.name} className="text-slate-400 px-3 py-2 border rounded-md w-46 sm:w-60 bg-white h-[38px]">
                <label htmlFor={filter.name}>{filter.label}</label>
                <input
                  id={filter.name}
                  type="text"
                  value={filters[filter.name]}
                  placeholder={filter.placeholder || `Enter ${filter.label}`}
                  onChange={(e) => {
                    const newFilters = {
                      ...filters,
                      [filter.name]: e.target.value,
                    };
                    console.log("Updated Filters (Select):", newFilters); // Debug Log
                    setFilters(newFilters);
                  }}
                />
              </div>
            );

          case "date":
            return (
              <div key={filter.name}>
                <label htmlFor={filter.name}>{filter.label}</label>
                <input
                  id={filter.name}
                  type="date"
                  value={filters[filter.name]}
                  onChange={(e) => {
                    const newFilters = {
                      ...filters,
                      [filter.name]: e.target.value,
                    };
                    console.log("Updated Filters (Select):", newFilters); // Debug Log
                    setFilters(newFilters);
                  }}
                  className="text-slate-400 px-3 py-2 border rounded-md w-46 sm:w-60 bg-white h-[38px]"
                />
              </div>
            );

            
          case "checkbox":
            return (
              <div key={filter.name} className="text-slate-400 px-3 py-2 border rounded-md w-46 sm:w-60 bg-white h-[38px]">
                <label htmlFor={filter.name}>{filter.label}</label>
                <input
                  id={filter.name}
                  type="checkbox"
                  checked={filters[filter.name]}
                  onChange={(e) => {
                    const newFilters = {
                      ...filters,
                      [filter.name]: e.target.value,
                    };
                    console.log("Updated Filters (Select):", newFilters); // Debug Log
                    setFilters(newFilters);
                  }}
                />
              </div>
            );

            case "search":
            return (
              <form
                key={filter.name}
                className="search-form bg-white rounded-md flex items-center border text-slate-400 w-46 sm:w-60 h-[38px]"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="text"
                  placeholder={filter.placeholder || `Search by ${filter.label}...`}
                  value={filters[filter.name]}
                  onChange={(e) => {
                    const newFilters = {
                      ...filters,
                      [filter.name]: e.target.value,
                    };
                    console.log("Updated Filters (Select):", newFilters); // Debug Log
                    setFilters(newFilters);
                  }}
                  className="bg-transparent focus:outline-none flex-grow px-2"
                />
                <button className="flex items-center justify-center w-10 h-full">
                  <filter.icon className="text-slate-400" />
                </button>
              </form>
            );

          default:
            return null;
        }
      })}
      {/* Reset Button */}
      <button
        className="button button-reset"
        onClick={() => onResetFilters()}
      >
        <FaUndo style={{ fontSize: "20px" }} />
      </button>

    </div>
  );
};
export default Filters;
