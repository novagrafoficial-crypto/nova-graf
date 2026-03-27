import { useState, useEffect, useCallback, useRef } from "react";
import "../../styles/admin/AdminModulo.css";

const API_MODULO    = "http://localhost:5000/api/admin/modulo";
const API_MONITOREO = "http://localhost:5000/api/admin/monitoreo";

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const fmtDur = (interval) => {
  if (!interval) return "—";
  const m = String(interval).match(/(\d+):(\d+):(\d+)/);
  if (!m) return String(interval);
  const [, h, min, s] = m;
  if (+h)   return `${h}h ${min}m`;
  if (+min) return `${min}m ${s}s`;
  return `${s}s`;
};

const fmtSeg = (sec) => {
  if (sec == null) return "—";
  const s = +sec;
  if (s >= 3600) return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
  if (s >= 60)   return `${Math.floor(s/60)}m ${s%60}s`;
  return `${s}s`;
};

// ─── Chart.js lazy loader ─────────────────────────────────────────────────────
let cjsReady = false, cjsCbs = [];
const loadCjs = (cb) => {
  if (cjsReady) return cb();
  cjsCbs.push(cb);
  if (document.getElementById("cjs")) return;
  const s = Object.assign(document.createElement("script"), {
    id: "cjs",
    src: "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js",
    onload: () => { cjsReady = true; cjsCbs.forEach(f => f()); cjsCbs = []; }
  });
  document.head.appendChild(s);
};

const useChart = (ref, build, deps) => {
  const inst = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    loadCjs(() => {
      const cfg = build();
      if (!cfg) return;
      if (inst.current) { inst.current.data = cfg.data; inst.current.options = cfg.options; inst.current.update("none"); }
      else inst.current = new window.Chart(ref.current, cfg);
    });
  }, deps); // eslint-disable-line
};

const P = {
  blue:   "#2f80ed", blueA:  "rgba(47,128,237,.14)",
  green:  "#27ae60", greenA: "rgba(39,174,96,.14)",
  amber:  "#e67e22", amberA: "rgba(230,126,34,.14)",
  red:    "#e74c3c", redA:   "rgba(231,76,60,.14)",
  purple: "#8e44ad", purpleA:"rgba(142,68,173,.10)",
  teal:   "#16a085", tealA:  "rgba(22,160,133,.14)",
  slate:  "#7f8c8d", slateA: "rgba(127,140,141,.18)",
};

const TIPO_META = {
  SELECT: { bg:"#e8f4fd", fg:"#1a5f8a" },
  INSERT: { bg:"#eafaf1", fg:"#1a6b3c" },
  UPDATE: { bg:"#fef9e7", fg:"#7d6608" },
  DELETE: { bg:"#fdedec", fg:"#922b21" },
  WITH:   { bg:"#f4ecf7", fg:"#6c3483" },
  OTRO:   { bg:"#f2f3f4", fg:"#566573" },
};

function TipoPill({ query }) {
  const q = (query || "").trimStart().toUpperCase();
  const t = q.startsWith("SELECT") ? "SELECT"
          : q.startsWith("INSERT") ? "INSERT"
          : q.startsWith("UPDATE") ? "UPDATE"
          : q.startsWith("DELETE") ? "DELETE"
          : q.startsWith("WITH")   ? "WITH" : "OTRO";
  const m = TIPO_META[t];
  return <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:3,
    background:m.bg,color:m.fg,letterSpacing:".04em",whiteSpace:"nowrap"}}>{t}</span>;
}

function KpiCard({ label, value, sub, color, icon }) {
  const colors = { ok:"#27ae60", warn:"#e67e22", bad:"#e74c3c", blue:"#2f80ed", purple:"#8e44ad" };
  const c = colors[color] || colors.blue;
  return (
    <div className="adm-kpi">
      <div className="adm-kpi__bar" style={{background:c}}/>
      <div className="adm-kpi__icon">{icon}</div>
      <div className="adm-kpi__body">
        <div className="adm-kpi__value" style={{color:c}}>{value ?? "—"}</div>
        <div className="adm-kpi__label">{label}</div>
        {sub && <div className="adm-kpi__sub">{sub}</div>}
      </div>
    </div>
  );
}

function Gauge({ pct, label, invert }) {
  const p = Math.min(Math.round(pct), 100);
  const c = invert
    ? (p < 90 ? P.red : p < 95 ? P.amber : P.green)
    : (p >= 90 ? P.red : p >= 70 ? P.amber : P.green);
  return (
    <div className="adm-gauge">
      <div className="adm-gauge__head">
        <span className="adm-gauge__label">{label}</span>
        <span className="adm-gauge__pct" style={{color:c}}>{p}%</span>
      </div>
      <div className="adm-gauge__track">
        <div className="adm-gauge__fill" style={{width:`${p}%`,background:c}}/>
      </div>
    </div>
  );
}

