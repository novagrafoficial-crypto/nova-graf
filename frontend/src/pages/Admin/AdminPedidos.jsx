import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}/api/admin/pedidos`;

const ESTADOS = [
  "PENDIENTE_VERIFICACION",
  "ANTICIPO_VERIFICADO",
  "EN_PRODUCCION",
  "LISTO_PARA_ENTREGA",
  "ENTREGADO",
  "CANCELADO",
];

const COLORES = {
  PENDIENTE_VERIFICACION: { bg: "#FFF3CD", color: "#7d5a00" },
  ANTICIPO_VERIFICADO:    { bg: "#d4f5eb", color: "#0F6E56" },
  EN_PRODUCCION:          { bg: "#d0eaff", color: "#0a4a7c" },
  LISTO_PARA_ENTREGA:     { bg: "#e8d5ff", color: "#4a0080" },
  ENTREGADO:              { bg: "#e0f5e0", color: "#1a6163" },
  CANCELADO:              { bg: "#ffe0e0", color: "#8b0000" },
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
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

  const pedidosFiltrados = pedidos.filter((p) => {
    const coincideFiltro = filtro === "TODOS" || p.estado === filtro;
    const coincideBusqueda =
      p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(p.id).includes(busqueda);
    return coincideFiltro && coincideBusqueda;
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
          {pedidos.length} pedidos en total
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
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
        placeholder="Buscar por cliente o # de pedido..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: "100%", padding: "10px 16px", borderRadius: "10px",
          border: "1.5px solid #d4eeea", fontSize: "14px",
          marginBottom: "1rem", boxSizing: "border-box", outline: "none",
        }}
      />

      {/* Tabla */}
      {loading ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>Cargando pedidos...</p>
      ) : pedidosFiltrados.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No hay pedidos que mostrar.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {pedidosFiltrados.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/admin/pedidos/${p.id}`)}
              style={{
                background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px",
                padding: "1rem 1.25rem", display: "flex", alignItems: "center",
                gap: "1rem", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#35BA99"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#d4eeea"}
            >
              {/* ID */}
              <div style={{ minWidth: "48px", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#999" }}>#</span>
                <p style={{ margin: 0, fontWeight: 600, color: "#1A6163", fontSize: "16px" }}>{p.id}</p>
              </div>

              <div style={{ width: "1px", height: "40px", background: "#e0f0ee" }} />

              {/* Cliente */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: "14px" }}>{p.cliente_nombre}</p>
                <span style={{ fontSize: "12px", color: "#999" }}>{p.cliente_correo}</span>
              </div>

              {/* Fecha */}
              <div style={{ textAlign: "right", minWidth: "90px" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>Fecha</p>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500 }}>{formatFecha(p.fecha_pedido)}</p>
              </div>

              {/* Total */}
              <div style={{ textAlign: "right", minWidth: "100px" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>Total</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1A6163" }}>{formatMoney(p.total_general)}</p>
              </div>

              {/* Estado */}
              <span style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                background: COLORES[p.estado]?.bg || "#f0f0f0",
                color: COLORES[p.estado]?.color || "#333",
                whiteSpace: "nowrap",
              }}>
                {p.estado?.replace(/_/g, " ")}
              </span>

              <span style={{ color: "#35BA99", fontSize: "18px" }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}