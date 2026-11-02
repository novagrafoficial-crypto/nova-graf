-- Derecho ARCO de Oposición (switch Opt-Out en el perfil del cliente).
-- Por defecto queda en TRUE: el cliente puede oponerse cuando quiera desde la app.
--   recibe_avisos: recibir avisos dentro de la app (chat y previas de sus pedidos).
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS recibe_avisos BOOLEAN NOT NULL DEFAULT TRUE;
