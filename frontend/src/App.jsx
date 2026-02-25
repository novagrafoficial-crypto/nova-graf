import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";

import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Home from "./pages/public/Home";

import AdminLayout from "./layouts/AdminLayout";
import AdminMarcas from "./pages/Admin/AdminMarcas";
import AdminCategorias from "./pages/Admin/AdminCategorias";
import AdminSubcategorias from "./pages/Admin/AdminSubcategorias";
import AdminProductos from "./pages/Admin/AdminProductos";
import AdminUsuarios from "./pages/Admin/AdminUsuarios";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* RUTAS PÚBLICAS CON HEADER */}
        <Route
          path="/*"
          element={
            <>
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
              </Routes>
            </>
          }
        />

        {/* PANEL ADMIN SIN HEADER */}
        <Route path="/admin" element={<AdminLayout />}>

          <Route path="marcas" element={<AdminMarcas />} />
          <Route path="categorias" element={<AdminCategorias />} />
          <Route path="subcategorias" element={<AdminSubcategorias />} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="usuarios" element={<AdminUsuarios />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;