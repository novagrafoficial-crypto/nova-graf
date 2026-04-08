import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../../components/Footer";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.id_usuario) {
        navigate(`/verify-recovery/${data.id_usuario}`);
      } else {
        setMessage(data.message || "Error al enviar el código");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Estilos verdes
  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      paddingTop: "80px", // Ajusta según la altura de tu header
    },
    main: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    },
    card: {
      background: "white",
      borderRadius: "24px",
      padding: "40px",
      width: "100%",
      maxWidth: "420px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
      border: "1px solid #e2e8f0",
    },
    title: {
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: "1.75rem",
      fontWeight: "600",
      marginBottom: "8px",
      color: "#065f46", // verde oscuro
    },
    description: {
      color: "#4b5563",
      marginBottom: "28px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.95rem",
      lineHeight: "1.5",
    },
    label: {
      display: "block",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.95rem",
      boxSizing: "border-box",
      transition: "all 0.2s ease",
      outline: "none",
    },
    inputFocus: {
      borderColor: "#10b981",
      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
    },
    button: {
      width: "100%",
      padding: "12px",
      background: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "1rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    buttonHover: {
      background: "#059669",
    },
    buttonDisabled: {
      background: "#9ca3af",
      cursor: "not-allowed",
    },
    message: {
      marginTop: "16px",
      color: "#dc2626",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.875rem",
    },
    backLink: {
      textAlign: "center",
      marginTop: "20px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.875rem",
    },
    link: {
      color: "#10b981",
      textDecoration: "none",
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.title}>Recuperar contraseña</h2>
          <p style={styles.description}>
            Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>Correo electrónico</label>
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = styles.buttonHover.background)}
              onMouseLeave={(e) => !loading && (e.target.style.background = styles.button.background)}
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>

          {message && <p style={styles.message}>{message}</p>}

          <div style={styles.backLink}>
            <Link to="/login" style={styles.link}>
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ForgotPassword;