import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'juanita-vision';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'juanita_preset';
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary no configurado. Agregue CLOUDINARY_CLOUD_NAME.' },
        { status: 500 }
      );
    }

    // Intentar UNSIGNED upload primero (solo necesita cloud name + preset)
    const unsignedForm = new FormData();
    unsignedForm.append('file', file);
    unsignedForm.append('upload_preset', uploadPreset);
    unsignedForm.append('folder', folder);

    let response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: unsignedForm }
    );

    // Si unsigned falla y tenemos API key + secret, intentar signed upload
    if (!response.ok && apiKey && apiSecret) {
      const errData = await response.json().catch(() => null);
      console.warn('Unsigned upload failed, trying signed:', errData?.error?.message);

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signatureStr = `timestamp=${timestamp}&folder=${folder}`;
      const signature = crypto
        .createHash('sha1')
        .update(signatureStr + apiSecret)
        .digest('hex');

      const signedForm = new FormData();
      signedForm.append('file', file);
      signedForm.append('timestamp', timestamp);
      signedForm.append('api_key', apiKey);
      signedForm.append('signature', signature);
      signedForm.append('folder', folder);

      response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: signedForm }
      );
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const msg = errData?.error?.message || `Error al subir imagen: ${response.status}`;
      console.error('Cloudinary upload error:', JSON.stringify(errData));

      // Mensaje de ayuda si falta el preset
      if (msg.includes('preset') || msg.includes('Upload preset')) {
        return NextResponse.json({
          error: `Falta el upload preset "${uploadPreset}". Crea uno en cloudinary.com → Settings → Upload → Add Upload Preset → Nombre: "${uploadPreset}" → Signing Mode: Unsigned`,
        }, { status: 400 });
      }

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

// DELETE: Eliminar imagen de Cloudinary
export async function DELETE(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: 'No se proporcionó public_id' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary no configurado completamente para eliminar' },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('public_id', public_id);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: 'POST', body: formData }
    );

    const data = await response.json();

    if (data.result === 'ok') {
      return NextResponse.json({ success: true, message: 'Imagen eliminada' });
    }

    return NextResponse.json({ error: data.error?.message || 'Error al eliminar' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
