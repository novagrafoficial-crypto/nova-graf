import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/public/Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // limpiar mensaje anterior

    try {
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.status === 200) {
        // Redirigir al home
        navigate("/");
      }
    } catch (error) {
      setMessage("Error de conexión");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h2>Bienvenido</h2>
          <p className="login-subtitle">Inicia sesión para continuar</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Ingresar
            </button>
          </form>

          {message && <p className="login-message">{message}</p>}

          <div className="login-footer">
            <Link to="/register">¿No tienes cuenta? Regístrate</Link>
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;