const empresaInfo = {
  nombre: "Nova Graf",
  mision: "Ofrecer productos personalizados de alta calidad que reflejen la identidad de cada cliente.",
  vision: "Ser una empresa líder en personalización de artículos a nivel regional.",
  valores: [
    "Calidad",
    "Responsabilidad",
    "Creatividad",
    "Compromiso",
    "Honestidad"
  ],
  contacto: {
    telefono: "7751234567",
    email: "contacto@novagraf.com"
  },
  ubicacion: "Yahualica, Hidalgo"
};

class HomeModel {
  static getInfo() {
    return empresaInfo;
  }
}

module.exports = HomeModel;
