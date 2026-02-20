import { Link } from "react-router-dom";
import "../../styles/client/ClientFooter.css"; // Estilos con tonos verdes y animaciones

function ClientFooter() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Columna Mi Cuenta */}
        <div className="footer-column">
          <h4 className="footer-title">Mi Cuenta</h4>
          <div className="footer-links">
            <Link to="/cliente/pedidos" className="footer-link">
              Mis Pedidos
            </Link>
            <Link to="/cliente/carrito" className="footer-link">
              Mi Carrito
            </Link>
            <Link to="/cliente/perfil" className="footer-link">
              Mi Perfil
            </Link>
          </div>
        </div>

        {/* Columna Soporte */}
        <div className="footer-column">
          <h4 className="footer-title">Soporte</h4>
          <div className="footer-links">
            <Link to="/cliente/ayuda" className="footer-link">
              Centro de Ayuda
            </Link>
            <Link to="/cliente/contacto" className="footer-link">
              Contáctanos
            </Link>
          </div>
        </div>

        {/* Columna Información / Marca */}
        <div className="footer-column">
          <h4 className="footer-title">NovaGraf</h4>
          <p className="footer-description">
            Tu plataforma de confianza para gestionar tus pedidos e impresiones.
          </p>
          <div className="social-icons">
            <span>🌱</span>
            <span>📷</span>
            <span>📘</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} NovaGraf. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default ClientFooter;