'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Eye, DollarSign, Package, Settings, Upload, Camera,
  Search, Filter, Plus, Edit3, Trash2, Check, X, Send,
  ChevronDown, ChevronRight, AlertCircle, Loader2, Share2,
  FileText, RefreshCw, Eye as EyeIcon, Sparkles, TrendingUp,
  Building2, Glasses, Percent, Database, Save, ArrowLeft
} from 'lucide-react';

// ==================== TYPES ====================
type TabId = 'home' | 'formula' | 'pricing' | 'catalog' | 'admin';
type AdminSubTab = 'providers' | 'lens-prices' | 'profits' | 'database';

interface Product {
  id: string;
  image_url: string | null;
  description: string;
  gender: string;
  style: string;
  status: string;
  code: string;
  created_at: string;
}

interface Provider {
  id: string;
  name: string;
  contact: string;
  phone: string;
  created_at: string;
}

interface LensPrice {
  id: string;
  provider_id: string;
  lens_type: string;
  base_price: number;
  material: string;
  coating: string;
  created_at: string;
  providers?: { name: string };
}

interface Prescription {
  od: { sph: string; cyl: string; axis: string };
  oi: { sph: string; cyl: string; axis: string };
  add: string;
}

interface AppSettings {
  profit_basico: string;
  profit_estandar: string;
  profit_premium: string;
}

// ==================== HELPERS ====================
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    disponible: 'badge-disponible',
    vendido: 'badge-vendido',
    reservado: 'badge-reservado',
  };
  return map[status] || '';
};

