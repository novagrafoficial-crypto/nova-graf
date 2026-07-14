import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}/api/admin/pedidos`;

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

export default function AdminPedidoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [archivoPrevia1, setArchivoPrevia1] = useState(null);
  const [archivoPrevia2, setArchivoPrevia2] = useState(null);
  const [subiendoPrevias, setSubiendoPrevias] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [notasRechazo, setNotasRechazo] = useState("");
  const [previa1, setPrevia1] = useState("");
  const [previa2, setPrevia2] = useState("");
  const [status, setStatus] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminId = storedUser?.id_usuario || storedUser?.id;

  useEffect(() => { cargar(); }, [id]);

  const cargar = async () => {
    try {
      const res = await fetch(`${API}/${id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (estado) => {
    try {
      await fetch(`${API}/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      setStatus({ tipo: "ok", msg: "Estado actualizado correctamente" });
      cargar();
    } catch (err) {
      setStatus({ tipo: "error", msg: err.message });
    }
  };

  const actualizarPago = async (pagoId, estado_pago) => {
    try {
      await fetch(`${API}/pagos/${pagoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado_pago, notas_admin: notasRechazo }),
      });
      setStatus({ tipo: "ok", msg: `Pago ${estado_pago.toLowerCase()} correctamente` });
      setNotasRechazo("");
      cargar();
    } catch (err) {
      setStatus({ tipo: "error", msg: err.message });
    }
  };

    const enviarPrevias = async () => {
      if (!archivoPrevia1) { setStatus({ tipo: "error", msg: "La previa 1 es requerida" }); return; }
      setSubiendoPrevias(true);
      try {
        const url1 = await subirImagen(archivoPrevia1);
        await fetch(`${API}/previas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedido_cliente_id: id, numero_previa: 1, imagen_url: url1 }),
        });
        if (archivoPrevia2) {
          const url2 = await subirImagen(archivoPrevia2);
          await fetch(`${API}/previas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pedido_cliente_id: id, numero_previa: 2, imagen_url: url2 }),
          });
        }
        await actualizarEstado("PREVIAS_ENVIADAS");
        setArchivoPrevia1(null);
        setArchivoPrevia2(null);
        setStatus({ tipo: "ok", msg: "Previas enviadas correctamente" });
      } catch (err) {
        setStatus({ tipo: "error", msg: err.message });
      } finally {
        setSubiendoPrevias(false);
      }
    };

    const subirImagen = async (file) => {
      const { supabase } = await import("../../supabaseClient");
      const ext = file.name.split(".").pop();
      const nombre = `previas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("Previas").upload(nombre, file, { cacheControl: "3600", upsert: false });
      if (error) throw new Error(`Error al subir imagen: ${error.message}`);
      const { data } = supabase.storage.from("Previas").getPublicUrl(nombre);
      return data.publicUrl;
    };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
    try {
      await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_cliente_id: id, remitente_id: adminId, mensaje }),
      });
      setMensaje("");
      cargar();
    } catch (err) {
      setStatus({ tipo: "error", msg: err.message });
    }
  };

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const formatMoney = (n) => Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  if (loading) return <p style={{ padding: "2rem", color: "#999" }}>Cargando pedido...</p>;
  if (!data?.pedido) return <p style={{ padding: "2rem", color: "#999" }}>Pedido no encontrado.</p>;

  const { pedido, detalle, pagos, previas, chat, disenos } = data;
  const estadoColor = COLORES[pedido.estado] || { bg: "#f0f0f0", color: "#333" };

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {status && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
          background: status.tipo === "ok" ? "#d4f5eb" : "#ffd6d6",
          color: status.tipo === "ok" ? "#0F6E56" : "#8b0000",
          borderLeft: `3px solid ${status.tipo === "ok" ? "#35BA99" : "#dc3545"}`,
        }}>
          {status.msg}
        </div>
      )}

      {/* Info del pedido */}
      <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", color: "#1A6163", fontSize: "18px" }}>Pedido #{pedido.id}</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#999" }}>{formatFecha(pedido.fecha_pedido)}</p>
          </div>
          <span style={{
            padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
            background: estadoColor.bg, color: estadoColor.color,
          }}>
            {pedido.estado?.replace(/_/g, " ")}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#999" }}>Cliente</p>
            <p style={{ margin: 0, fontWeight: 500 }}>{pedido.cliente_nombre}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{pedido.cliente_correo}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#999" }}>Total</p>
            <p style={{ margin: 0, fontWeight: 600, color: "#1A6163", fontSize: "16px" }}>{formatMoney(pedido.total_general)}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Anticipo: {formatMoney(pedido.monto_anticipo)}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#999" }}>Entrega</p>
            <p style={{ margin: 0, fontWeight: 500 }}>{pedido.metodo_entrega || "—"}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{pedido.direccion_envio || "—"}</p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>Productos del pedido</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {detalle.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f4fdfb", borderRadius: "8px" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500, fontSize: "14px" }}>{d.producto_nombre}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>SKU: {d.sku} · Cantidad: {d.cantidad}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 600, color: "#1A6163" }}>{formatMoney(d.precio_unitario)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Diseño del cliente */}
      {disenos?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>Diseño enviado por el cliente</h3>
          {disenos.map((d) => (
            <div key={d.id} style={{ border: "1px solid #e0f0ee", borderRadius: "10px", padding: "1rem", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{
                  padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                  background: "#d0eaff", color: "#0a4a7c"
                }}>
                  {d.tipo_origen}
                </span>
                <span style={{ fontSize: "12px", color: "#999" }}>{formatFecha(d.fecha_envio)}</span>
              </div>
              {d.notas_cliente && (
                <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#555", fontStyle: "italic" }}>
                  "{d.notas_cliente}"
                </p>
              )}
              {d.archivo_url && (
                <a href={d.archivo_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: "13px", color: "#35BA99", textDecoration: "none", display: "block", marginBottom: "8px" }}>
                  Ver archivo de diseño →
                </a>
              )}
              {d.simulador_json && (
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
                  Diseño creado con el simulador
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagos */}
      <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>Comprobantes de pago</h3>
        {pagos.length === 0 ? (
          <p style={{ color: "#999", fontSize: "13px" }}>Sin comprobantes aún.</p>
        ) : pagos.map((pago) => (
          <div key={pago.id} style={{ border: "1px solid #e0f0ee", borderRadius: "10px", padding: "1rem", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
               <p style={{ margin: 0, fontWeight: 500 }}>{pago.tipo_pago} — {formatMoney(pago.monto)}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>{formatFecha(pago.fecha_pago)}</p>
              </div>
              <span style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                background: pago.estado_pago === "APROBADO" ? "#d4f5eb" : pago.estado_pago === "RECHAZADO" ? "#ffd6d6" : "#FFF3CD",
                color: pago.estado_pago === "APROBADO" ? "#0F6E56" : pago.estado_pago === "RECHAZADO" ? "#8b0000" : "#7d5a00",
              }}>
                {pago.estado_pago}
              </span>
            </div>
            <a href={pago.comprobante_url} target="_blank" rel="noreferrer"
              style={{ fontSize: "13px", color: "#35BA99", textDecoration: "none" }}>
              Ver comprobante →
            </a>
            {pago.estado_pago === "PENDIENTE" && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  placeholder="Notas (opcional, para rechazo)"
                  value={notasRechazo}
                  onChange={(e) => setNotasRechazo(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d4eeea", fontSize: "13px", outline: "none" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => actualizarPago(pago.id, "APROBADO")}
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "#35BA99", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                    ✓ Aprobar
                  </button>
                  <button onClick={() => actualizarPago(pago.id, "RECHAZADO")}
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "#dc3545", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Previas de diseño */}
      <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>Previas de diseño</h3>
        {previas.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            {previas.map((p) => (
              <div key={p.id} style={{ flex: 1, border: "1px solid #e0f0ee", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#999" }}>Previa {p.numero_previa}</p>
                <img src={p.imagen_url} alt={`Previa ${p.numero_previa}`}
                  style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "8px" }} />
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: p.aprobada ? "#0F6E56" : "#999" }}>
                  {p.aprobada ? "✓ Aprobada" : "Pendiente de aprobación"}
                </p>
              </div>
            ))}
          </div>
        )}
          {pedido.estado === "EN_REVISION" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Previa 1 *</label>
                <input type="file" accept="image/*" onChange={(e) => setArchivoPrevia1(e.target.files[0])}
                  style={{ padding: "8px", border: "1px solid #d4eeea", borderRadius: "8px", width: "100%", fontSize: "13px" }} />
                {archivoPrevia1 && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#35BA99" }}>✓ {archivoPrevia1.name}</p>}
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Previa 2 (opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => setArchivoPrevia2(e.target.files[0])}
                  style={{ padding: "8px", border: "1px solid #d4eeea", borderRadius: "8px", width: "100%", fontSize: "13px" }} />
                {archivoPrevia2 && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#35BA99" }}>✓ {archivoPrevia2.name}</p>}
              </div>
              <button onClick={enviarPrevias} disabled={subiendoPrevias}
                style={{ padding: "10px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600, opacity: subiendoPrevias ? 0.6 : 1 }}>
                {subiendoPrevias ? "Subiendo imágenes..." : "Enviar previas"}
              </button>
            </div>
          )}
      </div>

      {/* Acciones */}
      <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>Acciones</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {pedido.estado === "EN_PRODUCCION" && (
            <button onClick={() => actualizarEstado("PENDIENTE_PAGO_FINAL")}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#1A6163", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
              Marcar como listo
            </button>
          )}
          {pedido.estado !== "CANCELADO" && pedido.estado !== "ENVIADO" && (
            <button onClick={() => { if (window.confirm("¿Cancelar este pedido?")) actualizarEstado("CANCELADO"); }}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#dc3545", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
              Cancelar pedido
            </button>
          )}
        </div>
      </div>

      {/* Chat */}
      <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", color: "#1A6163", fontSize: "15px" }}>Chat con el cliente</h3>
        <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1rem" }}>
          {chat.length === 0 ? (
            <p style={{ color: "#999", fontSize: "13px" }}>Sin mensajes aún.</p>
          ) : chat.map((m) => {
            const esAdmin = m.remitente_id === adminId;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: esAdmin ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "70%", padding: "8px 14px", borderRadius: "12px", fontSize: "13px",
                  background: esAdmin ? "#1A6163" : "#f4fdfb",
                  color: esAdmin ? "#fff" : "#333",
                  border: esAdmin ? "none" : "1px solid #d4eeea",
                }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 500, fontSize: "11px", opacity: 0.8 }}>{m.remitente_nombre}</p>
                  <p style={{ margin: 0 }}>{m.mensaje}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "10px", opacity: 0.7, textAlign: "right" }}>{formatFecha(m.fecha_envio)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            placeholder="Escribe un mensaje..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #d4eeea", fontSize: "13px", outline: "none" }}
          />
          <button onClick={enviarMensaje}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#35BA99", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Enviar
          </button>
        </div>
      </div>

    </div>
  );
}