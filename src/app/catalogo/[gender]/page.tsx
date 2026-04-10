'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Glasses } from 'lucide-react';

interface Product {
  id: string;
  image_url: string | null;
  description: string;
  gender: string;
  style: string;
  status: string;
  code: string;
}

const genderLabels: Record<string, string> = {
  todos: 'Catálogo Completo',
  mujer: 'Catálogo Mujer',
  hombre: 'Catálogo Hombre',
  nino: 'Catálogo Niños',
  unisex: 'Catálogo Unisex',
  gafas_de_sol: 'Gafas de Sol',
};

const styleOrder = ['cuadrada', 'cat_eye', 'ovalada', 'redonda', 'rectangular', 'aviator', 'wayfarer', 'clubmaster', 'classic', 'sport', 'vintage', 'modern', 'bold', 'media_luna', 'otro'];
const styleLabels: Record<string, string> = {
  cuadrada: '📐 Cuadradas', cat_eye: '🐱 Cat Eye', ovalada: '⚪ Ovaladas',
  redonda: '🔴 Redondas', rectangular: '▬ Rectangulares', aviator: '✈️ Aviador',
  wayfarer: '🌊 Wayfarer', clubmaster: '🎩 Clubmaster', classic: '👑 Classic',
  sport: '⚡ Sport', vintage: '🎞️ Vintage', modern: '💎 Modern',
  bold: '💪 Bold', media_luna: '🌙 Media Luna', otro: '✨ Otros',
};

const genderEmojis: Record<string, string> = {
  mujer: '👩', hombre: '👨', nino: '👶', unisex: '🧑', gafas_de_sol: '🕶️', todos: '📋',
};

