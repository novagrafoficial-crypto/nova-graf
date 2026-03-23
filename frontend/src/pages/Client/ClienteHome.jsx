import { useOutletContext, useNavigate } from "react-router-dom";

function ClienteHome() {
  const navigate = useNavigate();
  
  // Protección contra null en el primer render
  const context = useOutletContext();
  if (!context) return null;
  
  const { user } = context;

  const cards = [
    { icon: "📦", title: "Mis Pedidos", desc: "Revisa el estado de tus pedidos", ruta: "/cliente/pedidos" },
    { icon: "🛒", title: "Mi Carrito", desc: "Productos agregados", ruta: "/cliente/carrito" },
    { icon: "👤", title: "Mi Perfil", desc: "Gestiona tu información", ruta: "/cliente/perfil" },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "Arial", marginBottom: "8px" }}>
        Bienvenido, {user.nombre} 👋
      </h1>
      <p style={{ color: "#64748b", marginBottom: "32px" }}>¿Qué deseas hacer hoy?</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        {cards.map((card) => (
          <div
            key={card.ruta}
            onClick={() => navigate(card.ruta)}
            style={{
              background: "#f9fafb", borderRadius: "12px", padding: "28px 24px",
              border: "1px solid #e5e7eb", cursor: "pointer", fontFamily: "Arial"
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{card.icon}</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>{card.title}</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>{card.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "40px", background: "#f1f5f9", borderRadius: "12px", padding: "20px 24px", border: "1px solid #e2e8f0" }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Tu cuenta</h4>
        <p style={{ margin: "4px 0", color: "#475569" }}><strong>Correo:</strong> {user.correo_electronico}</p>
        <p style={{ margin: "4px 0", color: "#475569" }}><strong>Rol:</strong> {user.rol}</p>
      </div>
    </div>
  );
}

export default ClienteHome;