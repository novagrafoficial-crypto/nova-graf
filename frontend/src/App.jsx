import { BrowserRouter, Routes, Route } from 'react-router-dom';

import PublicLayout from "./layouts/PublicLayout";
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";

// Páginas públicas
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Mision from './pages/public/Mision';
import Vision from './pages/public/Vision';
import VerificarRegistro from "./pages/public/VerificarRegistro";
import ForgotPassword from "./pages/public/ForgotPassword";
import VerifyRecovery from "./pages/public/VerifyRecovery";
import ResetPassword from "./pages/public/ResetPassword";
import AuthCallback from "./pages/public/AuthCallback";

// Páginas cliente
import ClienteHome from "./pages/Client/ClienteHome";
import ClientProfile from "./pages/Client/ClientProfile";

// Páginas admin
import AdminMarcas from "./pages/Admin/AdminMarcas";
import AdminCategorias from "./pages/Admin/AdminCategorias";
import AdminSubcategorias from "./pages/Admin/AdminSubcategorias";
import AdminProductos from "./pages/Admin/AdminProductos";
import AdminUsuarios from "./pages/Admin/AdminUsuarios";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rutas públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/nosotros/mision" element={<Mision />} />
          <Route path="/nosotros/vision" element={<Vision />} />
          <Route path="/verify-account/:id_usuario" element={<VerificarRegistro />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-recovery/:id_usuario" element={<VerifyRecovery />} />
          <Route path="/reset-password/:id_usuario" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Route>

        {/* Rutas cliente */}
        <Route element={<ClientLayout />}>
          <Route path="/cliente/home" element={<ClienteHome />} />
          <Route path="/cliente/perfil" element={<ClientProfile />} />
          <Route path="/cliente/pedidos" element={<div>Mis Pedidos</div>} />
          <Route path="/cliente/carrito" element={<div>Mi Carrito</div>} />
        </Route>

        {/* Rutas admin */}
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