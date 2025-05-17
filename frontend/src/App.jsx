import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/productlist";
import Header from "./components/Header";
import Profile from "./pages/Profile";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Accounting from "./pages/Accounting";
import Materials from "./pages/Materials";
import Recipes from "./pages/Recipes";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import PrivateRoute from "./components/PrivateRoute";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const App = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/product-list" element={<ProductList />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