function Block({ title, sub, badge, badgeWarn, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="adm-block">
      <button className="adm-block__head" onClick={()=>setOpen(!open)}>
        <div className="adm-block__titles">
          <span className="adm-block__title">{title}</span>
          {sub && <span className="adm-block__sub">{sub}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {badge !== undefined && (
            <span className={`adm-badge ${badgeWarn&&badge>0?"adm-badge--warn":""}`}>{badge}</span>
          )}
          <span className="adm-block__chevron">{open?"▾":"▸"}</span>
        </div>
      </button>
      {open && <div className="adm-block__body">{children}</div>}
    </div>
  );
}

function Empty({ icon, text }) {
  return <div className="adm-empty"><span>{icon}</span><span>{text}</span></div>;
}

function StatusDot({ state }) {
  const c = { active:"#27ae60", idle:"#bdc3c7",
    "idle in transaction":"#e67e22","idle in transaction (aborted)":"#e74c3c" };
  return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",
    background:c[state]||"#bdc3c7",flexShrink:0}}/>;
}

// ─── Gráficas ─────────────────────────────────────────────────────────────────
function DonutConexiones({ resumen }) {
  const ref = useRef(null);
  const used = resumen?.conexiones?.total ?? 0;
  const max  = resumen?.conexiones?.max   ?? 100;
  const free = Math.max(max - used, 0);
  const pct  = max > 0 ? Math.round(used/max*100) : 0;
  const c    = pct>=90?P.red:pct>=70?P.amber:P.green;
  useChart(ref,()=>({
    type:"doughnut",
    data:{labels:["En uso","Libres"],datasets:[{data:[used,free],
      backgroundColor:[c,P.slateA],borderColor:[c,"transparent"],borderWidth:[2,0],hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:"74%",
      plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>` ${ctx.label}: ${ctx.raw}`}}}},
  }),[used,free,c]);
  return (
    <div className="adm-donut-wrap">
      <div className="adm-donut-label">Conexiones</div>
      <div style={{position:"relative",height:130}}>
        <canvas ref={ref}/>
        <div className="adm-donut-center">
          <b style={{fontSize:22,color:c}}>{pct}%</b>
          <small>{used}/{max}</small>
        </div>
      </div>
      <div className="adm-donut-legend">
        <span><i style={{background:c}}/> En uso {used}</span>
        <span><i style={{background:P.slateA,border:`1px solid ${P.slate}`}}/> Libres {free}</span>
      </div>
    </div>
  );
}

function DonutCache({ resumen }) {
  const ref  = useRef(null);
  const hit  = resumen?.cache?.hit_ratio ?? 0;
  const miss = parseFloat(Math.max(100-hit,0).toFixed(1));
  const c    = hit>=99?P.green:hit>=95?P.amber:P.red;
  useChart(ref,()=>({
    type:"doughnut",
    data:{labels:["Hit","Miss"],datasets:[{data:[hit,miss],
      backgroundColor:[c,P.slateA],borderColor:[c,"transparent"],borderWidth:[2,0],hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:"74%",
      plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>` ${ctx.label}: ${ctx.raw}%`}}}},
  }),[hit,c]);
  return (
    <div className="adm-donut-wrap">
      <div className="adm-donut-label">Cache hit</div>
      <div style={{position:"relative",height:130}}>
        <canvas ref={ref}/>
        <div className="adm-donut-center">
          <b style={{fontSize:22,color:c}}>{hit}%</b>
          <small>{hit>=99?"Óptimo":hit>=95?"Aceptable":"Revisar"}</small>
        </div>
      </div>
      <div className="adm-donut-legend">
        <span><i style={{background:c}}/> Hit {hit}%</span>
        <span><i style={{background:P.slateA,border:`1px solid ${P.slate}`}}/> Miss {miss}%</span>
      </div>
    </div>
  );
}

function LineaTPS({ tps }) {
  const ref  = useRef(null);
  const hist = useRef([]);
  useEffect(()=>{ if(tps!=null) hist.current=[...hist.current.slice(-29),parseFloat(tps)]; },[tps]);
  useChart(ref,()=>{
    const d = hist.current;
    if(!d.length) return null;
    const labels = d.map((_,i)=>i===d.length-1?"ahora":`-${(d.length-1-i)*5}s`);
    return {type:"line",
      data:{labels,datasets:[{label:"TPS",data:d,borderColor:P.purple,backgroundColor:P.purpleA,
        borderWidth:2,pointRadius:0,fill:true,tension:.4}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{display:false},ticks:{color:P.slate,font:{size:10},maxTicksLimit:5}},
          y:{grid:{color:P.slateA},ticks:{color:P.slate,font:{size:11}},beginAtZero:true},
        }},
    };
  },[tps]);
  return (
    <div className="adm-line-wrap">
      <div className="adm-donut-label">TPS · en vivo</div>
      <div style={{position:"relative",height:130}}><canvas ref={ref}/></div>
    </div>
  );
}

