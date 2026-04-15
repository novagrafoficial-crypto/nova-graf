import { useState, useEffect } from "react";

const COLORS = {
  teal2: "#35BA99",
  teal1: "#1A6163",
  black: "#000000",
  red: "#FF0000",
  white: "#FFFFFF",
  border: "#D9D9D6",
  tealLight: "rgba(53, 186, 153, 0.12)",
};

export default function PaginaEnProceso({ titulo = "Página en construcción", mensaje = "Estamos trabajando para traerte esta funcionalidad muy pronto." }) {
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgreso(prev => (prev >= 100 ? 100 : prev + 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Icono animado */}
        <div style={styles.iconContainer}>
          <span style={styles.icon}>🚧</span>
        </div>

        {/* Título */}
        <h1 style={styles.title}>{titulo}</h1>

        {/* Mensaje */}
        <p style={styles.message}>{mensaje}</p>

        {/* Barra de progreso animada */}
        <div style={styles.progressBarContainer}>
          <div style={{ ...styles.progressBarFill, width: `${progreso}%` }} />
        </div>
        <p style={styles.progressText}>{progreso}% completado</p>

        {/* Separador decorativo */}
        <div style={styles.separator} />

        {/* Estado del sistema */}
        <div style={styles.statusContainer}>
          <span style={styles.statusDot} />
          <span style={styles.statusText}>Sistema en desarrollo activo</span>
        </div>

        {/* Fecha estimada (opcional) */}
        <p style={styles.estimatedDate}>📅 Fecha estimada: Próximamente</p>

        {/* Botón de volver (opcional) */}
        <button style={styles.button} onClick={() => window.history.back()}>
          ← Volver atrás
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
    padding: "40px 20px",
    background: "linear-gradient(135deg, #F4F8F7 0%, #EDF3F1 100%)",
  },
  card: {
    maxWidth: "500px",
    width: "100%",
    background: COLORS.white,
    borderRadius: "28px",
    padding: "48px 40px",
    textAlign: "center",
    boxShadow: "0 20px 40px -12px rgba(26, 97, 99, 0.12), 0 4px 12px rgba(0, 0, 0, 0.02)",
    border: `1px solid ${COLORS.border}`,
    transition: "all 0.3s ease",
  },
  iconContainer: {
    marginBottom: "24px",
  },
  icon: {
    fontSize: "64px",
    display: "inline-block",
    animation: "bounce 1s ease-in-out infinite",
  },
  title: {
    fontSize: "28px",
    fontWeight: 800,
    fontFamily: "'Syne', sans-serif",
    color: COLORS.teal1,
    marginBottom: "16px",
    letterSpacing: "-0.02em",
  },
  message: {
    fontSize: "15px",
    color: "#4A5568",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  progressBarContainer: {
    height: "8px",
    background: COLORS.tealLight,
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressBarFill: {
    height: "100%",
    background: `linear-gradient(90deg, ${COLORS.teal1}, ${COLORS.teal2})`,
    borderRadius: "10px",
    transition: "width 0.1s linear",
  },
  progressText: {
    fontSize: "12px",
    color: COLORS.teal2,
    fontWeight: 600,
    marginBottom: "32px",
  },
  separator: {
    width: "60px",
    height: "3px",
    background: `linear-gradient(90deg, ${COLORS.teal1}, ${COLORS.teal2})`,
    borderRadius: "3px",
    margin: "0 auto 24px auto",
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: COLORS.teal2,
    animation: "pulse 1.5s ease-in-out infinite",
  },
  statusText: {
    fontSize: "12px",
    color: COLORS.teal1,
    fontWeight: 500,
  },
  estimatedDate: {
    fontSize: "12px",
    color: "#9AA5B4",
    marginBottom: "24px",
  },
  button: {
    background: `linear-gradient(135deg, ${COLORS.teal1}, ${COLORS.teal2})`,
    color: COLORS.white,
    border: "none",
    padding: "10px 24px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(53, 186, 153, 0.25)",
  },
};

// Agregar keyframes al documento
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
`;
document.head.appendChild(styleSheet);