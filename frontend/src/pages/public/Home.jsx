// frontend/src/pages/public/Home.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/public/Home.css';

// ✅ CAMBIO: Usamos la variable de entorno de Vite
const API = import.meta.env.VITE_API_URL;

const PASOS = [
  { icon: '🛍️', num: '01', titulo: 'Elige tu producto', desc: 'Explora nuestro catálogo y selecciona el producto base que deseas personalizar.' },
  { icon: '🎨', num: '02', titulo: 'Personalízalo', desc: 'Elige color, agrega tu diseño, logo o texto. Nosotros nos encargamos del resto.' },
  { icon: '🚚', num: '03', titulo: 'Recíbelo en casa', desc: 'Enviamos tu pedido personalizado directo a tu domicilio en tiempo y forma.' },
];

const TESTIMONIOS = [
  { nombre: 'María G.', texto: 'Excelente calidad y atención. Mis tazas personalizadas quedaron perfectas para el evento.', estrellas: 5 },
  { nombre: 'Carlos R.', texto: 'Muy buenos precios y entrega rápida. Volveré a pedir sin duda.', estrellas: 5 },
  { nombre: 'Ana L.', texto: 'El equipo fue muy amable y el resultado superó mis expectativas.', estrellas: 4 },
];

const STATS = [
  { valor: '500+', label: 'Clientes felices' },
  { valor: '1,200+', label: 'Productos entregados' },
  { valor: '8', label: 'Años de experiencia' },
  { valor: '100%', label: 'Satisfacción garantizada' },
];

const Home = () => {
  const navigate = useNavigate();

  const [productos,   setProductos]   = useState([]);
  const [portafolio,  setPortafolio]  = useState([]);
  const [mision,      setMision]      = useState(null);
  const [vision,      setVision]      = useState(null);
  const [valores,     setValores]     = useState([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [loadingPort, setLoadingPort] = useState(true);
  const [loadingNos,  setLoadingNos]  = useState(true);

  const [coloresSeleccionados, setColoresSeleccionados] = useState({});
  const [portIdx, setPortIdx] = useState(0);
  const [contacto, setContacto] = useState({ nombre: '', correo: '', mensaje: '' });
  const [enviado,  setEnviado]  = useState(false);
  const [visibleSections, setVisibleSections] = useState({});

  useEffect(() => {
    // ✅ Ahora todas estas peticiones apuntarán a Render automáticamente
    axios.get(`${API}/api/client/productos/catalogo`)
      .then(res => setProductos(res.data.slice(0, 6)))
      .catch(err => console.error('Error productos:', err))
      .finally(() => setLoadingProd(false));

    axios.get(`${API}/api/public/public/portafolio`)
      .then(res => setPortafolio(res.data))
      .catch(err => console.error('Error portafolio:', err))
      .finally(() => setLoadingPort(false));

    Promise.allSettled([
      fetch(`${API}/api/public/mision`).then(r => r.json()),
      fetch(`${API}/api/public/vision`).then(r => r.json()),
      fetch(`${API}/api/public/valores`).then(r => r.json()),
    ]).then(([resMision, resVision, resValores]) => {
      if (resMision.status === 'fulfilled') {
        const d = resMision.value; setMision(d?.data ?? d);
      }
      if (resVision.status === 'fulfilled') {
        const d = resVision.value; setVision(d?.data ?? d);
      }
      if (resValores.status === 'fulfilled') {
        const d = resValores.value?.data ?? resValores.value;
        setValores(Array.isArray(d) ? d.slice(0, 4) : (d ? [d] : []));
      }
    }).finally(() => setLoadingNos(false));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ... (Resto de las funciones seleccionarColor, verDetalle, handleContacto igual)
  const seleccionarColor = (productoId, color) => {
    setColoresSeleccionados(prev => ({ ...prev, [productoId]: color }));
  };

  const verDetalle = (productoId) => {
    const color = coloresSeleccionados[productoId] || '';
    navigate(`/cliente/producto/${productoId}`, { state: { colorSeleccionado: color } });
  };

  const handleContacto = (e) => {
    e.preventDefault();
    setEnviado(true);
    setContacto({ nombre: '', correo: '', mensaje: '' });
    setTimeout(() => setEnviado(false), 4000);
  };

  const portGrupos = [];
  for (let i = 0; i < portafolio.length; i += 3) {
    portGrupos.push(portafolio.slice(i, i + 3));
  }

  return (
    <main className="home">
      {/* El JSX se mantiene exactamente igual a como lo tienes, 
         solo asegúrate de que use las variables de estado que ya están definidas.
      */}
      <section className="hero-nova">
        <div className="hero-nova__inner">
          <div className="hero-nova__content">
            <div className="hero-nova__badge">
                <span>✨ Personalización profesional</span>
            </div>
            <h1 className="hero-nova__titulo">
              Tu marca, <br />
              <span className="hero-nova__destaque">impresa</span> <br />
              en todo.
            </h1>
            <p className="hero-nova__desc">
              Transforma cualquier producto con tu imagen, logo o diseño. <br />
              <strong>Calidad garantizada. Entregas puntuales.</strong> <br />
              Huejutla de Reyes, Hidalgo.
            </p>
            <div className="hero-nova__actions">
              <Link to="/catalogo" className="btn-redondeado btn-principal">
                Ver catálogo
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#portafolio" className="btn-redondeado btn-secundario">Ver trabajos</a>
            </div>
          </div>
        </div>

        <div className="hero-nova__curva">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 C480,100 960,100 1440,0 L1440,120 L0,120 Z" fill="#1A6163"></path>
          </svg>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        {STATS.map((s, i) => (
          <div key={i} className="stats-bar__item">
            <strong>{s.valor}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* PORTAFOLIO, PROCESO, NOSOTROS, etc. (El resto de tu código JSX) */}
      {/* ... */}
      <section className="ng-section" id="portafolio" data-animate>
         {/* Tu lógica de mapeo de portafolio aquí... */}
      </section>
      
      {/* ... (Cierre de las secciones y el main) */}
    </main>
  );
};

export default Home;