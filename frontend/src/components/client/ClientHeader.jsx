import { Link, useNavigate } from "react-router-dom";

function ClientHeader({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header style={{
      background: "#1e293b", color: "white", padding: "0 40px",
      height: "64px", display: "flex", alignItems: "center",
      justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100
    }}>
      {/* Logo */}
      <Link to="/cliente/home" style={{ color: "white", textDecoration: "none", fontSize: "1.4rem", fontWeight: "bold" }}>
        NovaGraf
      </Link>

      {/* Navegación */}
      <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
        <Link to="/cliente/home" style={navStyle}>Inicio</Link>
        <Link to="/cliente/catalogo" style={navStyle}>Catálogo</Link>
        <Link to="/cliente/pedidos" style={navStyle}>Mis Pedidos</Link>
        <Link to="/cliente/carrito" style={navStyle}>
          🛒 Carrito
        </Link>
      </nav>

      {/* Usuario */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link to="/cliente/perfil" style={{ color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#4f46e5", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: "bold"
          }}>
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "0.9rem" }}>{user?.nombre}</span>
        </Link>

        <button onClick={handleLogout} style={{
          background: "#ef4444", color: "white", border: "none",
          padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem"
        }}>
          Salir
        </button>
      </div>
    </header>
  );
}

const navStyle = {
  color: "#cbd5e1", textDecoration: "none", fontSize: "0.95rem",
  transition: "color 0.2s"
};

export default ClientHeader;