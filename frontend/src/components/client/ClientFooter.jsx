import { Link } from "react-router-dom";
import "../../styles/client/ClientFooter.css"; // Estilos con tonos verdes y animaciones

function ClientFooter() {
  return (
    <footer className="footer">
      <div className="footer-container">

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
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} NovaGraf. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default ClientFooter;