import { useEffect, useState } from "react";

const API_PROV = `${import.meta.env.VITE_API_URL}/api/admin/proveedores`;
const API_COMP = `${import.meta.env.VITE_API_URL}/api/admin/compras`;
const API_PROD = `${import.meta.env.VITE_API_URL}/api/admin/productos`;

const TABS = ["Proveedores", "Compras"];

const FORM_PROV = { nombre_proveedor: "", contacto_nombre: "", telefono: "", correo_electronico: "", direccion: "", activo: true };

export default function AdminInventario() {
  const [tab, setTab] = useState("Proveedores");
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [status, setStatus] = useState(null);

  const [formProv, setFormProv] = useState(FORM_PROV);
  const [editandoProv, setEditandoProv] = useState(null);
  const [mostrarFormProv, setMostrarFormProv] = useState(false);

  const [mostrarFormComp, setMostrarFormComp] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [detalleCompra, setDetalleCompra] = useState([]);

  useEffect(() => { cargarProveedores(); cargarCompras(); cargarProductos(); }, []);

  const cargarProveedores = async () => {
    const res = await fetch(API_PROV);
    const data = await res.json();
    setProveedores(Array.isArray(data) ? data : []);
  };

  const cargarCompras = async () => {
    const res = await fetch(API_COMP);
    const data = await res.json();
    setCompras(Array.isArray(data) ? data : []);
  };

  const cargarProductos = async () => {
    const res = await fetch(API_PROD);
    const data = await res.json();
    setProductos(Array.isArray(data) ? data : []);
  };

  const mostrarStatus = (tipo, msg) => {
    setStatus({ tipo, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  const guardarProveedor = async () => {
    if (!formProv.nombre_proveedor.trim()) {
      mostrarStatus("error", "El nombre es requerido");
      return;
    }
    try {
      const url = editandoProv ? `${API_PROV}/${editandoProv}` : API_PROV;
      const method = editandoProv ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formProv),
      });
      if (!res.ok) throw new Error("Error al guardar");
      mostrarStatus("ok", editandoProv ? "Proveedor actualizado" : "Proveedor creado");
      setFormProv(FORM_PROV);
      setEditandoProv(null);
      setMostrarFormProv(false);
      cargarProveedores();
    } catch (err) {
      mostrarStatus("error", err.message);
    }
  };

  const abrirEditarProv = (p) => {
    setFormProv({
      nombre_proveedor: p.nombre_proveedor,
      contacto_nombre: p.contacto_nombre || "",
      telefono: p.telefono || "",
      correo_electronico: p.correo_electronico || "",
      direccion: p.direccion || "",
      activo: p.activo,
    });
    setEditandoProv(p.proveedor_id);
    setMostrarFormProv(true);
  };

  const eliminarProveedor = async (id) => {
    if (!window.confirm("¿Eliminar este proveedor?")) return;
    await fetch(`${API_PROV}/${id}`, { method: "DELETE" });
    cargarProveedores();
  };

  const agregarProductoDetalle = (producto) => {
    const existe = detalleCompra.find(d => d.producto_nombre === producto.nombre);
    if (existe) return;
    setDetalleCompra(prev => [...prev, {
      variante_id: null,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      sku: "—",
      cantidad: 1,
      precio_unitario: 0,
    }]);
  };

  const actualizarDetalle = (producto_id, campo, valor) => {
    setDetalleCompra(prev => prev.map(d =>
      d.producto_id === producto_id ? { ...d, [campo]: valor } : d
    ));
  };

  const quitarDetalle = (producto_id) => {
    setDetalleCompra(prev => prev.filter(d => d.producto_id !== producto_id));
  };

  const guardarCompra = async () => {
    if (!proveedorSeleccionado || detalleCompra.length === 0) {
      mostrarStatus("error", "Selecciona un proveedor y agrega productos");
      return;
    }
    try {
      const res = await fetch(API_COMP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor_id: proveedorSeleccionado,
          observaciones,
          detalle: detalleCompra.map(d => ({
            variante_id: d.variante_id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
          })),
        }),
      });
      if (!res.ok) throw new Error("Error al guardar compra");
      mostrarStatus("ok", "Compra registrada correctamente");
      setMostrarFormComp(false);
      setProveedorSeleccionado("");
      setObservaciones("");
      setDetalleCompra([]);
      cargarCompras();
    } catch (err) {
      mostrarStatus("error", err.message);
    }
  };

  const eliminarCompra = async (id) => {
    if (!window.confirm("¿Eliminar esta compra?")) return;
    await fetch(`${API_COMP}/${id}`, { method: "DELETE" });
    cargarCompras();
  };

  const totalCompra = detalleCompra.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0);
  const formatMoney = (n) => Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  const formatFecha = (f) => f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div style={{ padding: "1.5rem" }}>

      {status && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px", marginBottom: "1rem", fontSize: "13px", fontWeight: 500,
          background: status.tipo === "ok" ? "#d4f5eb" : "#ffd6d6",
          color: status.tipo === "ok" ? "#0F6E56" : "#8b0000",
          borderLeft: `3px solid ${status.tipo === "ok" ? "#35BA99" : "#dc3545"}`,
        }}>{status.msg}</div>
      )}

      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", background: "#f0fafa", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: "13px",
            background: tab === t ? "#1A6163" : "transparent",
            color: tab === t ? "#fff" : "#666",
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB PROVEEDORES ── */}
      {tab === "Proveedores" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "#1A6163", fontSize: "18px", margin: 0 }}>Proveedores ({proveedores.length})</h2>
            {!mostrarFormProv && (
              <button onClick={() => { setMostrarFormProv(true); setFormProv(FORM_PROV); setEditandoProv(null); }}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                + Nuevo proveedor
              </button>
            )}
          </div>

          {mostrarFormProv && (
            <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
              <h3 style={{ color: "#1A6163", fontSize: "15px", marginBottom: "1rem" }}>
                {editandoProv ? "Editar proveedor" : "Nuevo proveedor"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                {[
                  { label: "Nombre *", key: "nombre_proveedor", placeholder: "Ej: Imprenta XYZ" },
                  { label: "Contacto", key: "contacto_nombre", placeholder: "Nombre del contacto" },
                  { label: "Teléfono", key: "telefono", placeholder: "+52 123 456 7890" },
                  { label: "Correo", key: "correo_electronico", placeholder: "correo@ejemplo.com" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>{label}</label>
                    <input value={formProv[key]} onChange={e => setFormProv(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Dirección</label>
                  <input value={formProv.direccion} onChange={e => setFormProv(f => ({ ...f, direccion: e.target.value }))}
                    placeholder="Dirección del proveedor"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={guardarProveedor} style={{
                  padding: "10px 24px", borderRadius: "8px", border: "none",
                  background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600
                }}>
                  {editandoProv ? "Actualizar" : "Guardar"}
                </button>
                <button onClick={() => { setMostrarFormProv(false); setEditandoProv(null); setFormProv(FORM_PROV); }}
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "1.5px solid #d4eeea", background: "#fff", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {proveedores.length === 0 ? (
              <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No hay proveedores registrados.</p>
            ) : proveedores.map(p => (
              <div key={p.proveedor_id} style={{
                background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px",
                padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem"
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{p.nombre_proveedor}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>
                    {[p.contacto_nombre, p.telefono, p.correo_electronico].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                  background: p.activo ? "#d4f5eb" : "#f0f0f0",
                  color: p.activo ? "#0F6E56" : "#666"
                }}>
                  {p.activo ? "Activo" : "Inactivo"}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => abrirEditarProv(p)} style={{
                    padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #35BA99",
                    background: "#fff", color: "#1A6163", cursor: "pointer", fontSize: "12px", fontWeight: 600
                  }}>Editar</button>
                  <button onClick={() => eliminarProveedor(p.proveedor_id)} style={{
                    padding: "6px 14px", borderRadius: "8px", border: "none",
                    background: "#ffd6d6", color: "#8b0000", cursor: "pointer", fontSize: "12px", fontWeight: 600
                  }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB COMPRAS ── */}
      {tab === "Compras" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "#1A6163", fontSize: "18px", margin: 0 }}>Compras ({compras.length})</h2>
            {!mostrarFormComp && (
              <button onClick={() => setMostrarFormComp(true)}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                + Nueva compra
              </button>
            )}
          </div>

          {mostrarFormComp && (
            <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
              <h3 style={{ color: "#1A6163", fontSize: "15px", marginBottom: "1rem" }}>Nueva compra</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Proveedor *</label>
                  <select value={proveedorSeleccionado} onChange={e => setProveedorSeleccionado(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none" }}>
                    <option value="">Seleccionar...</option>
                    {proveedores.filter(p => p.activo).map(p => (
                      <option key={p.proveedor_id} value={p.proveedor_id}>{p.nombre_proveedor}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Observaciones</label>
                  <input value={observaciones} onChange={e => setObservaciones(e.target.value)}
                    placeholder="Notas opcionales"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Agregar producto</label>
                <select
                  onChange={e => {
                    const producto = productos.find(p => p.id === parseInt(e.target.value));
                    if (producto) { agregarProductoDetalle(producto); e.target.value = ""; }
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none" }}
                >
                  <option value="">Seleccionar producto...</option>
                  {productos
                    .filter(p => !detalleCompra.find(d => d.producto_id === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))
                  }
                </select>
              </div>

              {detalleCompra.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f0fafa" }}>
                        {["Producto", "Cantidad", "Precio unitario", "Total", ""].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#1A6163" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalleCompra.map(d => (
                        <tr key={d.producto_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "8px 12px" }}>{d.producto_nombre}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <input type="number" min="1" value={d.cantidad}
                              onChange={e => actualizarDetalle(d.producto_id, "cantidad", parseInt(e.target.value) || 1)}
                              style={{ width: "70px", padding: "6px", borderRadius: "6px", border: "1px solid #d4eeea", outline: "none" }} />
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <input type="number" min="0" step="0.01" value={d.precio_unitario}
                              onChange={e => actualizarDetalle(d.producto_id, "precio_unitario", parseFloat(e.target.value) || 0)}
                              style={{ width: "90px", padding: "6px", borderRadius: "6px", border: "1px solid #d4eeea", outline: "none" }} />
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1A6163" }}>
                            {formatMoney(d.cantidad * d.precio_unitario)}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <button onClick={() => quitarDetalle(d.producto_id)}
                              style={{ background: "#ffd6d6", color: "#8b0000", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ textAlign: "right", marginTop: "8px", fontWeight: 700, color: "#1A6163", fontSize: "15px" }}>
                    Total: {formatMoney(totalCompra)}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={guardarCompra} style={{
                  padding: "10px 24px", borderRadius: "8px", border: "none",
                  background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600
                }}>
                  Guardar compra
                </button>
                <button onClick={() => { setMostrarFormComp(false); setDetalleCompra([]); setProveedorSeleccionado(""); setObservaciones(""); }}
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "1.5px solid #d4eeea", background: "#fff", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {compras.length === 0 ? (
              <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No hay compras registradas.</p>
            ) : compras.map(c => (
              <div key={c.id} style={{
                background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px",
                padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem"
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>Compra #{c.id} — {c.nombre_proveedor}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#666" }}>
                    {formatFecha(c.fecha_compra)} · {c.observaciones || "Sin observaciones"}
                  </p>
                </div>
                <p style={{ margin: 0, fontWeight: 700, color: "#1A6163", fontSize: "15px" }}>{formatMoney(c.total_compra)}</p>
                <button onClick={() => eliminarCompra(c.id)} style={{
                  padding: "6px 14px", borderRadius: "8px", border: "none",
                  background: "#ffd6d6", color: "#8b0000", cursor: "pointer", fontSize: "12px", fontWeight: 600
                }}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}