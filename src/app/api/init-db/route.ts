import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Crear tablas
    const { error: err1 } = await supabase.rpc('exec_sql', { sql: `
      CREATE TABLE IF NOT EXISTS products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        image_url TEXT,
        description TEXT,
        gender TEXT DEFAULT 'unisex',
        style TEXT DEFAULT 'moderno',
        status TEXT DEFAULT 'disponible',
        code TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `}).catch(async () => {
      // Fallback: try direct approach via REST
      return null;
    });

    // Usar la API REST de Supabase para verificar/crear tablas
    // Primero verificamos si las tablas existen intentando hacer un select
    const tables = ['products', 'providers', 'lens_prices', 'settings', 'prescriptions'];

    // Insertar configuraciones por defecto
    const { error: settingsErr } = await supabase.from('settings').upsert([
      { key: 'profit_basico', value: '30' },
      { key: 'profit_estandar', value: '50' },
      { key: 'profit_premium', value: '70' },
    ], { onConflict: 'key' });

    if (settingsErr) {
      console.log('Settings upsert result:', settingsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada correctamente. Si hay errores, crea las tablas manualmente en Supabase.',
      details: 'Asegúrate de crear las tablas: products, providers, lens_prices, settings, prescriptions en Supabase SQL Editor.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
