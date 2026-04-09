import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    // Extraer base64
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

    // Usar z-ai-web-dev-sdk para análisis de imagen (sin límite de rate)
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const text = completion.choices?.[0]?.message?.content || '';

    if (!text) {
      return NextResponse.json(
        { error: 'No se pudo analizar la imagen. Intenta de nuevo.' },
        { status: 422 }
      );
    }

    // Limpiar respuesta y parsear JSON
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let prescription;
    try {
      prescription = JSON.parse(cleanText);
    } catch {
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
