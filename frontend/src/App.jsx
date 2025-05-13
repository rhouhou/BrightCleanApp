import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductList from "./pages/productlist";
import Header from "./components/Header";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Accounting from "./pages/Accounting";
import Materials from "./pages/Materials";
import Recipes from "./pages/Recipes";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const App = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product-list" element={<ProductList />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/recipes" element={<Recipes />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