export default function CatalogoPublico() {
  const params = useParams();
  const gender = (params?.gender as string) || 'todos';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGender, setActiveGender] = useState(gender);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (activeGender !== 'todos' && p.gender !== activeGender) return false;
    return true;
  });

  // Agrupar: MATERIAL → ESTILO → productos
  const materialOrder = ['Acetato', 'Metal', 'TR90', 'Titanio', 'Acerada', 'Mixta', 'Tres Piezas'];
  const byMaterial: Record<string, Record<string, Product[]>> = {};
  materialOrder.forEach((mat) => {
    const matProducts = filtered.filter((p) => p.description === mat);
    if (matProducts.length === 0) return;
    byMaterial[mat] = {};
    styleOrder.forEach((s) => {
      const items = matProducts.filter((p) => p.style === s);
      if (items.length > 0) byMaterial[mat][s] = items;
    });
    const others = matProducts.filter((p) => !styleOrder.includes(p.style));
    if (others.length > 0) byMaterial[mat]['otro'] = others;
  });
  const unknownMat = filtered.filter((p) => !materialOrder.includes(p.description));
  if (unknownMat.length > 0) {
    byMaterial['Otros'] = {};
    styleOrder.forEach((s) => {
      const items = unknownMat.filter((p) => p.style === s);
      if (items.length > 0) byMaterial['Otros'][s] = items;
    });
    const others = unknownMat.filter((p) => !styleOrder.includes(p.style));
    if (others.length > 0) byMaterial['Otros']['otro'] = others;
  }

  const genders = ['todos', 'mujer', 'hombre', 'nino', 'unisex', 'gafas_de_sol'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center">
          <img src="/logo.png" alt="Juanita Pelaez Visión" className="w-20 h-20 rounded-full object-cover border-2 border-[#D4AF37] mx-auto mb-4 animate-pulse" />
          <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#666] text-sm">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#000', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3" style={{ background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid #1a1a1a', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover border-2 border-[#D4AF37]" />
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#D4AF37' }}>Juanita Pelaez Visión</h1>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: '#A0A0A0' }}>Catálogo de Monturas</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Gender tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {genders.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGender(g)}
              className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeGender === g ? '#D4AF37' : '#111',
                color: activeGender === g ? '#000' : '#888',
                border: activeGender === g ? '1px solid #D4AF37' : '1px solid #222',
              }}
            >
              {genderEmojis[g] || '📋'} {genderLabels[g] || g}
            </button>
          ))}
        </div>

        <p className="text-center text-xs" style={{ color: '#555' }}>
          {filtered.length} productos · {new Date().toLocaleDateString('es-CO')}
        </p>

        {/* Products grouped by MATERIAL → STYLE */}
        {Object.keys(byMaterial).length === 0 && (
          <div className="text-center py-16">
            <Glasses size={48} className="mx-auto mb-3" style={{ color: '#333' }} />
            <p style={{ color: '#666' }}>No hay productos en este catálogo</p>
          </div>
        )}

        {Object.entries(byMaterial).map(([material, styles]) => (
          <div key={material} className="mb-8">
            {/* Material header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1" style={{ background: '#D4AF37' }} />
              <h2 className="text-sm font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#D4AF37' }}>
                {material}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#555', background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.2)' }}>
                {Object.values(styles).flat().length}
              </span>
              <div className="h-px flex-1" style={{ background: '#D4AF37' }} />
            </div>

            {/* Style sub-groups */}
            {Object.entries(styles).map(([style, items]) => (
              <div key={style} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1" style={{ background: '#222' }} />
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#888' }}>
                    {styleLabels[style] || style}
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: '#444', background: '#0a0a0a' }}>
                    {items.length}
                  </span>
                  <div className="h-px flex-1" style={{ background: '#222' }} />
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-xl overflow-hidden"
                      style={{ background: '#111', border: '1px solid #1a1a1a' }}
                    >
                      <div className="relative aspect-square" style={{ background: '#0a0a0a' }}>
                        {product.image_url ? (
                          <>
                            <img
                              src={product.image_url}
                              alt={product.description}
                              className="w-full h-full object-cover"
                              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                              draggable={false}
                            />
                            {/* Watermark */}
                            {product.status !== 'disponible' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: product.status === 'agotado' ? 'rgba(0,0,0,0.5)' : product.status === 'vendido' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.3)',
                                  }}
                                />
                                <span
                                  className="relative font-black text-xl sm:text-2xl uppercase tracking-widest"
                                  style={{
                                    color: product.status === 'agotado' ? '#ef4444' : product.status === 'vendido' ? '#f97316' : '#eab308',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    transform: 'rotate(-15deg)',
                                    opacity: 0.85,
                                  }}
                                >
                                  {product.status === 'agotado' ? 'AGOTADO' : product.status === 'vendido' ? 'VENDIDO' : 'RESERVADO'}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Glasses size={32} style={{ color: '#333' }} />
                          </div>
                        )}
                        {/* Status badge */}
                        <div className="absolute bottom-2 left-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                            style={{
                              background: product.status === 'disponible' ? 'rgba(22,163,74,0.9)' : product.status === 'agotado' ? 'rgba(220,38,38,0.9)' : product.status === 'reservado' ? 'rgba(202,138,4,0.9)' : 'rgba(234,88,12,0.9)',
                              color: '#fff',
                            }}
                          >
                            {product.status}
                          </span>
                        </div>
                      </div>

                      {/* Product info */}
                      <div className="p-2.5">
                        <p className="text-xs font-medium truncate" style={{ color: '#fff' }}>
                          {product.description || 'Sin descripción'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px]" style={{ color: '#888' }}>
                            {product.code ? `#${product.code}` : (styleLabels[product.style] || '').replace(/^[^\s]+\s/, '')}
                          </span>
                          <span className="text-[10px] capitalize" style={{ color: '#555' }}>
                            {product.gender?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 mt-8" style={{ borderTop: '1px solid #1a1a1a' }}>
        <img src="/logo.png" alt="Juanita Pelaez Visión" className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37] mx-auto mb-2" />
        <p className="text-xs font-bold" style={{ color: '#D4AF37' }}>Juanita Pelaez Visión</p>
        <p className="text-[10px] mt-1" style={{ color: '#444' }}>Catálogo generado automáticamente</p>
      </footer>
    </div>
  );
}
