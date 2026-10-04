import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const API = `${import.meta.env.VITE_API_URL}/api/admin/reportes`;

const COLORES_ESTADO = [
  "#35BA99","#1A6163","#F59E0B","#DC2626","#7C3AED","#3B82F6","#0F6E56","#6B7280"
];

const COLORES_BARRAS = [
  "#1A6163","#35BA99","#0F6E56","#F59E0B","#3B82F6","#7C3AED","#DC2626","#6B7280","#0a4a7c","#4a0080"
];

export default function AdminReportes() {
  const [ventasMes, setVentasMes] = useState([]);
  const [pedidosEstado, setPedidosEstado] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [v, e, p] = await Promise.all([
        fetch(`${API}/ventas-por-mes`).then(r => r.json()),
        fetch(`${API}/pedidos-por-estado`).then(r => r.json()),
        fetch(`${API}/productos-mas-vendidos`).then(r => r.json()),
      ]);
      setVentasMes(Array.isArray(v) ? v : []);
      setPedidosEstado(Array.isArray(e) ? e : []);
      setTopProductos(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const totalIngresos = ventasMes.reduce((acc, v) => acc + Number(v.ingresos || 0), 0);
  const totalPedidos = pedidosEstado.reduce((acc, e) => acc + Number(e.total || 0), 0);

  if (loading) return (
    <div style={{ padding: "2rem", color: "#999", textAlign: "center" }}>
      Cargando reportes...
    </div>
  );

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#f4fdfb", minHeight: "100vh" }}>

      {/* Encabezado */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#1A6163", margin: "0 0 4px" }}>Reportes</h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Información importante del negocio</p>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { label: "Ingresos totales", valor: formatMoney(totalIngresos), color: "#1A6163", icon: "💰" },
          { label: "Total pedidos", valor: totalPedidos.toLocaleString(), color: "#35BA99", icon: "📦" },
          { label: "Productos en catálogo", valor: `${topProductos.length}+`, color: "#F59E0B", icon: "🏷️" },
        ].map((t, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: 28 }}>{t.icon}</span>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#999" }}>{t.label}</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: t.color }}>{t.valor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfica ingresos por mes */}
      <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>📈 Ingresos por mes</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ventasMes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(l) => `Mes: ${l}`} />
            <Bar dataKey="ingresos" fill="#1A6163" name="Ingresos" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pedidos por estado y top productos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Pedidos por estado — lista con barras */}
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>📊 Pedidos por estado</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pedidosEstado.map((e, i) => {
              const pct = ((Number(e.total) / totalPedidos) * 100).toFixed(1);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#333", fontWeight: 500 }}>
                      {e.estado?.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: "12px", color: "#999" }}>
                      {Number(e.total).toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "8px", overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: COLORES_ESTADO[i % COLORES_ESTADO.length],
                      borderRadius: "20px", transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top productos */}
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>🏆 Top 10 productos más vendidos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topProductos.slice(0, 10).map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", background: COLORES_BARRAS[i % COLORES_BARRAS.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.nombre}
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: "#35BA99", fontWeight: 600, flexShrink: 0 }}>
                  {Number(p.unidades_vendidas).toLocaleString()} uds.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}