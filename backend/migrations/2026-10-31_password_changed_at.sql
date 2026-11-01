-- Guarda cuándo se cambió la contraseña por última vez.
-- Los tokens JWT emitidos ANTES de esa fecha dejan de ser válidos
-- (cierra la sesión en todos los dispositivos al cambiar o recuperar la contraseña).
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