function BarrasTablasUsadas({ data }) {
  const ref = useRef(null);
  if (!data?.length) return null;
  const top  = data.slice(0,10);
  const labs = top.map(r=>`${r.esquema}.${r.tabla}`);
  useChart(ref,()=>({
    type:"bar",
    data:{labels:labs,datasets:[
      {label:"Lecturas",data:top.map(r=>+r.total_lecturas),backgroundColor:P.blue,borderRadius:3,barThickness:11,stack:"s"},
      {label:"Escrituras",data:top.map(r=>+r.total_escrituras),backgroundColor:P.amber,borderRadius:3,barThickness:11,stack:"s"},
    ]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()}`}}},
      scales:{
        x:{stacked:true,grid:{color:P.slateA},ticks:{color:P.slate,font:{size:10},
          callback:v=>v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}k`:v}},
        y:{stacked:true,grid:{display:false},ticks:{color:"#333",font:{size:10}}},
      }},
  }),[data]);
  return <div style={{position:"relative",height:Math.max(top.length*36+50,180)}}><canvas ref={ref}/></div>;
}

function BarrasTipo({ data }) {
  const ref = useRef(null);
  if (!data?.disponible || !data?.rows?.length) return null;
  const COLS = [P.blue,P.green,P.amber,P.red,P.purple,P.teal];
  useChart(ref,()=>({
    type:"bar",
    data:{labels:data.rows.map(r=>r.tipo),datasets:[{
      label:"Ejecuciones",data:data.rows.map(r=>+r.total_ejecuciones),
      backgroundColor:COLS.slice(0,data.rows.length),borderRadius:5,barThickness:30,
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{
        label:(ctx)=>` ${parseInt(ctx.raw).toLocaleString()} ejecuciones`,
        afterLabel:(ctx)=>{const r=data.rows[ctx.dataIndex];return[` Promedio: ${r.tiempo_promedio_ms} ms`];},
      }}},
      scales:{
        x:{grid:{display:false},ticks:{color:P.slate,font:{size:12}}},
        y:{grid:{color:P.slateA},ticks:{color:P.slate,font:{size:11},
          callback:v=>v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}k`:v}},
      }},
  }),[data]);
  return <div style={{position:"relative",height:220}}><canvas ref={ref}/></div>;
}

function BarrasUsuarios({ data }) {
  const ref    = useRef(null);
  const fuente = data?.historico?.length ? data.historico : data?.sesiones;
  const usaH   = !!data?.historico?.length;
  if (!fuente?.length) return null;
  const COLS = [P.teal,P.blue,P.purple,P.amber,P.green];
  useChart(ref,()=>({
    type:"bar",
    data:{labels:fuente.map(r=>r.usuario),datasets:[{
      label:usaH?"Ejecuciones":"Sesiones",
      data:fuente.map(r=>+(usaH?r.total_ejecuciones:r.sesiones_activas)),
      backgroundColor:fuente.map((_,i)=>COLS[i%5]),borderRadius:4,barThickness:18,
    }]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>` ${parseInt(ctx.raw).toLocaleString()}`}}},
      scales:{
        x:{grid:{color:P.slateA},ticks:{color:P.slate,font:{size:11},
          callback:v=>v>=1e3?`${(v/1e3).toFixed(0)}k`:v}},
        y:{grid:{display:false},ticks:{color:"#333",font:{size:12}}},
      }},
  }),[data]);
  return <div style={{position:"relative",height:Math.max(fuente.length*36+50,120)}}><canvas ref={ref}/></div>;
}

// ─── Cards del esquema empresa ────────────────────────────────────────────────
function TablaEmpresa({ tablas }) {
  if (!tablas?.length) return <Empty icon="📭" text="Sin tablas del esquema empresa"/>;
  return (
    <div className="adm-empresa-grid">
      {tablas.map((r,i)=>{
        const pct   = parseFloat(r.pct_muertas);
        const warn  = pct > 20;
        const total = +r.filas_vivas + +r.filas_muertas;
        const pctV  = total > 0 ? Math.round(+r.filas_vivas/total*100) : 100;
        return (
          <div key={i} className={`adm-empresa-card ${warn?"adm-empresa-card--warn":""}`}>
            <div className="adm-empresa-card__head">
              <span className="adm-empresa-card__name">{r.tabla}</span>
              {warn && <span className="adm-empresa-tag adm-empresa-tag--warn">bloat</span>}
            </div>
            <div className="adm-empresa-card__stats">
              <div className="adm-empresa-stat">
                <span className="adm-empresa-stat__val">{parseInt(r.filas_vivas).toLocaleString()}</span>
                <span className="adm-empresa-stat__lbl">filas vivas</span>
              </div>
              <div className="adm-empresa-stat">
                <span className={`adm-empresa-stat__val ${warn?"adm-empresa-stat__val--warn":""}`}>{r.pct_muertas}%</span>
                <span className="adm-empresa-stat__lbl">% muertas</span>
              </div>
              <div className="adm-empresa-stat">
                <span className="adm-empresa-stat__val">{r.tamaño}</span>
                <span className="adm-empresa-stat__lbl">tamaño</span>
              </div>
            </div>
            <div className="adm-empresa-bar-track">
              <div className="adm-empresa-bar-fill" style={{width:`${pctV}%`,background:warn?P.amber:P.green}}/>
            </div>
            <div className="adm-empresa-card__foot">
              <span>Vacuum: {r.ultimo_autovacuum||"Nunca"}</span>
              <span>{parseInt(r.seq_scan).toLocaleString()} scans</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ranking top tablas ───────────────────────────────────────────────────────
function TopTablasTarjetas({ data }) {
  if (!data?.length) return <Empty icon="📭" text="Sin datos"/>;
  const maxOps = Math.max(...data.map(r=>+r.total_operaciones), 1);
  const ICONS  = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","",""];
  return (
    <div className="adm-top-list">
      {data.map((r,i)=>(
        <div key={i} className="adm-top-row">
          <div className="adm-top-row__rank">{ICONS[i]||`${i+1}`}</div>
          <div className="adm-top-row__info">
            <div className="adm-top-row__name">
              <span className="adm-top-row__schema">{r.esquema}.</span>{r.tabla}
            </div>
            <div className="adm-top-bar">
              <div className="adm-top-bar__lect" style={{width:`${Math.round(+r.total_lecturas/maxOps*100)}%`}}/>
              <div className="adm-top-bar__escr" style={{width:`${Math.round(+r.total_escrituras/maxOps*100)}%`,marginTop:2}}/>
            </div>
          </div>
          <div className="adm-top-row__nums">
            <span className="adm-top-num adm-top-num--lect" title="Lecturas">↗ {(+r.total_lecturas).toLocaleString()}</span>
            <span className="adm-top-num adm-top-num--escr" title="Escrituras">✎ {(+r.total_escrituras).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminModulo() {
  const [tab, setTab] = useState("respaldo");

  const [historial,         setHistorial]        = useState([]);
  const [tablas,            setTablas]            = useState([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState("");
  const [tablaCSV,      setTablaCSV]      = useState("");
  const [archivoCSV,    setArchivoCSV]    = useState(null);
  const [mensajeImport, setMensajeImport] = useState("");
  const [cargandoCSV,   setCargandoCSV]   = useState(false);

  const [monitor,     setMonitor]     = useState(null);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState(null);
  const [ultimaAct,   setUltimaAct]   = useState(null);
  const [terminando,  setTerminando]  = useState(null);
  const [msgTerm,     setMsgTerm]     = useState("");

  const [tablasUsadas,     setTablasUsadas]     = useState([]);
  const [consultasTipo,    setConsultasTipo]    = useState(null);
  const [usuariosActivos,  setUsuariosActivos]  = useState(null);
  const [ultimasConsultas, setUltimasConsultas] = useState(null);
  const [subQ,             setSubQ]             = useState("enCurso");

  useEffect(()=>{
    fetchJSON(`${API_MODULO}/historial`).then(setHistorial).catch(()=>{});
    fetchJSON(`${API_MODULO}/tablas`).then(setTablas).catch(()=>{});
  },[]);

  const descargar = async (url) => {
    const res = await fetch(url);
    if (!res.ok){ const e=await res.json().catch(()=>({})); alert(e.error||"Error"); return; }
    if (res.status===204){ alert("La tabla está vacía."); return; }
    const blob=await res.blob(), bUrl=window.URL.createObjectURL(blob);
    const cd=res.headers.get("content-disposition"); let fn="descarga";
    if(cd){ const m=cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); if(m?.[1]) fn=m[1].replace(/['"]/g,"").trim(); }
    const a=document.createElement("a"); a.href=bUrl; a.download=fn;
    document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(bUrl);
    setTimeout(()=>fetchJSON(`${API_MODULO}/historial`).then(setHistorial),500);
  };

  const importar = async () => {
    if(!tablaCSV||!archivoCSV) return;
    const fd=new FormData(); fd.append("archivo",archivoCSV);
    setCargandoCSV(true); setMensajeImport("");
    try{
      const res=await fetch(`${API_MODULO}/csv/${tablaCSV}`,{method:"POST",body:fd});
      const d=await res.json(); setMensajeImport(d.message||d.error||"Respuesta inesperada");
      setArchivoCSV(null); const inp=document.getElementById("csv-input"); if(inp) inp.value="";
    }catch{ setMensajeImport("Error de red"); } finally{ setCargandoCSV(false); }
  };

  const cargar = useCallback(async()=>{
    setCargando(true); setError(null); setMsgTerm("");
    try{
      const [resumen,actividad,bloqueos,lentas,tablasMon,tU,cT,uA,uQ]=await Promise.all([
        fetchJSON(`${API_MONITOREO}/resumen`),
        fetchJSON(`${API_MONITOREO}/actividad`),
        fetchJSON(`${API_MONITOREO}/bloqueos`),
        fetchJSON(`${API_MONITOREO}/consultas-lentas`),
        fetchJSON(`${API_MONITOREO}/tablas`),
        fetchJSON(`${API_MONITOREO}/tablas-usadas`).catch(()=>[]),
        fetchJSON(`${API_MONITOREO}/consultas-por-tipo`).catch(()=>null),
        fetchJSON(`${API_MONITOREO}/usuarios-activos`).catch(()=>null),
        fetchJSON(`${API_MONITOREO}/ultimas-consultas`).catch(()=>null),
      ]);
      setMonitor({resumen,actividad,bloqueos,lentas,tablas:tablasMon});
      setTablasUsadas(tU||[]); setConsultasTipo(cT||null);
      setUsuariosActivos(uA||null); setUltimasConsultas(uQ||null);
      setUltimaAct(new Date().toLocaleTimeString());
    }catch{ setError("No se pudo conectar con el servidor de monitoreo."); }
    finally{ setCargando(false); }
  },[]);

  useEffect(()=>{
    if(tab!=="monitoreo") return;
    cargar(); const t=setInterval(cargar,5000); return()=>clearInterval(t);
  },[tab,cargar]);

  const terminar = async(pid)=>{
    if(!window.confirm(`¿Terminar proceso ${pid}?`)) return;
    setTerminando(pid);
    try{
      const res=await fetch(`${API_MONITOREO}/proceso/${pid}`,{method:"DELETE"});
      const j=await res.json(); setMsgTerm(j.mensaje||j.error); cargar();
    }catch{ setMsgTerm("Error al terminar el proceso"); } finally{ setTerminando(null); }
  };

  const {resumen,actividad,bloqueos,lentas,tablas:tablasMon}=monitor||{};

  return (
    <div className="adm-root">
      <header className="adm-header">
        <div className="adm-header__brand">
          <div className="adm-header__dot"/>
          <span>Administración</span>
        </div>
        <nav className="adm-tabs">
          {[{id:"respaldo",label:"Respaldos",icon:"💾"},
            {id:"csv",label:"CSV",icon:"📄"},
            {id:"monitoreo",label:"Monitoreo",icon:"📊"}].map(t=>(
            <button key={t.id} className={`adm-tab ${tab===t.id?"adm-tab--on":""}`} onClick={()=>setTab(t.id)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="adm-main">

        {/* ════════ RESPALDOS ════════ */}
        {tab==="respaldo" && (
          <div className="adm-grid2">
            <div className="adm-col">
              <div className="adm-card">
                <div className="adm-card__head"><span className="adm-card__ico">🗄️</span>
                  <div><div className="adm-card__title">Respaldo completo</div>
                    <div className="adm-card__desc">Exporta toda la base en formato .dump</div></div>
                </div>
                <button className="adm-btn adm-btn--primary" onClick={()=>descargar(API_MODULO)}>↓ Generar respaldo completo</button>
              </div>
              <div className="adm-card" style={{marginTop:14}}>
                <div className="adm-card__head"><span className="adm-card__ico">📋</span>
                  <div><div className="adm-card__title">Respaldo por tabla</div>
                    <div className="adm-card__desc">Selecciona una tabla específica</div></div>
                </div>
                <select className="adm-select" value={tablaSeleccionada} onChange={e=>setTablaSeleccionada(e.target.value)}>
                  <option value="">Seleccionar tabla…</option>
                  {tablas.map((t,i)=><option key={i} value={t}>{t}</option>)}
                </select>
                <button className="adm-btn adm-btn--primary" style={{marginTop:10}} disabled={!tablaSeleccionada}
                  onClick={()=>descargar(`${API_MODULO}/tabla/${tablaSeleccionada}`)}>↓ Respaldar tabla</button>
              </div>
            </div>
            <div className="adm-card">
              <div className="adm-card__head"><span className="adm-card__ico">🕑</span>
                <div className="adm-card__title">Historial de respaldos</div>
              </div>
              {historial.length===0?<Empty icon="📭" text="Sin respaldos aún"/>:(
                <div className="adm-tbl-wrap"><table className="adm-tbl">
                  <thead><tr><th>Archivo</th><th>Fecha</th><th>Tamaño</th><th>Tipo</th></tr></thead>
                  <tbody>{historial.map((it,i)=>(
                    <tr key={i}><td className="mono">{it.nombre}</td>
                      <td>{new Date(it.fecha).toLocaleString()}</td>
                      <td>{it.tamaño}</td>
                      <td><span className="adm-pill adm-pill--info">{it.tipo}</span></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </div>
        )}

        {/* ════════ CSV ════════ */}
        {tab==="csv" && (
          <div className="adm-card" style={{maxWidth:540}}>
            <div className="adm-card__head"><span className="adm-card__ico">📄</span>
              <div><div className="adm-card__title">Exportar / Importar CSV</div>
                <div className="adm-card__desc">Selecciona una tabla para operar</div></div>
            </div>
            <select className="adm-select" value={tablaCSV} onChange={e=>{setTablaCSV(e.target.value);setMensajeImport("");}}>
              <option value="">Seleccionar tabla…</option>
              {tablas.map((t,i)=><option key={i} value={t}>{t}</option>)}
            </select>
            <button className="adm-btn adm-btn--primary" disabled={!tablaCSV} onClick={()=>descargar(`${API_MODULO}/csv/${tablaCSV}`)}>↓ Exportar CSV</button>
            <div className="adm-divider"><span>Importar</span></div>
            <div className="adm-file-row">
              <label className="adm-file-label">
                <input id="csv-input" type="file" accept=".csv" onChange={e=>{setArchivoCSV(e.target.files[0]||null);setMensajeImport("");}}/>
                {archivoCSV?archivoCSV.name:"Elegir archivo .csv…"}
              </label>
              <button className="adm-btn adm-btn--primary" disabled={!tablaCSV||!archivoCSV||cargandoCSV} onClick={importar}>
                {cargandoCSV?"Importando…":"↑ Importar"}
              </button>
            </div>
            {mensajeImport&&<div className={`adm-alert ${mensajeImport.toLowerCase().includes("error")?"adm-alert--error":"adm-alert--ok"}`}>{mensajeImport}</div>}
          </div>
        )}

        {/* ════════ MONITOREO ════════ */}
        {tab==="monitoreo" && (
          <>
            <div className="adm-livebar">
              <span className="adm-livebadge"><span className="adm-livedot"/> En vivo · 5s</span>
              {ultimaAct&&<span className="adm-livetime">{cargando?<><span className="adm-spin"/>Actualizando…</>:`Actualizado ${ultimaAct}`}</span>}
            </div>

            {error&&<div className="adm-alert adm-alert--error">{error}</div>}
            {msgTerm&&<div className={`adm-alert ${msgTerm.includes("Error")?"adm-alert--error":"adm-alert--ok"}`}>{msgTerm}</div>}
            {!monitor&&cargando&&<div className="adm-card adm-card--center"><span className="adm-spin adm-spin--lg"/> Cargando métricas…</div>}

            {monitor&&(<>

              {/* 1. Estado general */}
              <Block title="Estado general del servidor">
                <div className="adm-kpi-grid">
                  <KpiCard icon="🔌" label="Conexiones" color={resumen.conexiones.porcentaje>=90?"bad":resumen.conexiones.porcentaje>=70?"warn":"ok"}
                    value={`${resumen.conexiones.total}/${resumen.conexiones.max}`} sub={`${resumen.conexiones.porcentaje}% del límite`}/>
                  <KpiCard icon="⚡" label="Cache hit" color={resumen.cache.hit_ratio<95?"warn":"ok"}
                    value={`${resumen.cache.hit_ratio}%`} sub={resumen.cache.hit_ratio>=99?"Óptimo":resumen.cache.hit_ratio>=95?"Aceptable":"Revisar shared_buffers"}/>
                  <KpiCard icon="🔄" label="TPS promedio" color="blue" value={resumen.transacciones.tps} sub="transacciones/seg"/>
                  <KpiCard icon="🗃️" label="Tamaño de base" color="purple" value={resumen.base.tamaño} sub={resumen.base.nombre}/>
                  <KpiCard icon="✅" label="Commits" color="ok" value={resumen.transacciones.commits.toLocaleString()}/>
                  <KpiCard icon="↩️" label="Rollbacks" color={resumen.transacciones.rollbacks>100?"warn":"ok"} value={resumen.transacciones.rollbacks.toLocaleString()}/>
                </div>
                <div className="adm-charts3">
                  <DonutConexiones resumen={resumen}/>
                  <DonutCache resumen={resumen}/>
                  <LineaTPS tps={resumen.transacciones.tps}/>
                </div>
                <div className="adm-gauges">
                  <Gauge pct={resumen.conexiones.porcentaje} label="Uso de conexiones"/>
                  <Gauge pct={resumen.cache.hit_ratio} label="Cache hit ratio" invert/>
                </div>
              </Block>

              {/* 2. Tablas más usadas */}
              <Block title="Tablas más usadas" sub="Top 12 por operaciones acumuladas">
                <div className="adm-used-layout">
                  <div className="adm-used-left"><TopTablasTarjetas data={tablasUsadas}/></div>
                  <div className="adm-used-right">
                    <div className="adm-chart-legend">
                      <span><i style={{background:P.blue}}/> Lecturas</span>
                      <span><i style={{background:P.amber}}/> Escrituras</span>
                    </div>
                    <BarrasTablasUsadas data={tablasUsadas}/>
                  </div>
                </div>
              </Block>

              {/* 3. Estado esquema empresa */}
              <Block title="Estado del esquema empresa" sub="Salud de tablas: vacuums, bloat y scans">
                <TablaEmpresa tablas={tablasMon}/>
              </Block>

              {/* 4. Consultas por tipo */}
              <Block title="Consultas generadas por tipo">
                {!consultasTipo?<Empty icon="📭" text="Sin datos"/>
                  :!consultasTipo.disponible
                    ?<>
                        <div className="adm-alert adm-alert--info" style={{marginBottom:16}}>
                          <strong>pg_stat_statements no instalada.</strong> Stats globales:
                          <code style={{display:"block",marginTop:6}}>CREATE EXTENSION pg_stat_statements;</code>
                        </div>
                        {consultasTipo.fallback&&<div className="adm-kpi-grid">
                          <KpiCard icon="📥" label="INSERTs" color="ok" value={parseInt(consultasTipo.fallback.inserts||0).toLocaleString()}/>
                          <KpiCard icon="✏️" label="UPDATEs" color="blue" value={parseInt(consultasTipo.fallback.updates||0).toLocaleString()}/>
                          <KpiCard icon="🗑️" label="DELETEs" color="bad" value={parseInt(consultasTipo.fallback.deletes||0).toLocaleString()}/>
                          <KpiCard icon="✅" label="Commits" color="ok" value={parseInt(consultasTipo.fallback.commits||0).toLocaleString()}/>
                          <KpiCard icon="↩️" label="Rollbacks" color="warn" value={parseInt(consultasTipo.fallback.rollbacks||0).toLocaleString()}/>
                        </div>}
                      </>
                    :<div className="adm-tipo-layout">
                        <div className="adm-tipo-pills">
                          {consultasTipo.rows.map((r,i)=>{
                            const COLS=[P.blue,P.green,P.amber,P.red,P.purple,P.teal];
                            return(<div key={r.tipo} className="adm-tipo-pill" style={{borderLeft:`3px solid ${COLS[i%6]}`}}>
                              <TipoPill query={r.tipo}/>
                              <span className="adm-tipo-pill__val">{parseInt(r.total_ejecuciones).toLocaleString()}</span>
                              <span className="adm-tipo-pill__lbl">ejecuciones</span>
                              <span className="adm-tipo-pill__ms">{r.tiempo_promedio_ms} ms avg</span>
                            </div>);
                          })}
                        </div>
                        <div className="adm-tipo-chart"><BarrasTipo data={consultasTipo}/></div>
                      </div>
                }
              </Block>

              {/* 5. Usuarios activos */}
              <Block title="Usuarios con más actividad">
                {!usuariosActivos?<Empty icon="👤" text="Sin datos"/>
                  :<div className="adm-user-layout">
                      <div className="adm-user-chart"><BarrasUsuarios data={usuariosActivos}/></div>
                      {usuariosActivos.sesiones?.length>0&&(
                        <div className="adm-user-table">
                          <div className="adm-section-mini-title">Sesiones ahora</div>
                          <div className="adm-tbl-wrap"><table className="adm-tbl">
                            <thead><tr><th>Usuario</th><th>Sesiones</th><th>Activas</th><th>Espera</th></tr></thead>
                            <tbody>{usuariosActivos.sesiones.map((r,i)=>(
                              <tr key={i} className={r.queries_corriendo>0?"adm-tr--warn":""}>
                                <td><strong>{r.usuario}</strong></td>
                                <td className="mono">{r.sesiones_activas}</td>
                                <td className="mono">{r.queries_corriendo>0?<span className="adm-pill adm-pill--warn">{r.queries_corriendo}</span>:<span className="adm-dim">—</span>}</td>
                                <td className="mono">{r.en_espera>0?<span className="adm-pill adm-pill--warn">{r.en_espera}</span>:<span className="adm-dim">—</span>}</td>
                              </tr>
                            ))}</tbody>
                          </table></div>
                        </div>
                      )}
                    </div>
                }
              </Block>

              {/* 6. Últimas consultas */}
              <Block title="Últimas consultas ejecutadas">
                {!ultimasConsultas?<Empty icon="📋" text="Sin datos"/>
                  :<>
                      <div className="adm-subtabs">
                        {["enCurso","historial"].map(s=>(
                          <button key={s} className={`adm-subtab ${subQ===s?"adm-subtab--on":""}`} onClick={()=>setSubQ(s)}>
                            {s==="enCurso"?"En curso ahora":"Historial reciente"}
                            {s==="enCurso"&&ultimasConsultas.enCurso?.length>0&&(
                              <span className="adm-badge adm-badge--warn" style={{marginLeft:6}}>{ultimasConsultas.enCurso.length}</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {subQ==="enCurso"&&(ultimasConsultas.enCurso?.length===0
                        ?<Empty icon="🟢" text="Ninguna consulta en ejecución"/>
                        :<div className="adm-tbl-wrap"><table className="adm-tbl">
                            <thead><tr><th>PID</th><th>Usuario</th><th>Tipo</th><th>Estado</th><th>Espera</th><th>Tiempo</th><th>Query</th></tr></thead>
                            <tbody>{ultimasConsultas.enCurso?.map((r,i)=>(
                              <tr key={i} className={r.wait_event_type?"adm-tr--warn":""}>
                                <td className="mono adm-dim">{r.pid}</td><td>{r.usuario}</td>
                                <td><TipoPill query={r.query}/></td>
                                <td><span style={{display:"flex",alignItems:"center",gap:5}}><StatusDot state={r.state}/><small>{r.state}</small></span></td>
                                <td>{r.wait_event_type?<span className="adm-pill adm-pill--warn">{r.wait_event_type}</span>:<span className="adm-dim">—</span>}</td>
                                <td className="mono">{fmtSeg(r.segundos_ejecutando)}</td>
                                <td className="adm-qcell" title={r.query}>{r.query}</td>
                              </tr>
                            ))}</tbody>
                          </table></div>
                      )}
                      {subQ==="historial"&&(!ultimasConsultas.pg_stat_disponible
                        ?<div className="adm-alert adm-alert--info"><strong>pg_stat_statements no instalada.</strong><code style={{display:"block",marginTop:6}}>CREATE EXTENSION pg_stat_statements;</code></div>
                        :ultimasConsultas.historial?.length===0?<Empty icon="📭" text="Sin historial"/>
                        :<div className="adm-tbl-wrap"><table className="adm-tbl">
                            <thead><tr><th>Usuario</th><th>Tipo</th><th>Ejecuciones</th><th>Promedio (ms)</th><th>Máximo (ms)</th><th>Query</th></tr></thead>
                            <tbody>{ultimasConsultas.historial.map((r,i)=>(
                              <tr key={i} className={r.promedio_ms>1000?"adm-tr--warn":""}>
                                <td>{r.usuario}</td><td><TipoPill query={r.query}/></td>
                                <td className="mono">{parseInt(r.ejecuciones).toLocaleString()}</td>
                                <td className={`mono ${r.promedio_ms>500?"adm-txt--warn":""}`}>{r.promedio_ms}</td>
                                <td className="mono">{r.max_ms}</td>
                                <td className="adm-qcell" title={r.query}>{r.query}</td>
                              </tr>
                            ))}</tbody>
                          </table></div>
                      )}
                    </>
                }
              </Block>

              {/* 7. Sesiones activas */}
              <Block title="Sesiones activas" badge={actividad.length} badgeWarn={actividad.some(r=>r.wait_event_type)}>
                {actividad.length===0?<Empty icon="🟢" text="Sin sesiones activas"/>
                  :<div className="adm-tbl-wrap"><table className="adm-tbl">
                      <thead><tr><th>PID</th><th>Usuario</th><th>Estado</th><th>Espera</th><th>Duración</th><th>Query</th><th/></tr></thead>
                      <tbody>{actividad.map(r=>(
                        <tr key={r.pid} className={r.wait_event_type?"adm-tr--warn":""}>
                          <td className="mono adm-dim">{r.pid}</td>
                          <td>{r.usuario||<span className="adm-dim">—</span>}</td>
                          <td><span style={{display:"flex",alignItems:"center",gap:5}}><StatusDot state={r.state}/><small>{r.state}</small></span></td>
                          <td>{r.wait_event_type?<span className="adm-pill adm-pill--warn">{r.wait_event_type}</span>:<span className="adm-dim">—</span>}</td>
                          <td className="mono">{fmtDur(r.duracion)}</td>
                          <td className="adm-qcell" title={r.query}>{r.query||<span className="adm-dim">—</span>}</td>
                          <td><button className="adm-kill" disabled={terminando===r.pid} onClick={()=>terminar(r.pid)}>{terminando===r.pid?"…":"✕"}</button></td>
                        </tr>
                      ))}</tbody>
                    </table></div>
                }
              </Block>

              {/* 8. Bloqueos */}
              <Block title="Bloqueos activos" badge={bloqueos.length} badgeWarn={bloqueos.length>0}>
                {bloqueos.length===0?<Empty icon="🔓" text="Sin bloqueos detectados"/>
                  :<div className="adm-tbl-wrap"><table className="adm-tbl">
                      <thead><tr><th>PID bloqueado</th><th>Query bloqueada</th><th>Espera</th><th>PID bloqueador</th><th>Query bloqueadora</th><th/></tr></thead>
                      <tbody>{bloqueos.map((r,i)=>(
                        <tr key={i} className="adm-tr--error">
                          <td className="mono">{r.pid_bloqueado}</td>
                          <td className="adm-qcell" title={r.query_bloqueada}>{r.query_bloqueada}</td>
                          <td className="mono adm-txt--warn">{fmtDur(r.tiempo_espera)}</td>
                          <td className="mono">{r.pid_bloqueador}</td>
                          <td className="adm-qcell" title={r.query_bloqueadora}>{r.query_bloqueadora}</td>
                          <td><button className="adm-kill adm-kill--label" disabled={terminando===r.pid_bloqueador} onClick={()=>terminar(r.pid_bloqueador)}>{terminando===r.pid_bloqueador?"…":"✕ Liberar"}</button></td>
                        </tr>
                      ))}</tbody>
                    </table></div>
                }
              </Block>

              {/* 9. Consultas lentas */}
              <Block title="Top 10 consultas más costosas">
                {!lentas.disponible
                  ?<div className="adm-alert adm-alert--info"><strong>pg_stat_statements no instalada.</strong><code style={{display:"block",marginTop:6}}>CREATE EXTENSION pg_stat_statements;</code></div>
                  :lentas.rows.length===0?<Empty icon="📭" text="Sin datos aún"/>
                  :<div className="adm-tbl-wrap"><table className="adm-tbl">
                      <thead><tr><th style={{width:32}}>#</th><th>Query</th><th>Ejecuciones</th><th>Total (ms)</th><th>Promedio (ms)</th><th>Máximo (ms)</th></tr></thead>
                      <tbody>{lentas.rows.map((r,i)=>(
                        <tr key={i} className={r.tiempo_promedio_ms>1000?"adm-tr--warn":""}>
                          <td className="mono adm-dim">{i+1}</td>
                          <td className="adm-qcell" title={r.query}>{r.query}</td>
                          <td className="mono">{parseInt(r.ejecuciones).toLocaleString()}</td>
                          <td className="mono">{parseFloat(r.tiempo_total_ms).toLocaleString()}</td>
                          <td className={`mono ${r.tiempo_promedio_ms>1000?"adm-txt--warn":""}`}>{r.tiempo_promedio_ms}</td>
                          <td className="mono">{r.tiempo_max_ms}</td>
                        </tr>
                      ))}</tbody>
                    </table></div>
                }
              </Block>

            </>)}
          </>
        )}
      </main>
    </div>
  );
}