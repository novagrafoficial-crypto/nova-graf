import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const accesos = [
  { icon: "🛍️", label: "Productos", ruta: "productos" },
  { icon: "👥", label: "Usuarios", ruta: "usuarios" },
  { icon: "🏢", label: "Empresa", ruta: "empresa" },
  { icon: "📰", label: "Publicación", ruta: "publicacion" },
  { icon: "🗂️", label: "Catálogo", ruta: "catalogo" },
  { icon: "🏷️", label: "Ofertas", ruta: "ofertas" },
];

function AdminHome() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser?.nombre || storedUser?.name || "Administrador";
  const navigate = useNavigate();

  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [pedientesLista, setPendientesLista] = useState([]);
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resPedidos, resProductos, resUsuarios] = await Promise.all([
          fetch(`${API}/api/admin/pedidos`),
          fetch(`${API}/api/admin/productos`),
          fetch(`${API}/api/admin/usuarios`),
        ]);

        const pedidos = await resPedidos.json();
        const productos = await resProductos.json();
        const usuarios = await resUsuarios.json();

        const pendientes = Array.isArray(pedidos)
          ? pedidos.filter(p => p.estado === "PENDIENTE_VERIFICACION")
          : [];

        setPedidosPendientes(pendientes.length);
        setPendientesLista(pendientes.slice(0, 3));
        setTotalProductos(Array.isArray(productos) ? productos.filter(p => p.activo).length : 0);
        setTotalUsuarios(Array.isArray(usuarios) ? usuarios.length : 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const stats = [
    { label: "Pedidos pendientes", value: pedidosPendientes, sub: "por atender" },
    { label: "Productos activos", value: totalProductos, sub: "en catálogo" },
    { label: "Usuarios registrados", value: totalUsuarios, sub: "en total" },
  ];

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "—";
  const formatMoney = (n) => Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

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
            <p style={{ fontSize: "24px", fontWeight: 500, color: "#1A6163", margin: 0 }}>
              {loading ? "..." : value}
            </p>
            <p style={{ fontSize: "11px", color: "#35BA99", margin: "2px 0 0" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Grid inferior */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Pedidos pendientes */}
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Pedidos pendientes
            </span>
            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "#FFF3CD", color: "#7d5a00", fontWeight: 500 }}>
              {pedidosPendientes} nuevos
            </span>
          </div>
          {loading ? (
            <p style={{ color: "#999", fontSize: "13px" }}>Cargando...</p>
          ) : pedientesLista.length === 0 ? (
            <p style={{ color: "#999", fontSize: "13px" }}>Sin pedidos pendientes 🎉</p>
          ) : pedientesLista.map((p) => (
            <div key={p.id}
              onClick={() => navigate(`pedidos/${p.id}`)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid #f0f0f0", cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 500, color: "#0F6E56", flexShrink: 0 }}>
                {p.cliente_nombre?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500 }}>{p.cliente_nombre}</p>
                <span style={{ fontSize: "12px", color: "#999" }}>
                  Pedido #{p.id} · {formatFecha(p.fecha_pedido)} · {formatMoney(p.total_general)}
                </span>
              </div>
              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: "#FFF3CD", color: "#7d5a00", fontWeight: 500 }}>
                Pendiente
              </span>
            </div>
          ))}
          {pedidosPendientes > 3 && (
            <p onClick={() => navigate("pedidos")} style={{ margin: "10px 0 0", fontSize: "12px", color: "#35BA99", cursor: "pointer", textAlign: "center" }}>
              Ver todos ({pedidosPendientes}) →
            </p>
          )}
        </div>

        {/* Accesos rápidos */}
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: "12px", padding: "1.25rem" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "1rem" }}>
            Accesos rápidos
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {accesos.map(({ icon, label, ruta }) => (
              <div key={ruta} onClick={() => navigate(ruta)} style={{
                background: "#f0fafa", border: "0.5px solid #e0e0e0",
                borderRadius: "12px", padding: "1rem 0.75rem",
                textAlign: "center", cursor: "pointer",
                transition: "border-color 0.15s"
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#35BA99"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e0e0e0"}
              >
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