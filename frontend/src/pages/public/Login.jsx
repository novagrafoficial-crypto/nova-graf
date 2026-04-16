import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import "../../styles/public/Login.css";

const API = "http://localhost:5000";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cuentaInactiva, setCuentaInactiva] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const errorMessages = {
    email_local: 'Este correo ya está registrado manualmente. Usa tu contraseña para iniciar sesión.',
    google: 'Error al iniciar sesión con Google. Intenta de nuevo.',
    facebook: 'Error al iniciar sesión con Facebook. Intenta de nuevo.',
    email_google: 'Este correo fue registrado con Google. Usa el botón de Google.',
    email_facebook: 'Este correo fue registrado con Facebook. Usa el botón de Facebook.',
  };

  const urlError = searchParams.get('error');
  const [message, setMessage] = useState(
    urlError ? errorMessages[urlError] || 'Error de autenticación' : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    setCuentaInactiva(false);
    setResendMessage("");
    setErrors({});

    // Validaciones básicas
    const newErrors = {};
    if (!email.trim()) newErrors.email = "El correo es requerido";
    if (!password.trim()) newErrors.password = "La contraseña es requerida";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.rol === "administrador") {
          navigate("/admin");
        } else {
          navigate("/cliente/home");
        }
      } else {
        setMessage(data.message || "Error al iniciar sesión");
        if (data.message?.includes("no activada")) {
          setCuentaInactiva(true);
        }
      }
    } catch (error) {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async () => {
    setResending(true);
    setResendMessage("");

    try {
      const res = await fetch(`${API}/api/users/get-user-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.id_usuario) {
        setResendMessage("❌ No se encontró el usuario");
        return;
      }

      const resend = await fetch(`${API}/api/users/resend-activation-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: data.id_usuario }),
      });
      const resendData = await resend.json();

      if (resend.ok) {
        setResendMessage("✅ Se ha enviado un nuevo código de activación a tu correo");
      } else {
        setResendMessage(resendData.message || "❌ Error al reenviar el código");
      }
    } catch (error) {
      setResendMessage("❌ Error de conexión al reenviar");
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API}/api/auth/facebook`;
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
              {errors.email && (
                <span style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className="input-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
              </button>
              {errors.password && (
                <span style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                  {errors.password}
                </span>
              )}
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {message && (
            <p className="login-message" style={{ color: "#ef4444", marginTop: "12px", textAlign: "center", fontSize: "0.9rem" }}>
              {message}
            </p>
          )}

          {cuentaInactiva && (
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <button
                onClick={handleResendActivation}
                disabled={resending}
                style={{
                  background: "transparent", border: "none",
                  color: resending ? "#94a3b8" : "#4f46e5",
                  cursor: resending ? "not-allowed" : "pointer",
                  fontSize: "0.88rem", fontWeight: "600",
                  textDecoration: "underline"
                }}
              >
                {resending ? "Enviando..." : "Reenviar código de activación"}
              </button>

              {resendMessage && (
                <p style={{
                  marginTop: "6px", fontSize: "0.85rem",
                  color: resendMessage.startsWith("✅") ? "#16a34a" : "#ef4444"
                }}>
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          <div className="social-login" style={{ marginTop: "16px" }}>
            <p style={{ textAlign: "center", color: "#888", marginBottom: "8px" }}>O inicia con</p>

            <button
              onClick={handleGoogleLogin}
              style={{
                width: "100%", padding: "10px", background: "#fff",
                border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", fontSize: "0.95rem", marginBottom: "8px"
              }}
            >
              <i className="fab fa-google" style={{ color: "#EA4335" }}></i> Google
            </button>

            <button
              onClick={handleFacebookLogin}
              style={{
                width: "100%", padding: "10px", background: "#fff",
                border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", fontSize: "0.95rem"
              }}
            >
              <i className="fab fa-facebook-f" style={{ color: "#1877F2" }}></i> Facebook
            </button>
          </div>

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