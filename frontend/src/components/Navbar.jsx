import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      <h2 className="logo">Nova Graf</h2>

      <ul className="nav-links">

        <li><a href="#inicio">Inicio</a></li>
        <li><a href="#catalogos">Catálogos</a></li>
        <li><a href="#servicios">Servicios</a></li>
        <li><a href="#contacto">Contacto</a></li>

        <li>
          <Link to="/login" className="login-btn">Login</Link>
        </li>

        <li>
          <Link to="/register" className="register-btn">Registro</Link>
        </li>

      </ul>

    </nav>
  );
}

export default Navbar;
