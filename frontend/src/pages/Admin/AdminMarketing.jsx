import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL}/api/admin/marketing`;
const API_PRODUCTOS = `${import.meta.env.VITE_API_URL}/api/admin/productos`;

export default function AdminMarketing() {
  const [ofertas, setOfertas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vista, setVista] = useState("lista"); // lista | crear | editar
  const [ofertaActiva, setOfertaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const FORM_VACIO = {
    nombre: "", tipo: "PORCENTAJE", valor: "",
    cantidad_minima: 1, fecha_inicio: "", fecha_fin: "",
    productos: []
  };
  const [form, setForm] = useState(FORM_VACIO);

  useEffect(() => { cargar(); cargarProductos(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setOfertas(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const cargarProductos = async () => {
    try {
      const res = await fetch(API_PRODUCTOS);
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const handleForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleProducto = (producto_id) => {
    setForm(f => {
      const existe = f.productos.find(p => p.producto_id === producto_id);
      return {
        ...f,
        productos: existe
          ? f.productos.filter(p => p.producto_id !== producto_id)
          : [...f.productos, { producto_id, prioridad: 1 }]
      };
    });
  };

  const guardar = async () => {
    if (!form.nombre || !form.valor) {
      setStatus({ tipo: "error", msg: "Nombre y valor son requeridos" });
      return;
    }
    try {
      const url = ofertaActiva ? `${API}/${ofertaActiva.id}` : API;
      const method = ofertaActiva ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setStatus({ tipo: "ok", msg: ofertaActiva ? "Oferta actualizada" : "Oferta creada" });
      setVista("lista");
      setForm(FORM_VACIO);
      setOfertaActiva(null);
      cargar();
    } catch (err) {
      setStatus({ tipo: "error", msg: err.message });
    }
  };

  const abrirEditar = async (id) => {
    const res = await fetch(`${API}/${id}`);
    const data = await res.json();
    setOfertaActiva(data.descuento);
    setForm({
      nombre: data.descuento.nombre,
      tipo: data.descuento.tipo,
      valor: data.descuento.valor,
      cantidad_minima: data.descuento.cantidad_minima,
      fecha_inicio: data.descuento.fecha_inicio?.slice(0, 10) || "",
      fecha_fin: data.descuento.fecha_fin?.slice(0, 10) || "",
      productos: data.productos.map(p => ({ producto_id: p.producto_id, prioridad: p.prioridad }))
    });
    setVista("editar");
  };

  const togglePublicar = async (id, activo) => {
    await fetch(`${API}/${id}/publicar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    cargar();
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta oferta?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    cargar();
  };

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (vista === "crear" || vista === "editar") {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ color: "#1A6163", marginBottom: "1.5rem" }}>
          {vista === "crear" ? "Nueva oferta" : "Editar oferta"}
        </h2>

        {status && (
          <div style={{
            padding: "12px 16px", borderRadius: "10px", marginBottom: "1rem",
            background: status.tipo === "ok" ? "#d4f5eb" : "#ffd6d6",
            color: status.tipo === "ok" ? "#0F6E56" : "#8b0000",
            borderLeft: `3px solid ${status.tipo === "ok" ? "#35BA99" : "#dc3545"}`,
          }}>{status.msg}</div>
        )}

        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
          <h3 style={{ color: "#1A6163", fontSize: "15px", marginBottom: "1rem" }}>Datos de la oferta</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Nombre *</label>
              <input value={form.nombre} onChange={e => handleForm("nombre", e.target.value)}
                placeholder="Ej: Descuento de verano"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Tipo *</label>
              <select value={form.tipo} onChange={e => handleForm("tipo", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }}>
                <option value="PORCENTAJE">Porcentaje (%)</option>
                <option value="MONTO_FIJO">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
                Valor * {form.tipo === "PORCENTAJE" ? "(%)" : "($)"}
              </label>
              <input type="number" value={form.valor} onChange={e => handleForm("valor", e.target.value)}
                placeholder={form.tipo === "PORCENTAJE" ? "Ej: 20" : "Ej: 50"}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Cantidad mínima</label>
              <input type="number" value={form.cantidad_minima} onChange={e => handleForm("cantidad_minima", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Fecha inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e => handleForm("fecha_inicio", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Fecha fin</label>
              <input type="date" value={form.fecha_fin} onChange={e => handleForm("fecha_fin", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        {/* Selección de productos */}
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
          <h3 style={{ color: "#1A6163", fontSize: "15px", marginBottom: "1rem" }}>
            Productos en oferta ({form.productos.length} seleccionados)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {productos.map(p => {
              const seleccionado = form.productos.find(fp => fp.producto_id === p.id);
              return (
                <div key={p.id} onClick={() => toggleProducto(p.id)}
                  style={{
                    padding: "12px", borderRadius: "10px", cursor: "pointer",
                    border: `2px solid ${seleccionado ? "#35BA99" : "#e0f0ee"}`,
                    background: seleccionado ? "#f0fdf9" : "#fff",
                    transition: "all 0.15s"
                  }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: seleccionado ? "#1A6163" : "#333" }}>
                    {seleccionado ? "✓ " : ""}{p.nombre}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#999" }}>
                    ${parseFloat(p.precio_base).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={guardar} style={{
            padding: "12px 28px", borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg, #1A6163, #35BA99)",
            color: "#fff", cursor: "pointer", fontWeight: 600
          }}>
            {vista === "crear" ? "Guardar como borrador" : "Guardar cambios"}
          </button>
          <button onClick={() => { setVista("lista"); setForm(FORM_VACIO); setOfertaActiva(null); }}
            style={{ padding: "12px 28px", borderRadius: "8px", border: "1.5px solid #d4eeea", background: "#fff", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: "#1A6163", fontSize: "22px", fontWeight: 500, margin: 0 }}>Ofertas y descuentos</h1>
          <p style={{ color: "#999", fontSize: "14px", margin: "4px 0 0" }}>{ofertas.length} ofertas en total</p>
        </div>
        <button onClick={() => { setVista("crear"); setStatus(null); }} style={{
          padding: "10px 20px", borderRadius: "8px", border: "none",
          background: "linear-gradient(135deg, #1A6163, #35BA99)",
          color: "#fff", cursor: "pointer", fontWeight: 600
        }}>
          + Nueva oferta
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>Cargando...</p>
      ) : ofertas.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No hay ofertas aún.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {ofertas.map(o => (
            <div key={o.id} style={{
              background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px",
              padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "15px" }}>{o.nombre}</p>
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                    background: o.activo ? "#d4f5eb" : "#f0f0f0",
                    color: o.activo ? "#0F6E56" : "#666"
                  }}>
                    {o.activo ? "Publicada" : "Borrador"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                  {o.tipo === "PORCENTAJE" ? `${o.valor}% de descuento` : `$${o.valor} de descuento`}
                  {" · "}{o.total_productos} producto(s)
                  {o.fecha_inicio && ` · ${formatFecha(o.fecha_inicio)} — ${formatFecha(o.fecha_fin)}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => togglePublicar(o.id, o.activo)} style={{
                  padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "12px",
                  background: o.activo ? "#fff3cd" : "#d4f5eb",
                  color: o.activo ? "#7d5a00" : "#0F6E56"
                }}>
                  {o.activo ? "Despublicar" : "Publicar"}
                </button>
                <button onClick={() => abrirEditar(o.id)} style={{
                  padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #35BA99",
                  background: "#fff", color: "#1A6163", cursor: "pointer", fontWeight: 600, fontSize: "12px"
                }}>
                  Editar
                </button>
                <button onClick={() => eliminar(o.id)} style={{
                  padding: "8px 16px", borderRadius: "8px", border: "none",
                  background: "#ffd6d6", color: "#8b0000", cursor: "pointer", fontWeight: 600, fontSize: "12px"
                }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}