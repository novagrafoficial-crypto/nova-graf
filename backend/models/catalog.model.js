const categorias = [];

class CatalogModel {

  static createCategory(nombre) {
    const categoria = {
      id: categorias.length + 1,
      nombre,
      subcategorias: []
    };

    categorias.push(categoria);
    return categoria;
  }

  static getCategories() {
    return categorias;
  }

  static addSubcategory(idCategoria, nombreSub) {
    const categoria = categorias.find(c => c.id === idCategoria);

    if (!categoria) return null;

    const sub = {
      id: categoria.subcategorias.length + 1,
      nombre: nombreSub
    };

    categoria.subcategorias.push(sub);
    return sub;
  }
}

module.exports = CatalogModel;
