import { Link, useNavigate } from "react-router-dom";
import "../../styles/client/ClientHeader.css"; // Importamos los estilos

function ClientHeader({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="header">
      {/* Logo */}
      <Link to="/cliente/home" className="logo">
        NovaGraf
      </Link>
      

      {/* Navegación */}
      <nav className="nav">
        <Link to="/cliente/home" className="nav-link">Inicio</Link>
        <Link to="/cliente/catalogo" className="nav-link">Catálogo</Link>
        <Link to="/cliente/pedidos" className="nav-link">Mis Pedidos</Link>
        <Link to="/cliente/perfil" className="nav-link">Mi Perfil</Link>
        <Link to="/cliente/carrito" className="nav-link">🛒 Carrito</Link>
      </nav>

      {/* Usuario */}
      <div className="user-section">
        <Link to="/cliente/perfil" className="user-info">
          <div className="avatar">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{user?.nombre}</span>
        </Link>

        <button onClick={handleLogout} className="logout-button">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

export default ClientHeader;