import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/public/Login.css";
import Footer from "../../components/Footer";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.rol === "administrador") {
          navigate("/admin/dashboard");
        } else {
          navigate("/cliente/home"); // ← cliente va aquí
        }
      } else {
        setMessage(data.message || "Error al iniciar sesión");
      }
    } catch (error) {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => window.location.href = "http://localhost:5000/api/auth/google";

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

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {message && <p className="login-message">{message}</p>}

          <div className="social-login" style={{ marginTop: "16px" }}>
            <p style={{ textAlign: "center", color: "#888", marginBottom: "8px" }}>O inicia con</p>
            <button
              onClick={handleGoogleLogin}
              style={{
                width: "100%", padding: "10px", background: "#fff",
                border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", fontSize: "0.95rem"
              }}
            >
              <i className="fab fa-google" style={{ color: "#EA4335" }}></i> Google
            </button>
          </div>

          <div className="login-footer">
            <Link to="/register">¿No tienes cuenta? Regístrate</Link>
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;