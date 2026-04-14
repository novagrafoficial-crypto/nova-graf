import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "../../styles/client/ClientHeader.css";

// ═══════════════════════════════════════════════════════════
//  URL BASE PARA LA API (desde variable de entorno)
//  En desarrollo local, si no está definida, se usa cadena vacía
//  y el proxy de Vite redirige a localhost:5000
// ═══════════════════════════════════════════════════════════
const API_BASE_URL = import.meta.env.VITE_API_URL ;

function ClientHeader({ user }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [empresa, setEmpresa] = useState({ nombre_empresa: "", logo_url: "" });
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cargar logo y nombre de empresa desde la API (ahora usa API_BASE_URL)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/empresa`)
      .then(res => res.json())
      .then(json => { if (json.success) setEmpresa(json.data); })
      .catch(err => console.error("Error al cargar empresa:", err))
      .finally(() => setLoadingEmpresa(false));
  }, []);

  // Cerrar menú móvil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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