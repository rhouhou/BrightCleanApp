import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FaChartPie,
  FaBox,
  FaChartLine,
  FaBoxes,
  FaBookOpen,
  FaWallet,
  FaFileInvoiceDollar,
  FaSearch,
  FaSignInAlt,
  FaUser,
  FaChevronDown,
  FaCogs,
} from "react-icons/fa";
import { useSelector } from "react-redux";

const Header = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <header className="header-container">
      <div
        className="flex justify-between items-center max-w-6xl mx-auto p-1 gap-3"
        style={{ marginLeft: "40px" }}
      >
        <NavLink to="/">
          <h1 className="font-bold text-sm sm:text-xl flex flex-wrap">
            <span className="text-sky-500">Bright</span>
            <span className="text-sky-700">Clean</span>
          </h1>
        </NavLink>
        <form className="bg-slate-100 p-3 rounded-lg flex items-center">
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent focus:outline-none w-20 h-3 sm:w-52"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>
            <FaChevronDown className="text-slate-600" />
          </button>
        </form>
      </div>

      <div className="top-nav">
        {/* Dashboard */}
        <NavLink
          to="/"
          className="nav-link"
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: isActive ? "#7f8c8d" : "#7dd3fc",
            textDecoration: "none",
          })}
        >
          <FaChartPie size={18} title="Dashboard" />
          <span style={{ fontSize: 18 }}>Dashboard</span>
        </NavLink>

        {/* Inventory Group */}
        <div className="dropdown">
          <button className="dropdown-btn">
            <FaBoxes size={18} title="Inventory" />
            <span style={{ fontSize: 18 }}>Inventory</span>
            <FaChevronDown size={14} />
          </button>
          <div className="dropdown-content">
            <NavLink to="/product-list">Products</NavLink>
            <NavLink to="/materials">Materials</NavLink>
            <NavLink to="/recipes">Recipes</NavLink>
          </div>
        </div>

        {/* Financials Group */}
        <div className="dropdown">
          <button className="dropdown-btn">
            <FaWallet size={18} title="Financials" />
            <span style={{ fontSize: 18 }}>Financials</span>
            <FaChevronDown size={14} />
          </button>
          <div className="dropdown-content">
            <NavLink to="/sales">Sales</NavLink>
            <NavLink to="/expenses">Expenses</NavLink>
            <NavLink to="/accounting">Accounting</NavLink>
          </div>
        </div>

        {/* User/Profile */}
        <NavLink
          to="/profile"
          className="nav-link"
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: isActive ? "#7f8c8d" : "#7dd3fc",
            textDecoration: "none",
            marginRight: "40px",
          })}
        >
          {currentUser ? (
            <img
              className="rounded-full h-7 w-7 object-cover"
              src={currentUser.avatar}
              alt="profile"
            />
          ) : (
            <FaSignInAlt size={18} title="Login Section" />
          )}
        </NavLink>
      </div>
    </header>
  );
};

export default Header;
