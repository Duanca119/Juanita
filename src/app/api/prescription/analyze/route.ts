import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'PUT_YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json(
        { error: 'API key de Gemini no configurada' },
        { status: 500 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    const base64Data = imageData.includes('base64,')
      ? imageData.split('base64,')[1]
      : imageData;

    const prompt = `Extrae los datos ópticos de esta imagen de fórmula/prescripción.

Retorna ÚNICAMENTE un objeto JSON con esta estructura exacta, sin texto adicional, sin markdown, sin backticks:

{
  "od": {
    "sph": "valor o vacio",
    "cyl": "valor o vacio",
    "axis": "valor o vacio"
  },
  "oi": {
    "sph": "valor o vacio",
    "cyl": "valor o vacio",
    "axis": "valor o vacio"
  },
  "add": "valor o vacio"
}

Si no encuentras un valor, déjalo como cadena vacía "".
Los valores numéricos pueden incluir signo + o - y hasta 2 decimales.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json(
        { error: `Error de Gemini API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpiar respuesta y parsear JSON
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let prescription;
    try {
      prescription = JSON.parse(cleanText);
    } catch {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prescription = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: 'No se pudo extraer la fórmula de la imagen. Intenta de nuevo.', rawText: text },
          { status: 422 }
        );
      }
    }

    // Generar recomendaciones
    const recommendations: string[] = [];
    if (prescription.add && prescription.add.trim() !== '') {
      recommendations.push('Lentes progresivos');
    }
    if (prescription.od?.cyl && prescription.od.cyl.trim() !== '') {
      recommendations.push('Antirreflejo');
    }
    if (prescription.oi?.cyl && prescription.oi.cyl.trim() !== '') {
      if (!recommendations.includes('Antirreflejo')) {
        recommendations.push('Antirreflejo');
      }
    }
    const odSph = parseFloat(prescription.od?.sph) || 0;
    const oiSph = parseFloat(prescription.oi?.sph) || 0;
    if (Math.abs(odSph) > 2.0 || Math.abs(oiSph) > 2.0) {
      recommendations.push('Índice alto');
    }

    return NextResponse.json({
      prescription,
      recommendations,
      recommendationText:
        recommendations.length > 0
          ? `Recomendación: ${recommendations.join(' con ')}`
          : 'Sin recomendaciones especiales',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Prescription analysis error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
