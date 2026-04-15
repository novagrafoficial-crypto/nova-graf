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
import Contacto from './pages/public/Contacto';
import PortafolioPublico from './pages/public/PortafolioPublico';
import Nosotros from './pages/public/Nosotros';
import Contactos from './pages/public/Contactos';
import Redes from './pages/public/RedesSociales';






// Páginas cliente
import ClienteHome from "./pages/Client/ClienteHome";
import ClientProfile from "./pages/Client/ClientProfile";

// Páginas admin
import AdminMarcas from "./pages/Admin/AdminMarcas";
import AdminCategorias from "./pages/Admin/AdminCategorias";
import AdminSubcategorias from "./pages/Admin/AdminSubcategorias";
import AdminProductos from "./pages/Admin/AdminProductos";
import AdminUsuarios from "./pages/Admin/AdminUsuarios";
import AdminModulo from "./pages/Admin/AdminModulo";
import AdminPublicacion from './pages/Admin/AdminPublicacion';
import AdminMision from './pages/Admin/AdminMision';
import AdminEmpresaCom from './pages/Admin/AdminEmpresaCom';
import AdminInventario from './pages/Admin/AdminInventario';
import AdminProveedores from './pages/Admin/AdminProveedores';
import AdminAtributosproduc from './pages/Admin/AdminAtributosproduc';



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
          <Route path="/redes-sociales" element={<Redes />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/catalogo" element={<PortafolioPublico />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contactos" element={<Contactos />} />
          
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
          <Route path="publicacion" element={<AdminPublicacion />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="modulo-extra" element={<AdminModulo />} />
          <Route path="mision" element={<AdminMision />} />
          <Route path="empresa" element={<AdminEmpresaCom />} />
          <Route path="inventario" element={<AdminInventario />} />
          <Route path="proveedores" element={<AdminProveedores />} />
          <Route path="Atributos" element={<AdminAtributosproduc />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;