import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import ClientLayout from "./layouts/ClientLayout";

// Páginas públicas
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Mision from './pages/public/Mision';
import Vision from './pages/public/Vision';
import VerificarRegistro from "./pages/public/VerificarRegistro";

// Páginas cliente
import ClienteHome from "./pages/Client/ClienteHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rutas públicas — con Header y Footer público */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/nosotros/mision" element={<Mision />} />
          <Route path="/nosotros/vision" element={<Vision />} />
          <Route path="/verify-account/:id_usuario" element={<VerificarRegistro />} />
        </Route>

        {/* Rutas cliente — con Header y Footer de cliente */}
        <Route element={<ClientLayout />}>
          <Route path="/cliente/home" element={<ClienteHome />} />
          <Route path="/cliente/perfil" element={<div>Perfil</div>} />
          <Route path="/cliente/pedidos" element={<div>Mis Pedidos</div>} />
          <Route path="/cliente/carrito" element={<div>Mi Carrito</div>} />
        </Route>

        
        {/* Rutas del administrador */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;