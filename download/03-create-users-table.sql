-- Tabla de usuarios (admin y empleados)
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar seguridad a nivel de fila
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY all_users ON users FOR ALL USING (true) WITH CHECK (true);
