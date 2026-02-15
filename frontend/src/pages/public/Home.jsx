import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../styles/Home.css';

function Home() {
  // Estado para el contador del carrito (ejemplo)
  const [cartCount] = useState(3); // Valor de ejemplo

  return (
    <div className="home-container">
      <Header cartCount={cartCount} />

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
      <Footer />

      {/* 🛒 OPCIONAL: Carrito flotante (puedes eliminarlo si usas el del Header) */}
      {/*
      <div className="cart-floating">
        <span className="cart-icon">🛒</span>
        <span className="cart-count">{cartCount}</span>
        <span className="cart-tooltip">Carrito</span>
      </div>
      */}
    </div>
  );
}

export default Home;