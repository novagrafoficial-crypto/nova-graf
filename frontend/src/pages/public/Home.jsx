import React from 'react';
import '../../styles/public/Home.css';
import LogoNova from '../../assets/LogoNova.png';

const Home = () => {
  return (
    <>
      <main className="home-main">
        {/* Sección Inicio - Hero */}
        <section id="inicio" className="hero-section">
          <div className="hero-container">
            <img src={LogoNova} alt="Nova Graf" className="hero-logo" />
            <h1 className="hero-title">Bienvenido a Nova Graf</h1>
            <p className="hero-subtitle">
              Innovación y calidad en impresión y diseño gráfico
            </p>
            <a href="#catalogo" className="hero-cta">Explorar catálogo</a>
          </div>
          <div className="hero-decoration"></div>
        </section>

        {/* Sección Catálogo */}
        <section id="catalogo" className="section">
          <h2 className="section-title">Catálogo de productos</h2>
          <p className="section-text">Aquí irían tus productos destacados...</p>
        </section>

        {/* Sección Misión */}
        <section id="mision" className="section">
          <h2 className="section-title">Misión</h2>
          <p className="section-text">
            Nuestra misión es ofrecer soluciones de impresión innovadoras y sostenibles...
          </p>
        </section>

        {/* Sección Visión */}
        <section id="vision" className="section">
          <h2 className="section-title">Visión</h2>
          <p className="section-text">
            Ser líderes en el mercado latinoamericano de diseño e impresión...
          </p>
        </section>

        {/* Sección Valores */}
        <section id="valores" className="section">
          <h2 className="section-title">Valores</h2>
          <ul className="values-list">
            <li>Compromiso con la calidad</li>
            <li>Innovación constante</li>
            <li>Sostenibilidad</li>
            <li>Atención personalizada</li>
          </ul>
        </section>

        {/* Sección Antecedentes */}
        <section id="antecedentes" className="section">
          <h2 className="section-title">Nuestra historia</h2>
          <p className="section-text">
            Desde 2010, Nova Graf ha evolucionado para convertirse en un referente...
          </p>
        </section>

        {/* Sección Contacto */}
        <section id="contacto" className="section">
          <h2 className="section-title">Contacto</h2>
          <p className="section-text">
            ¿Hablamos? Escríbenos a <a href="mailto:info@novagraf.com">info@novagraf.com</a>
          </p>
        </section>
      </main>
    </>
  );
};

export default Home;