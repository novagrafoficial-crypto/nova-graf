import { useEffect, useState, useCallback } from "react";
import "../../styles/admin/AdminInventario.css";

// ✅ URL dinámica con fallback para desarrollo local
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── API ──────────────────────────────────────────────────────────────────────
const API      = `${API_BASE}/api/admin/inventario`;
const API_PROD = `${API_BASE}/api/admin/productos`;

// ─── Fórmulas (internas, el usuario nunca las ve directamente) ────────────────
const calcEOQ = (D, S, H) =>
  D > 0 && S > 0 && H > 0 ? Math.round(Math.sqrt((2 * D * S) / H)) : 0;
const calcSS = (Z, sigma, L) =>
  Z > 0 && sigma > 0 && L > 0 ? Math.round(Z * sigma * Math.sqrt(L)) : 0;
const calcROP = (d, L, SS) => Math.round(d * L + SS);

const NIVEL_MAP = [
  { z: 1.04, pct: "85%", label: "Básica",  desc: "Puede que te falte stock 1 de cada 7 semanas" },
  { z: 1.28, pct: "90%", label: "Normal",  desc: "Pequeñas faltas ocasionales, aceptable para la mayoría" },
  { z: 1.65, pct: "95%", label: "Buena",   desc: "Recomendado — faltas muy poco frecuentes" },
  { z: 2.05, pct: "98%", label: "Alta",    desc: "Casi nunca te falta stock, pero guardas más en bodega" },
  { z: 2.33, pct: "99%", label: "Máxima",  desc: "Prácticamente nunca falta, mayor inversión en almacén" },
];
const getNivel = (z) =>
  NIVEL_MAP.reduce((a, b) => (Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a));

