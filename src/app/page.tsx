'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Eye, DollarSign, Package, Upload, Camera,
  Plus, Edit3, Trash2, Check, X, Send,
  ChevronRight, AlertCircle, Loader2, Share2,
  FileText, RefreshCw, Eye as EyeIcon, Sparkles, TrendingUp,
  Building2, Glasses, Database, Save,
  Settings, LogOut, Download, UserPlus, Users
} from 'lucide-react';

// ==================== TYPES ====================
type TabId = 'home' | 'formula' | 'pricing' | 'catalog' | 'proveedores' | 'soporte';
type ProveedorSubTab = 'Reelens' | 'Cerlents';
type SoporteSubTab = 'backup' | 'users' | 'proveedores' | 'database';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
}

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
  contact?: string;
  phone?: string;
  created_at: string;
}

// Adaptado al esquema REAL de Supabase
interface LensPrice {
  id: string;
  provider_id: string;
  lens_type: string;
  quality: string;        // basico | premium
  base_price: number;
  blue_filter: number;    // precio del filtro azul
  photochromic: number;   // precio fotocromático
  antireflective: number; // precio antirreflejo
  created_at: string;
  providers?: { name: string };
}

interface Prescription {
  od: { sph: string; cyl: string; axis: string; add: string };
  oi: { sph: string; cyl: string; axis: string; add: string };
}

// Adaptado: settings es array de {id, name, profit_margin}
interface SettingItem {
  id: string;
  name: string;
  profit_margin: number;
  created_at: string;
}

interface ProviderLens {
  id: number;
  provider: string;
  categoria: string;
  material: string;
  tipo_lente: string | null;
  esferas: string | null;
  cilindro: string | null;
  adicion: string | null;
  precio_par: number;
  created_at: string;
}

interface CerlensPrice {
  id: number;
  grupo: string;
  material: string;
  prog_prime: number | null;
  prog_ventrix: number | null;
  prog_advance: number | null;
  prog_confort: number | null;
  prog_practice_20: number | null;
  prog_practice: number | null;
  bif_invisible: number | null;
  bif_bfree: number | null;
  ocu_ocupacional: number | null;
  mono_simple: number | null;
  mono_relax: number | null;
  mono_kids: number | null;
  created_at: string;
}

// ==================== HELPERS ====================
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    disponible: 'badge-disponible',
    agotado: 'badge-agotado',
    reservado: 'badge-reservado',
    vendido: 'badge-vendido',
  };
  return map[status] || '';
};

