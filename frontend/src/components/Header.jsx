import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaBoxes,
  FaWallet,
  FaSignInAlt,
  FaChevronDown,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/user/userSlice";

const Header = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/staff/login");
    }
  };

  return (
    <header className="header-container">
      <div
        className="flex justify-between items-center max-w-6xl mx-auto p-1 gap-3"
        style={{ marginLeft: "40px" }}
      >
        <NavLink to="/staff">
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
          <button type="button">
            <FaChevronDown className="text-slate-600" />
          </button>
        </form>
      </div>

      <div className="top-nav">
        {/* Dashboard */}
        <NavLink
          to="/staff"
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
            <NavLink to="/staff/products">Products</NavLink>
            <NavLink to="/staff/materials">Materials</NavLink>
            <NavLink to="/staff/recipes">Recipes</NavLink>
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
            <NavLink to="/staff/sales">Sales</NavLink>
            <NavLink to="/staff/expenses">Expenses</NavLink>
            <NavLink to="/staff/accounting">Accounting</NavLink>
          </div>
        </div>

        {/* Profile/Login */}
        <div className="relative" ref={menuRef} style={{ marginRight: "40px" }}>
          {currentUser ? (
            <>
              <img
                className="rounded-full h-7 w-7 object-cover cursor-pointer"
                src={currentUser.avatar || "/default-avatar.png"}
                alt="profile"
                onClick={() => setMenuOpen((prev) => !prev)}
              />
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white shadow-lg rounded-2xl border border-gray-200 p-3 z-50">
                  <div className="flex items-center gap-3 border-b pb-3">
                    <img
                      src={currentUser.avatar || "/default-avatar.png"}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-xs text-gray-500">{currentUser.username}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/staff/profile");
                      }}
                      className="hover:bg-gray-100 p-2 rounded-lg text-left text-gray-500"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/settings");
                      }}
                      className="hover:bg-gray-100 p-2 rounded-lg text-left text-gray-500"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-left"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-2 text-sky-500"
              style={{ textDecoration: "none" }}
            >
              <FaSignInAlt size={18} title="Login Section" />
              <span>Login</span>
            </NavLink>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;
