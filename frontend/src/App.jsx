import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import PublicHome from "./pages/PublicHome";
import Shop from "./pages/Shop";

import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/ProductList";
import Profile from "./pages/Profile";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Accounting from "./pages/Accounting";
import Materials from "./pages/Materials";
import Recipes from "./pages/Recipes";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import PrivateRoute from "./components/PrivateRoute";
import StaffLayout from "./components/StaffLayout";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* -----------------------
            PUBLIC CUSTOMER SITE
        ----------------------- */}

        <Route
          path="/"
          element={<PublicHome />}
        />

        <Route
          path="/shop"
          element={<Shop />}
        />

        {/* -----------------------
            STAFF LOGIN
        ----------------------- */}

        <Route
          path="/staff/login"
          element={<Login />}
        />

        <Route
          path="/staff/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Old login URL */}
        <Route
          path="/login"
          element={
            <Navigate
              to="/staff/login"
              replace
            />
          }
        />

        {/* -----------------------
            PROTECTED STAFF AREA
        ----------------------- */}

        <Route element={<PrivateRoute />}>
          <Route element={<StaffLayout />}>
            <Route
              path="/staff"
              element={<Dashboard />}
            />

            <Route
              path="/staff/profile"
              element={<Profile />}
            />

            <Route
              path="/staff/products"
              element={<ProductList />}
            />

            <Route
              path="/staff/materials"
              element={<Materials />}
            />

            <Route
              path="/staff/recipes"
              element={<Recipes />}
            />

            <Route
              path="/staff/sales"
              element={<Sales />}
            />

            <Route
              path="/staff/expenses"
              element={<Expenses />}
            />

            <Route
              path="/staff/accounting"
              element={<Accounting />}
            />
          </Route>
        </Route>

        {/* Unknown page */}
        <Route
          path="*"
          element={
            <Navigate to="/" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;