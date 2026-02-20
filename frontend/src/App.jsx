import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Home from "./pages/public/Home";
import AdminMarcas from "./pages/Admin/AdminMarcas";
import AdminCategorias from "./pages/Admin/AdminCategorias";
import AdminSubcategorias from "./pages/Admin/AdminSubcategorias";
import AdminProductos from "./pages/Admin/AdminProductos";

// Tu panel admin

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* RUTA DEL PANEL ADMIN */}
        <Route path="/admin/marcas" element={<AdminMarcas />} />
        <Route path="/admin/categorias" element={<AdminCategorias />} />
        <Route path="/admin/subcategorias" element={<AdminSubcategorias />} />
        <Route path="/admin/productos" element={<AdminProductos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
