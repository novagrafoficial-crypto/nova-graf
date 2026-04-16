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

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Ingresa un correo electrónico válido");
      setLoading(false);
      return;
    }

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

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#F5F7FA",
      marginTop: "90px",
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
      boxShadow: "0 8px 28px rgba(0, 0, 0, 0.08)",
      border: `1px solid #DBDBDB`,
    },
    title: {
      fontFamily: "system-ui, sans-serif",
      fontSize: "1.75rem",
      fontWeight: "600",
      marginBottom: "8px",
      color: "#1A6163",
    },
    description: {
      color: "#565653",
      marginBottom: "28px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.95rem",
    },
    label: {
      display: "block",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.85rem",
      fontWeight: "500",
      color: "#1A6163",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "14px",
      border: `2px solid #DBDBDB`,
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.95rem",
      boxSizing: "border-box",
      outline: "none",
      transition: "all 0.2s",
    },
    inputFocus: {
      borderColor: "#35BA99",
      boxShadow: "0 0 0 3px rgba(53, 186, 153, 0.2)",
    },
    button: {
      width: "100%",
      padding: "12px",
      background: "#35BA99",
      color: "white",
      border: "none",
      borderRadius: "40px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background 0.2s",
    },
    buttonHover: { background: "#1A6163" },
    buttonDisabled: { background: "#B0BEC5", cursor: "not-allowed" },
    message: {
      marginTop: "16px",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.9rem",
      fontWeight: "500",
      color: "#ef4444",
    },
    backLink: {
      textAlign: "center",
      marginTop: "24px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.9rem",
    },
    link: {
      color: "#1A6163",
      textDecoration: "none",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    },
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          <h2 style={{ fontFamily: "Arial", marginBottom: "8px", color: "#1e293b" }}>
            Recuperar contraseña
          </h2>
          <p style={{ color: "#64748b", marginBottom: "28px", fontFamily: "Arial" }}>
            Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => (e.target.style.borderColor = "#DBDBDB")}
              />
            </div>

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>

          {message && (
            <p style={{ marginTop: "16px", color: "#ef4444", textAlign: "center", fontFamily: "Arial" }}>
              {message}
            </p>
          )}

          <p style={{ textAlign: "center", marginTop: "20px", fontFamily: "Arial", fontSize: "0.9rem" }}>
            <Link to="/login" style={{ color: "#4f46e5" }}>← Volver al login</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const labelStyle = { display: "block", fontFamily: "Arial", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontFamily: "Arial", fontSize: "0.95rem", boxSizing: "border-box" };
const btnStyle = { width: "100%", padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", fontFamily: "Arial", fontSize: "1rem", cursor: "pointer" };

export default ForgotPassword;