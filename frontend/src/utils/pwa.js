// Llama esto al cerrar sesión para que un siguiente usuario del mismo
// dispositivo no vea datos guardados en caché del anterior.
export async function limpiarCachesPrivados() {
  if ('caches' in window) {
    await caches.delete('api-cache');
  }
}