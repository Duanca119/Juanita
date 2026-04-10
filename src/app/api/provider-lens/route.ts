import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/provider-lens — Obtener lentes por proveedor
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    let query = supabase.from('provider_lens').select('*');

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/provider-lens — Crear nuevo lente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('provider_lens')
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/provider-lens — Editar lente existente
export async function PUT(req: NextRequest) {
  try {
    const { id, ...body } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { data, error } = await supabase
      .from('provider_lens')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/provider-lens?id=X — Eliminar lente
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { error } = await supabase.from('provider_lens').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
