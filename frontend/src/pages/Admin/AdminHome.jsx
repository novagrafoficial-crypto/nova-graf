import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminHome() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser?.nombre || storedUser?.name || "Administrador";
  const navigate = useNavigate();

  const stats = [
    { label: "Pedidos pendientes", value: 5, sub: "por atender" },
    { label: "Productos activos", value: 38, sub: "en catálogo" },
    { label: "Usuarios registrados", value: 124, sub: "en total" },
  ];

  const pedidos = [
    { iniciales: "JL", nombre: "Juan López", detalle: "Tarjetas de presentación · hoy" },
    { iniciales: "MR", nombre: "María Ramos", detalle: "Banner 2x1m · ayer" },
    { iniciales: "CA", nombre: "Carlos Arenas", detalle: "Playeras · hace 2 días" },
  ];

  const accesos = [
    { icon: "📦", label: "Marcas", ruta: "marcas" },
    { icon: "🛍️", label: "Productos", ruta: "productos" },
    { icon: "👥", label: "Usuarios", ruta: "usuarios" },
    { icon: "📊", label: "Predicción", ruta: "stock" },
    { icon: "🏢", label: "Empresa", ruta: "empresa" },
    { icon: "📰", label: "Publicación", ruta: "publicacion" },
  ];

  return (
    <div style={{ padding: "1.5rem" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1A6163 0%, #35BA99 100%)",
        borderRadius: "16px", padding: "2rem 2.5rem",
        marginBottom: "1.5rem", display: "flex",
        alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 500, margin: "0 0 6px" }}>
            Bienvenida, {adminName}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0 }}>
            Panel de administración · Nova Graf
          </p>
        </div>
        <span style={{ fontSize: "56px", opacity: 0.3 }}>🗂️</span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
        {stats.map(({ label, value, sub }) => (
          <div key={label} style={{ background: "#f0fafa", borderRadius: "8px", padding: "1rem" }}>
            <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: "24px", fontWeight: 500, color: "#1A6163", margin: 0 }}>{value}</p>
            <p style={{ fontSize: "11px", color: "#35BA99", margin: "2px 0 0" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Grid inferior */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Pedidos pendientes */}
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>Pedidos pendientes</span>
            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "#FFF3CD", color: "#7d5a00", fontWeight: 500 }}>5 nuevos</span>
          </div>
          {pedidos.map(({ iniciales, nombre, detalle }) => (
            <div key={nombre} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid #f0f0f0" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 500, color: "#0F6E56", flexShrink: 0 }}>
                {iniciales}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500 }}>{nombre}</p>
                <span style={{ fontSize: "12px", color: "#999" }}>{detalle}</span>
              </div>
              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: "#FFF3CD", color: "#7d5a00", fontWeight: 500 }}>Pendiente</span>
            </div>
          ))}
        </div>

        {/* Accesos rápidos */}
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: "12px", padding: "1.25rem" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "1rem" }}>Accesos rápidos</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {accesos.map(({ icon, label, ruta }) => (
              <div key={ruta} onClick={() => navigate(ruta)} style={{
                background: "#f0fafa", border: "0.5px solid #e0e0e0",
                borderRadius: "12px", padding: "1rem 0.75rem",
                textAlign: "center", cursor: "pointer"
              }}>
                <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
                <span style={{ fontSize: "11px", color: "#1A6163" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminHome;