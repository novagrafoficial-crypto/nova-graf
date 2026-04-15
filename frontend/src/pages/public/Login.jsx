import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import "../../styles/public/Login.css";

const API = import.meta.env.VITE_API_URL;

// ─── VALIDACIONES ─────────────────────────────────────────
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? "" : "Ingresa un correo electrónico válido.";
};

const validatePassword = (password) => {
  if (!password) return "La contraseña es requerida.";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  return "";
};

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cuentaInactiva, setCuentaInactiva] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const errorMessages = {
    email_local:    "Este correo ya está registrado manualmente. Usa tu contraseña para iniciar sesión.",
    google:         "Error al iniciar sesión con Google. Intenta de nuevo.",
    facebook:       "Error al iniciar sesión con Facebook. Intenta de nuevo.",
    email_google:   "Este correo fue registrado con Google. Usa el botón de Google.",
    email_facebook: "Este correo fue registrado con Facebook. Usa el botón de Facebook.",
  };

  const urlError = searchParams.get("error");
  const [message, setMessage] = useState(
    urlError ? errorMessages[urlError] || "Error de autenticación" : ""
  );

  // ─── VALIDAR ANTES DE ENVIAR ───────────────────────────
  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    return !emailError && !passwordError;
  };

  // ─── VALIDACIÓN EN TIEMPO REAL ────────────────────────
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
  };

  // ─── SUBMIT ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setMessage("");
    setLoading(true);
    setCuentaInactiva(false);
    setResendMessage("");

    try {
      const response = await fetch(`${API}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
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
    } catch {
      setMessage("Error de conexión. Verifica que el servidor esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  // ─── REENVIAR OTP ─────────────────────────────────────
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
        setResendMessage("✅ Código enviado. Revisa tu correo.");
        setTimeout(() => navigate(`/verify-account/${data.id_usuario}`), 2000);
      } else {
        setResendMessage("❌ " + (resendData.message || "Error al reenviar"));
      }
    } catch {
      setResendMessage("❌ Error de conexión");
    } finally {
      setResending(false);
    }
  };

  // ─── SOCIAL LOGIN ─────────────────────────────────────
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

          <form onSubmit={handleSubmit} noValidate>
            {/* EMAIL */}
            <div className="input-group">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
                required
                style={{ borderColor: errors.email ? "#ef4444" : undefined }}
              />
              {errors.email && (
                <span style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                  {errors.email}
                </span>
              )}
            </div>

            {/* PASSWORD con toggle usando iconos FontAwesome */}
            <div className="input-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
                required
                style={{ borderColor: errors.password ? "#ef4444" : undefined }}
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

          {/* MENSAJE GLOBAL */}
          {message && (
            <p style={{ color: "#ef4444", marginTop: "12px", textAlign: "center", fontSize: "0.9rem" }}>
              {message}
            </p>
          )}

          {/* REENVIAR OTP */}
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
                  textDecoration: "underline",
                }}
              >
                {resending ? "Enviando..." : "Reenviar código de activación"}
              </button>
              {resendMessage && (
                <p style={{
                  marginTop: "6px", fontSize: "0.85rem",
                  color: resendMessage.startsWith("✅") ? "#16a34a" : "#ef4444",
                }}>
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          {/* SOCIAL LOGIN */}
          <div className="social-login" style={{ marginTop: "16px" }}>
            <p style={{ textAlign: "center", color: "#888", marginBottom: "8px" }}>O inicia con</p>

            <button
              onClick={handleGoogleLogin}
              style={{
                width: "100%", padding: "10px", background: "#fff",
                border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", fontSize: "0.95rem", marginBottom: "8px",
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
                gap: "8px", fontSize: "0.95rem",
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