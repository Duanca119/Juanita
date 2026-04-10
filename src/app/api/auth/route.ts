import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error) {
      // Si la tabla no existe, el error dice "does not exist"
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { error: 'La tabla users no existe. Ejecuta el SQL en Supabase primero.' },
          { status: 500 }
        );
      }
      // Si no encuentra el usuario
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
      }
      console.error('Auth error:', error);
      return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
    }

    return NextResponse.json({ user: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Auth catch:', message);
    return NextResponse.json({ error: 'Error de conexión: ' + message }, { status: 500 });
  }
}
