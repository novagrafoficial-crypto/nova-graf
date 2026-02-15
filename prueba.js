


db = db.getSiblingDB('sample_mflix');// Seleccionar la base de datos
print("--- Verificando índices ---");// Verificar si el índice en 'year' existe

var indexes = db.movies.getIndexes();
var indexExists = indexes.some(function(idx) {
    return idx.key.hasOwnProperty('year') && idx.key.year === -1;
});

if (!indexExists) {
    print("Creando índice 'year' en la colección 'movies'...");
    db.movies.createIndex({ year: -1 });
    print("Índice creado con éxito.");
} else {
    print("El índice 'year' ya existe. No se requiere acción.");
}
// Reporte de otros índices existentes
print("Índices actuales en 'movies': " + indexes.length);




