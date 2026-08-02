import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/usuarios`;
const API_CLUSTER = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/clientes`;

const SEGMENTO_STYLE = {
  "VIP":      { bg: "#D1FAE5", color: "#0F6E56", emoji: "⭐" },
  "Ocasional":{ bg: "#e0f5e0", color: "#1A6163", emoji: "📦" },
  "Inactivo": { bg: "#F3F4F6", color: "#6B7280", emoji: "💤" },
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [segmentos, setSegmentos] = useState({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSegmento, setFiltroSegmento] = useState("TODOS");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setUsuarios(lista);
      const clientes = lista.filter(u => u.rol === "cliente");
      cargarSegmentos(clientes);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const cargarSegmentos = async (clientes) => {
    const mapa = {};
    await Promise.all(
      clientes.map(async (u) => {
        try {
          const res = await fetch(`${API_CLUSTER}/${u.id_usuario}/segmento`);
          const data = await res.json();
          mapa[u.id_usuario] = data.segmento || "Ocasional";
        } catch {
          mapa[u.id_usuario] = "Ocasional";
        }
      })
    );
    setSegmentos(mapa);
  };

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === "administrador" ? "cliente" : "administrador";
    await fetch(`${API}/${id}/rol`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: nuevoRol }),
    });
    await cargar();
    setUsuarioSeleccionado(prev => prev ? { ...prev, rol: nuevoRol } : prev);
  };

  const cambiarEstado = async (id, estadoActual) => {
    await fetch(`${API}/${id}/activo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !estadoActual }),
    });
    await cargar();
    setUsuarioSeleccionado(prev => prev ? { ...prev, activo: !estadoActual } : prev);
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideBusqueda =
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo_electronico?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideSegmento =
      filtroSegmento === "TODOS" ||
      u.rol !== "cliente" ||
      segmentos[u.id_usuario] === filtroSegmento;
    return coincideBusqueda && coincideSegmento;
  });

  const conteo = { VIP: 0, Ocasional: 0, Inactivo: 0 };
  Object.values(segmentos).forEach(s => { if (conteo[s] !== undefined) conteo[s]++; });

  return (
    <div style={{ padding: "1.5rem" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: "#1A6163", fontSize: "22px", fontWeight: 500, margin: 0 }}>Gestión de Usuarios</h1>
          <p style={{ color: "#999", fontSize: "14px", margin: "4px 0 0" }}>{usuarios.length} usuarios registrados</p>
        </div>
      </div>

      {/* Resumen de segmentos ML */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
        {Object.entries(SEGMENTO_STYLE).map(([seg, style]) => (
          <div
            key={seg}
            onClick={() => setFiltroSegmento(filtroSegmento === seg ? "TODOS" : seg)}
            style={{
              background: filtroSegmento === seg ? style.bg : "#fff",
              border: `1.5px solid ${filtroSegmento === seg ? style.color : "#d4eeea"}`,
              borderRadius: "20px", padding: "1.1rem 1.3rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "10px",
              boxShadow: "0 2px 10px rgba(26, 97, 99, 0.07)",
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: 24 }}>{style.emoji}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "18px", color: style.color }}>{conteo[seg]}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Clientes {seg}</p>
            </div>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, correo o usuario..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{
          width: "100%", padding: "10px 16px", borderRadius: "10px",
          border: "1.5px solid #d4eeea", fontSize: "14px",
          marginBottom: "1rem", boxSizing: "border-box", outline: "none",
        }}
      />

      {loading ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>Cargando usuarios...</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 10px rgba(26, 97, 99, 0.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#1A6163" }}>
                {["ID", "Nombre", "Rol", "Segmento ML", "Estado"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#fff", fontWeight: 600, fontSize: "12px", borderBottom: "2px solid #35BA99" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No hay usuarios que mostrar</td></tr>
              ) : usuariosFiltrados.map((u, i) => {
                const seg = segmentos[u.id_usuario];
                const segStyle = SEGMENTO_STYLE[seg] || {};
                return (
                  <tr key={u.id_usuario} style={{ background: i % 2 === 0 ? "#fff" : "#f9fefe", borderBottom: "1px solid #e0f0ee" }}>
                    <td style={{ padding: "12px 14px", color: "#999" }}>#{u.id_usuario}</td>
                    <td
                      onClick={() => setUsuarioSeleccionado(u)}
                      style={{ padding: "12px 14px", fontWeight: 500, cursor: "pointer" }}
                      title="Ver detalles"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: u.rol === "administrador" ? "#1A6163" : "#E1F5EE",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: 700,
                          color: u.rol === "administrador" ? "#fff" : "#0F6E56",
                          flexShrink: 0
                        }}>
                          {u.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: "#1A6163", textDecoration: "underline", textDecorationColor: "transparent" }}>
                          {u.nombre} {u.apellido_paterno}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                        background: u.rol === "administrador" ? "#1A6163" : "rgba(53, 186, 153, 0.14)",
                        color: u.rol === "administrador" ? "#fff" : "#1c7360",
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {u.rol === "cliente" && seg ? (
                        <span style={{
                          padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                          background: segStyle.bg, color: segStyle.color,
                        }}>
                          {segStyle.emoji} {seg}
                        </span>
                      ) : (
                        <span style={{ color: "#ccc", fontSize: "11px" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                        background: u.activo ? "#d4f5eb" : "#f0f0f0",
                        color: u.activo ? "#0F6E56" : "#666",
                      }}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalle de usuario */}
      {usuarioSeleccionado && (
        <div
          onClick={() => setUsuarioSeleccionado(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15, 40, 40, 0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "1rem"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "20px", padding: "1.8rem",
              width: "100%", maxWidth: "420px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              position: "relative"
            }}
          >
            <button
              onClick={() => setUsuarioSeleccionado(null)}
              style={{
                position: "absolute", top: "1rem", right: "1rem",
                border: "none", background: "transparent", fontSize: "18px",
                color: "#999", cursor: "pointer", lineHeight: 1
              }}
            >
              ✕
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "1.4rem" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: usuarioSeleccionado.rol === "administrador" ? "#1A6163" : "#E1F5EE",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", fontWeight: 700,
                color: usuarioSeleccionado.rol === "administrador" ? "#fff" : "#0F6E56",
                flexShrink: 0
              }}>
                {usuarioSeleccionado.nombre?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "17px", color: "#1A6163" }}>
                  {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido_paterno}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#999" }}>#{usuarioSeleccionado.id_usuario}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.4rem" }}>
              <DetalleFila label="Usuario" valor={usuarioSeleccionado.nombre_usuario || "—"} />
              <DetalleFila label="Correo" valor={usuarioSeleccionado.correo_electronico} />
              <DetalleFila
                label="Rol"
                valor={
                  <span style={{
                    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                    background: usuarioSeleccionado.rol === "administrador" ? "#1A6163" : "rgba(53, 186, 153, 0.14)",
                    color: usuarioSeleccionado.rol === "administrador" ? "#fff" : "#1c7360",
                  }}>
                    {usuarioSeleccionado.rol}
                  </span>
                }
              />
              {usuarioSeleccionado.rol === "cliente" && (
                <DetalleFila
                  label="Segmento ML"
                  valor={
                    segmentos[usuarioSeleccionado.id_usuario] ? (
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                        background: SEGMENTO_STYLE[segmentos[usuarioSeleccionado.id_usuario]]?.bg,
                        color: SEGMENTO_STYLE[segmentos[usuarioSeleccionado.id_usuario]]?.color,
                      }}>
                        {SEGMENTO_STYLE[segmentos[usuarioSeleccionado.id_usuario]]?.emoji} {segmentos[usuarioSeleccionado.id_usuario]}
                      </span>
                    ) : "—"
                  }
                />
              )}
              <DetalleFila
                label="Estado"
                valor={
                  <span style={{
                    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                    background: usuarioSeleccionado.activo ? "#d4f5eb" : "#f0f0f0",
                    color: usuarioSeleccionado.activo ? "#0F6E56" : "#666",
                  }}>
                    {usuarioSeleccionado.activo ? "Activo" : "Inactivo"}
                  </span>
                }
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => cambiarRol(usuarioSeleccionado.id_usuario, usuarioSeleccionado.rol)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #35BA99",
                  background: "#fff", color: "#1A6163", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                }}
              >
                {usuarioSeleccionado.rol === "administrador" ? "Hacer Cliente" : "Hacer Administrador"}
              </button>
              <button
                onClick={() => cambiarEstado(usuarioSeleccionado.id_usuario, usuarioSeleccionado.activo)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600,
                  background: usuarioSeleccionado.activo ? "#ffd6d6" : "#d4f5eb",
                  color: usuarioSeleccionado.activo ? "#8b0000" : "#0F6E56",
                }}
              >
                {usuarioSeleccionado.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetalleFila({ label, valor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "#999" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#333", fontWeight: 500 }}>{valor}</span>
    </div>
  );
}
