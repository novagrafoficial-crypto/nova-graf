import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/AdminPedidos.css";

const API = `${import.meta.env.VITE_API_URL}/api/admin/pedidos`;

const ESTADOS = [
  "PENDIENTE_VERIFICACION","EN_DISENO","EN_REVISION","PREVIAS_ENVIADAS",
  "EN_PRODUCCION","PENDIENTE_PAGO_FINAL","ENVIADO","CANCELADO",
];

const COLORES = {
  PENDIENTE_VERIFICACION: { bg: "#FFF3CD", color: "#7d5a00" },
  EN_DISENO:              { bg: "#d0eaff", color: "#0a4a7c" },
  EN_REVISION:            { bg: "#ffe8d0", color: "#7a3500" },
  PREVIAS_ENVIADAS:       { bg: "#e8d5ff", color: "#4a0080" },
  EN_PRODUCCION:          { bg: "#d4f5eb", color: "#0F6E56" },
  PENDIENTE_PAGO_FINAL:   { bg: "#ffd6d6", color: "#8b0000" },
  ENVIADO:                { bg: "#e0f5e0", color: "#1a6163" },
  CANCELADO:              { bg: "#f0f0f0", color: "#555" },
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [clienteAbierto, setClienteAbierto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar pedidos por cliente
  const agrupadosPorCliente = pedidos.reduce((acc, p) => {
    const key = p.cliente_correo;
    if (!acc[key]) {
      acc[key] = {
        nombre: p.cliente_nombre,
        correo: p.cliente_correo,
        pedidos: [],
      };
    }
    acc[key].pedidos.push(p);
    return acc;
  }, {});

  // Filtrar clientes según búsqueda y filtro de estado
  const clientesFiltrados = Object.values(agrupadosPorCliente).filter((c) => {
    const coincideBusqueda =
      c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.correo?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro =
      filtro === "TODOS" || c.pedidos.some((p) => p.estado === filtro);
    return coincideBusqueda && coincideFiltro;
  });

  const formatFecha = (f) =>
    new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  const formatMoney = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Encabezado */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#1A6163", margin: "0 0 4px" }}>
          Gestión de Pedidos
        </h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
          {pedidos.length} pedidos · {clientesFiltrados.length} clientes
        </p>
      </div>

      {/* Filtros */}
      <div className="pedidos-filtros" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button
          onClick={() => setFiltro("TODOS")}
          style={{
            padding: "6px 16px", borderRadius: "20px", border: "1.5px solid",
            cursor: "pointer", fontSize: "12px", fontWeight: 500,
            background: filtro === "TODOS" ? "#1A6163" : "transparent",
            color: filtro === "TODOS" ? "#fff" : "#1A6163",
            borderColor: "#1A6163",
          }}
        >
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            style={{
              padding: "6px 16px", borderRadius: "20px", border: "1.5px solid",
              cursor: "pointer", fontSize: "12px", fontWeight: 500,
              background: filtro === e ? COLORES[e].color : "transparent",
              color: filtro === e ? "#fff" : COLORES[e].color,
              borderColor: COLORES[e].color,
            }}
          >
            {e.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <input
        type="text"
        className="pedidos-search"
        placeholder="Buscar por cliente o correo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: "100%", padding: "10px 16px", borderRadius: "10px",
          border: "1.5px solid #d4eeea", fontSize: "14px",
          marginBottom: "1rem", boxSizing: "border-box", outline: "none",
        }}
      />

      {/* Lista agrupada por cliente */}
      {loading ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>Cargando pedidos...</p>
      ) : clientesFiltrados.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No hay pedidos que mostrar.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {clientesFiltrados.map((c) => {
            const abierto = clienteAbierto === c.correo;
            const pedidosFiltrados = filtro === "TODOS"
              ? c.pedidos
              : c.pedidos.filter((p) => p.estado === filtro);
            const totalGastado = c.pedidos.reduce((acc, p) => acc + Number(p.total_general), 0);

            return (
              <div key={c.correo} className="cliente-card" style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", overflow: "hidden" }}>
                {/* Fila del cliente */}
                <div
                  className="cliente-row"
                  onClick={() => setClienteAbierto(abierto ? null : c.correo)}
                  style={{
                    padding: "1rem 1.25rem", display: "flex", alignItems: "center",
                    gap: "1rem", cursor: "pointer", transition: "background 0.15s",
                    background: abierto ? "#f0fafa" : "#fff",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "#E1F5EE", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "16px", fontWeight: 700,
                    color: "#0F6E56", flexShrink: 0,
                  }}>
                    {c.nombre?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info cliente */}
                  <div className="cliente-info" style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{c.nombre}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>{c.correo}</p>
                  </div>

                  {/* Stats */}
                  <div className="cliente-stats" style={{ display: "flex", gap: "1.5rem" }}>
                    <div style={{ textAlign: "right", minWidth: "80px" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>Pedidos</p>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1A6163" }}>{c.pedidos.length}</p>
                    </div>
                    <div style={{ textAlign: "right", minWidth: "100px" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>Total gastado</p>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1A6163" }}>{formatMoney(totalGastado)}</p>
                    </div>
                  </div>

                  {/* Flecha */}
                  <span style={{ color: "#35BA99", fontSize: "18px", transform: abierto ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                </div>

                {/* Pedidos del cliente */}
                {abierto && (
                  <div style={{ borderTop: "1px solid #e0f0ee" }}>
                    {pedidosFiltrados.map((p) => (
                      <div
                        key={p.id}
                        className="pedido-row"
                        onClick={() => navigate(`/admin/pedidos/${p.id}`)}
                        style={{
                          padding: "0.75rem 1.25rem 0.75rem 4rem",
                          display: "flex", alignItems: "center", gap: "1rem",
                          cursor: "pointer", borderBottom: "1px solid #f0f0f0",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f4fdfb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ minWidth: "40px" }}>
                          <span style={{ fontSize: "11px", color: "#999" }}>#</span>
                          <span style={{ fontWeight: 600, color: "#1A6163", fontSize: "14px" }}>{p.id}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>{formatFecha(p.fecha_pedido)}</p>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1A6163" }}>
                          {formatMoney(p.total_general)}
                        </p>
                        <span style={{
                          padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                          background: COLORES[p.estado]?.bg || "#f0f0f0",
                          color: COLORES[p.estado]?.color || "#333",
                          whiteSpace: "nowrap",
                        }}>
                          {p.estado?.replace(/_/g, " ")}
                        </span>
                        <span style={{ color: "#35BA99", fontSize: "16px" }}>›</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}