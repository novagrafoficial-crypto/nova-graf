import "../styles/Home.css";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="home-container">
    <Navbar />
      {/* HERO */}
      <section className="hero" id="inicio">
        <h1>Nova Graf</h1>
        <p>Especialistas en personalización de artículos</p>
        <button>Ver Catálogo</button>
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="section" id="nosotros">
        <h2>Sobre Nosotros</h2>
        <p>
          Nova Graf es una empresa dedicada a la personalización de productos
          como tazas, playeras, termos y más, ofreciendo calidad, diseño y
          atención personalizada.
        </p>
      </section>

      {/* CATÁLOGOS */}
      <section className="section" id="catalogos">
        <h2>Catálogos</h2>

        <div className="cards">
          <div className="card">Tazas</div>
          <div className="card">Playeras</div>
          <div className="card">Gorras</div>
          <div className="card">Termos</div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="section" id="servicios">
        <h2>Servicios</h2>
        <p>
          Impresión, sublimación, serigrafía, grabado láser y diseño gráfico.
        </p>
      </section>

      {/* CONTACTO */}
      <section className="section" id="contacto">
        <h2>Contacto</h2>

        <div className="contact-info">
          <p>Teléfono: 771 123 4567</p>
          <p>Correo: contacto@novagraf.com</p>
          <p>Dirección: Yahualica, Hidalgo</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2026 Nova Graf</p>
      </footer>

    </div>
  );
}

export default Home;
