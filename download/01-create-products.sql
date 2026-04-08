CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  description TEXT,
  gender TEXT DEFAULT 'unisex',
  style TEXT DEFAULT 'moderno',
  status TEXT DEFAULT 'disponible',
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