// ==================== CERLENS EDIT FORM ====================
function CerlensEditForm({ item, onSave, onClose, formatCurrency }: {
  item: CerlensPrice;
  onSave: (id: number, field: keyof CerlensPrice, value: number | null) => Promise<void>;
  onClose: () => void;
  formatCurrency: (n: number) => string;
}) {
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const priceFields: { key: keyof CerlensPrice; label: string; group: string }[] = [
    { key: 'prog_prime', label: 'Prime Max', group: 'PROGRESIVOS' },
    { key: 'prog_ventrix', label: 'Ventrix Max', group: 'PROGRESIVOS' },
    { key: 'prog_advance', label: 'Advance Max', group: 'PROGRESIVOS' },
    { key: 'prog_confort', label: 'Confort Max', group: 'PROGRESIVOS' },
    { key: 'prog_practice_20', label: 'Practice 2.0', group: 'PROGRESIVOS' },
    { key: 'prog_practice', label: 'Practice', group: 'PROGRESIVOS' },
    { key: 'bif_invisible', label: 'Invisible', group: 'BIFOCALES' },
    { key: 'bif_bfree', label: 'B-Free', group: 'BIFOCALES' },
    { key: 'ocu_ocupacional', label: 'Ocupacional', group: 'OCUPACIONAL' },
    { key: 'mono_simple', label: 'Simple', group: 'MONOFOCALES' },
    { key: 'mono_relax', label: 'Relax', group: 'MONOFOCALES' },
    { key: 'mono_kids', label: 'Kids', group: 'MONOFOCALES' },
  ];

  const groupColors: Record<string, string> = { 'PROGRESIVOS': '#F59E0B', 'BIFOCALES': '#22C55E', 'OCUPACIONAL': '#8B5CF6', 'MONOFOCALES': '#3B82F6' };
  const groups = [...new Set(priceFields.map(f => f.group))];

  const handleChange = (key: string, value: string) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: keyof CerlensPrice) => {
    const raw = editValues[key];
    const numVal = raw === '' || raw === '-' ? null : Number(raw.replace(/[^0-9]/g, ''));
    setSaving(key);
    await onSave(item.id, key, numVal);
    setSaving(null);
    setEditValues(prev => { const n = { ...prev }; delete n[key as string]; return n; });
  };

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const fields = priceFields.filter(f => f.group === group);
        const gColor = groupColors[group];
        return (
          <div key={group}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: gColor }}>{group}</p>
            <div className="grid grid-cols-2 gap-2">
              {fields.map(f => {
                const val = f.key in editValues ? editValues[f.key] : (item[f.key] !== null ? String(item[f.key]) : '');
                const isEditing = f.key in editValues;
                return (
                  <div key={f.key} className="rounded-lg p-2" style={{ background: '#0a0a0a', border: `1px solid ${gColor}15` }}>
                    <label className="text-[10px] text-[#666] mb-1 block">{f.label}</label>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <input
                          className="premium-input text-xs flex-1"
                          type="number"
                          value={val}
                          onChange={(e) => handleChange(f.key, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSave(f.key)}
                          autoFocus
                        />
                        <button onClick={() => handleSave(f.key)} className="p-1 rounded bg-green-600/20 hover:bg-green-600/30" title="Guardar">
                          <Check size={12} className="text-green-400" />
                        </button>
                        <button onClick={() => handleChange(f.key, '')} className="p-1 rounded bg-red-600/20 hover:bg-red-600/30" title="Vaciar">
                          <X size={12} className="text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleChange(f.key, val)}
                        className="text-xs font-bold text-left cursor-pointer hover:underline py-0.5"
                        style={{ color: val ? gColor : '#333' }}
                      >
                        {val ? formatCurrency(Number(val)) : '— (vacío)'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <button onClick={onClose} className="w-full py-2 rounded-lg text-sm text-[#888] bg-[#1a1a1a] hover:bg-[#222] transition-colors mt-2">
        Cerrar
      </button>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function Page() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [soporteSubTab, setSoporteSubTab] = useState<SoporteSubTab>('backup');
  const [isInitialized, setIsInitialized] = useState(false);

  // Auth
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Update notification
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [lensPrices, setLensPrices] = useState<LensPrice[]>([]);
  const [settingsList, setSettingsList] = useState<SettingItem[]>([]);

  // Derived settings
  const getMargin = useCallback((name: string): number => {
    const item = settingsList.find((s) => s.name.toLowerCase() === name.toLowerCase());
    return item ? item.profit_margin : 1;
  }, [settingsList]);

  // Loading
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Formula
  const [formulaImage, setFormulaImage] = useState<string | null>(null);
  const [formulaMode, setFormulaMode] = useState<'none' | 'photo' | 'gallery' | 'manual'>('none');
  const [analyzing, setAnalyzing] = useState(false);
  const [showFormulaFields, setShowFormulaFields] = useState(false);
  const [prescription, setPrescription] = useState<Prescription>({
    od: { sph: '', cyl: '', axis: '', add: '' },
    oi: { sph: '', cyl: '', axis: '', add: '' },
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Pricing - adaptado al esquema real con extras individuales
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedLens, setSelectedLens] = useState<LensPrice | null>(null);
  const [addBlueFilter, setAddBlueFilter] = useState(false);
  const [addPhotochromic, setAddPhotochromic] = useState(false);
  const [addAntireflective, setAddAntireflective] = useState(false);
  const [profitProfile, setProfitProfile] = useState<'Básico' | 'Estándar' | 'Premium'>('Estándar');

  // Cotización - Cerlents: dropdowns tipo lente + material grupo
  const [cotTipoLente, setCotTipoLente] = useState<'progresivo' | 'bifocal' | 'ocupacional' | 'monofocal' | ''>('');
  const [cotGrupo, setCotGrupo] = useState<string>('');
  // Cotización - Reelens: categoría + material
  const [cotCategoria, setCotCategoria] = useState<string>('');
  const [cotMaterial, setCotMaterial] = useState<string>('');
  // Servicios adicionales (bisel, filtro uv, color)
  const [cotBisel, setCotBisel] = useState<string>('');
  // Selección de proveedor (cuando aplica ambos)
  const [cotProveedor, setCotProveedor] = useState<'Cerlents' | 'Reelens' | ''>('');
  // Selección compartida (ambos proveedores)
  const [selectedCotizacion, setSelectedCotizacion] = useState<{ material: string; tipoLente: string; grupo: string; columnLabel: string; price: number; provider: string } | null>(null);

  // Catalog
  const [genderFilter, setGenderFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadForm, setUploadForm] = useState({
    image_url: '',
    description: '',
    gender: '',
    style: '',
    status: 'disponible',
    code: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Admin - Providers
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [providerForm, setProviderForm] = useState({ name: '', contact: '', phone: '' });
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Proveedores - Provider Lens
  const [providerLensData, setProviderLensData] = useState<ProviderLens[]>([]);
  const [proveedorSubTab, setProveedorSubTab] = useState<ProveedorSubTab>('Reelens');
  const [editingLensRow, setEditingLensRow] = useState<ProviderLens | null>(null);
  const [lensEditForm, setLensEditForm] = useState({
    material: '', tipo_lente: '', esferas: '', cilindro: '', adicion: '', precio_par: 0,
  });
  const [showAddLensForm, setShowAddLensForm] = useState(false);
  const [addLensForm, setAddLensForm] = useState({
    categoria: '', material: '', tipo_lente: '', esferas: '', cilindro: '', adicion: '', precio_par: 0,
  });

  // Proveedores - Cerlens
  const [cerlensData, setCerlensData] = useState<CerlensPrice[]>([]);
  const [editingCerlens, setEditingCerlens] = useState<CerlensPrice | null>(null);

  // Admin - Lens prices (adaptado al esquema real)
  const [showLensForm, setShowLensForm] = useState(false);
  const [lensForm, setLensForm] = useState({
    provider_id: '',
    lens_type: '',
    quality: 'basico',
    base_price: 0,
    blue_filter: 0,
    photochromic: 0,
    antireflective: 0,
  });
  const [editingLens, setEditingLens] = useState<LensPrice | null>(null);

  // Soporte - Users
  const [usersList, setUsersList] = useState<CurrentUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'employee' as 'admin' | 'employee' });
  const [editingUser, setEditingUser] = useState<CurrentUser | null>(null);

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ==================== DATA FETCHING ====================
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch { setProducts([]); }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) setProviders(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchProviderLens = useCallback(async (provider: string = 'Reelens') => {
    try {
      const res = await fetch(`/api/provider-lens?provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        setProviderLensData(Array.isArray(data) ? data : []);
      }
    } catch { setProviderLensData([]); }
  }, []);

  const fetchCerlensData = useCallback(async () => {
    try {
      const res = await fetch('/api/cerlens-prices');
      if (res.ok) {
        const data = await res.json();
        setCerlensData(Array.isArray(data) ? data : []);
      }
    } catch { setCerlensData([]); }
  }, []);

  const fetchLensPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/pricing');
      if (res.ok) setLensPrices(await res.json());
    } catch { /* ignore */ }
  }, []);

  // Adaptado: settings viene como array de {id, name, profit_margin}
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSettingsList(data);
          setIsInitialized(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const initDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/init-db', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Base de datos verificada');
        await fetchSettings();
      } else {
        showToast(data.error || 'Error al inicializar', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
    setLoading(false);
  }, [fetchSettings, showToast]);

  // ==================== AUTH ====================
  // Limpiar cache del Service Worker para forzar actualización
  const clearCacheAndReload = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.unregister();
    }
    window.location.reload();
  };

  const handleLogin = async () => {
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Escribe tu email y contraseña');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setLoginError('No se pudo conectar al servidor. Intenta limpiar cache.');
        setLoginLoading(false);
        return;
      }
      if (res.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('jp_user', JSON.stringify(data.user));
        setShowLogin(false);
        setLoginEmail('');
        setLoginPassword('');
        setLoginError('');
        showToast(`Bienvenido, ${data.user.name}`);
        setActiveTab(data.user.role === 'admin' ? 'home' : 'catalog');
      } else {
        setLoginError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setLoginError('Error de conexión. Verifica tu internet.');
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jp_user');
    setShowLogin(true);
    showToast('Sesión cerrada');
  };

  // Escuchar mensajes del Service Worker sobre nueva versión
  // Solo mostrar el banner una vez por versión usando sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NEW_VERSION') {
          const newVersion = event.data.version;
          const seenVersion = sessionStorage.getItem('jp_update_version');
          if (newVersion !== seenVersion) {
            setShowUpdateBanner(true);
            sessionStorage.setItem('jp_update_version', newVersion);
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  // Check localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('jp_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
      } catch {
        localStorage.removeItem('jp_user');
      }
    } else {
      setShowLogin(true);
    }
  }, []);

  // Load all data
  useEffect(() => {
    fetchProducts();
    fetchProviders();
    fetchLensPrices();
    fetchSettings();
    fetchProviderLens('Reelens');
    fetchCerlensData();
    initDatabase();
  }, []);

  // ==================== PRESCRIPTION ANALYSIS ====================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormulaImage(reader.result as string);
      setFormulaMode('photo');
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormulaImage(reader.result as string);
      setFormulaMode('gallery');
    };
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
        setShowFormulaFields(true);
        showToast('Fórmula analizada correctamente');
      } else {
        showToast(data.error || 'Error al analizar', 'error');
      }
    } catch {
      showToast('Error de conexión con Gemini', 'error');
    }
    setAnalyzing(false);
  };

  // ==================== IMAGE UPLOAD ====================
  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'juanita-vision');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        showToast('Imagen subida a Cloudinary ✅');
        return data.url;
      }
      // Si Cloudinary falla, usar base64 como fallback
      console.warn('Cloudinary falló, usando base64:', data.error);
      showToast('Cloudinary no disponible, se guardará localmente', 'error');
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      showToast('Error al subir imagen', 'error');
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
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
      showToast('Selecciona la descripción del material', 'error');
      return;
    }
    if (!uploadForm.gender) {
      showToast('Selecciona el género', 'error');
      return;
    }
    if (!uploadForm.style) {
      showToast('Selecciona el estilo', 'error');
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
        setUploadForm({ image_url: '', description: '', gender: '', style: '', status: 'disponible', code: '' });
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
      if (res.ok) { showToast('Producto eliminado'); fetchProducts(); }
    } catch { /* ignore */ }
  };

  const updateProductStatus = async (product: Product, newStatus: string) => {
    if (product.status === newStatus) return;
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, status: newStatus }),
      });
      if (res.ok) {
        fetchProducts();
        showToast(`Estado: ${newStatus}`);
      }
    } catch { /* ignore */ }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setUploadForm({
      image_url: product.image_url || '',
      description: product.description,
      gender: product.gender || '',
      style: product.style || '',
      status: product.status || 'disponible',
      code: product.code || '',
    });
    setShowUploadForm(true);
  };

  // ==================== PROVIDER CRUD ====================
  const saveProvider = async () => {
    if (!providerForm.name) { showToast('El nombre es requerido', 'error'); return; }
    setLoading(true);
    try {
      let res: Response;
      if (editingProvider) {
        res = await fetch('/api/providers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProvider.id, name: providerForm.name }),
        });
      } else {
        res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: providerForm.name }),
        });
      }
      if (res.ok) {
        showToast(editingProvider ? 'Proveedor actualizado' : 'Proveedor creado');
        setShowProviderForm(false);
        setEditingProvider(null);
        setProviderForm({ name: '', contact: '', phone: '' });
        fetchProviders();
      }
    } catch { showToast('Error de conexión', 'error'); }
    setLoading(false);
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor y sus precios?')) return;
    try {
      const res = await fetch(`/api/providers?id=${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Proveedor eliminado'); fetchProviders(); fetchLensPrices(); }
    } catch { /* ignore */ }
  };

  // ==================== PROVIDER LENS CRUD ====================
  const startEditLensRow = (item: ProviderLens) => {
    setEditingLensRow(item);
    setLensEditForm({
      material: item.material,
      tipo_lente: item.tipo_lente || '',
      esferas: item.esferas || '',
      cilindro: item.cilindro || '',
      adicion: item.adicion || '',
      precio_par: item.precio_par,
    });
  };

  const saveLensRow = async () => {
    if (!editingLensRow) return;
    setLoading(true);
    try {
      const res = await fetch('/api/provider-lens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLensRow.id, ...lensEditForm }),
      });
      if (res.ok) {
        showToast('Lente actualizado');
        setEditingLensRow(null);
        fetchProviderLens(proveedorSubTab);
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al actualizar', 'error');
      }
    } catch { showToast('Error de conexión', 'error'); }
    setLoading(false);
  };

  const deleteLensRow = async (id: number) => {
    if (!confirm('¿Eliminar este lente?')) return;
    try {
      const res = await fetch(`/api/provider-lens?id=${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Lente eliminado'); fetchProviderLens(proveedorSubTab); }
    } catch { showToast('Error al eliminar', 'error'); }
  };

  const addNewLens = async () => {
    if (!addLensForm.categoria || !addLensForm.material) {
      showToast('Categoría y material son requeridos', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/provider-lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: proveedorSubTab,
          ...addLensForm,
        }),
      });
      if (res.ok) {
        showToast('Lente creado');
        setShowAddLensForm(false);
        setAddLensForm({ categoria: '', material: '', tipo_lente: '', esferas: '', cilindro: '', adicion: '', precio_par: 0 });
        fetchProviderLens(proveedorSubTab);
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al crear', 'error');
      }
    } catch { showToast('Error de conexión', 'error'); }
    setLoading(false);
  };

  // ==================== CERLENS CRUD ====================
  const saveCerlensCell = async (id: number, field: keyof CerlensPrice, value: number | null) => {
    try {
      const res = await fetch('/api/cerlens-prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (res.ok) {
        setCerlensData(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
        showToast('Precio actualizado');
      }
    } catch { showToast('Error al actualizar', 'error'); }
  };

  const deleteCerlensRow = async (id: number) => {
    if (!confirm('¿Eliminar esta fila?')) return;
    try {
      const res = await fetch(`/api/cerlens-prices?id=${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Fila eliminada'); fetchCerlensData(); }
    } catch { showToast('Error al eliminar', 'error'); }
  };

  // ==================== LENS PRICE CRUD (adaptado al esquema real) ====================
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
        setLensForm({ provider_id: '', lens_type: '', quality: 'basico', base_price: 0, blue_filter: 0, photochromic: 0, antireflective: 0 });
        fetchLensPrices();
      }
    } catch { showToast('Error de conexión', 'error'); }
    setLoading(false);
  };

  const deleteLensPrice = async (id: string) => {
    if (!confirm('¿Eliminar este precio?')) return;
    try {
      const res = await fetch(`/api/pricing?id=${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Precio eliminado'); fetchLensPrices(); }
    } catch { /* ignore */ }
  };

  // ==================== SETTINGS (adaptado al esquema real) ====================
  const saveProfitMargins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsList.map((s) => ({ id: s.id, profit_margin: s.profit_margin }))),
      });
      if (res.ok) { showToast('Márgenes actualizados'); fetchSettings(); }
    } catch { showToast('Error de conexión', 'error'); }
    setLoading(false);
  };

  // ==================== PRICING CALCULATION (adaptado al esquema real) ====================
  const pricingCalc = (() => {
    const base = selectedLens?.base_price || 0;
    const extras = [
      addBlueFilter ? (selectedLens?.blue_filter || 0) : 0,
      addPhotochromic ? (selectedLens?.photochromic || 0) : 0,
      addAntireflective ? (selectedLens?.antireflective || 0) : 0,
    ];
    const extrasTotal = extras.reduce((a, b) => a + b, 0);
    const cost = base + extrasTotal;
    const marginPct = getMargin(profitProfile);
    const finalPrice = Math.round(cost * marginPct);
    const margin = finalPrice - cost;
    return { base, extrasTotal, cost, marginPct, margin, finalPrice };
  })();

  // ==================== WHATSAPP SHARE ====================
  const shareProduct = (product: Product) => {
    const text = `👓 Juanita Pelaez Visión\n\n${product.description}\nCódigo: ${product.code || 'N/A'}\nEstado: ${product.status}\n\n¡Visítanos!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareCatalogWhatsApp = () => {
    const baseUrl = window.location.origin;
    const catalogUrl = `${baseUrl}/catalogo/${genderFilter}`;
    const genderName = genderFilter === 'todos' ? 'Catálogo Completo' : genderFilter === 'gafas_de_sol' ? 'Gafas de Sol' : genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1);
    const text = `👓 *Juanita Pelaez Visión*\n\n${genderName} - ${products.filter((p) => genderFilter === 'todos' || p.gender === genderFilter).length} monturas disponibles\n\n👉 Mira el catálogo aquí:\n${catalogUrl}\n\n¡Visítanos! 😊`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ==================== PDF EXPORT ====================
  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      showToast('Generando PDF con imágenes...');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      // Helper: nueva página con fondo negro
      const newPage = () => { pdf.addPage(); pdf.setFillColor(0, 0, 0); pdf.rect(0, 0, pw, ph, 'F'); };
      // Helper: dibujar header en página
      const drawHeader = (subtitle: string) => {
        pdf.setTextColor(212, 175, 55);
        pdf.setFontSize(16);
        pdf.text('Juanita Pelaez Visión', pw / 2, 12, { align: 'center' });
        pdf.setFontSize(9);
        pdf.setTextColor(160, 160, 160);
        pdf.text(subtitle, pw / 2, 18, { align: 'center' });
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.3);
        pdf.line(15, 21, pw - 15, 21);
      };
      // Helper: dibujar marca de agua
      const drawWatermark = (x: number, y: number, w: number, h: number, status: string) => {
        const colors: Record<string, [number, number, number]> = {
          agotado: [220, 50, 50],
          vendido: [230, 130, 50],
          reservado: [200, 180, 50],
        };
        const labels: Record<string, string> = { agotado: 'AGOTADO', vendido: 'VENDIDO', reservado: 'RESERVADO' };
        const col = colors[status];
        if (!col) return;
        // overlay oscuro
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new (pdf as any).GState({ opacity: 0.5 }));
        pdf.rect(x, y, w, h, 'F');
        pdf.setGState(new (pdf as any).GState({ opacity: 0.9 }));
        // texto diagonal
        pdf.setTextColor(col[0], col[1], col[2]);
        pdf.setFontSize(18);
        const cx = x + w / 2, cy = y + h / 2;
        pdf.text(labels[status], cx, cy, { align: 'center', angle: -20 });
        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
      };
      // Helper: cargar imagen
      const loadImage = (url: string): Promise<string> =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(url);
          img.onerror = () => resolve('');
          img.src = url;
        });

      // Filtrar productos
      const filtered = products.filter((p) => {
        if (genderFilter !== 'todos' && p.gender !== genderFilter) return false;
        if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
        return true;
      });

      const genderLabels: Record<string, string> = {
        mujer: '👩 Catálogo Mujer', hombre: '👨 Catálogo Hombre', nino: '👶 Catálogo Niños',
        unisex: '🧑 Catálogo Unisex', gafas_de_sol: '🕶️ Catálogo Gafas de Sol', todos: '📋 Catálogo Completo',
      };
      const styleLabelsPDF: Record<string, string> = {
        cuadrada: 'Cuadradas', cat_eye: 'Cat Eye', ovalada: 'Ovaladas', redonda: 'Redondas',
        rectangular: 'Rectangulares', aviator: 'Aviador', wayfarer: 'Wayfarer', clubmaster: 'Clubmaster',
        classic: 'Classic', sport: 'Sport', vintage: 'Vintage', modern: 'Modern', bold: 'Bold',
        media_luna: 'Media Luna', otro: 'Otros',
      };
      const styleOrder = ['cuadrada', 'cat_eye', 'ovalada', 'redonda', 'rectangular', 'aviator', 'wayfarer', 'clubmaster', 'classic', 'sport', 'vintage', 'modern', 'bold', 'media_luna', 'otro'];

      // Agrupar: MATERIAL → ESTILO → productos
      const materialOrder = ['Acetato', 'Metal', 'TR90', 'Titanio', 'Acerada', 'Mixta', 'Tres Piezas'];
      const byMaterial: Record<string, Record<string, typeof filtered>> = {};
      materialOrder.forEach((mat) => {
        const matProducts = filtered.filter((p) => p.description === mat);
        if (!matProducts.length) return;
        byMaterial[mat] = {};
        styleOrder.forEach((s) => { const items = matProducts.filter((p) => p.style === s); if (items.length) byMaterial[mat][s] = items; });
        const others = matProducts.filter((p) => !styleOrder.includes(p.style));
        if (others.length) byMaterial[mat]['otro'] = others;
      });
      const unknownMat = filtered.filter((p) => !materialOrder.includes(p.description));
      if (unknownMat.length) {
        byMaterial['Otros'] = {};
        styleOrder.forEach((s) => { const items = unknownMat.filter((p) => p.style === s); if (items.length) byMaterial['Otros'][s] = items; });
        const others = unknownMat.filter((p) => !styleOrder.includes(p.style));
        if (others.length) byMaterial['Otros']['otro'] = others;
      }

      if (Object.keys(byMaterial).length === 0) {
        pdf.setFillColor(0, 0, 0); pdf.rect(0, 0, pw, ph, 'F');
        drawHeader('Sin productos');
        pdf.setTextColor(160, 160, 160); pdf.setFontSize(12);
        pdf.text('No hay productos para exportar', pw / 2, ph / 2, { align: 'center' });
        pdf.save('juanita-pelaez-catalogo.pdf');
        return;
      }

      // Primera página
      pdf.setFillColor(0, 0, 0); pdf.rect(0, 0, pw, ph, 'F');
      drawHeader(genderLabels[genderFilter] || 'Catálogo Completo');
      pdf.setFontSize(8); pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, pw / 2, 24, { align: 'center' });

      let y = 28;
      let count = 0;
      const margin = 12;
      const gap = 4;
      const boxW = (pw - margin * 2 - gap) / 2;
      const imgH = 38;
      const textH = 14;
      const boxH = imgH + textH;

      for (const [material, styles] of Object.entries(byMaterial)) {
        // Título de sección por MATERIAL
        const needsNewPageMat = y + 10 > ph - 10;
        if (count > 0 && needsNewPageMat) { newPage(); drawHeader(genderLabels[genderFilter] || 'Catálogo Completo'); y = 28; }
        if (count === 0 && y < 30) y = 28;

        pdf.setTextColor(212, 175, 55); pdf.setFontSize(11);
        pdf.text(`─── ${material} (${Object.values(styles).flat().length}) ───`, pw / 2, y + 3, { align: 'center' });
        y += 8;

        // Sub-grupos por estilo dentro del material
        for (const [style, items] of Object.entries(styles)) {
          // Título de sub-sección por ESTILO
          const needsNewPageStyle = y + 8 > ph - 10;
          if (count > 0 && needsNewPageStyle) { newPage(); drawHeader(genderLabels[genderFilter] || 'Catálogo Completo'); y = 28; }

          pdf.setTextColor(160, 160, 160); pdf.setFontSize(8);
          pdf.text(`${styleLabelsPDF[style] || style} (${items.length})`, pw / 2, y + 2, { align: 'center' });
          y += 6;

        for (const product of items) {
          // Nueva página si no caben 2 filas (4 productos)
          if (y + boxH * 2 + gap * 2 + 10 > ph) { newPage(); drawHeader(genderLabels[genderFilter] || 'Catálogo Completo'); y = 28; }

          const col = count % 2;
          const row = Math.floor(count / 2) % 2;
          const boxX = margin + col * (boxW + gap);
          const boxY = y + row * (boxH + gap);

          // Caja
          pdf.setFillColor(17, 17, 17);
          pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'F');
          pdf.setDrawColor(40, 40, 40); pdf.setLineWidth(0.2);
          pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'S');

          // Imagen
          if (product.image_url) {
            try {
              const imgData = await loadImage(product.image_url);
              if (imgData) pdf.addImage(imgData, 'JPEG', boxX + 1, boxY + 1, boxW - 2, imgH);
              else { pdf.setFillColor(30, 30, 30); pdf.rect(boxX + 1, boxY + 1, boxW - 2, imgH, 'F'); }
            } catch { pdf.setFillColor(30, 30, 30); pdf.rect(boxX + 1, boxY + 1, boxW - 2, imgH, 'F'); }
          } else {
            pdf.setFillColor(30, 30, 30); pdf.rect(boxX + 1, boxY + 1, boxW - 2, imgH, 'F');
          }

          // Marca de agua sobre imagen
          if (product.status !== 'disponible') drawWatermark(boxX + 1, boxY + 1, boxW - 2, imgH, product.status);

          // Texto info
          const textY = boxY + imgH + 3;
          pdf.setFontSize(7); pdf.setTextColor(255, 255, 255);
          pdf.text(pdf.splitTextToSize(product.description || 'Sin descripción', boxW - 8).slice(0, 1), boxX + 4, textY);
          pdf.setFontSize(6); pdf.setTextColor(120, 120, 120);
          pdf.text(product.code ? `#${product.code}` : styleLabelsPDF[product.style] || '', boxX + 4, textY + 4);
          // Badge estado
          const badgeColors: Record<string, [number, number, number]> = {
            disponible: [110, 231, 183], agotado: [252, 100, 100], reservado: [252, 211, 77], vendido: [252, 165, 100],
          };
          const bc = badgeColors[product.status] || [160, 160, 160];
          pdf.setTextColor(bc[0], bc[1], bc[2]); pdf.setFontSize(6);
          pdf.text(product.status.toUpperCase(), boxX + boxW - 4, textY + 4, { align: 'right' });

          count++;
          // Avanzar Y cada 2 productos (una fila)
          if (col === 1 && row === 1) { y += boxH * 2 + gap * 2 + 5; }
        }
        // Si quedó una fila incompleta, avanzar Y
        if (count % 4 !== 0) { y += (Math.ceil((count % 4) / 2)) * (boxH + gap) + 5; }
        else { y += 5; }
        } // fin sub-grupo estilo
      } // fin material

      pdf.save('juanita-pelaez-catalogo.pdf');
      showToast('PDF generado correctamente ✅');
    } catch (err) { console.error(err); showToast('Error al generar PDF', 'error'); }
  };

  // ==================== USER MANAGEMENT ====================
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsersList(await res.json());
    } catch { /* ignore */ }
  }, []);

  const saveUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      showToast('Todos los campos son requeridos', 'error');
      return;
    }
    setLoading(true);
    try {
      let res: Response;
      if (editingUser) {
        res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingUser.id, name: userForm.name, role: userForm.role }),
        });
      } else {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        });
      }
      if (res.ok) {
        showToast(editingUser ? 'Usuario actualizado' : 'Usuario creado');
        setShowUserForm(false);
        setEditingUser(null);
        setUserForm({ name: '', email: '', password: '', role: 'employee' });
        fetchUsers();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al guardar', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Usuario eliminado'); fetchUsers(); }
    } catch { /* ignore */ }
  };

  // ==================== BACKUP EXPORT ====================
  const exportBackup = async () => {
    try {
      showToast('Generando respaldo...');
      const [productsRes, providersRes, pricingRes, settingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/providers'),
        fetch('/api/pricing'),
        fetch('/api/settings'),
      ]);
      const backup = {
        exportDate: new Date().toISOString(),
        products: productsRes.ok ? await productsRes.json() : [],
        providers: providersRes.ok ? await providersRes.json() : [],
        lens_prices: pricingRes.ok ? await pricingRes.json() : [],
        settings: settingsRes.ok ? await settingsRes.json() : [],
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `juanita-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Respaldo descargado correctamente');
    } catch {
      showToast('Error al generar respaldo', 'error');
    }
  };

  // ==================== NAV TABS ====================
  const allTabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Inicio', icon: <Home size={20} /> },
    { id: 'formula', label: 'Fórmula', icon: <Eye size={20} /> },
    { id: 'pricing', label: 'Cotizar', icon: <DollarSign size={20} /> },
    { id: 'catalog', label: 'Catálogo', icon: <Package size={20} /> },
    { id: 'proveedores', label: 'Proveedores', icon: <Building2 size={20} /> },
    { id: 'soporte', label: 'Soporte', icon: <Settings size={20} /> },
  ];

  const tabs = currentUser
    ? (currentUser.role === 'admin'
      ? allTabs
      : allTabs.filter((t) => ['home', 'formula', 'pricing', 'catalog', 'proveedores'].includes(t.id)))
    : allTabs.filter((t) => ['home', 'formula', 'catalog'].includes(t.id));

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-green-900/90 text-green-200 border border-green-700' : 'bg-red-900/90 text-red-200 border border-red-700'
            }`}>
            {toast.type === 'success' ? <Check size={16} className="inline mr-2" /> : <AlertCircle size={16} className="inline mr-2" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && !currentUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm space-y-6">
              <div className="text-center">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gold-gradient">Juanita Pelaez</h2>
                <p className="text-xs text-[#888] mt-1">Inicia sesión para continuar</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#666] uppercase mb-1 block">Email</label>
                  <input type="email" className="premium-input text-sm" placeholder="correo@ejemplo.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                </div>
                <div>
                  <label className="text-xs text-[#666] uppercase mb-1 block">Contraseña</label>
                  <input type="password" className="premium-input text-sm" placeholder="Tu contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                </div>
                {loginError && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/50 text-xs text-red-300">
                    {loginError}
                  </div>
                )}
                {loginLoading ? (
                  <div className="flex items-center justify-center gap-2 py-3"><Loader2 size={18} className="animate-spin text-[#D4AF37]" /><span className="text-sm text-[#888]">Ingresando...</span></div>
                ) : (
                  <button onClick={handleLogin} className="w-full btn-gold flex items-center justify-center gap-2">
                    Iniciar Sesión
                  </button>
                )}
                <button onClick={clearCacheAndReload} className="w-full text-xs text-[#555] hover:text-[#888] py-1 transition-colors">
                  Problemas? Limpiar cache y recargar
                </button>
              </div>
            </motion.div>
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
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2 mr-1">
              <div className="text-right">
                <p className="text-xs text-white font-medium leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#D4AF37] uppercase">{currentUser.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors" title="Cerrar sesión">
                <LogOut size={16} className="text-[#888] hover:text-red-400" />
              </button>
            </div>
          )}
          <button onClick={shareCatalogWhatsApp} className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors" title="Compartir catálogo por WhatsApp">
            <Share2 size={18} className="text-[#D4AF37]" />
          </button>
        </div>
      </header>

      {/* Banner de actualización */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #D4AF37, #b8962e)' }}>
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-black" />
                <span className="text-xs font-semibold text-black">Nueva versión disponible</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-bold text-black bg-white/30 px-3 py-1 rounded-full hover:bg-white/50 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <AnimatePresence mode="wait">

          {/* ==================== HOME ==================== */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
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

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-[#A0A0A0] uppercase tracking-wider">Acciones Rápidas</h2>
                {[
                  { action: () => setActiveTab('formula'), icon: <Camera size={22} />, title: 'Analizar Fórmula', desc: 'Escanea y analiza prescripciones ópticas con IA' },
                  { action: () => { setActiveTab('catalog'); setTimeout(() => setShowUploadForm(true), 100); }, icon: <Upload size={22} />, title: 'Subir Montura', desc: 'Agrega nuevos productos al catálogo' },
                  { action: () => setActiveTab('pricing'), icon: <TrendingUp size={22} />, title: 'Cotizar Lentes', desc: 'Calcula precios con márgenes de ganancia' },
                  { action: () => setActiveTab('catalog'), icon: <Package size={22} />, title: 'Ver Catálogo', desc: `Explora todos los productos (${products.length})` },
                ].map((item) => (
                  <button key={item.title} onClick={item.action} className="flex items-center gap-4 p-4 rounded-xl card-hover text-left w-full" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0">{item.icon}<span className="text-[#D4AF37]" /></div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-[#666] truncate">{item.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-[#444] ml-auto shrink-0" />
                  </button>
                ))}
              </div>

              {!isInitialized && (
                <button onClick={initDatabase} disabled={loading} className="w-full btn-gold flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                  {loading ? 'Verificando...' : 'Conectar Base de Datos'}
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
                <p className="text-xs text-[#666]">Captura, elige de galería o ingresa manualmente</p>
              </div>

              {/* Botones de acción: 3 opciones */}
              {!formulaImage && !showFormulaFields && (
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => document.getElementById('camera-input')?.click()} className="flex flex-col items-center gap-2 p-4 rounded-xl card-hover text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <Camera size={24} className="text-[#D4AF37]" />
                    <span className="text-xs text-white font-medium">Tomar Foto</span>
                  </button>
                  <button onClick={() => document.getElementById('gallery-input')?.click()} className="flex flex-col items-center gap-2 p-4 rounded-xl card-hover text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <Upload size={24} className="text-[#D4AF37]" />
                    <span className="text-xs text-white font-medium">Galería</span>
                  </button>
                  <button onClick={() => { setShowFormulaFields(true); setFormulaMode('manual'); }} className="flex flex-col items-center gap-2 p-4 rounded-xl card-hover text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <FileText size={24} className="text-[#D4AF37]" />
                    <span className="text-xs text-white font-medium">Manual</span>
                  </button>
                </div>
              )}

              {/* Inputs ocultos */}
              <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" id="camera-input" />
              <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" id="gallery-input" />

              {/* Imagen cargada */}
              {formulaImage && (
                <div className="relative">
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1a1a1a' }}>
                    <img src={formulaImage} alt="Fórmula" className="max-h-64 mx-auto rounded-xl" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setFormulaImage(null); setFormulaMode('none'); setPrescription({ od: { sph: '', cyl: '', axis: '', add: '' }, oi: { sph: '', cyl: '', axis: '', add: '' } }); setRecommendations([]); setShowFormulaFields(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-red-400" style={{ background: '#111', border: '1px solid #2a1a1a' }}>
                      <X size={16} /> Quitar
                    </button>
                    <button onClick={analyzePrescription} disabled={analyzing} className="flex-1 btn-gold flex items-center justify-center gap-2">
                      {analyzing ? <Loader2 size={16} className="animate-spin" /> : <EyeIcon size={16} />}
                      {analyzing ? 'Analizando...' : 'Analizar con IA'}
                    </button>
                  </div>
                </div>
              )}

              {/* Botón para volver a elegir después de ver campos */}
              {showFormulaFields && !formulaImage && (
                <button onClick={() => { setShowFormulaFields(false); setFormulaMode('none'); setPrescription({ od: { sph: '', cyl: '', axis: '', add: '' }, oi: { sph: '', cyl: '', axis: '', add: '' } }); setRecommendations([]); }} className="text-xs text-[#555] hover:text-[#888] transition-colors">
                  ← Volver a elegir método
                </button>
              )}

              {/* Formulario de fórmula - visible siempre que showFormulaFields o haya datos */}
              {showFormulaFields && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">
                    {formulaMode === 'manual' ? '📋 Ingresar Fórmula' : '✨ Datos Extraídos'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'OD (Ojo Derecho)', data: prescription.od, eye: 'od' },
                      { label: 'OI (Ojo Izquierdo)', data: prescription.oi, eye: 'oi' },
                    ].map((eye) => (
                      <div key={eye.label} className="rounded-xl p-3 space-y-2" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                        <p className="text-xs font-bold text-[#D4AF37] text-center">{eye.label}</p>
                        {[
                          { key: 'sph', label: 'SPH (Esfera)', placeholder: 'Ej: -2.50' },
                          { key: 'cyl', label: 'CYL (Cilindro)', placeholder: 'Ej: -1.00' },
                          { key: 'axis', label: 'AXIS (Eje)', placeholder: 'Ej: 180' },
                          { key: 'add', label: 'ADD (Adición)', placeholder: 'Ej: +2.50' },
                        ].map((f) => (
                          <div key={f.key}>
                            <label className="text-[10px] text-[#666] uppercase">{f.label}</label>
                            <input className="premium-input text-sm" value={eye.data[f.key as keyof typeof eye.data]} onChange={(e) => {
                              setPrescription((p) => eye.eye === 'od'
                                ? { ...p, od: { ...p.od, [f.key]: e.target.value } }
                                : { ...p, oi: { ...p.oi, [f.key]: e.target.value } });
                            }} placeholder={f.placeholder} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* Botón limpiar formulario manual */}
                  <button onClick={() => { setPrescription({ od: { sph: '', cyl: '', axis: '', add: '' }, oi: { sph: '', cyl: '', axis: '', add: '' } }); setRecommendations([]); }} className="w-full py-2.5 rounded-xl text-xs text-[#888] hover:text-white transition-colors" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    Limpiar Fórmula
                  </button>

                  {recommendations.length > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl p-4 gold-glow" style={{ background: 'linear-gradient(135deg, #1a1505 0%, #111 100%)', border: '1px solid rgba(212,175,55,0.3)' }}>
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

              {/* Fórmula cargada desde Analizar */}
              {(prescription.od.sph || prescription.oi.sph) && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'linear-gradient(135deg, #1a1505 0%, #111 100%)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#D4AF37] flex items-center gap-1.5"><EyeIcon size={14} /> Fórmula del Paciente</p>
                    <button onClick={() => setActiveTab('formula')} className="text-[10px] text-[#888] hover:text-[#D4AF37] transition-colors">Editar →</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">OD (Ojo Derecho)</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">SPH</span> <span className="text-white font-medium ml-1">{prescription.od.sph || '—'}</span></div>
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">CYL</span> <span className="text-white font-medium ml-1">{prescription.od.cyl || '—'}</span></div>
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">AXIS</span> <span className="text-white font-medium ml-1">{prescription.od.axis || '—'}</span></div>
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">ADD</span> <span className="text-white font-medium ml-1">{prescription.od.add || '—'}</span></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider">OI (Ojo Izquierdo)</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">SPH</span> <span className="text-white font-medium ml-1">{prescription.oi.sph || '—'}</span></div>
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">CYL</span> <span className="text-white font-medium ml-1">{prescription.oi.cyl || '—'}</span></div>
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">AXIS</span> <span className="text-white font-medium ml-1">{prescription.oi.axis || '—'}</span></div>
                        <div className="rounded-lg px-2 py-1.5 bg-[#0a0a0a]"><span className="text-[#666]">ADD</span> <span className="text-white font-medium ml-1">{prescription.oi.add || '—'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No hay fórmula - pedir que vaya a Analizar */}
              {!(prescription.od.sph || prescription.oi.sph) && (
                <div className="text-center py-12 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                  <EyeIcon size={40} className="text-[#333] mx-auto mb-3" />
                  <p className="text-sm text-[#666]">Primero analiza una fórmula del paciente</p>
                  <button onClick={() => setActiveTab('formula')} className="mt-4 btn-gold text-sm px-4 py-2 flex items-center gap-2 mx-auto"><EyeIcon size={16} /> Ir a Analizar Fórmula</button>
                </div>
              )}

              {/* ===== FLUJO DE COTIZACIÓN ===== */}
              {(prescription.od.sph || prescription.oi.sph) && (() => {
                const hasAdd = !!(prescription.od.add || prescription.oi.add);
                const addVal = Math.max(
                  parseFloat(prescription.od.add) || 0,
                  parseFloat(prescription.oi.add) || 0
                );
                const maxAbsSph = Math.max(
                  Math.abs(parseFloat(prescription.od.sph) || 0),
                  Math.abs(parseFloat(prescription.oi.sph) || 0)
                );
                const maxAbsCyl = Math.max(
                  Math.abs(parseFloat(prescription.od.cyl) || 0),
                  Math.abs(parseFloat(prescription.oi.cyl) || 0)
                );
                // Determinar cuáles proveedores aplican (extra rango: esfera -6.00/-4.00, cilindro -2.25/-4.00)
                const canCerlents = hasAdd || maxAbsSph >= 4 || maxAbsCyl >= 2.25;
                const canReelens = !hasAdd || addVal <= 3;
                const bothApply = canCerlents && canReelens;
                // Proveedor activo: si solo uno aplica ir directo, si ambos esperar selección
                const activeProvider = bothApply ? cotProveedor : (canCerlents ? 'Cerlents' : 'Reelens');
                const useCerlents = activeProvider === 'Cerlents';
                const useReelens = activeProvider === 'Reelens';

                // === HELPERS DE RANGO ===
                // Parsea rango tipo "N-2.00" → [0, 2], "-2.25/-4.00" → [2.25, 4], "-4.00/+4.00" → [0, 4]
                const parseRange = (range: string | null): [number, number] => {
                  if (!range) return [0, 99];
                  const r = range.replace(/\s/g, '');
                  // Formato "N-2.00" o "N/+3.00" → N = 0/neutro
                  if (r.startsWith('N')) {
                    const nums = r.replace('N', '').replace(/[\/\-]/g, ',').split(',').map(Number).filter(n => !isNaN(n));
                    if (nums.length >= 1) return [0, Math.abs(nums[nums.length - 1])];
                    return [0, 99];
                  }
                  // Formato "-4.00/+4.00" → separar por / primero
                  const parts = r.split('/').map(s => parseFloat(s)).filter(n => !isNaN(n));
                  if (parts.length >= 2) {
                    const [a, b] = parts.map(Math.abs);
                    // Si los signos originales son opuestos (-4/+4) → rango de 0 al máximo
                    const rawParts = r.split('/').map(s => s.trim());
                    const signA = rawParts[0].startsWith('-') ? -1 : 1;
                    const signB = rawParts[1].startsWith('-') ? -1 : 1;
                    if (signA !== signB) return [0, Math.max(a, b)];
                    // Mismo signo (-2.25/-4.00) → rango entre los dos valores absolutos
                    return [Math.min(a, b), Math.max(a, b)];
                  }
                  if (parts.length === 1) return [0, Math.abs(parts[0])];
                  return [0, 99];
                };

                const valueInRange = (val: number, range: string | null): boolean => {
                  if (!range) return true; // sin rango = aplica
                  const [min, max] = parseRange(range);
                  const absVal = Math.abs(val);
                  return absVal >= min && absVal <= max;
                };

                // Obtener valores de ambos ojos para verificar
                const odSph = parseFloat(prescription.od.sph) || 0;
                const oiSph = parseFloat(prescription.oi.sph) || 0;
                const odCyl = parseFloat(prescription.od.cyl) || 0;
                const oiCyl = parseFloat(prescription.oi.cyl) || 0;
                const odAdd = parseFloat(prescription.od.add) || 0;
                const oiAdd = parseFloat(prescription.oi.add) || 0;

                const formulaFitsRow = (row: typeof providerLensData[0]): boolean => {
                  // Verificar esferas (al menos un ojo debe entrar)
                  if (row.esferas) {
                    const sphOk = valueInRange(odSph, row.esferas) || valueInRange(oiSph, row.esferas);
                    if (!sphOk) return false;
                  }
                  // Verificar cilindro (al menos un ojo debe entrar)
                  if (row.cilindro) {
                    const cylOk = valueInRange(odCyl, row.cilindro) || valueInRange(oiCyl, row.cilindro);
                    if (!cylOk) return false;
                  }
                  // Verificar adición (al menos un ojo debe entrar, si la fórmula tiene ADD)
                  if (row.adicion && hasAdd) {
                    const addOk = valueInRange(odAdd, row.adicion) || valueInRange(oiAdd, row.adicion);
                    if (!addOk) return false;
                  }
                  return true;
                };

                // === CERLENTS ===
                const tipoLenteCols: Record<string, { key: keyof CerlensPrice; label: string; tier?: string }[]> = {
                  progresivo: [
                    { key: 'prog_prime', label: 'Prime Max', tier: 'premium' },
                    { key: 'prog_ventrix', label: 'Ventrix Max', tier: 'premium' },
                    { key: 'prog_advance', label: 'Advance Max', tier: 'premium' },
                    { key: 'prog_confort', label: 'Confort Max', tier: 'medio' },
                    { key: 'prog_practice_20', label: 'Practice 2.0', tier: 'medio' },
                    { key: 'prog_practice', label: 'Practice Max', tier: 'medio' },
                  ],
                  bifocal: [
                    { key: 'bif_invisible', label: 'Invisible' },
                    { key: 'bif_bfree', label: 'B-Free' },
                  ],
                  ocupacional: [{ key: 'ocu_ocupacional', label: 'Ocupacional' }],
                  monofocal: [
                    { key: 'mono_simple', label: 'Simple' },
                    { key: 'mono_relax', label: 'Relax' },
                    { key: 'mono_kids', label: 'Kids' },
                  ],
                };
                const gruposDisponibles = [...new Set(cerlensData.map(r => r.grupo))];
                const cerlFilas = cotGrupo ? cerlensData.filter(r => r.grupo === cotGrupo) : [];
                const cerlCols = cotTipoLente ? (tipoLenteCols[cotTipoLente] || []) : [];

                // === REELENS ===
                const reelensData = providerLensData.filter(r => r.provider === 'Reelens');
                // Si tiene ADD, solo mostrar categorías que tengan campo adición
                const categoriasConAdd = new Set(reelensData.filter(r => r.adicion).map(r => r.categoria));
                const categoriasReelens = hasAdd
                  ? [...new Set(reelensData.filter(r => categoriasConAdd.has(r.categoria)).map(r => r.categoria))]
                  : [...new Set(reelensData.filter(r => !categoriasConAdd.has(r.categoria)).map(r => r.categoria))];
                const materialesFiltrados = cotCategoria
                  ? [...new Set(reelensData.filter(r => r.categoria === cotCategoria).map(r => r.material))]
                  : [];
                // Filtrar filas por categoría, material y rangos de fórmula
                const reelFilas = cotCategoria && cotMaterial
                  ? reelensData.filter(r =>
                      r.categoria === cotCategoria &&
                      r.material === cotMaterial &&
                      formulaFitsRow(r)
                    )
                  : [];

                // Cálculo de precio con margen
                const cotCost = selectedCotizacion?.price || 0;
                const cotMarginPct = getMargin(profitProfile);

                // Servicios adicionales (bisel, filtro uv, color) - solo Reelens
                const biselOptions: Record<string, number> = {
                  'Bisel Sencillo': 3000,
                  'Bisel Especial': 4000,
                  'Bisel Especial Ranurado': 6000,
                  'Bisel 3 Piezas': 15000,
                  'Filtro UV': 7000,
                  'Color': 7000,
                };
                const cotBiselCost = biselOptions[cotBisel] || 0;
                const cotCostTotal = cotCost + cotBiselCost;
                const cotFinal = Math.round(cotCostTotal * cotMarginPct);
                const cotMargin = cotFinal - cotCostTotal;

                const tipoLenteLabels: Record<string, string> = { progresivo: 'Progresivo', bifocal: 'Bifocal', ocupacional: 'Ocupacional', monofocal: 'Monofocal' };

                const selectStyle = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 12px center' };
                const selectClass = 'w-full rounded-xl px-3 py-2.5 text-sm bg-[#111] text-white border border-[#1a1a1a] focus:border-[#D4AF37] outline-none appearance-none';

                return (
                  <>
                    {/* === Selector de Proveedor (cuando ambos aplican) === */}
                    {bothApply && !cotProveedor && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #D4AF3740' }}>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#D4AF37]">¿Con qué proveedor quieres cotizar?</p>
                          <p className="text-[10px] text-[#888] mt-1">Esta fórmula puede trabajarse con ambos proveedores</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => { setCotProveedor('Cerlents'); setSelectedCotizacion(null); }}
                            className="p-4 rounded-xl text-center transition-all hover:scale-[1.02]"
                            style={{ background: '#A855F715', border: '1px solid #A855F750' }}>
                            <p className="text-sm font-bold" style={{ color: '#A855F7' }}>📐 Cerlents</p>
                            <p className="text-[10px] text-[#888] mt-1">Talla Digital</p>
                            <p className="text-[9px] text-[#555]">Progresivos, Bifocales, Mono</p>
                          </button>
                          <button onClick={() => { setCotProveedor('Reelens'); setSelectedCotizacion(null); }}
                            className="p-4 rounded-xl text-center transition-all hover:scale-[1.02]"
                            style={{ background: '#60A5FA15', border: '1px solid #60A5FA50' }}>
                            <p className="text-sm font-bold" style={{ color: '#60A5FA' }}>🔵 Reelens</p>
                            <p className="text-[10px] text-[#888] mt-1">Convencional</p>
                            <p className="text-[9px] text-[#555]">Terminados, Bifocales, Talla Conv.</p>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* === Indicador de tipo === */}
                    {activeProvider && (
                      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: useCerlents ? '#A855F710' : '#60A5FA10', border: `1px solid ${useCerlents ? '#A855F730' : '#60A5FA30'}` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ background: useCerlents ? '#A855F7' : '#60A5FA' }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: useCerlents ? '#A855F7' : '#60A5FA' }}>{useCerlents ? 'Talla Digital — Cerlents' : 'Convencional — Reelens'}</p>
                            <p className="text-[10px] text-[#888]">{useCerlents
                              ? (hasAdd ? 'Fórmula con adición · Cerlents' : 'Graduación alta (≥±3.00) · Cerlents')
                              : 'Fórmula convencional · Reelens'}</p>
                          </div>
                        </div>
                        {bothApply && (
                          <button onClick={() => { setCotProveedor(''); setSelectedCotizacion(null); setCotCategoria(''); setCotMaterial(''); }}
                            className="text-[9px] text-[#888] hover:text-[#D4AF37] transition-colors px-2 py-1 rounded-lg border border-[#222] hover:border-[#D4AF3740]">
                            Cambiar proveedor
                          </button>
                        )}
                      </div>
                    )}

                    {activeProvider && useCerlents ? (
                      <>
                        {/* === Dropdowns Cerlents === */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[#666] uppercase mb-1.5 block">Tipo de Lente</label>
                            <select value={cotTipoLente} onChange={e => { setCotTipoLente(e.target.value as any); setSelectedCotizacion(null); }} className={selectClass} style={selectStyle}>
                              <option value="">Seleccionar...</option>
                              <option value="progresivo">Progresivo</option>
                              <option value="bifocal">Bifocal</option>
                              <option value="ocupacional">Ocupacional</option>
                              <option value="monofocal">Monofocal</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-[#666] uppercase mb-1.5 block">Material</label>
                            <select value={cotGrupo} onChange={e => { setCotGrupo(e.target.value); setSelectedCotizacion(null); }} className={selectClass} style={selectStyle}>
                              <option value="">Seleccionar...</option>
                              {gruposDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                        </div>
                        {/* === Tabla Cerlents === */}
                        {cotTipoLente && cotGrupo && cerlFilas.length > 0 && cerlCols.length > 0 ? (
                          <div className="rounded-xl overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr style={{ background: '#0a0a0a' }}>
                                    <th className="px-2 py-2 text-left text-[#888] font-bold uppercase tracking-wider min-w-[140px]">Material</th>
                                    {cotTipoLente === 'progresivo' && (
                                      <>
                                        <th colSpan={3} className="px-2 py-1.5 text-center text-[#D4AF37] font-bold uppercase tracking-wider border-l border-[#D4AF37]/20"><span className="text-[8px] opacity-60 block">Premium</span>Progresivos</th>
                                        <th colSpan={3} className="px-2 py-1.5 text-center text-[#60A5FA] font-bold uppercase tracking-wider border-l border-[#60A5FA]/20"><span className="text-[8px] opacity-60 block">Medio</span>Progresivos</th>
                                      </>
                                    )}
                                    {cotTipoLente === 'bifocal' && <th colSpan={2} className="px-2 py-1.5 text-center text-[#22C55E] font-bold uppercase tracking-wider border-l border-[#22C55E]/20">Bifocal</th>}
                                    {cotTipoLente === 'ocupacional' && <th className="px-2 py-1.5 text-center text-[#F97316] font-bold uppercase tracking-wider border-l border-[#F97316]/20">Ocupacional</th>}
                                    {cotTipoLente === 'monofocal' && <th colSpan={3} className="px-2 py-1.5 text-center text-[#06B6D4] font-bold uppercase tracking-wider border-l border-[#06B6D4]/20">Monofocal</th>}
                                  </tr>
                                  <tr style={{ background: '#0d0d0d' }}>
                                    <th className="px-2 py-1.5" />
                                    {cerlCols.map((col, ci) => {
                                      const isLastOfTier = cotTipoLente === 'progresivo' && (ci === 2 || ci === 5);
                                      return <th key={col.key} className={`px-2 py-1.5 text-center font-medium uppercase tracking-wider ${ci === 0 ? 'border-l border-[#222]' : ''} ${isLastOfTier ? 'border-l border-[#222]' : ''}`} style={{ color: col.tier === 'premium' ? '#D4AF3780' : (cotTipoLente === 'progresivo' ? '#60A5FA80' : '#888') }}>{col.label}</th>;
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {cerlFilas.map(fila => {
                                    const isSelected = selectedCotizacion?.material === fila.material && selectedCotizacion?.provider === 'Cerlents';
                                    return (
                                      <tr key={fila.id} className={isSelected ? 'bg-[#D4AF37]/5' : ''} style={{ borderTop: '1px solid #1a1a1a' }}>
                                        <td className="px-2 py-2"><p className="text-[11px] font-medium text-white leading-tight">{fila.material}</p></td>
                                        {cerlCols.map((col, ci) => {
                                          const val = fila[col.key] as number | null;
                                          const isCellSelected = isSelected && selectedCotizacion?.columnLabel === col.label;
                                          return (
                                            <td key={col.key} className={`px-1 py-1.5 text-center ${ci === 0 ? 'border-l border-[#1a1a1a]' : ''} ${cotTipoLente === 'progresivo' && (ci === 3) ? 'border-l border-[#222]' : ''}`}>
                                              {val !== null && val !== undefined ? (
                                                <button onClick={() => setSelectedCotizacion({ material: fila.material, tipoLente: cotTipoLente, grupo: cotGrupo, columnLabel: col.label, price: val, provider: 'Cerlents' })}
                                                  className={`w-full px-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isCellSelected ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'hover:bg-[#1a1a1a] text-white'}`}>{formatCurrency(val)}</button>
                                              ) : <span className="text-[#222]">—</span>}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="px-3 py-2 flex items-center justify-between" style={{ background: '#0a0a0a' }}>
                              <span className="text-[9px] text-[#555]">{cerlFilas.length} materiales · {cerlCols.length} columnas</span>
                              <button onClick={() => setSelectedCotizacion(null)} className="text-[9px] text-[#555] hover:text-[#888]">Limpiar</button>
                            </div>
                          </div>
                        ) : cotTipoLente && cotGrupo ? (
                          <div className="text-center py-6 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}><Package size={28} className="text-[#333] mx-auto mb-2" /><p className="text-xs text-[#666]">No hay materiales en este grupo</p></div>
                        ) : (
                          <div className="text-center py-8 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}><EyeIcon size={32} className="text-[#333] mx-auto mb-2" /><p className="text-xs text-[#666]">Selecciona tipo de lente y material</p></div>
                        )}
                      </>
                    ) : (
                      /* === REELENS === */
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[#666] uppercase mb-1.5 block">Categoría</label>
                            <select value={cotCategoria} onChange={e => { setCotCategoria(e.target.value); setCotMaterial(''); setSelectedCotizacion(null); }} className={selectClass} style={selectStyle}>
                              <option value="">Seleccionar...</option>
                              {categoriasReelens.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-[#666] uppercase mb-1.5 block">Material</label>
                            <select value={cotMaterial} onChange={e => { setCotMaterial(e.target.value); setSelectedCotizacion(null); }} className={selectClass} style={selectStyle} disabled={!cotCategoria}>
                              <option value="">Seleccionar...</option>
                              {materialesFiltrados.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        </div>

                        {cotCategoria && cotMaterial && (
                          reelFilas.length > 0 ? (
                            <div className="rounded-xl overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                              <div className="overflow-x-auto">
                                <table className="w-full text-[11px]">
                                  <thead>
                                    <tr style={{ background: '#0a0a0a' }}>
                                      <th className="px-3 py-2 text-left text-[#888] font-bold uppercase tracking-wider">Material</th>
                                      <th className="px-3 py-2 text-center text-[#888] font-bold uppercase tracking-wider">Esferas</th>
                                      <th className="px-3 py-2 text-center text-[#888] font-bold uppercase tracking-wider">Cilindro</th>
                                      <th className="px-3 py-2 text-center text-[#888] font-bold uppercase tracking-wider">Adición</th>
                                      <th className="px-3 py-2 text-center text-[#60A5FA] font-bold uppercase tracking-wider">Precio Par</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {reelFilas.map(row => {
                                      const isSelected = selectedCotizacion?.material === row.material && selectedCotizacion?.columnLabel === row.esferas && selectedCotizacion?.provider === 'Reelens';
                                      return (
                                        <tr key={row.id} className={isSelected ? 'bg-[#D4AF37]/5' : ''} style={{ borderTop: '1px solid #1a1a1a' }}>
                                          <td className="px-3 py-2"><p className="font-medium text-white leading-tight">{row.material}</p>{row.tipo_lente && <p className="text-[9px] text-[#555]">{row.tipo_lente}</p>}</td>
                                          <td className="px-3 py-2 text-center text-[#ccc]">{row.esferas || '—'}</td>
                                          <td className="px-3 py-2 text-center text-[#ccc]">{row.cilindro || '—'}</td>
                                          <td className="px-3 py-2 text-center text-[#ccc]">{row.adicion || '—'}</td>
                                          <td className="px-2 py-2 text-center">
                                            <button onClick={() => setSelectedCotizacion({ material: row.material, tipoLente: cotCategoria, grupo: row.esferas || '', columnLabel: `${row.cilindro || ''} ${row.adicion || ''}`.trim(), price: row.precio_par, provider: 'Reelens' })}
                                              className={`px-3 py-2 rounded-lg font-bold transition-all ${isSelected ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'hover:bg-[#1a1a1a] text-[#60A5FA]'}`}>
                                              {formatCurrency(row.precio_par)}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="px-3 py-2 flex items-center justify-between" style={{ background: '#0a0a0a' }}>
                                <span className="text-[9px] text-[#555]">{reelFilas.length} rango{reelFilas.length !== 1 ? 's' : ''} disponible{reelFilas.length !== 1 ? 's' : ''} para esta fórmula</span>
                                <button onClick={() => setSelectedCotizacion(null)} className="text-[9px] text-[#555] hover:text-[#888]">Limpiar</button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                              <Package size={28} className="text-[#333] mx-auto mb-2" />
                              <p className="text-xs text-[#666]">No hay rangos disponibles para esta fórmula</p>
                              <p className="text-[10px] text-[#444] mt-1">La fórmula no entra en los rangos de esta tabla</p>
                            </div>
                          )
                        )}

                        {!cotCategoria && (
                          <div className="text-center py-8 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                            <EyeIcon size={32} className="text-[#333] mx-auto mb-2" />
                            <p className="text-xs text-[#666]">Selecciona categoría y material para ver precios</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* === Servicios Adicionales (solo Reelens) === */}
                    {useReelens && (
                      <div>
                        <label className="text-xs text-[#666] uppercase mb-1.5 block">Servicios Adicionales</label>
                        <select value={cotBisel} onChange={e => setCotBisel(e.target.value)} className={selectClass} style={selectStyle}>
                          <option value="">Ninguno</option>
                          {Object.entries(biselOptions).map(([label, price]) => (
                            <option key={label} value={label}>{label} - {formatCurrency(price)}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* === Perfil de Ganancia === */}
                    <div>
                      <label className="text-xs text-[#666] uppercase mb-2 block">Perfil de Ganancia</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Básico', 'Estándar', 'Premium'] as const).map((profile) => (
                          <button key={profile} onClick={() => setProfitProfile(profile)} className={`p-3 rounded-xl text-center transition-all ${profitProfile === profile ? 'gold-glow' : ''}`} style={{ background: '#111', border: `1px solid ${profitProfile === profile ? '#D4AF37' : '#1a1a1a'}` }}>
                            <p className="text-xs font-bold text-[#D4AF37]">{profile}</p>
                            <p className="text-lg font-bold text-white">x{getMargin(profile)}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* === Desglose de Precio === */}
                    {selectedCotizacion && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                        <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Desglose de Precio</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-[#A0A0A0]">Material</span><span className="text-white">{selectedCotizacion.material}</span></div>
                          <div className="flex justify-between"><span className="text-[#A0A0A0]">Tipo</span><span className="text-white">{selectedCotizacion.tipoLente}</span></div>
                          {selectedCotizacion.columnLabel && <div className="flex justify-between"><span className="text-[#A0A0A0]">Rango</span><span className="text-white">{selectedCotizacion.columnLabel}</span></div>}
                          {selectedCotizacion.grupo && selectedCotizacion.provider === 'Cerlents' && <div className="flex justify-between"><span className="text-[#A0A0A0]">Grupo</span><span className="text-white">{selectedCotizacion.grupo}</span></div>}
                          <div className="flex justify-between"><span className="text-[#A0A0A0]">Proveedor</span><span className="text-white">{selectedCotizacion.provider}</span></div>
                          {cotBisel && (
                            <div className="flex justify-between"><span className="text-[#A0A0A0]">{cotBisel}</span><span className="text-yellow-400">{formatCurrency(cotBiselCost)}</span></div>
                          )}
                          <div className="h-px bg-[#222]" />
                          <div className="flex justify-between"><span className="text-[#A0A0A0]">Costo lente{cotBisel ? ' + servicio' : ''}</span><span className="text-white font-medium">{formatCurrency(cotCostTotal)}</span></div>
                          <div className="flex justify-between"><span className="text-[#A0A0A0]">Margen (x{cotMarginPct})</span><span className="text-green-400">{formatCurrency(cotMargin)}</span></div>
                          <div className="h-px bg-[#222]" />
                          <div className="flex justify-between items-center">
                            <span className="text-[#D4AF37] font-bold">PRECIO FINAL</span>
                            <span className="text-xl font-bold text-gold-gradient">{formatCurrency(cotFinal)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* === WhatsApp === */}
                    {selectedCotizacion && cotFinal > 0 && (
                      <button onClick={() => {
                        const formulaText = `\n\nFórmula:\nOD: ${prescription.od.sph || '—'} / ${prescription.od.cyl || '—'} × ${prescription.od.axis || '—'}${prescription.od.add ? ' Add ' + prescription.od.add : ''}\nOI: ${prescription.oi.sph || '—'} / ${prescription.oi.cyl || '—'} × ${prescription.oi.axis || '—'}${prescription.oi.add ? ' Add ' + prescription.oi.add : ''}`;
                        const text = `Juanita Pelaez Visión\n\nCotización:\nMaterial: ${selectedCotizacion.material}\nTipo: ${selectedCotizacion.tipoLente}\nPrecio: ${formatCurrency(cotFinal)}${formulaText}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }} className="w-full btn-gold flex items-center justify-center gap-2">
                        <Send size={16} /> Compartir Cotización por WhatsApp
                      </button>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ==================== CATALOG ==================== */}
          {activeTab === 'catalog' && (
            <motion.div key="catalog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Catálogo</h2>
                <div className="flex gap-2">
                  <button onClick={shareCatalogWhatsApp} className="p-2 rounded-lg bg-[#111] border border-[#222] text-green-400 hover:bg-[#1a1a1a] transition-colors" title="Compartir por WhatsApp"><Share2 size={18} /></button>
                  <button onClick={exportPDF} className="p-2 rounded-lg bg-[#111] border border-[#222] text-[#D4AF37] hover:bg-[#1a1a1a] transition-colors" title="Descargar PDF"><FileText size={18} /></button>
                  <button onClick={() => { setEditingProduct(null); setUploadForm({ image_url: '', description: '', gender: '', style: '', status: 'disponible', code: '' }); setShowUploadForm(true); }} className="btn-gold flex items-center gap-1 text-sm px-3 py-2"><Plus size={16} /> Subir</button>
                </div>
              </div>

              {/* 5 Catálogos principales + Todos */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['todos', 'mujer', 'hombre', 'nino', 'unisex', 'gafas_de_sol'].map((g) => (
                  <button key={g} onClick={() => setGenderFilter(g)} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${genderFilter === g ? 'bg-[#D4AF37] text-black' : 'bg-[#111] text-[#888] border border-[#222]'}`}>
                    {g === 'todos' ? '📋 Todos' : g === 'mujer' ? '👩 Mujer' : g === 'hombre' ? '👨 Hombre' : g === 'nino' ? '👶 Niños' : g === 'unisex' ? '🧑 Unisex' : '🕶️ Sol'}
                  </button>
                ))}
              </div>

              {/* Filtro de estado */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['todos', 'disponible', 'agotado', 'reservado', 'vendido'].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? (s === 'disponible' ? 'bg-green-600 text-white' : s === 'agotado' ? 'bg-red-600 text-white' : s === 'reservado' ? 'bg-yellow-600 text-white' : 'bg-orange-600 text-white') : 'bg-[#111] text-[#888] border border-[#222]'}`}>
                    {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
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
                      {/* Descripción - Selector de material */}
                      <div>
                        <label className="text-xs font-bold text-white block mb-1.5">Descripción *</label>
                        <select className="premium-input text-sm" value={uploadForm.description} onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}>
                          <option value="">Seleccionar...</option>
                          <option value="Acetato">Acetato</option>
                          <option value="Metal">Metal</option>
                          <option value="TR90">TR90</option>
                          <option value="Titanio">Titanio</option>
                          <option value="Acerada">Acerada</option>
                          <option value="Mixta">Mixta</option>
                          <option value="Tres Piezas">Tres Piezas</option>
                        </select>
                      </div>

                      {/* Género - Botones */}
                      <div>
                        <label className="text-xs font-bold text-white block mb-1.5">Género *</label>
                        <div className="flex flex-wrap gap-2">
                          {[{v: 'mujer', l: 'Mujer'}, {v: 'hombre', l: 'Hombre'}, {v: 'unisex', l: 'Unisex'}, {v: 'nino', l: 'Niño'}, {v: 'gafas_de_sol', l: 'Gafas de Sol'}].map((g) => (
                            <button key={g.v} type="button" onClick={() => setUploadForm((f) => ({ ...f, gender: g.v }))} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${uploadForm.gender === g.v ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0a0a0a] text-[#ccc] border border-[#333] hover:border-[#555]'}`}>{g.l}</button>
                          ))}
                        </div>
                      </div>

                      {/* Estilo - Botones */}
                      <div>
                        <label className="text-xs font-bold text-white block mb-1.5">Estilo *</label>
                        <div className="flex flex-wrap gap-2">
                          {[{v: 'classic', l: 'Classic'}, {v: 'sport', l: 'Sport'}, {v: 'vintage', l: 'Vintage'}, {v: 'modern', l: 'Modern'}, {v: 'cat_eye', l: 'Cat Eye'}, {v: 'aviator', l: 'Aviator'}, {v: 'bold', l: 'Bold'}, {v: 'ovalada', l: 'Ovalada'}, {v: 'cuadrada', l: 'Cuadrada'}, {v: 'redonda', l: 'Redonda'}, {v: 'rectangular', l: 'Rectangular'}, {v: 'wayfarer', l: 'Wayfarer'}, {v: 'clubmaster', l: 'Clubmaster'}, {v: 'media_luna', l: 'Media Luna'}, {v: 'otro', l: 'Otro'}].map((s) => (
                            <button key={s.v} type="button" onClick={() => setUploadForm((f) => ({ ...f, style: s.v }))} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${uploadForm.style === s.v ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0a0a0a] text-[#ccc] border border-[#333] hover:border-[#555]'}`}>{s.l}</button>
                          ))}
                        </div>
                      </div>

                      {/* Estado - 4 botones */}
                      <div>
                        <label className="text-xs font-bold text-white block mb-1.5">Estado *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setUploadForm((f) => ({ ...f, status: 'disponible' }))} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${uploadForm.status === 'disponible' ? 'bg-green-600 text-white border-green-500' : 'bg-[#0a0a0a] text-[#888] border border-[#333]'}`}>✅ Disponible</button>
                          <button type="button" onClick={() => setUploadForm((f) => ({ ...f, status: 'agotado' }))} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${uploadForm.status === 'agotado' ? 'bg-red-600 text-white border-red-500' : 'bg-[#0a0a0a] text-[#888] border border-[#333]'}`}>❌ Agotado</button>
                          <button type="button" onClick={() => setUploadForm((f) => ({ ...f, status: 'reservado' }))} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${uploadForm.status === 'reservado' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-[#0a0a0a] text-[#888] border border-[#333]'}`}>📌 Reservado</button>
                          <button type="button" onClick={() => setUploadForm((f) => ({ ...f, status: 'vendido' }))} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${uploadForm.status === 'vendido' ? 'bg-orange-600 text-white border-orange-500' : 'bg-[#0a0a0a] text-[#888] border border-[#333]'}`}>💰 Vendido</button>
                        </div>
                      </div>

                      {/* Código */}
                      <div>
                        <label className="text-xs font-bold text-white block mb-1.5">Código (Opcional)</label>
                        <input className="premium-input text-sm" placeholder="Ej: HD-001" value={uploadForm.code} onChange={(e) => setUploadForm((f) => ({ ...f, code: e.target.value }))} />
                      </div>
                      <button onClick={saveProduct} disabled={loading} className="w-full btn-gold flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {loading ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ==================== PRODUCT CATALOG BY STYLE GROUPS ==================== */}
              {(() => {
                // Filtrar productos por género y estado
                const filtered = products.filter((p) => {
                  if (genderFilter !== 'todos' && p.gender !== genderFilter) return false;
                  if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Package size={48} className="text-[#333] mx-auto mb-3" />
                      <p className="text-[#666]">No hay productos en este catálogo</p>
                      <button onClick={() => setShowUploadForm(true)} className="mt-4 btn-gold text-sm px-4 py-2">Subir Producto</button>
                    </div>
                  );
                }

                // Orden: primero por MATERIAL, luego por ESTILO
                const materialOrder = ['Acetato', 'Metal', 'TR90', 'Titanio', 'Acerada', 'Mixta', 'Tres Piezas'];
                const styleOrder = ['cuadrada', 'cat_eye', 'ovalada', 'redonda', 'rectangular', 'aviator', 'wayfarer', 'clubmaster', 'classic', 'sport', 'vintage', 'modern', 'bold', 'media_luna', 'otro'];
                const styleLabels: Record<string, string> = {
                  cuadrada: '📐 Cuadradas', cat_eye: '🐱 Cat Eye', ovalada: '⚪ Ovaladas',
                  redonda: '🔴 Redondas', rectangular: '▬ Rectangulares', aviator: '✈️ Aviador',
                  wayfarer: '🌊 Wayfarer', clubmaster: '🎩 Clubmaster', classic: '👑 Classic',
                  sport: '⚡ Sport', vintage: '🎞️ Vintage', modern: '💎 Modern',
                  bold: '💪 Bold', media_luna: '🌙 Media Luna', otro: '✨ Otros',
                };

                // Agrupar: material → estilo → productos
                const byMaterial: Record<string, Record<string, typeof filtered>> = {};
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
                // Productos con material no reconocido
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

                return (
                  <div className="space-y-8">
                    {Object.entries(byMaterial).map(([material, styles]) => (
                      <div key={material}>
                        {/* Encabezado de MATERIAL */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px flex-1 bg-[#D4AF37]/30" />
                          <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider whitespace-nowrap">
                            {material}
                          </h3>
                          <span className="text-[10px] text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                            {Object.values(styles).flat().length}
                          </span>
                          <div className="h-px flex-1 bg-[#D4AF37]/30" />
                        </div>

                        {/* Sub-grupos por ESTILO */}
                        {Object.entries(styles).map(([style, items]) => (
                          <div key={style} className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-px flex-1 bg-[#222]" />
                              <h4 className="text-[10px] font-semibold text-[#888] uppercase tracking-wider whitespace-nowrap">
                                {styleLabels[style] || style}
                              </h4>
                              <span className="text-[9px] text-[#444] bg-[#0a0a0a] px-1.5 py-0.5 rounded-full">{items.length}</span>
                              <div className="h-px flex-1 bg-[#222]" />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              {items.map((product) => (
                            <motion.div key={product.id} whileTap={{ scale: 0.98 }} className="rounded-xl overflow-hidden card-hover" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                              <div className="relative aspect-square bg-[#0a0a0a]">
                                {product.image_url ? (
                                  <>
                                    <img src={product.image_url} alt={product.description} className="w-full h-full object-cover" />
                                    {/* Marca de agua AGOTADO */}
                                    {product.status === 'agotado' && (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="absolute inset-0 bg-black/40" />
                                        <span className="relative text-red-500 font-black text-xl sm:text-2xl uppercase tracking-widest opacity-80" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)', transform: 'rotate(-15deg)' }}>AGOTADO</span>
                                      </div>
                                    )}
                                    {/* Marca de agua VENDIDO */}
                                    {product.status === 'vendido' && (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="absolute inset-0 bg-black/30" />
                                        <span className="relative text-orange-400 font-black text-xl sm:text-2xl uppercase tracking-widest opacity-70" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)', transform: 'rotate(-15deg)' }}>VENDIDO</span>
                                      </div>
                                    )}
                                    {/* Marca de agua RESERVADO */}
                                    {product.status === 'reservado' && (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="absolute inset-0 bg-black/20" />
                                        <span className="relative text-yellow-400 font-black text-xl sm:text-2xl uppercase tracking-widest opacity-70" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)', transform: 'rotate(-15deg)' }}>RESERVADO</span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Glasses size={40} className="text-[#333]" /></div>
                                )}
                                {/* Botones editar / borrar */}
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <button onClick={() => startEditProduct(product)} className="p-1.5 rounded-full bg-black/70 text-white hover:text-[#D4AF37] transition-colors" title="Editar"><Edit3 size={14} /></button>
                                  <button onClick={() => deleteProduct(product.id)} className="p-1.5 rounded-full bg-black/70 text-white hover:text-red-400 transition-colors" title="Borrar"><Trash2 size={14} /></button>
                                </div>
                              </div>

                              {/* Info del producto + botones de estado */}
                              <div className="p-2.5 space-y-2">
                                <p className="text-xs text-white truncate font-medium">{product.description || 'Sin descripción'}</p>
                                {product.code && <p className="text-[10px] text-[#666]">#{product.code}</p>}
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#888] capitalize">{(styleLabels[product.style] || product.style).replace(/^[^\s]+\s/, '')}</span>
                                  <button onClick={() => shareProduct(product)} className="p-1 rounded text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"><Share2 size={12} /></button>
                                </div>
                                {/* 4 botones de estado */}
                                <div className="grid grid-cols-4 gap-1 pt-1">
                                  <button onClick={() => updateProductStatus(product, 'disponible')} className={`py-1 rounded-lg text-[9px] font-bold transition-all ${product.status === 'disponible' ? 'bg-green-600 text-white' : 'bg-[#0a0a0a] text-[#555] hover:text-green-400'}`}>Disp.</button>
                                  <button onClick={() => updateProductStatus(product, 'agotado')} className={`py-1 rounded-lg text-[9px] font-bold transition-all ${product.status === 'agotado' ? 'bg-red-600 text-white' : 'bg-[#0a0a0a] text-[#555] hover:text-red-400'}`}>Agot.</button>
                                  <button onClick={() => updateProductStatus(product, 'reservado')} className={`py-1 rounded-lg text-[9px] font-bold transition-all ${product.status === 'reservado' ? 'bg-yellow-600 text-white' : 'bg-[#0a0a0a] text-[#555] hover:text-yellow-400'}`}>Res.</button>
                                  <button onClick={() => updateProductStatus(product, 'vendido')} className={`py-1 rounded-lg text-[9px] font-bold transition-all ${product.status === 'vendido' ? 'bg-orange-600 text-white' : 'bg-[#0a0a0a] text-[#555] hover:text-orange-400'}`}>Vend.</button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ==================== PROVEEDORES ==================== */}
          {activeTab === 'proveedores' && (
            <motion.div key="proveedores" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Building2 size={20} className="text-[#D4AF37]" /> Proveedores — Lentes</h2>

              {/* Proveedor Sub-tabs: Reelens / Cerlents */}
              <div className="flex gap-2">
                {(['Reelens', 'Cerlents'] as const).map((tab) => (
                  <button key={tab} onClick={() => { setProveedorSubTab(tab); fetchProviderLens(tab); setEditingLensRow(null); setShowAddLensForm(false); }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      proveedorSubTab === tab
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                        : 'bg-[#111] text-[#888] border border-[#1a1a1a] hover:border-[#333]'
                    }`}>
                    <Glasses size={16} />
                    {tab}
                  </button>
                ))}
              </div>

              {/* Stats Reelens - solo cuando sub-tab es Reelens */}
              {proveedorSubTab === 'Reelens' && (
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const cats = providerLensData.reduce<Record<string, number>>((acc, r) => { acc[r.categoria] = (acc[r.categoria] || 0) + 1; return acc; }, {});
                  const catColors: Record<string, { bg: string; label: string }> = {
                    'Lentes Terminados': { bg: 'bg-yellow-500/20 border-yellow-600/30', label: '🟡 Terminados' },
                    'Blue Vision Sencilla': { bg: 'bg-sky-500/20 border-sky-600/30', label: '🔵 Blue Vision' },
                    'Bifocales': { bg: 'bg-green-500/20 border-green-600/30', label: '🟢 Bifocales' },
                    'Talla Convencional': { bg: 'bg-blue-800/30 border-blue-700/30', label: '🔷 Convencional' },
                    'Lentes Terminados Progresivos': { bg: 'bg-purple-500/20 border-purple-600/30', label: '🟣 Progresivos' },
                  };
                  return Object.entries(catColors).map(([cat, { bg, label }]) => (
                    <div key={cat} className={`rounded-lg p-2.5 text-center border ${bg}`}>
                      <p className="text-lg font-bold text-white">{cats[cat] || 0}</p>
                      <p className="text-[10px] text-[#aaa]">{label}</p>
                    </div>
                  ));
                })()}
              </div>
              )}

              {/* Agregar nuevo lente (admin) */}
              {currentUser?.role === 'admin' && (
                <div className="space-y-3">
                  {!showAddLensForm ? (
                    <button onClick={() => setShowAddLensForm(true)} className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-all flex items-center justify-center gap-2">
                      <Plus size={16} /> Agregar Lente
                    </button>
                  ) : (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Nuevo Lente — {proveedorSubTab}</h3>
                        <button onClick={() => { setShowAddLensForm(false); setAddLensForm({ categoria: '', material: '', tipo_lente: '', esferas: '', cilindro: '', adicion: '', precio_par: 0 }); }} className="text-[#888] hover:text-white"><X size={18} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="premium-input text-xs" value={addLensForm.categoria} onChange={(e) => setAddLensForm({ ...addLensForm, categoria: e.target.value })}>
                          <option value="">Categoría</option>
                          <option value="Lentes Terminados">Lentes Terminados</option>
                          <option value="Blue Vision Sencilla">Blue Vision Sencilla</option>
                          <option value="Bifocales">Bifocales</option>
                          <option value="Talla Convencional">Talla Convencional</option>
                          <option value="Lentes Terminados Progresivos">Lentes Terminados Progresivos</option>
                        </select>
                        <input className="premium-input text-xs" placeholder="Material" value={addLensForm.material} onChange={(e) => setAddLensForm({ ...addLensForm, material: e.target.value })} />
                        <input className="premium-input text-xs" placeholder="Tipo lente (opcional)" value={addLensForm.tipo_lente} onChange={(e) => setAddLensForm({ ...addLensForm, tipo_lente: e.target.value })} />
                        <input className="premium-input text-xs" placeholder="Esferas" value={addLensForm.esferas} onChange={(e) => setAddLensForm({ ...addLensForm, esferas: e.target.value })} />
                        <input className="premium-input text-xs" placeholder="Cilindro" value={addLensForm.cilindro} onChange={(e) => setAddLensForm({ ...addLensForm, cilindro: e.target.value })} />
                        <input className="premium-input text-xs" placeholder="Adición" value={addLensForm.adicion} onChange={(e) => setAddLensForm({ ...addLensForm, adicion: e.target.value })} />
                        <input className="premium-input text-xs" type="number" placeholder="Precio par ($)" value={addLensForm.precio_par || ''} onChange={(e) => setAddLensForm({ ...addLensForm, precio_par: Number(e.target.value) })} />
                      </div>
                      <button onClick={addNewLens} disabled={loading} className="w-full btn-gold flex items-center justify-center gap-2 text-sm">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Crear Lente
                      </button>
                    </div>
                  )}
                </div>
              )}

              {proveedorSubTab === 'Reelens' && (
              <>
              {/* Tablas coloreadas por categoría */}
              {providerLensData.length === 0 ? (
                <div className="text-center py-12 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                  <Glasses size={40} className="text-[#333] mx-auto mb-3" />
                  <p className="text-sm text-[#666]">No hay lentes para {proveedorSubTab}</p>
                  <p className="text-xs text-[#444] mt-1">Agrega lentes usando el botón de arriba</p>
                </div>
              ) : (
                (() => {
                  const categoryOrder = ['Lentes Terminados', 'Blue Vision Sencilla', 'Lentes Terminados Progresivos', 'Bifocales', 'Talla Convencional'];
                  const categoryStyles: Record<string, { headerBg: string; headerText: string; rowBg: string; borderColor: string; accentColor: string }> = {
                    'Lentes Terminados': { headerBg: 'background: rgba(234,179,8,0.15)', headerText: 'color: #EAB308', rowBg: 'background: rgba(234,179,8,0.05)', borderColor: 'border-color: rgba(234,179,8,0.2)', accentColor: '#EAB308' },
                    'Blue Vision Sencilla': { headerBg: 'background: rgba(56,189,248,0.12)', headerText: 'color: #38BDF8', rowBg: 'background: rgba(56,189,248,0.04)', borderColor: 'border-color: rgba(56,189,248,0.2)', accentColor: '#38BDF8' },
                    'Bifocales': { headerBg: 'background: rgba(34,197,94,0.12)', headerText: 'color: #22C55E', rowBg: 'background: rgba(34,197,94,0.04)', borderColor: 'border-color: rgba(34,197,94,0.2)', accentColor: '#22C55E' },
                    'Talla Convencional': { headerBg: 'background: rgba(59,130,246,0.15)', headerText: 'color: #60A5FA', rowBg: 'background: rgba(59,130,246,0.04)', borderColor: 'border-color: rgba(59,130,246,0.2)', accentColor: '#60A5FA' },
                    'Lentes Terminados Progresivos': { headerBg: 'background: rgba(168,85,247,0.12)', headerText: 'color: #A855F7', rowBg: 'background: rgba(168,85,247,0.04)', borderColor: 'border-color: rgba(168,85,247,0.2)', accentColor: '#A855F7' },
                  };
                  const grouped = categoryOrder.map(cat => ({
                    name: cat,
                    items: providerLensData.filter(r => r.categoria === cat),
                    style: categoryStyles[cat],
                  })).filter(g => g.items.length > 0);

                  return grouped.map(group => (
                    <div key={group.name} className="rounded-xl overflow-hidden" style={{ border: group.style.borderColor, borderWidth: '1px' }}>
                      {/* Header de categoría */}
                      <div className="px-4 py-2.5 flex items-center justify-between" style={Object.fromEntries(group.style.headerBg.split(', ').map(p => p.split(': ')))}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: group.style.accentColor }} />
                          <h3 className="text-sm font-bold" style={{ color: group.style.accentColor }}>{group.name}</h3>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${group.style.accentColor}20`, color: group.style.accentColor }}>{group.items.length} lentes</span>
                      </div>

                      {/* Talla Convencional: tabla pivotada por material */}
                      {group.name === 'Talla Convencional' ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[#888] border-b" style={{ borderBottomColor: `${group.style.accentColor}20` }}>
                                <th className="text-left px-3 py-2 font-medium" style={{ minWidth: '130px' }}>Material</th>
                                <th className="text-right px-3 py-2 font-medium" colSpan={2}>Visión Sencilla</th>
                                <th className="text-center px-1 py-2 font-medium" colSpan={2} style={{ borderBottom: `2px solid ${group.style.accentColor}40` }}>Bifocal</th>
                                <th className="text-right px-3 py-2 font-medium">Progresivo</th>
                                {currentUser?.role === 'admin' && <th className="text-center px-2 py-2 font-medium">Acciones</th>}
                              </tr>
                              <tr className="text-[10px] text-[#666] border-b" style={{ borderBottomColor: `${group.style.accentColor}10` }}>
                                <th />
                                <th className="px-3 py-1" />
                                <th className="px-1 py-1" />
                                <th className="px-3 py-1 font-medium" style={{ color: group.style.accentColor }}>Invisible</th>
                                <th className="px-3 py-1 font-medium" style={{ color: group.style.accentColor }}>Flat Top</th>
                                <th className="px-3 py-1" />
                                {currentUser?.role === 'admin' && <th />}
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const materials = [...new Set(group.items.map(r => r.material))];
                                return materials.map((mat, idx) => {
                                  const rows = group.items.filter(r => r.material === mat);
                                  const vs = rows.find(r => r.tipo_lente === 'Vision Sencilla');
                                  const bi = rows.find(r => r.tipo_lente === 'Bifocal Invisible');
                                  const bf = rows.find(r => r.tipo_lente === 'Bifocal Flat Top');
                                  const pr = rows.find(r => r.tipo_lente === 'Progresivo');
                                  return (
                                    <tr key={mat} className="transition-colors hover:brightness-125" style={idx % 2 === 0 ? Object.fromEntries(group.style.rowBg.split(', ').map(p => p.split(': '))) : undefined}>
                                      <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{mat}</td>
                                      <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: group.style.accentColor }}>{vs ? formatCurrency(vs.precio_par) : '—'}</td>
                                      <td className="px-1 py-2.5">
                                        {currentUser?.role === 'admin' && vs ? (
                                          <button onClick={() => startEditLensRow(vs)} className="p-1 rounded hover:bg-white/10" title="Editar V.Sencilla"><Edit3 size={10} className="text-[#D4AF37]/60" /></button>
                                        ) : null}
                                      </td>
                                      <td className="px-3 py-2.5 text-center whitespace-nowrap" style={{ background: `${group.style.accentColor}06` }}>
                                        <span className="text-white font-semibold">{bi ? formatCurrency(bi.precio_par) : '—'}</span>
                                        {currentUser?.role === 'admin' && bi && (
                                          <button onClick={() => startEditLensRow(bi)} className="p-0.5 ml-1 rounded hover:bg-white/10" title="Editar Invisible"><Edit3 size={9} className="text-[#D4AF37]/50" /></button>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-center whitespace-nowrap" style={{ background: `${group.style.accentColor}06` }}>
                                        <span className="text-white font-semibold">{bf ? formatCurrency(bf.precio_par) : '—'}</span>
                                        {currentUser?.role === 'admin' && bf && (
                                          <button onClick={() => startEditLensRow(bf)} className="p-0.5 ml-1 rounded hover:bg-white/10" title="Editar Flat Top"><Edit3 size={9} className="text-[#D4AF37]/50" /></button>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: group.style.accentColor }}>{pr ? formatCurrency(pr.precio_par) : '—'}</td>
                                      {currentUser?.role === 'admin' && (
                                        <td className="px-2 py-2.5">
                                          {pr ? (
                                            <button onClick={() => startEditLensRow(pr)} className="p-1 rounded hover:bg-white/10" title="Editar Progresivo"><Edit3 size={10} className="text-[#D4AF37]/60" /></button>
                                          ) : null}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* Tablas normales: Lentes Terminados, Blue Vision, Bifocales */
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[#888] border-b" style={{ borderBottomColor: `${group.style.accentColor}15` }}>
                                <th className="text-left px-3 py-2 font-medium w-6">#</th>
                                <th className="text-left px-3 py-2 font-medium" style={{ minWidth: '140px' }}>Material</th>
                                <th className="text-left px-3 py-2 font-medium">Esferas</th>
                                {!(group.name === 'Bifocales' || group.name === 'Lentes Terminados Progresivos') && <th className="text-left px-3 py-2 font-medium">Cilindro</th>}
                                {(group.name === 'Bifocales' || group.name === 'Lentes Terminados Progresivos') && <th className="text-left px-3 py-2 font-medium">Adición</th>}
                                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Precio Par</th>
                                {currentUser?.role === 'admin' && <th className="text-center px-3 py-2 font-medium">Acciones</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item, idx) => (
                                <tr key={item.id} className="transition-colors hover:brightness-125" style={idx % 2 === 0 ? Object.fromEntries(group.style.rowBg.split(', ').map(p => p.split(': '))) : undefined}>
                                  <td className="px-3 py-2 text-[#666]">{idx + 1}</td>
                                  <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{item.material}</td>
                                  <td className="px-3 py-2 text-[#ccc]">{item.esferas || '—'}</td>
                                  {!(group.name === 'Bifocales' || group.name === 'Lentes Terminados Progresivos') && <td className="px-3 py-2 text-[#ccc]">{item.cilindro || '—'}</td>}
                                  {(group.name === 'Bifocales' || group.name === 'Lentes Terminados Progresivos') && <td className="px-3 py-2 text-[#ccc]">{item.adicion || '—'}</td>}
                                  <td className="px-3 py-2 text-right font-bold whitespace-nowrap" style={{ color: group.style.accentColor }}>{formatCurrency(item.precio_par)}</td>
                                  {currentUser?.role === 'admin' && (
                                    <td className="px-3 py-2">
                                      <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => startEditLensRow(item)} className="p-1.5 rounded-md hover:bg-white/10 transition-colors" title="Editar">
                                          <Edit3 size={13} className="text-[#D4AF37]" />
                                        </button>
                                        <button onClick={() => deleteLensRow(item.id)} className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors" title="Eliminar">
                                          <Trash2 size={13} className="text-red-400" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ));
                })()
              )}

              {/* Modal de edición (admin) */}
              <AnimatePresence>
                {editingLensRow && currentUser?.role === 'admin' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setEditingLensRow(null)}>
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={(e) => e.stopPropagation()}
                      className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white">Editar Lente</h3>
                          <p className="text-xs text-[#888]">{editingLensRow.categoria} — {editingLensRow.material}</p>
                        </div>
                        <button onClick={() => setEditingLensRow(null)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} className="text-[#888]" /></button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-[#666] mb-1 block">Material</label>
                          <input className="premium-input text-sm w-full" value={lensEditForm.material} onChange={(e) => setLensEditForm({ ...lensEditForm, material: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs text-[#666] mb-1 block">Tipo Lente</label>
                          <input className="premium-input text-sm w-full" value={lensEditForm.tipo_lente} onChange={(e) => setLensEditForm({ ...lensEditForm, tipo_lente: e.target.value })} placeholder="Opcional" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-[#666] mb-1 block">Esferas</label>
                            <input className="premium-input text-sm w-full" value={lensEditForm.esferas} onChange={(e) => setLensEditForm({ ...lensEditForm, esferas: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-[#666] mb-1 block">Cilindro</label>
                            <input className="premium-input text-sm w-full" value={lensEditForm.cilindro} onChange={(e) => setLensEditForm({ ...lensEditForm, cilindro: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-[#666] mb-1 block">Adición</label>
                            <input className="premium-input text-sm w-full" value={lensEditForm.adicion} onChange={(e) => setLensEditForm({ ...lensEditForm, adicion: e.target.value })} placeholder="Ej: +1.00/+3.00" />
                          </div>
                          <div>
                            <label className="text-xs text-[#666] mb-1 block">Precio Par (COP)</label>
                            <input className="premium-input text-sm w-full" type="number" value={lensEditForm.precio_par || ''} onChange={(e) => setLensEditForm({ ...lensEditForm, precio_par: Number(e.target.value) })} />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingLensRow(null)} className="flex-1 py-2.5 rounded-lg text-sm text-[#888] bg-[#1a1a1a] hover:bg-[#222] transition-colors">Cancelar</button>
                        <button onClick={saveLensRow} disabled={loading} className="flex-1 btn-gold flex items-center justify-center gap-2 text-sm">
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              </>
              )}

              {/* ============ TAB CERLENS ============ */}
              {proveedorSubTab === 'Cerlents' && (
                <div className="space-y-4">
                  {/* Stats por grupo */}
                  <div className="grid grid-cols-4 gap-2">
                    {(() => {
                      const grupos = cerlensData.reduce<Record<string, number>>((acc, r) => { acc[r.grupo] = (acc[r.grupo] || 0) + 1; return acc; }, {});
                      const gStyles: Record<string, { bg: string; label: string }> = {
                        'Lentes Claros': { bg: 'bg-amber-500/20 border-amber-600/30', label: '🟡 Claros' },
                        'Lentes Fotosensibles': { bg: 'bg-orange-500/20 border-orange-600/30', label: '🟠 Fotosensibles' },
                        'Lentes Mirror': { bg: 'bg-pink-500/20 border-pink-600/30', label: '🩷 Mirror' },
                        'Lentes Polarizados': { bg: 'bg-cyan-500/20 border-cyan-600/30', label: '🩵 Polarizados' },
                      };
                      return Object.entries(gStyles).map(([g, { bg, label }]) => (
                        <div key={g} className={`rounded-lg p-2.5 text-center border ${bg}`}>
                          <p className="text-lg font-bold text-white">{grupos[g] || 0}</p>
                          <p className="text-[10px] text-[#aaa]">{label}</p>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Tabla Cerlents pivotada por grupo */}
                  {cerlensData.length === 0 ? (
                    <div className="text-center py-12 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <Glasses size={40} className="text-[#333] mx-auto mb-3" />
                      <p className="text-sm text-[#666]">No hay datos de Cerlents</p>
                    </div>
                  ) : (
                    (() => {
                      const grupoOrder = ['Lentes Claros', 'Lentes Fotosensibles', 'Lentes Mirror', 'Lentes Polarizados'];
                      const grupoColors: Record<string, string> = {
                        'Lentes Claros': '#F59E0B',
                        'Lentes Fotosensibles': '#F97316',
                        'Lentes Mirror': '#EC4899',
                        'Lentes Polarizados': '#06B6D4',
                      };

                      // Column definitions: [key, label, span, group]
                      const colGroups = [
                        { name: 'PROGRESIVOS', cols: [
                          ['prog_prime', 'Prime Max'], ['prog_ventrix', 'Ventrix Max'], ['prog_advance', 'Advance Max'],
                          ['prog_confort', 'Confort Max'], ['prog_practice_20', 'Practice 2.0'], ['prog_practice', 'Practice'],
                        ]},
                        { name: 'BIFOCALES', cols: [['bif_invisible', 'Invisible'], ['bif_bfree', 'B-Free']] },
                        { name: 'OCUPACIONAL', cols: [['ocu_ocupacional', 'Ocupacional']] },
                        { name: 'MONOFOCALES', cols: [['mono_simple', 'Simple'], ['mono_relax', 'Relax'], ['mono_kids', 'Kids']] },
                      ];

                      return grupoOrder.map(grupo => {
                        const items = cerlensData.filter(r => r.grupo === grupo);
                        if (!items.length) return null;
                        const color = grupoColors[grupo] || '#888';

                        return (
                          <div key={grupo} className="rounded-xl overflow-hidden" style={{ border: `${color}30`, borderWidth: '1px' }}>
                            {/* Header grupo */}
                            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: `${color}15` }}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                <h3 className="text-sm font-bold" style={{ color: color }}>{grupo}</h3>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{items.length} materiales</span>
                            </div>

                            {/* Tabla */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead>
                                  {/* Row 1: Group headers */}
                                  <tr>
                                    <th rowSpan={2} className="text-left px-2 py-1.5 font-medium text-[#888] sticky left-0 bg-[#0a0a0a] z-10" style={{ minWidth: '120px' }}>Material</th>
                                    {colGroups.map(g => (
                                      <th key={g.name} colSpan={g.cols.length} className="text-center px-1 py-1.5 font-bold text-[11px] uppercase tracking-wider" style={{ color, borderBottom: `2px solid ${color}40` }}>
                                        {g.name}
                                      </th>
                                    ))}
                                    {currentUser?.role === 'admin' && <th rowSpan={2} className="px-1 py-1.5" />}
                                  </tr>
                                  {/* Row 2: Sub-column headers */}
                                  <tr className="text-[#666]">
                                    {colGroups.map(g => g.cols.map(([key, label]) => (
                                      <th key={key} className="text-center px-1 py-1 font-medium whitespace-nowrap" style={{ color: `${color}99`, borderBottom: `${color}15` }}>
                                        {label}
                                      </th>
                                    )))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, idx) => (
                                    <tr key={item.id} className="transition-colors hover:brightness-125" style={idx % 2 === 0 ? { background: `${color}05` } : undefined}>
                                      <td className="px-2 py-1.5 text-white font-medium whitespace-nowrap sticky left-0 z-10" style={{ background: idx % 2 === 0 ? '#0f0f0f' : '#0a0a0a' }}>
                                        {item.material}
                                      </td>
                                      {colGroups.map(g => g.cols.map(([key]) => {
                                        const val = item[key] as number | null;
                                        const isNull = val === null || val === undefined;
                                        return (
                                          <td key={key} className="text-center px-1 py-1.5 whitespace-nowrap relative group/col">
                                            {isNull ? (
                                              <span className="text-[#333]">—</span>
                                            ) : currentUser?.role === 'admin' ? (
                                              <button
                                                onClick={() => setEditingCerlens(item)}
                                                className="font-bold cursor-pointer hover:underline"
                                                style={{ color }}
                                                title="Click para editar"
                                              >
                                                {formatCurrency(val)}
                                              </button>
                                            ) : (
                                              <span className="font-bold" style={{ color }}>{formatCurrency(val)}</span>
                                            )}
                                          </td>
                                        );
                                      }))}
                                      {currentUser?.role === 'admin' && (
                                        <td className="px-1 py-1.5">
                                          <button onClick={() => deleteCerlensRow(item.id)} className="p-1 rounded hover:bg-red-500/10" title="Eliminar">
                                            <Trash2 size={11} className="text-red-400/60 hover:text-red-400" />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}

                  {/* Modal edición Cerlens (admin) */}
                  <AnimatePresence>
                    {editingCerlens && currentUser?.role === 'admin' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setEditingCerlens(null)}>
                        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={(e) => e.stopPropagation()}
                          className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-white">Editar Precios</h3>
                              <p className="text-xs text-[#888]">{editingCerlens.grupo} — {editingCerlens.material}</p>
                            </div>
                            <button onClick={() => setEditingCerlens(null)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} className="text-[#888]" /></button>
                          </div>
                          <CerlensEditForm item={editingCerlens} onSave={saveCerlensCell} onClose={() => setEditingCerlens(null)} formatCurrency={formatCurrency} />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== SOPORTE ==================== */}
          {activeTab === 'soporte' && (
            <motion.div key="soporte" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={20} className="text-[#D4AF37]" /> Soporte Técnico</h2>

              {/* Soporte Sub-tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {([
                  { id: 'backup' as const, label: 'Respaldo', icon: <Download size={14} /> },
                  ...(currentUser?.role === 'admin' ? [
                    { id: 'users' as const, label: 'Usuarios', icon: <Users size={14} /> },
                    { id: 'proveedores' as const, label: 'Proveedores', icon: <Building2 size={14} /> },
                  ] : []),
                  { id: 'database' as const, label: 'Base Datos', icon: <Database size={14} /> },
                ]).map((tab) => (
                  <button key={tab.id} onClick={() => { setSoporteSubTab(tab.id); if (tab.id === 'users') fetchUsers(); if (tab.id === 'proveedores') fetchProviders(); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${soporteSubTab === tab.id ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-[#111] text-[#888] border border-[#1a1a1a]'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* === Backup Tab === */}
              {soporteSubTab === 'backup' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-5 space-y-4" style={{ background: 'linear-gradient(135deg, #1a1505 0%, #111 100%)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                        <Download size={24} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#D4AF37]">Respaldo de Datos</h3>
                        <p className="text-xs text-[#888]">Exporta toda la información como archivo JSON</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#666]">Se descargarán: productos, proveedores, precios de lentes y configuración de márgenes.</p>
                    <button onClick={exportBackup} disabled={loading} className="w-full btn-gold flex items-center justify-center gap-2">
                      <Download size={16} />
                      Descargar Respaldo JSON
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Productos', value: products.length },
                      { label: 'Proveedores', value: providers.length },
                      { label: 'Precios Lentes', value: lensPrices.length },
                      { label: 'Márgenes', value: settingsList.length },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                        <p className="text-xl font-bold text-white">{item.value}</p>
                        <p className="text-xs text-[#666]">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === Users Tab (Admin only) === */}
              {soporteSubTab === 'users' && currentUser?.role === 'admin' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#A0A0A0]">{usersList.length} usuarios</p>
                    <button onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'employee' }); setShowUserForm(true); }} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1"><UserPlus size={14} /> Nuevo</button>
                  </div>

                  {showUserForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #222' }}>
                      <input className="premium-input text-sm" placeholder="Nombre completo *" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} />
                      <input type="email" className="premium-input text-sm" placeholder="Email *" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} />
                      {!editingUser && (
                        <input type="password" className="premium-input text-sm" placeholder="Contraseña *" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} />
                      )}
                      <select className="premium-input text-sm" value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as 'admin' | 'employee' }))}>
                        <option value="employee">Empleado</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={saveUser} disabled={loading} className="flex-1 btn-gold text-sm flex items-center justify-center gap-1">{loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingUser ? 'Actualizar' : 'Crear'}</button>
                        <button onClick={() => { setShowUserForm(false); setEditingUser(null); }} className="px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] text-[#888]">Cancelar</button>
                      </div>
                    </motion.div>
                  )}

                  {usersList.map((user) => (
                    <div key={user.id} className="rounded-xl p-3 flex items-center justify-between card-hover" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-[#666]">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#333] text-[#888]'}`}>{user.role === 'admin' ? 'Admin' : 'Empleado'}</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingUser(user); setUserForm({ name: user.name, email: user.email, password: '', role: user.role }); setShowUserForm(true); }} className="p-1.5 rounded-lg text-[#666] hover:text-[#D4AF37] transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded-lg text-[#666] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* === Proveedores Tab (Admin only) === */}
              {soporteSubTab === 'proveedores' && currentUser?.role === 'admin' && (
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
                        <button onClick={saveProvider} disabled={loading} className="flex-1 btn-gold text-sm flex items-center justify-center gap-1">{loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingProvider ? 'Actualizar' : 'Crear'}</button>
                        <button onClick={() => { setShowProviderForm(false); setEditingProvider(null); }} className="px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] text-[#888]">Cancelar</button>
                      </div>
                    </motion.div>
                  )}

                  {providers.map((prov) => (
                    <div key={prov.id} className="rounded-xl p-3 flex items-center justify-between card-hover" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div>
                        <p className="text-sm font-medium text-white">{prov.name}</p>
                        <p className="text-xs text-[#666]">{prov.contact || 'Sin contacto'} {prov.phone ? `· ${prov.phone}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#3B82F6]/20 text-blue-400">Proveedor</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingProvider(prov); setProviderForm({ name: prov.name, contact: prov.contact || '', phone: prov.phone || '' }); setShowProviderForm(true); }} className="p-1.5 rounded-lg text-[#666] hover:text-[#D4AF37] transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => deleteProvider(prov.id)} className="p-1.5 rounded-lg text-[#666] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* === Database Tab === */}
              {soporteSubTab === 'database' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <h3 className="text-sm font-semibold text-[#D4AF37]">Estado de la Base de Datos</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Productos', value: products.length, ok: products.length >= 0 },
                        { label: 'Proveedores', value: providers.length, ok: providers.length > 0 },
                        { label: 'Precios', value: lensPrices.length, ok: lensPrices.length > 0 },
                        { label: 'Márgenes', value: settingsList.length, ok: settingsList.length > 0 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg p-3 bg-[#0a0a0a] text-center">
                          <p className="text-xl font-bold text-white">{item.value}</p>
                          <p className="text-xs text-[#666]">{item.label}</p>
                          <p className={`text-[10px] ${item.ok ? 'text-green-400' : 'text-yellow-400'}`}>{item.ok ? '✓ OK' : '⚠ Requiere atención'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SQL para crear tabla products */}
                  <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(212,175,55,0.3)' }}>
                    <h3 className="text-sm font-bold text-[#D4AF37] mb-2">Tabla products</h3>
                    <p className="text-xs text-[#A0A0A0] mb-3">Ejecuta este SQL en el <strong>SQL Editor</strong> de Supabase:</p>
                    <pre className="text-[10px] leading-relaxed text-[#ccc] bg-[#0a0a0a] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  description TEXT,
  gender TEXT DEFAULT 'unisex',
  style TEXT DEFAULT 'moderno',
  status TEXT DEFAULT 'disponible',
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_products" ON products
  FOR ALL USING (true) WITH CHECK (true);`}</pre>
                  </div>

                  <button onClick={initDatabase} disabled={loading} className="w-full py-3 rounded-xl bg-[#111] border border-[#D4AF37]/30 text-[#D4AF37] font-medium flex items-center justify-center gap-2 hover:bg-[#D4AF37]/10 transition-colors">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Verificar Conexión
                  </button>
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
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${activeTab === tab.id ? 'text-[#D4AF37]' : 'text-[#555] hover:text-[#888]'}`}
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
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