const FORM_INIT = {
  variante_id: "", cantidad_disponible: "", ventas_diarias: "",
  tiempo_entrega: "", nivel_servicio: 1.65,
  costo_pedido: 100, costo_mantenimiento: 5, desviacion_demanda: "",
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminInventario() {
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState(FORM_INIT);
  const [variantes, setVariantes]     = useState([]);
  const [loadingVar, setLoadingVar]   = useState(false);
  const [inventario, setInventario]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [toast, setToast]             = useState({ visible: false, msg: "", error: false });

  const showToast = (msg, error = false) => {
    setToast({ visible: true, msg, error });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3200);
  };

  // ── Calcular resultados en tiempo real ─────────────────────────────────────
  const d   = parseFloat(form.ventas_diarias)     || 0;
  const L   = parseFloat(form.tiempo_entrega)      || 1;
  const S   = parseFloat(form.costo_pedido)        || 100;
  const H   = parseFloat(form.costo_mantenimiento) || 5;
  const Z   = parseFloat(form.nivel_servicio)      || 1.65;
  const sm  = parseFloat(form.desviacion_demanda);
  const sig = isNaN(sm) || sm === 0 ? parseFloat((d * 0.3).toFixed(2)) : sm;
  const D   = d * 365;
  const SS  = calcSS(Z, sig, L);
  const r   = { d, L, S, H, Z, sigma: sig, D, EOQ: calcEOQ(D, S, H), SS, ROP: calcROP(d, L, SS) };

  // ── Cargar variantes desde la API ──────────────────────────────────────────
  const cargarVariantes = useCallback(async () => {
    setLoadingVar(true);
    try {
      const res      = await fetch(API_PROD);
      const productos = await res.json();
      const detalles  = await Promise.all(
        productos.map((p) => fetch(`${API_PROD}/${p.id}`).then((r) => r.json()))
      );
      const lista = [];
      detalles.forEach((p) => {
        (p.variantes || []).forEach((v) => {
          const color = v.color_nombre || "";
          const atrs  = (v.atributos || []).map((a) => a.valor_nombre).join(" ");
          const desc  = [color, atrs].filter(Boolean).join(" ") || `variante ${v.id}`;
          lista.push({ id: v.id, label: `${p.nombre} — ${desc} (${v.sku || "sin SKU"})` });
        });
      });
      setVariantes(lista);
    } catch {
      showToast("No se pudieron cargar los productos", true);
    } finally {
      setLoadingVar(false);
    }
  }, []);

  useEffect(() => { cargarVariantes(); }, [cargarVariantes]);

  // ── Cargar inventario ──────────────────────────────────────────────────────
  const cargarInventario = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reabastecimiento`);
      if (!res.ok) throw new Error();
      setInventario(await res.json());
    } catch {
      showToast("No se pudo cargar el inventario", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (step === 3) cargarInventario(); }, [step, cargarInventario]);

  // ── Cambios de form ────────────────────────────────────────────────────────
  const setF    = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const handleNum = (e) => setF(e.target.name, e.target.value === "" ? "" : Number(e.target.value));
  const handleRaw = (e) => setF(e.target.name, e.target.value);

  // ── Guardar ────────────────────────────────────────────────────────────────
  const guardar = async () => {
    if (!form.variante_id)         return showToast("Selecciona un producto primero", true);
    if (!form.cantidad_disponible) return showToast("Ingresa el stock actual", true);
    if (!form.ventas_diarias)      return showToast("Ingresa las ventas diarias", true);
    if (!form.tiempo_entrega)      return showToast("Ingresa el tiempo de entrega", true);

    setGuardando(true);
    const payload = {
      variante_id:          Number(form.variante_id),
      cantidad_disponible:  Number(form.cantidad_disponible),
      ventas_diarias:       Number(form.ventas_diarias),
      tiempo_entrega:       Number(form.tiempo_entrega),
      nivel_servicio:       Number(form.nivel_servicio),
      costo_pedido:         Number(form.costo_pedido),
      costo_mantenimiento:  Number(form.costo_mantenimiento),
      ...(form.desviacion_demanda !== "" && { desviacion_demanda: Number(form.desviacion_demanda) }),
    };
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        const json = await res.json();
        showToast(json.error || "Este producto ya tiene inventario registrado", true);
        return;
      }
      if (!res.ok) throw new Error();
      showToast("¡Listo! Inventario guardado correctamente");
      setForm(FORM_INIT);
      setStep(3);
    } catch {
      showToast("Ocurrió un error al guardar. Intenta de nuevo.", true);
    } finally {
      setGuardando(false);
    }
  };

  const nivel = getNivel(parseFloat(form.nivel_servicio) || 1.65);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="inv-page">

      {/* ── STEPPER ──────────────────────────────────────────────────────── */}
      <div className="inv-stepper">
        {["¿Qué producto?", "¿Cómo van las ventas?", "Revisar y guardar", "Mi inventario"].map((label, i) => (
          <div key={i} className="inv-step-wrap">
            <div className={`inv-step-dot ${i === step ? "active" : i < step ? "done" : ""}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`inv-step-lbl ${i === step ? "active" : ""}`}>{label}</span>
            {i < 3 && <div className="inv-step-line" />}
          </div>
        ))}
      </div>

      {/* ── PASO 1 — ¿Qué producto? ──────────────────────────────────────── */}
      {step === 0 && (
        <div className="inv-card">
          <div className="inv-step-header">
            <h2>¿A qué producto le vas a llevar el inventario?</h2>
            <p>Selecciona el producto y dinos cuántas unidades tienes ahorita en bodega.</p>
          </div>

          <div className="inv-field" style={{ marginBottom: "1.25rem" }}>
            <label className="inv-field-label">Producto</label>
            <select name="variante_id" value={form.variante_id} onChange={handleNum}>
              <option value="">{loadingVar ? "Cargando productos…" : "— Elige un producto —"}</option>
              {variantes.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            <span className="inv-field-hint">
              Si no ves el producto, verifica que tenga variantes registradas en Gestión de Productos.
            </span>
          </div>

          <div className="inv-field">
            <label className="inv-field-label">¿Cuántas unidades tienes ahora mismo en bodega?</label>
            <input name="cantidad_disponible" type="number" min="0"
              placeholder="Ej: 80" value={form.cantidad_disponible} onChange={handleNum} />
            <div className="inv-field-example">
              Cuenta físicamente lo que tienes en almacén.
              Ejemplo: 3 cajas de 20 piezas = escribe <strong>60</strong>.
            </div>
          </div>

          <div className="inv-btn-row" style={{ marginTop: "1.5rem" }}>
            <button className="btn-primary"
              disabled={!form.variante_id || form.cantidad_disponible === ""}
              onClick={() => setStep(1)}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2 — ¿Cómo van las ventas? ──────────────────────────────── */}
      {step === 1 && (
        <div className="inv-card">
          <div className="inv-step-header">
            <h2>¿Cómo van las ventas de este producto?</h2>
            <p>Con esto el sistema sabrá cuándo avisarte que es momento de pedir más.</p>
          </div>

          <div className="inv-grid-2">
            <div className="inv-field">
              <label className="inv-field-label">¿Cuánto vendes por día?</label>
              <input name="ventas_diarias" type="number" min="0"
                placeholder="Ej: 10" value={form.ventas_diarias} onChange={handleNum} />
              <div className="inv-field-example">
                Si en un mes normal vendes 300 piezas,
                divide entre 30 = <strong>10 por día</strong>.
              </div>
            </div>

            <div className="inv-field">
              <label className="inv-field-label">¿Cuántos días tarda tu proveedor en surtirte?</label>
              <input name="tiempo_entrega" type="number" min="1"
                placeholder="Ej: 7" value={form.tiempo_entrega} onChange={handleNum} />
              <div className="inv-field-example">
                Desde que llamas al proveedor hasta que llega la mercancía a tu puerta.
                Si tarda una semana, escribe <strong>7</strong>.
              </div>
            </div>
          </div>

          {/* Nivel de servicio en lenguaje simple */}
          <div className="inv-nivel-card" style={{ marginTop: "1.25rem" }}>
            <div className="inv-nivel-top">
              <span className="inv-nivel-nombre">¿Con qué frecuencia quieres tener producto disponible?</span>
              <span className="inv-nivel-pct">{nivel.pct}</span>
            </div>
            <div className="inv-nivel-badges">
              {NIVEL_MAP.map((n) => (
                <button key={n.z}
                  className={`inv-nivel-btn ${parseFloat(form.nivel_servicio) === n.z ? "selected" : ""}`}
                  onClick={() => setF("nivel_servicio", n.z)}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="inv-nivel-desc">{nivel.desc}</div>
          </div>

          {/* Costos avanzados — colapsable */}
          <details className="inv-costos-detalle" style={{ marginTop: "1.25rem" }}>
            <summary>Configuración avanzada (opcional)</summary>
            <div className="inv-grid-2" style={{ marginTop: "1rem" }}>
              <div className="inv-field">
                <label className="inv-field-label">
                  ¿Cuánto te cuesta hacer un pedido al proveedor?
                  <span className="lbl-optional">opcional</span>
                </label>
                <input name="costo_pedido" type="number" min="0"
                  placeholder="Ej: 100" value={form.costo_pedido} onChange={handleNum} />
                <div className="inv-field-example">
                  Suma llamadas, papelería, envío y tiempo. Si no lo sabes exacto, deja <strong>100</strong>.
                </div>
              </div>
              <div className="inv-field">
                <label className="inv-field-label">
                  ¿Cuánto te cuesta guardar una unidad todo un año?
                  <span className="lbl-optional">opcional</span>
                </label>
                <input name="costo_mantenimiento" type="number" min="0"
                  placeholder="Ej: 5" value={form.costo_mantenimiento} onChange={handleNum} />
                <div className="inv-field-example">
                  Renta de bodega + luz + seguro, dividido entre cuántas piezas guardas.
                  Si no lo sabes, deja <strong>5</strong>.
                </div>
              </div>
            </div>
          </details>

          <div className="inv-btn-row" style={{ marginTop: "1.5rem" }}>
            <button className="btn-back" onClick={() => setStep(0)}>← Atrás</button>
            <button className="btn-primary"
              disabled={!form.ventas_diarias || !form.tiempo_entrega}
              onClick={() => setStep(2)}>
              Ver recomendación →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3 — Recomendación ────────────────────────────────────────── */}
      {step === 2 && (
        <div className="inv-card">
          <div className="inv-step-header">
            <h2>Esto es lo que el sistema recomienda</h2>
            <p>Basado en tus ventas diarias y el tiempo de entrega de tu proveedor.</p>
          </div>

          {/* 3 tarjetas amigables */}
          <div className="inv-result-cards">
            <div className="inv-result-card irc-blue">
              <div className="irc-icon">📦</div>
              <div className="irc-big">{r.EOQ}</div>
              <div className="irc-titulo">unidades por pedido</div>
              <div className="irc-explicacion">
                Cada vez que le pidas a tu proveedor,
                ordena <strong>{r.EOQ} unidades</strong>.
                Es la cantidad perfecta para no gastar de más
                ni en pedir ni en guardar.
              </div>
            </div>

            <div className="inv-result-card irc-amber">
              <div className="irc-icon">🛡️</div>
              <div className="irc-big">{r.SS}</div>
              <div className="irc-titulo">unidades de reserva</div>
              <div className="irc-explicacion">
                Guarda siempre <strong>{r.SS} unidades</strong> que
                no tocarás en condiciones normales.
                Son tu colchón para emergencias: ventas que suben
                de golpe o proveedor que se retrasa.
              </div>
            </div>

            <div className="inv-result-card irc-red">
              <div className="irc-icon">🔔</div>
              <div className="irc-big">{r.ROP}</div>
              <div className="irc-titulo">unidades = momento de pedir</div>
              <div className="irc-explicacion">
                En cuanto tu inventario llegue
                a <strong>{r.ROP} unidades</strong>, llama
                a tu proveedor de inmediato. Si esperas más,
                te puedes quedar sin stock antes de que llegue el pedido.
              </div>
            </div>
          </div>

          {/* Línea de tiempo del ciclo */}
          <div className="inv-timeline">
            <div className="itl-paso itl-blue">
              <span className="itl-num">1</span>
              <span>Tienes stock, vas vendiendo ~{r.d} u/día</span>
            </div>
            <div className="itl-flecha">↓</div>
            <div className="itl-paso itl-red">
              <span className="itl-num">2</span>
              <span>Stock llega a <strong>{r.ROP} u</strong> → llamas a tu proveedor</span>
            </div>
            <div className="itl-flecha">↓</div>
            <div className="itl-paso itl-amber">
              <span className="itl-num">3</span>
              <span>Esperas {r.L} {r.L === 1 ? "día" : "días"} — usas las {r.SS} u de reserva si hace falta</span>
            </div>
            <div className="itl-flecha">↓</div>
            <div className="itl-paso itl-green">
              <span className="itl-num">4</span>
              <span>Llegan <strong>{r.EOQ} u</strong> → el ciclo se repite</span>
            </div>
          </div>

          {/* Fórmulas matemáticas — colapsable para la maestra */}
          <details className="inv-detalle-tecnico" style={{ marginTop: "1rem" }}>
            <summary>Ver fórmulas matemáticas (detalle técnico)</summary>
            <div style={{ padding: "1rem" }}>
              <div className="inv-formula-grid">
                <FormulaCard title="EOQ — Cantidad económica de pedido" formula="√( 2 × D × S / H )"
                  result={r.EOQ} unit="unidades por orden" colorClass="f-eoq"
                  vars={[
                    { sym: "D (demanda anual)", val: `${r.D.toLocaleString()} u/año` },
                    { sym: "S (costo pedido)",  val: `$${r.S}` },
                    { sym: "H (costo mant.)",   val: `$${r.H}/u/año` },
                  ]} />
                <FormulaCard title="SS — Stock de seguridad" formula="Z × σd × √L"
                  result={r.SS} unit="unidades de reserva" colorClass="f-ss"
                  vars={[
                    { sym: "Z (nivel servicio)", val: r.Z.toFixed(2) },
                    { sym: "σd (desv. demanda)", val: `${r.sigma.toFixed(1)} u` },
                    { sym: "L (días entrega)",   val: `${r.L} días` },
                  ]} />
                <FormulaCard title="ROP — Punto de reorden" formula="( d × L ) + SS"
                  result={r.ROP} unit="unidades — pedir aquí" colorClass="f-rop"
                  vars={[
                    { sym: "d (ventas/día)",   val: `${r.d} u/día` },
                    { sym: "L (días entrega)", val: `${r.L} días` },
                    { sym: "SS (stock seg.)",  val: `${r.SS} u` },
                  ]} />
              </div>
              <CicloDiagrama eoq={r.EOQ} rop={r.ROP} ss={r.SS} />
            </div>
          </details>

          <div className="inv-btn-row" style={{ marginTop: "1.5rem" }}>
            <button className="btn-back" onClick={() => setStep(1)}>← Atrás</button>
            <button className="btn-save" onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar y ver inventario →"}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 4 — Mi inventario ────────────────────────────────────────── */}
      {step === 3 && (
        <>
          <AlertasStrip data={inventario} />

          <div className="inv-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="inv-card-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Mis productos</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                  La tabla te dice cuándo y cuánto pedir de cada uno
                </p>
              </div>
              <button className="btn-back" onClick={cargarInventario}>↻ Actualizar</button>
            </div>

            {loading ? (
              <div className="inv-empty">Cargando inventario…</div>
            ) : inventario.length === 0 ? (
              <div className="inv-empty">
                Aún no hay productos registrados. Agrega el primero con el botón de abajo.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>
                        Stock actual
                        <span className="inv-th-sub">Lo que tienes ahora</span>
                      </th>
                      <th>
                        Pide cuando llegues a
                        <span className="inv-th-sub">Punto de reorden</span>
                      </th>
                      <th>
                        Cantidad a pedir
                        <span className="inv-th-sub">EOQ</span>
                      </th>
                      <th>
                        Mínimo en bodega
                        <span className="inv-th-sub">Reserva de emergencia</span>
                      </th>
                      <th>Estado</th>
                      <th>¿Qué hacer ahora?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventario.map((item) => {
                      const critico = item.cantidad_disponible <= (item.stock_seguridad || 0);
                      const rowCls  = critico ? "row-danger" : item.alerta ? "row-warn" : "";
                      return (
                        <tr key={item.id} className={rowCls}>
                          <td>
                            <div className="td-prod">{item.producto_nombre || `Producto #${item.id}`}</div>
                            <div className="td-sku">{item.sku}</div>
                          </td>
                          <td className="td-num">{item.cantidad_disponible} u</td>
                          <td className="td-num td-rop">{item.punto_reorden} u</td>
                          <td className="td-num td-eoq">{item.EOQ} u</td>
                          <td className="td-num td-ss">{item.stock_seguridad} u</td>
                          <td>
                            {critico
                              ? <span className="inv-badge inv-badge-danger">¡Urgente!</span>
                              : item.alerta
                              ? <span className="inv-badge inv-badge-warn">Pedir pronto</span>
                              : <span className="inv-badge inv-badge-ok">OK</span>}
                          </td>
                          <td className="td-rec">
                            {critico
                              ? `⚠️ Pide ${item.EOQ} unidades hoy`
                              : item.alerta
                              ? `Pide ${item.EOQ} unidades a tu proveedor`
                              : "No necesitas pedir nada por ahora"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="inv-btn-row">
            <button className="btn-back" onClick={() => { setForm(FORM_INIT); setStep(0); }}>
              + Agregar otro producto
            </button>
          </div>
        </>
      )}

      {/* Toast */}
      <div className={`inv-toast${toast.error ? " error" : ""}${toast.visible ? " show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FormulaCard({ title, formula, result, unit, colorClass, vars }) {
  return (
    <div className={`inv-formula-card ${colorClass}`}>
      <div className="f-title">{title}</div>
      <div className="f-eq">{formula}</div>
      <div className="f-result">{result} u</div>
      <div className="f-unit">{unit}</div>
      <div className="f-vars">
        {vars.map((v) => (
          <div key={v.sym} className="f-var-row">
            <span className="f-var-sym">{v.sym}</span>
            <span className="f-var-val">{v.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CicloDiagrama({ eoq, rop, ss }) {
  return (
    <svg width="100%" viewBox="0 0 620 100" className="inv-ciclo-svg">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <line x1="30" y1="78" x2="590" y2="78" className="ciclo-axis" />
      <polyline points="30,15 190,62 240,62 420,15 580,62" className="ciclo-stock" fill="none" />
      <line x1="30" y1="62" x2="590" y2="62" className="ciclo-rop-line" />
      <line x1="30"  y1="15" x2="30"  y2="78" className="ciclo-brace" />
      <line x1="420" y1="15" x2="420" y2="78" className="ciclo-brace" />
      <line x1="30" y1="19" x2="420" y2="19" className="ciclo-brace" markerEnd="url(#arr)" markerStart="url(#arr)" />
      <line x1="580" y1="62" x2="580" y2="78" className="ciclo-ss-line" />
      <text x="225" y="13" className="ciclo-label ciclo-label-eoq">EOQ = {eoq} u</text>
      <text x="595" y="66" className="ciclo-label ciclo-label-rop">ROP = {rop} u</text>
      <text x="580" y="95" textAnchor="middle" className="ciclo-label ciclo-label-ss">SS = {ss} u</text>
      <text x="30"  y="93" textAnchor="middle" className="ciclo-label ciclo-label-ped">Pedido</text>
      <text x="420" y="93" textAnchor="middle" className="ciclo-label ciclo-label-ped">Pedido</text>
    </svg>
  );
}

function AlertasStrip({ data }) {
  const ok      = data.filter((d) => !d.alerta).length;
  const warn    = data.filter((d) => d.alerta && d.cantidad_disponible > (d.stock_seguridad || 0)).length;
  const critico = data.filter((d) => d.cantidad_disponible <= (d.stock_seguridad || 0)).length;
  return (
    <div className="inv-alertas-strip">
      <div className="inv-alerta-card ok">
        <div className="iac-num">{ok}</div>
        <div className="iac-label">Con stock suficiente</div>
        <div className="iac-desc">No necesitan atención por ahora</div>
      </div>
      <div className="inv-alerta-card warn">
        <div className="iac-num">{warn}</div>
        <div className="iac-label">Hay que pedir pronto</div>
        <div className="iac-desc">El stock bajó del punto de aviso</div>
      </div>
      <div className="inv-alerta-card danger">
        <div className="iac-num">{critico}</div>
        <div className="iac-label">¡Atención urgente!</div>
        <div className="iac-desc">Stock por debajo del mínimo</div>
      </div>
    </div>
  );
}