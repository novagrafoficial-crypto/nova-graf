import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Admin/Dashboard";
import ProductsAdmin from "./pages/Admin/ProductsAdmin";
import CategoriesAdmin from "./pages/Admin/CategoriesAdmin";
import OrdersAdmin from "./pages/Admin/OrdersAdmin";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/products" element={<ProductsAdmin />} />
      <Route path="/admin/categories" element={<CategoriesAdmin />} />
      <Route path="/admin/orders" element={<OrdersAdmin />} />

    </Routes>
  );
}

export default App;
