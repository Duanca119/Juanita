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
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary no está completamente configurado. Verifique CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en las variables de entorno.' },
        { status: 500 }
      );
    }

    // Generar firma (signature) para signed upload
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureStr = `timestamp=${timestamp}&folder=${folder}`;
    const signature = crypto
      .createHash('sha1')
      .update(signatureStr + apiSecret)
      .digest('hex');

    // Construir FormData para Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('timestamp', timestamp);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('signature', signature);
    uploadFormData.append('folder', folder);

    // Si hay un upload preset unsigned como fallback, lo agregamos
    if (uploadPreset) {
      uploadFormData.append('upload_preset', uploadPreset);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      console.error('Cloudinary error:', JSON.stringify(errData));
      const msg = errData?.error?.message || `Error al subir imagen: ${response.status}`;

      // Si falla el signed upload, intentar unsigned como fallback
      if (uploadPreset && !errData?.error?.message?.includes('Invalid')) {
        const unsignedForm = new FormData();
        unsignedForm.append('file', file);
        unsignedForm.append('upload_preset', uploadPreset);
        unsignedForm.append('folder', folder);

        const unsignedRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: unsignedForm }
        );

        if (unsignedRes.ok) {
          const unsignedData = await unsignedRes.json();
          return NextResponse.json({
            url: unsignedData.secure_url,
            public_id: unsignedData.public_id,
            width: unsignedData.width,
            height: unsignedData.height,
            format: unsignedData.format,
          });
        }
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

// DELETE: Eliminar imagen de Cloudinary usando signed request
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
        { error: 'Cloudinary no configurado completamente' },
        { status: 500 }
      );
    }

    // Generar firma para eliminar
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
      return NextResponse.json({ success: true, message: 'Imagen eliminada correctamente' });
    }

    return NextResponse.json({ error: data.error?.message || 'Error al eliminar imagen' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
