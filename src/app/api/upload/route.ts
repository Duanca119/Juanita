import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'juanita-vision';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary no configurado. Agregue CLOUDINARY_CLOUD_NAME al .env' },
        { status: 500 }
      );
    }

    // Build the Cloudinary unsigned upload FormData
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', uploadPreset || 'juanita_preset');
    uploadFormData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      console.error('Cloudinary error:', errData);
      const msg = errData?.error?.message || `Error al subir imagen: ${response.status}`;
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Eliminar imagen de Cloudinary (requiere API key + secret)
export async function DELETE(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: 'No se proporcionó public_id' }, { status: 400 });
    }

    // Para eliminar se necesita firma - se deja como placeholder para cuando
    // el usuario configure API Key y API Secret
    return NextResponse.json({
      message: 'Para eliminar imágenes necesitas configurar CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET',
      public_id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
