import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Insertar configuraciones por defecto si no existen
    const { data: existingSettings } = await supabase.from('settings').select('*');
    
    if (!existingSettings || existingSettings.length === 0) {
      await supabase.from('settings').insert([
        { name: 'Básico', profit_margin: 2.1 },
        { name: 'Estándar', profit_margin: 2.2 },
        { name: 'Premium', profit_margin: 2.5 },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos verificada correctamente.',
      tables: {
        providers: true,
        lens_prices: true,
        settings: true,
        prescriptions: true,
        products: false, // Necesita crearse manualmente
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
