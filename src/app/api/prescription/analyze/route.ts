import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key de Gemini no configurada. Agrégala en Vercel → Settings → Environment Variables como GEMINI_API_KEY' },
        { status: 500 }
      );
    }

    if (!imageData) {
      return NextResponse.json({ error: 'No se proporcionó imagen' }, { status: 400 });
    }

    const base64Data = imageData.includes('base64,')
      ? imageData.split('base64,')[1]
      : imageData;

    const prompt = `Extrae los datos ópticos de esta imagen de fórmula/prescripción.

Retorna ÚNICAMENTE un objeto JSON con esta estructura exacta, sin texto adicional, sin markdown, sin backticks:

{
  "od": { "sph": "valor o vacio", "cyl": "valor o vacio", "axis": "valor o vacio" },
  "oi": { "sph": "valor o vacio", "cyl": "valor o vacio", "axis": "valor o vacio" },
  "add": "valor o vacio"
}

Si no encuentras un valor, déjalo como cadena vacía "".
Los valores numéricos pueden incluir signo + o - y hasta 2 decimales.`;

    // Función para llamar Gemini con reintentos
    const callGemini = async (attempt: number): Promise<Response> => {
      // Esperar antes de reintentar (solo si no es el primer intento)
      if (attempt > 0) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // 2s, 4s, 8s...
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
                ],
              },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
          }),
        }
      );
    };

    // Intentar hasta 3 veces
    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await callGemini(attempt);
      if (response.ok) break;
      if (response.status === 429 && attempt < 2) {
        // Rate limit: reintentar
        continue;
      }
      // Otro error: no reintentar
      break;
    }

    if (!response || !response.ok) {
      const status = response?.status || 500;
      if (status === 429) {
        return NextResponse.json(
          { error: 'Gemini está ocupado. Espera 30 segundos e inténtalo de nuevo.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Error al analizar: ${status}. Intenta de nuevo.` },
        { status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return NextResponse.json(
        { error: 'No se pudo leer la fórmula. Asegúrate que la imagen sea clara.' },
        { status: 422 }
      );
    }

    // Limpiar y parsear JSON
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let prescription;
    try {
      prescription = JSON.parse(cleanText);
    } catch {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prescription = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: 'No se pudo interpretar la fórmula. Intenta con otra imagen.', rawText: text },
          { status: 422 }
        );
      }
    }

    // Recomendaciones
    const recommendations: string[] = [];
    if (prescription.add && prescription.add.trim() !== '') recommendations.push('Lentes progresivos');
    if (prescription.od?.cyl?.trim() || prescription.oi?.cyl?.trim()) {
      if (!recommendations.includes('Antirreflejo')) recommendations.push('Antirreflejo');
    }
    const odSph = parseFloat(prescription.od?.sph) || 0;
    const oiSph = parseFloat(prescription.oi?.sph) || 0;
    if (Math.abs(odSph) > 2.0 || Math.abs(oiSph) > 2.0) recommendations.push('Índice alto');

    return NextResponse.json({
      prescription,
      recommendations,
      recommendationText: recommendations.length > 0
        ? `Recomendación: ${recommendations.join(' con ')}`
        : 'Sin recomendaciones especiales',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Prescription analysis error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
