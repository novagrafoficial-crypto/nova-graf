import { Link } from "react-router-dom";
import "../../styles/client/ClientFooter.css";

function ClientFooter() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Columna 1: Soporte */}
        <div className="footer-column">
          <h4 className="footer-title">Soporte</h4>
          <div className="footer-links">
            <Link to="/cliente/ayuda" className="footer-link">Centro de Ayuda</Link>
            <Link to="/cliente/contacto" className="footer-link">Contáctanos</Link>
            <Link to="/cliente/faq" className="footer-link">Preguntas frecuentes</Link>
            <Link to="/cliente/devoluciones" className="footer-link">Devoluciones y garantías</Link>
          </div>
        </div>

        {/* Columna 2: Mi cuenta (solo para clientes registrados) */}
        <div className="footer-column">
          <h4 className="footer-title">Mi cuenta</h4>
          <div className="footer-links">
            <Link to="/cliente/perfil" className="footer-link">Mi perfil</Link>
            <Link to="/cliente/pedidos" className="footer-link">Mis pedidos</Link>
            <Link to="/cliente/mis-disenos" className="footer-link">Mis diseños</Link>
            <Link to="/cliente/direcciones" className="footer-link">Direcciones</Link>
          </div>
        </div>

        {/* Columna 3: Información */}
        <div className="footer-column">
          <h4 className="footer-title">Información</h4>
          <div className="footer-links">
            <Link to="/cliente/sobre-nosotros" className="footer-link">Sobre NovaGraf</Link>
            <Link to="/cliente/privacidad" className="footer-link">Política de privacidad</Link>
            <Link to="/cliente/terminos" className="footer-link">Términos y condiciones</Link>
            <Link to="/cliente/envios" className="footer-link">Envíos y entregas</Link>
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