// ==================== MAIN APP ====================
export default function Page() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('providers');
  const [isInitialized, setIsInitialized] = useState(false);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [lensPrices, setLensPrices] = useState<LensPrice[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    profit_basico: '30',
    profit_estandar: '50',
    profit_premium: '70',
  });

  // Loading
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Formula
  const [formulaImage, setFormulaImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [prescription, setPrescription] = useState<Prescription>({
    od: { sph: '', cyl: '', axis: '' },
    oi: { sph: '', cyl: '', axis: '' },
    add: '',
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Pricing
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedLens, setSelectedLens] = useState<LensPrice | null>(null);
  const [extraCost, setExtraCost] = useState(0);
  const [profitProfile, setProfitProfile] = useState<'basico' | 'estandar' | 'premium'>('estandar');

  // Catalog
  const [genderFilter, setGenderFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadForm, setUploadForm] = useState({
    image_url: '',
    description: '',
    gender: 'unisex',
    style: 'moderno',
    status: 'disponible',
    code: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Admin
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [providerForm, setProviderForm] = useState({ name: '', contact: '', phone: '' });
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const [showLensForm, setShowLensForm] = useState(false);
  const [lensForm, setLensForm] = useState({
    provider_id: '', lens_type: '', base_price: 0, material: 'plastico', coating: 'sin_recubrimiento',
  });
  const [editingLens, setEditingLens] = useState<LensPrice | null>(null);

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ==================== DATA FETCHING ====================
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) setProviders(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchLensPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/pricing');
      if (res.ok) setLensPrices(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.profit_basico) setSettings(data as AppSettings);
      }
    } catch { /* ignore */ }
  }, []);

  const initDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/init-db', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Base de datos inicializada');
        setIsInitialized(true);
        await fetchSettings();
      } else {
        showToast(data.error || 'Error al inicializar', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
    setLoading(false);
  }, [fetchSettings, showToast]);

  // Load all data
  useEffect(() => {
    fetchProducts();
    fetchProviders();
    fetchLensPrices();
    fetchSettings();
    initDatabase();
  }, []);

  // ==================== PRESCRIPTION ANALYSIS ====================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormulaImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyzePrescription = async () => {
    if (!formulaImage) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/prescription/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: formulaImage }),
      });
      const data = await res.json();
      if (res.ok) {
        setPrescription(data.prescription);
        setRecommendations(data.recommendations || []);
        showToast('Fórmula analizada correctamente');
      } else {
        showToast(data.error || 'Error al analizar', 'error');
      }
    } catch {
      showToast('Error de conexión con Gemini', 'error');
    }
    setAnalyzing(false);
  };

  // ==================== IMAGE UPLOAD TO CLOUDINARY ====================
  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, folder: 'juanita-vision' }),
      });
      const data = await res.json();
      if (res.ok) return data.url;
      if (data.fallback) return base64; // Use base64 as fallback
      throw new Error(data.error);
    } finally {
      setUploadingImage(false);
    }
  };

  // ==================== PRODUCT CRUD ====================
  const handleProductImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    setUploadForm((prev) => ({ ...prev, image_url: url }));
  };

  const saveProduct = async () => {
    if (!uploadForm.description) {
      showToast('La descripción es requerida', 'error');
      return;
    }
    setLoading(true);
    try {
      let res: Response;
      if (editingProduct) {
        res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...uploadForm }),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadForm),
        });
      }
      if (res.ok) {
        showToast(editingProduct ? 'Producto actualizado' : 'Producto creado');
        setShowUploadForm(false);
        setEditingProduct(null);
        setUploadForm({ image_url: '', description: '', gender: 'unisex', style: 'moderno', status: 'disponible', code: '' });
        fetchProducts();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al guardar', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
    setLoading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Producto eliminado');
        fetchProducts();
      }
    } catch { /* ignore */ }
  };

  const toggleProductStatus = async (product: Product) => {
    const statuses = ['disponible', 'reservado', 'vendido'];
    const currentIdx = statuses.indexOf(product.status);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, status: nextStatus }),
      });
      if (res.ok) {
        fetchProducts();
        showToast(`Estado cambiado a: ${nextStatus}`);
      }
    } catch { /* ignore */ }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setUploadForm({
      image_url: product.image_url || '',
      description: product.description,
      gender: product.gender,
      style: product.style,
      status: product.status,
      code: product.code || '',
    });
    setShowUploadForm(true);
  };

  // ==================== PROVIDER CRUD ====================
  const saveProvider = async () => {
    if (!providerForm.name) {
      showToast('El nombre es requerido', 'error');
      return;
    }
    setLoading(true);
    try {
      let res: Response;
      if (editingProvider) {
        res = await fetch('/api/providers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProvider.id, ...providerForm }),
        });
      } else {
        res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(providerForm),
        });
      }
      if (res.ok) {
        showToast(editingProvider ? 'Proveedor actualizado' : 'Proveedor creado');
        setShowProviderForm(false);
        setEditingProvider(null);
        setProviderForm({ name: '', contact: '', phone: '' });
        fetchProviders();
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
    setLoading(false);
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      const res = await fetch(`/api/providers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Proveedor eliminado');
        fetchProviders();
      }
    } catch { /* ignore */ }
  };

  // ==================== LENS PRICE CRUD ====================
  const saveLensPrice = async () => {
    if (!lensForm.lens_type || !lensForm.provider_id) {
      showToast('Tipo de lente y proveedor son requeridos', 'error');
      return;
    }
    setLoading(true);
    try {
      let res: Response;
      if (editingLens) {
        res = await fetch('/api/pricing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLens.id, ...lensForm }),
        });
      } else {
        res = await fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lensForm),
        });
      }
      if (res.ok) {
        showToast(editingLens ? 'Precio actualizado' : 'Precio creado');
        setShowLensForm(false);
        setEditingLens(null);
        setLensForm({ provider_id: '', lens_type: '', base_price: 0, material: 'plastico', coating: 'sin_recubrimiento' });
        fetchLensPrices();
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
    setLoading(false);
  };

  const deleteLensPrice = async (id: string) => {
    if (!confirm('¿Eliminar este precio?')) return;
    try {
      const res = await fetch(`/api/pricing?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Precio eliminado');
        fetchLensPrices();
      }
    } catch { /* ignore */ }
  };

  // ==================== SETTINGS ====================
  const saveProfitMargins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast('Márgenes actualizados');
        fetchSettings();
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
    setLoading(false);
  };

  // ==================== PRICING CALCULATION ====================
  const pricingCalc = (() => {
    const base = selectedLens?.base_price || 0;
    const cost = base + extraCost;
    const marginPct = parseFloat(settings[`profit_${profitProfile}`] as keyof AppSettings) || 0;
    const margin = cost * (marginPct / 100);
    const finalPrice = cost + margin;
    return { base, extraCost, cost, marginPct, margin, finalPrice };
  })();

  // ==================== WHATSAPP SHARE ====================
  const shareProduct = (product: Product) => {
    const text = `👓 Juanita Pelaez Visión\n\n${product.description}\nCódigo: ${product.code || 'N/A'}\nEstado: ${product.status}\n\n¡Visítanos!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareCatalog = () => {
    const url = window.location.href;
    const text = `👓 Juanita Pelaez Visión\nMira nuestro catálogo: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ==================== PDF EXPORT ====================
  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      showToast('Generando PDF...');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Background black
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(18);
      pdf.text('Juanita Pelaez Visión', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('Catálogo de Monturas', pageWidth / 2, 22, { align: 'center' });

      // Gold line
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.5);
      pdf.line(20, 25, pageWidth - 20, 25);

      const filtered = products.filter((p) => {
        if (genderFilter !== 'todos' && p.gender !== genderFilter) return false;
        if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
        return true;
      });

      let y = 32;
      let count = 0;

      for (const product of filtered) {
        if (count > 0 && count % 4 === 0) {
          pdf.addPage();
          pdf.setFillColor(0, 0, 0);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          y = 15;
        }

        const boxX = count % 2 === 0 ? 15 : pageWidth / 2 + 5;
        const boxW = pageWidth / 2 - 20;
        const boxH = 55;

        // Card background
        pdf.setFillColor(17, 17, 17);
        pdf.roundedRect(boxX, y, boxW, boxH, 3, 3, 'F');

        // Border
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(boxX, y, boxW, boxH, 3, 3, 'S');

        // Product info
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        const descLines = pdf.splitTextToSize(product.description || 'Sin descripción', boxW - 10);
        pdf.text(descLines.slice(0, 3), boxX + 5, y + 10);

        // Code
        pdf.setTextColor(160, 160, 160);
        pdf.setFontSize(7);
        pdf.text(`Código: ${product.code || 'N/A'}`, boxX + 5, y + boxH - 12);

        // Status
        if (product.status === 'disponible') pdf.setTextColor(110, 231, 183);
        else if (product.status === 'vendido') pdf.setTextColor(252, 165, 165);
        else pdf.setTextColor(252, 211, 77);
        pdf.text(product.status.toUpperCase(), boxX + 5, y + boxH - 5);

        if (count % 2 === 1) y += boxH + 8;
        count++;
      }

      if (count === 0) {
        pdf.setTextColor(160, 160, 160);
        pdf.setFontSize(12);
        pdf.text('No hay productos para exportar', pageWidth / 2, pageHeight / 2, { align: 'center' });
      }

      pdf.save('juanita-pelaez-vision-catalogo.pdf');
      showToast('PDF generado correctamente');
    } catch (err) {
      console.error(err);
      showToast('Error al generar PDF', 'error');
    }
  };

  // ==================== NAV TABS ====================
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Inicio', icon: <Home size={20} /> },
    { id: 'formula', label: 'Fórmula', icon: <Eye size={20} /> },
    { id: 'pricing', label: 'Cotizar', icon: <DollarSign size={20} /> },
    { id: 'catalog', label: 'Catálogo', icon: <Package size={20} /> },
    { id: 'admin', label: 'Admin', icon: <Settings size={20} /> },
  ];

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-green-900/90 text-green-200 border border-green-700' : 'bg-red-900/90 text-red-200 border border-red-700'
            }`}
          >
            {toast.type === 'success' ? <Check size={16} className="inline mr-2" /> : <AlertCircle size={16} className="inline mr-2" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid #1a1a1a', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover border-2 border-[#D4AF37]" />
          <div>
            <h1 className="text-gold-gradient font-bold text-base leading-tight">Juanita Pelaez</h1>
            <p className="text-[10px] text-[#A0A0A0] tracking-widest uppercase">Visión Profesional</p>
          </div>
        </div>
        <button onClick={shareCatalog} className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
          <Share2 size={18} className="text-[#D4AF37]" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <AnimatePresence mode="wait">
          {/* ==================== HOME ==================== */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Productos', value: products.length, icon: <Glasses size={20} /> },
                  { label: 'Proveedores', value: providers.length, icon: <Building2 size={20} /> },
                  { label: 'Precios', value: lensPrices.length, icon: <DollarSign size={20} /> },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl p-3 text-center card-hover" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <div className="text-[#D4AF37] mb-1 flex justify-center">{stat.icon}</div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-[#666]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-[#A0A0A0] uppercase tracking-wider">Acciones Rápidas</h2>
                <div className="grid gap-3">
                  <button onClick={() => setActiveTab('formula')} className="flex items-center gap-4 p-4 rounded-xl card-hover text-left" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><Camera size={22} className="text-[#D4AF37]" /></div>
                    <div>
                      <p className="font-semibold text-white">Analizar Fórmula</p>
                      <p className="text-xs text-[#666]">Escanea y analiza prescripciones ópticas</p>
                    </div>
                    <ChevronRight size={18} className="text-[#444] ml-auto" />
                  </button>

                  <button onClick={() => { setActiveTab('catalog'); setShowUploadForm(true); }} className="flex items-center gap-4 p-4 rounded-xl card-hover text-left" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><Upload size={22} className="text-[#D4AF37]" /></div>
                    <div>
                      <p className="font-semibold text-white">Subir Montura</p>
                      <p className="text-xs text-[#666]">Agrega nuevos productos al catálogo</p>
                    </div>
                    <ChevronRight size={18} className="text-[#444] ml-auto" />
                  </button>

                  <button onClick={() => setActiveTab('pricing')} className="flex items-center gap-4 p-4 rounded-xl card-hover text-left" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><TrendingUp size={22} className="text-[#D4AF37]" /></div>
                    <div>
                      <p className="font-semibold text-white">Cotizar Lentes</p>
                      <p className="text-xs text-[#666]">Calcula precios con márgenes de ganancia</p>
                    </div>
                    <ChevronRight size={18} className="text-[#444] ml-auto" />
                  </button>

                  <button onClick={() => setActiveTab('catalog')} className="flex items-center gap-4 p-4 rounded-xl card-hover text-left" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center"><Package size={22} className="text-[#D4AF37]" /></div>
                    <div>
                      <p className="font-semibold text-white">Ver Catálogo</p>
                      <p className="text-xs text-[#666]">Explora todos los productos ({products.length})</p>
                    </div>
                    <ChevronRight size={18} className="text-[#444] ml-auto" />
                  </button>
                </div>
              </div>

              {!isInitialized && (
                <button onClick={initDatabase} disabled={loading} className="w-full btn-gold flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                  {loading ? 'Inicializando...' : 'Inicializar Base de Datos'}
                </button>
              )}
            </motion.div>
          )}

          {/* ==================== FORMULA ==================== */}
          {activeTab === 'formula' && (
            <motion.div key="formula" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="text-center mb-2">
                <Sparkles size={32} className="text-[#D4AF37] mx-auto mb-2" />
                <h2 className="text-lg font-bold text-white">Analizador de Fórmulas</h2>
                <p className="text-xs text-[#666]">Sube una imagen de la fórmula óptica</p>
              </div>

              {/* Image Upload */}
              <label className="upload-area block">
                {formulaImage ? (
                  <div className="relative">
                    <img src={formulaImage} alt="Fórmula" className="max-h-64 mx-auto rounded-lg" />
                    <button onClick={(e) => { e.preventDefault(); setFormulaImage(null); setPrescription({ od: { sph: '', cyl: '', axis: '' }, oi: { sph: '', cyl: '', axis: '' }, add: '' }); setRecommendations([]); }} className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera size={40} className="text-[#444] mx-auto" />
                    <p className="text-sm text-[#666]">Toca para capturar o seleccionar imagen</p>
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Analyze Button */}
              {formulaImage && (
                <button onClick={analyzePrescription} disabled={analyzing} className="w-full btn-gold flex items-center justify-center gap-2">
                  {analyzing ? <Loader2 size={16} className="animate-spin" /> : <EyeIcon size={16} />}
                  {analyzing ? 'Analizando con IA...' : 'Analizar Fórmula'}
                </button>
              )}

              {/* Prescription Result */}
              {(prescription.od.sph || prescription.oi.sph) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Datos Extraídos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* OD */}
                    <div className="rounded-xl p-3 space-y-2" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <p className="text-xs font-bold text-[#D4AF37] text-center">OD (Ojo Derecho)</p>
                      {(['sph', 'cyl', 'axis'] as const).map((field) => (
                        <div key={field}>
                          <label className="text-[10px] text-[#666] uppercase">{field}</label>
                          <input className="premium-input text-sm" value={prescription.od[field]} onChange={(e) => setPrescription((p) => ({ ...p, od: { ...p.od, [field]: e.target.value } }))} />
                        </div>
                      ))}
                    </div>
                    {/* OI */}
                    <div className="rounded-xl p-3 space-y-2" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <p className="text-xs font-bold text-[#D4AF37] text-center">OI (Ojo Izquierdo)</p>
                      {(['sph', 'cyl', 'axis'] as const).map((field) => (
                        <div key={field}>
                          <label className="text-[10px] text-[#666] uppercase">{field}</label>
                          <input className="premium-input text-sm" value={prescription.oi[field]} onChange={(e) => setPrescription((p) => ({ ...p, oi: { ...p.oi, [field]: e.target.value } }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* ADD */}
                  <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <label className="text-xs text-[#666] uppercase">ADD (Adición)</label>
                    <input className="premium-input text-sm mt-1" value={prescription.add} onChange={(e) => setPrescription((p) => ({ ...p, add: e.target.value }))} placeholder="Ej: +2.50" />
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl p-4 gold-glow" style={{ background: 'linear-gradient(135deg, #1a1505 0%, #111 100%)', border: '1px solid #D4AF37/30' }}>
                      <p className="text-sm font-bold text-[#D4AF37] mb-2">✨ Recomendación Inteligente</p>
                      <p className="text-sm text-white">{recommendations.join(' con ')}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ==================== PRICING ==================== */}
          {activeTab === 'pricing' && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="text-center mb-2">
                <TrendingUp size={32} className="text-[#D4AF37] mx-auto mb-2" />
                <h2 className="text-lg font-bold text-white">Cotizador de Lentes</h2>
                <p className="text-xs text-[#666]">Calcula precios con márgenes de ganancia</p>
              </div>

              {/* Provider */}
              <div>
                <label className="text-xs text-[#666] uppercase mb-1 block">Proveedor</label>
                <select className="premium-input" value={selectedProvider} onChange={(e) => { setSelectedProvider(e.target.value); setSelectedLens(null); }}>
                  <option value="">Seleccionar proveedor...</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Lens Type */}
              <div>
                <label className="text-xs text-[#666] uppercase mb-1 block">Tipo de Lente</label>
                <select className="premium-input" value={selectedLens?.id || ''} onChange={(e) => {
                  const lens = lensPrices.find((l) => l.id === e.target.value);
                  setSelectedLens(lens || null);
                }} disabled={!selectedProvider}>
                  <option value="">Seleccionar lente...</option>
                  {lensPrices.filter((l) => l.provider_id === selectedProvider).map((l) => (
                    <option key={l.id} value={l.id}>{l.lens_type} - {formatCurrency(l.base_price)} ({l.material})</option>
                  ))}
                </select>
              </div>

              {/* Extras */}
              <div>
                <label className="text-xs text-[#666] uppercase mb-1 block">Costo de Extras (recubrimientos, etc.)</label>
                <input type="number" className="premium-input" value={extraCost} onChange={(e) => setExtraCost(parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>

              {/* Profit Profile */}
              <div>
                <label className="text-xs text-[#666] uppercase mb-2 block">Perfil de Ganancia</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['basico', 'estandar', 'premium'] as const).map((profile) => (
                    <button key={profile} onClick={() => setProfitProfile(profile)} className={`p-3 rounded-xl text-center transition-all ${profitProfile === profile ? 'gold-glow border-[#D4AF37] bg-[#D4AF37]/10' : ''}`} style={{ background: '#111', border: `1px solid ${profitProfile === profile ? '#D4AF37' : '#1a1a1a'}` }}>
                      <p className="text-xs font-bold text-[#D4AF37] capitalize">{profile}</p>
                      <p className="text-lg font-bold text-white">{settings[`profit_${profile}` as keyof AppSettings]}%</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Desglose de Precio</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Precio base</span><span>{formatCurrency(pricingCalc.base)}</span></div>
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Extras</span><span>{formatCurrency(pricingCalc.extraCost)}</span></div>
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Subtotal (costo)</span><span className="text-white font-medium">{formatCurrency(pricingCalc.cost)}</span></div>
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Margen ({pricingCalc.marginPct}%)</span><span className="text-green-400">{formatCurrency(pricingCalc.margin)}</span></div>
                  <div className="h-px bg-[#222]" />
                  <div className="flex justify-between items-center">
                    <span className="text-[#D4AF37] font-bold">PRECIO FINAL</span>
                    <span className="text-xl font-bold text-gold-gradient">{formatCurrency(pricingCalc.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Share Quote */}
              {pricingCalc.finalPrice > 0 && (
                <button onClick={() => {
                  const text = `👓 Juanita Pelaez Visión\n\nCotización:\nLente: ${selectedLens?.lens_type || 'N/A'}\nCosto: ${formatCurrency(pricingCalc.cost)}\nMargen: ${pricingCalc.marginPct}%\n\n💰 PRECIO: ${formatCurrency(pricingCalc.finalPrice)}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }} className="w-full btn-gold flex items-center justify-center gap-2">
                  <Send size={16} /> Compartir Cotización por WhatsApp
                </button>
              )}
            </motion.div>
          )}

          {/* ==================== CATALOG ==================== */}
          {activeTab === 'catalog' && (
            <motion.div key="catalog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Catálogo</h2>
                <div className="flex gap-2">
                  <button onClick={exportPDF} className="p-2 rounded-lg bg-[#111] border border-[#222] text-[#D4AF37] hover:bg-[#1a1a1a] transition-colors" title="Exportar PDF">
                    <FileText size={18} />
                  </button>
                  <button onClick={() => { setEditingProduct(null); setUploadForm({ image_url: '', description: '', gender: 'unisex', style: 'moderno', status: 'disponible', code: '' }); setShowUploadForm(true); }} className="btn-gold flex items-center gap-1 text-sm px-3 py-2">
                    <Plus size={16} /> Subir
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select className="premium-input text-xs flex-1" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="hombre">Hombre</option>
                  <option value="mujer">Mujer</option>
                  <option value="unisex">Unisex</option>
                </select>
                <select className="premium-input text-xs flex-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="todos">Todos estados</option>
                  <option value="disponible">Disponible</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>

              {/* Upload Form Modal */}
              <AnimatePresence>
                {showUploadForm && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowUploadForm(false)}>
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-5 space-y-4" style={{ background: '#111', border: '1px solid #222' }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-[#D4AF37]">{editingProduct ? 'Editar Producto' : 'Subir Producto'}</h3>
                        <button onClick={() => setShowUploadForm(false)} className="text-[#666] hover:text-white"><X size={20} /></button>
                      </div>

                      {/* Image */}
                      <label className="upload-area block">
                        {uploadForm.image_url ? (
                          <img src={uploadForm.image_url} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                        ) : (
                          <div className="space-y-1">
                            <Upload size={24} className="text-[#444] mx-auto" />
                            <p className="text-xs text-[#666]">{uploadingImage ? 'Subiendo...' : 'Toca para subir imagen'}</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleProductImageSelect} className="hidden" />
                      </label>

                      <input className="premium-input text-sm" placeholder="Descripción *" value={uploadForm.description} onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))} />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <select className="premium-input text-sm" value={uploadForm.gender} onChange={(e) => setUploadForm((f) => ({ ...f, gender: e.target.value }))}>
                          <option value="unisex">Unisex</option>
                          <option value="hombre">Hombre</option>
                          <option value="mujer">Mujer</option>
                        </select>
                        <select className="premium-input text-sm" value={uploadForm.style} onChange={(e) => setUploadForm((f) => ({ ...f, style: e.target.value }))}>
                          <option value="moderno">Moderno</option>
                          <option value="clasico">Clásico</option>
                          <option value="deportivo">Deportivo</option>
                          <option value="vintage">Vintage</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <select className="premium-input text-sm" value={uploadForm.status} onChange={(e) => setUploadForm((f) => ({ ...f, status: e.target.value }))}>
                          <option value="disponible">Disponible</option>
                          <option value="reservado">Reservado</option>
                          <option value="vendido">Vendido</option>
                        </select>
                        <input className="premium-input text-sm" placeholder="Código" value={uploadForm.code} onChange={(e) => setUploadForm((f) => ({ ...f, code: e.target.value }))} />
                      </div>

                      <button onClick={saveProduct} disabled={loading} className="w-full btn-gold flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {loading ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products
                  .filter((p) => {
                    if (genderFilter !== 'todos' && p.gender !== genderFilter) return false;
                    if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
                    return true;
                  })
                  .map((product) => (
                    <motion.div key={product.id} whileTap={{ scale: 0.98 }} className="rounded-xl overflow-hidden card-hover" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div className="relative aspect-square bg-[#0a0a0a]">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.description} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Glasses size={40} className="text-[#333]" /></div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button onClick={() => startEditProduct(product)} className="p-1.5 rounded-full bg-black/70 text-white hover:text-[#D4AF37] transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => deleteProduct(product.id)} className="p-1.5 rounded-full bg-black/70 text-white hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                        <button onClick={() => toggleProductStatus(product)} className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(product.status)}`}>
                          {product.status}
                        </button>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs text-white truncate">{product.description || 'Sin descripción'}</p>
                        {product.code && <p className="text-[10px] text-[#666] mt-0.5">#{product.code}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-[#888] capitalize">{product.gender}</span>
                          <button onClick={() => shareProduct(product)} className="p-1 rounded text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"><Share2 size={12} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package size={48} className="text-[#333] mx-auto mb-3" />
                  <p className="text-[#666]">No hay productos en el catálogo</p>
                  <button onClick={() => setShowUploadForm(true)} className="mt-4 btn-gold text-sm px-4 py-2">Subir Primer Producto</button>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== ADMIN ==================== */}
          {activeTab === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={20} className="text-[#D4AF37]" /> Panel de Administración</h2>

              {/* Admin Sub-tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {([
                  { id: 'providers' as const, label: 'Proveedores', icon: <Building2 size={14} /> },
                  { id: 'lens-prices' as const, label: 'Precios', icon: <DollarSign size={14} /> },
                  { id: 'profits' as const, label: 'Márgenes', icon: <Percent size={14} /> },
                  { id: 'database' as const, label: 'Base Datos', icon: <Database size={14} /> },
                ]).map((tab) => (
                  <button key={tab.id} onClick={() => setAdminSubTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${adminSubTab === tab.id ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-[#111] text-[#888] border border-[#1a1a1a]'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Providers Tab */}
              {adminSubTab === 'providers' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#A0A0A0]">{providers.length} proveedores</p>
                    <button onClick={() => { setEditingProvider(null); setProviderForm({ name: '', contact: '', phone: '' }); setShowProviderForm(true); }} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1"><Plus size={14} /> Nuevo</button>
                  </div>

                  {showProviderForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #222' }}>
                      <input className="premium-input text-sm" placeholder="Nombre del proveedor *" value={providerForm.name} onChange={(e) => setProviderForm((f) => ({ ...f, name: e.target.value }))} />
                      <input className="premium-input text-sm" placeholder="Contacto" value={providerForm.contact} onChange={(e) => setProviderForm((f) => ({ ...f, contact: e.target.value }))} />
                      <input className="premium-input text-sm" placeholder="Teléfono" value={providerForm.phone} onChange={(e) => setProviderForm((f) => ({ ...f, phone: e.target.value }))} />
                      <div className="flex gap-2">
                        <button onClick={saveProvider} disabled={loading} className="flex-1 btn-gold text-sm flex items-center justify-center gap-1">{loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar</button>
                        <button onClick={() => setShowProviderForm(false)} className="px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] text-[#888]">Cancelar</button>
                      </div>
                    </motion.div>
                  )}

                  {providers.map((provider) => (
                    <div key={provider.id} className="rounded-xl p-3 flex items-center justify-between card-hover" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div>
                        <p className="text-sm font-medium text-white">{provider.name}</p>
                        <p className="text-xs text-[#666]">{provider.contact || ''} {provider.phone ? `• ${provider.phone}` : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingProvider(provider); setProviderForm({ name: provider.name, contact: provider.contact || '', phone: provider.phone || '' }); setShowProviderForm(true); }} className="p-1.5 rounded-lg text-[#666] hover:text-[#D4AF37] transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => deleteProvider(provider.id)} className="p-1.5 rounded-lg text-[#666] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}

                  {providers.length === 0 && <p className="text-center text-[#666] text-sm py-6">No hay proveedores registrados</p>}
                </div>
              )}

              {/* Lens Prices Tab */}
              {adminSubTab === 'lens-prices' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#A0A0A0]">{lensPrices.length} precios registrados</p>
                    <button onClick={() => { setEditingLens(null); setLensForm({ provider_id: '', lens_type: '', base_price: 0, material: 'plastico', coating: 'sin_recubrimiento' }); setShowLensForm(true); }} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1"><Plus size={14} /> Nuevo</button>
                  </div>

                  {showLensForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #222' }}>
                      <select className="premium-input text-sm" value={lensForm.provider_id} onChange={(e) => setLensForm((f) => ({ ...f, provider_id: e.target.value }))}>
                        <option value="">Seleccionar proveedor...</option>
                        {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="premium-input text-sm" placeholder="Tipo de lente (ej: Progresivo, Bifocal...)" value={lensForm.lens_type} onChange={(e) => setLensForm((f) => ({ ...f, lens_type: e.target.value }))} />
                      <input type="number" className="premium-input text-sm" placeholder="Precio base" value={lensForm.base_price || ''} onChange={(e) => setLensForm((f) => ({ ...f, base_price: parseFloat(e.target.value) || 0 }))} />
                      <select className="premium-input text-sm" value={lensForm.material} onChange={(e) => setLensForm((f) => ({ ...f, material: e.target.value }))}>
                        <option value="plastico">Plástico</option>
                        <option value="policarbonato">Policarbonato</option>
                        <option value="cristal">Cristal</option>
                        <option value="alto_indice">Alto Índice</option>
                        <option value="trivex">Trivex</option>
                      </select>
                      <select className="premium-input text-sm" value={lensForm.coating} onChange={(e) => setLensForm((f) => ({ ...f, coating: e.target.value }))}>
                        <option value="sin_recubrimiento">Sin recubrimiento</option>
                        <option value="antirreflejo">Antirreflejo</option>
                        <option value="fotocromatico">Fotocromático</option>
                        <option value="blue_control">Blue Control</option>
                        <option value="antirreflejo_premium">Antirreflejo Premium</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={saveLensPrice} disabled={loading} className="flex-1 btn-gold text-sm flex items-center justify-center gap-1">{loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar</button>
                        <button onClick={() => setShowLensForm(false)} className="px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] text-[#888]">Cancelar</button>
                      </div>
                    </motion.div>
                  )}

                  {lensPrices.map((lens) => (
                    <div key={lens.id} className="rounded-xl p-3 card-hover" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{lens.lens_type}</p>
                          <p className="text-xs text-[#666]">{(lens as LensPrice & { providers?: { name: string } }).providers?.name || 'Proveedor'} • {lens.material} • {lens.coating.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#D4AF37]">{formatCurrency(lens.base_price)}</span>
                          <button onClick={() => { setEditingLens(lens); setLensForm({ provider_id: lens.provider_id, lens_type: lens.lens_type, base_price: lens.base_price, material: lens.material, coating: lens.coating }); setShowLensForm(true); }} className="p-1.5 rounded-lg text-[#666] hover:text-[#D4AF37]"><Edit3 size={14} /></button>
                          <button onClick={() => deleteLensPrice(lens.id)} className="p-1.5 rounded-lg text-[#666] hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {lensPrices.length === 0 && <p className="text-center text-[#666] text-sm py-6">No hay precios registrados</p>}
                </div>
              )}

              {/* Profits Tab */}
              {adminSubTab === 'profits' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#A0A0A0]">Configura los porcentajes de ganancia para cada perfil</p>
                  {(['basico', 'estandar', 'premium'] as const).map((profile) => (
                    <div key={profile} className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <label className="text-sm font-medium text-white capitalize block mb-2">Perfil {profile}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          className="premium-input text-lg font-bold text-[#D4AF37] text-center flex-1"
                          value={settings[`profit_${profile}` as keyof AppSettings]}
                          onChange={(e) => setSettings((s) => ({ ...s, [`profit_${profile}`]: e.target.value }))}
                          min="0"
                          max="100"
                        />
                        <span className="text-2xl text-[#444]">%</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={saveProfitMargins} disabled={loading} className="w-full btn-gold flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar Márgenes
                  </button>
                </div>
              )}

              {/* Database Tab */}
              {adminSubTab === 'database' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <h3 className="text-sm font-semibold text-[#D4AF37]">Información de la Base de Datos</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg p-3 bg-[#0a0a0a] text-center">
                        <p className="text-xl font-bold text-white">{products.length}</p>
                        <p className="text-xs text-[#666]">Productos</p>
                      </div>
                      <div className="rounded-lg p-3 bg-[#0a0a0a] text-center">
                        <p className="text-xl font-bold text-white">{providers.length}</p>
                        <p className="text-xs text-[#666]">Proveedores</p>
                      </div>
                      <div className="rounded-lg p-3 bg-[#0a0a0a] text-center">
                        <p className="text-xl font-bold text-white">{lensPrices.length}</p>
                        <p className="text-xs text-[#666]">Precios de Lente</p>
                      </div>
                      <div className="rounded-lg p-3 bg-[#0a0a0a] text-center">
                        <p className="text-xl font-bold text-[#D4AF37]">{isInitialized ? '✓' : '...'}</p>
                        <p className="text-xs text-[#666]">Estado</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={initDatabase} disabled={loading} className="w-full py-3 rounded-xl bg-[#111] border border-[#D4AF37]/30 text-[#D4AF37] font-medium flex items-center justify-center gap-2 hover:bg-[#D4AF37]/10 transition-colors">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Reinicializar Base de Datos
                  </button>

                  <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <h3 className="text-sm font-semibold text-[#D4AF37] mb-2">SQL para Supabase</h3>
                    <p className="text-xs text-[#666] mb-2">Ejecuta esto en el SQL Editor de Supabase:</p>
                    <pre className="text-[10px] text-[#888] bg-[#0a0a0a] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT, description TEXT,
  gender TEXT DEFAULT 'unisex',
  style TEXT DEFAULT 'moderno',
  status TEXT DEFAULT 'disponible',
  code TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, contact TEXT, phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lens_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES providers(id),
  lens_type TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  material TEXT DEFAULT 'plastico',
  coating TEXT DEFAULT 'sin_recubrimiento',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL, value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  od_sph TEXT, od_cyl TEXT, od_axis TEXT,
  oi_sph TEXT, oi_cyl TEXT, oi_axis TEXT,
  add TEXT, recommendation TEXT, raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS permissive
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_products" ON products FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_providers" ON providers FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE lens_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_lens" ON lens_prices FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_settings" ON settings FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_prescriptions" ON prescriptions FOR ALL USING (true) WITH CHECK (true);

-- Default settings
INSERT INTO settings (key, value) VALUES
('profit_basico', '30'),
('profit_estandar', '50'),
('profit_premium', '70')
ON CONFLICT (key) DO NOTHING;`}
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-1 pt-1" style={{ background: 'rgba(0,0,0,0.95)', borderTop: '1px solid #1a1a1a', backdropFilter: 'blur(10px)' }}>
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'catalog') { setShowUploadForm(false); setEditingProduct(null); } }}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                activeTab === tab.id ? 'text-[#D4AF37]' : 'text-[#555] hover:text-[#888]'
              }`}
            >
              <AnimatePresence mode="wait">
                {activeTab === tab.id ? (
                  <motion.div key="active" initial={{ scale: 0.8, y: 5 }} animate={{ scale: 1, y: 0 }} className="flex flex-col items-center">
                    <div className="w-1 h-1 rounded-full bg-[#D4AF37] mb-1" />
                    {tab.icon}
                    <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
                  </motion.div>
                ) : (
                  <motion.div key="inactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                    {tab.icon}
                    <span className="text-[10px] mt-0.5">{tab.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
