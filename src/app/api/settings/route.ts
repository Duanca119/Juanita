import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json(); // Array of { id, profit_margin } or { id, name }
    
    // Soportar tanto array como objeto individual
    const updates = Array.isArray(body) ? body : [body];
    
    const results = [];
    for (const item of updates) {
      const updateData: Record<string, unknown> = {};
      if (item.profit_margin !== undefined) updateData.profit_margin = item.profit_margin;
      if (item.name !== undefined) updateData.name = item.name;
      
      const { data, error } = await supabase
        .from('settings')
        .update(updateData)
        .eq('id', item.id)
        .select()
        .single();
      
      if (error) throw error;
      results.push(data);
    }
    
    return NextResponse.json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
