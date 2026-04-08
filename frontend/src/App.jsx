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
import Valores from './pages/public/Valores';
import Redes from './pages/public/RedesSociales';
import VerificarRegistro from "./pages/public/VerificarRegistro";
import ForgotPassword from "./pages/public/ForgotPassword";
import VerifyRecovery from "./pages/public/VerifyRecovery";
import ResetPassword from "./pages/public/ResetPassword";
import AuthCallback from "./pages/public/AuthCallback";
import Contacto from './pages/public/Contacto';


// Páginas cliente
import ClienteHome from "./pages/Client/ClienteHome";
import ClientProfile from "./pages/Client/ClientProfile";
import CatalogoCliente from "./pages/Client/CatalogoCliente";
import ProductoDetalle from "./pages/Client/ProductoDetalle";
import ProductoPersonalizador from './pages/Client/ProductoPersonalizador';



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
import Reabastecimiento from './pages/Admin/Reabastecimiento';
import Ventasproducto from "./pages/Admin/Ventasproducto";
import Variantesmodal from "./pages/Admin/Variantesmodal";
import Prediccionpage from "./pages/Admin/Prediccionpage";
import DetallePrediccion from './pages/Admin/DetallePrediccion';
import VentasGrafica from "./pages/Admin/VentasGrafica";



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
          <Route path="/nosotros/valores" element={<Valores />} />
          <Route path="/verify-account/:id_usuario" element={<VerificarRegistro />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-recovery/:id_usuario" element={<VerifyRecovery />} />
          <Route path="/reset-password/:id_usuario" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/redes-sociales" element={<Redes />} />
          <Route path="/contacto" element={<Contacto />} />
        </Route>

        {/* Rutas cliente */}
        <Route element={<ClientLayout />}>
          <Route path="/cliente/home" element={<ClienteHome />} />
          <Route path="/cliente/perfil" element={<ClientProfile />} />
          <Route path="/cliente/pedidos" element={<div>Mis Pedidos</div>} />
          <Route path="/cliente/carrito" element={<div>Mi Carrito</div>} />
          <Route path="/cliente/catalogo" element={<CatalogoCliente />} />
          <Route path="/cliente/producto/:id" element={<ProductoDetalle />} />
          <Route path="/cliente/producto/:id/personalizar" element={<ProductoPersonalizador />} />

          
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
          <Route path="stock" element={<Reabastecimiento />} />
          <Route path="stock/:id/ventas" element={<Ventasproducto/>} />
          <Route path="stock/:id/variantes" element={<Variantesmodal/>} />
          <Route path="stock/:id/prediccion" element={<Prediccionpage/>} />
          <Route path="/admin/prediccion/variante/:varianteId" element={<DetallePrediccion />} />
          <Route path="/admin/ventas/:id/grafica" element={<VentasGrafica />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;