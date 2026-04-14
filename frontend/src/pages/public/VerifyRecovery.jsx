import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";

const API_URL = import.meta.env.VITE_API_URL;

function VerifyRecovery() {
  const { id_usuario } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [msgColor, setMsgColor] = useState("#ef4444");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Validación: solo dígitos y longitud 6
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (otp.length !== 6) {
      setMsgColor("#ef4444");
      setMessage("El código debe tener exactamente 6 dígitos");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/verify-recovery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario, otp }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        navigate(`/reset-password/${id_usuario}`);
      } else {
        setMsgColor("#ef4444");
        setMessage(data.message || "Código incorrecto");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/users/resend-recovery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario }),
      });
      const data = await res.json();
      setMsgColor("#35BA99"); // color empresa éxito
      setMessage(data.message || "Código reenviado");
      setOtp("");
    } catch {
      setMsgColor("#ef4444");
      setMessage("Error al reenviar");
    } finally {
      setResendLoading(false);
    }
  };

  // Estilos con colores corporativos y margin-top para separar del header
  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#F5F7FA",
      marginTop: "90px", // separación del header
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
      color: "#1A6163", // PANTONE 7721 CP
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
      padding: "14px",
      borderRadius: "14px",
      border: `2px solid #DBDBDB`,
      fontFamily: "monospace",
      fontSize: "1.8rem",
      letterSpacing: "10px",
      textAlign: "center",
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
      background: "#35BA99", // PANTONE 7465 CP
      color: "white",
      border: "none",
      borderRadius: "40px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background 0.2s",
    },
    buttonHover: {
      background: "#1A6163",
    },
    buttonDisabled: {
      background: "#B0BEC5",
      cursor: "not-allowed",
    },
    message: {
      marginTop: "16px",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.9rem",
      fontWeight: "500",
    },
    resendContainer: {
      textAlign: "center",
      marginTop: "20px",
      borderTop: `1px solid #DBDBDB`,
      paddingTop: "20px",
    },
    resendText: {
      color: "#565653",
      fontSize: "0.85rem",
      marginBottom: "8px",
    },
    resendButton: {
      background: "none",
      border: "none",
      color: "#1A6163",
      fontWeight: "600",
      fontSize: "0.9rem",
      textDecoration: "underline",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.title}>Verifica tu código</h2>
          <p style={styles.description}>
            Ingresa el código de 6 dígitos que enviamos a tu correo.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <label style={styles.label}>Código OTP</label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                required
                style={styles.input}
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => (e.target.style.borderColor = "#DBDBDB")}
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
              {loading ? "Verificando..." : "Verificar código"}
            </button>
          </form>

          {message && <p style={{ ...styles.message, color: msgColor }}>{message}</p>}

          <div style={styles.resendContainer}>
            <p style={styles.resendText}>¿No recibiste el código o expiró?</p>
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={styles.resendButton}
            >
              {resendLoading ? "Reenviando..." : "Reenviar código"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default VerifyRecovery;