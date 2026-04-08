import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    // Convertir a objeto clave-valor
    const settings: Record<string, string> = {};
    for (const item of data) {
      settings[item.key] = item.value;
    }
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    const { data, error } = await supabase
      .from('settings')
      .upsert(updates, { onConflict: 'key' })
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
