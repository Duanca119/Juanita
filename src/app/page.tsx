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
type SoporteSubTab = 'backup' | 'users' | 'database';

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
  od: { sph: string; cyl: string; axis: string };
  oi: { sph: string; cyl: string; axis: string };
  add: string;
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
    return item ? item.profit_margin * 100 : 0;
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
    od: { sph: '', cyl: '', axis: '' },
    oi: { sph: '', cyl: '', axis: '' },
    add: '',
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Pricing - adaptado al esquema real con extras individuales
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedLens, setSelectedLens] = useState<LensPrice | null>(null);
  const [addBlueFilter, setAddBlueFilter] = useState(false);
  const [addPhotochromic, setAddPhotochromic] = useState(false);
  const [addAntireflective, setAddAntireflective] = useState(false);
  const [profitProfile, setProfitProfile] = useState<'Básico' | 'Estándar' | 'Premium'>('Estándar');

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
    const margin = cost * (marginPct / 100);
    const finalPrice = cost + margin;
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
      : allTabs.filter((t) => ['home', 'formula', 'catalog', 'proveedores'].includes(t.id)))
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
                    <button onClick={() => { setFormulaImage(null); setFormulaMode('none'); setPrescription({ od: { sph: '', cyl: '', axis: '' }, oi: { sph: '', cyl: '', axis: '' }, add: '' }); setRecommendations([]); setShowFormulaFields(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-red-400" style={{ background: '#111', border: '1px solid #2a1a1a' }}>
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
                <button onClick={() => { setShowFormulaFields(false); setFormulaMode('none'); setPrescription({ od: { sph: '', cyl: '', axis: '' }, oi: { sph: '', cyl: '', axis: '' }, add: '' }); setRecommendations([]); }} className="text-xs text-[#555] hover:text-[#888] transition-colors">
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
                  <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <label className="text-xs text-[#666] uppercase">ADD (Adición)</label>
                    <input className="premium-input text-sm mt-1" value={prescription.add} onChange={(e) => setPrescription((p) => ({ ...p, add: e.target.value }))} placeholder="Ej: +2.50" />
                  </div>

                  {/* Botón limpiar formulario manual */}
                  <button onClick={() => { setPrescription({ od: { sph: '', cyl: '', axis: '' }, oi: { sph: '', cyl: '', axis: '' }, add: '' }); setRecommendations([]); }} className="w-full py-2.5 rounded-xl text-xs text-[#888] hover:text-white transition-colors" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
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

              {/* Provider */}
              <div>
                <label className="text-xs text-[#666] uppercase mb-1 block">Proveedor</label>
                <select className="premium-input" value={selectedProvider} onChange={(e) => { setSelectedProvider(e.target.value); setSelectedLens(null); setAddBlueFilter(false); setAddPhotochromic(false); setAddAntireflective(false); }}>
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
                  setAddBlueFilter(false); setAddPhotochromic(false); setAddAntireflective(false);
                }} disabled={!selectedProvider}>
                  <option value="">Seleccionar lente...</option>
                  {lensPrices.filter((l) => l.provider_id === selectedProvider).map((l) => (
                    <option key={l.id} value={l.id}>{l.lens_type} ({l.quality}) - {formatCurrency(l.base_price)}</option>
                  ))}
                </select>
              </div>

              {/* Extras (adaptado al esquema real con precios individuales) */}
              {selectedLens && (
                <div className="space-y-2">
                  <label className="text-xs text-[#666] uppercase mb-1 block">Recubrimientos y Extras</label>
                  {[
                    { label: 'Filtro Azul (Blue Filter)', price: selectedLens.blue_filter, checked: addBlueFilter, toggle: () => setAddBlueFilter(!addBlueFilter) },
                    { label: 'Fotocromático', price: selectedLens.photochromic, checked: addPhotochromic, toggle: () => setAddPhotochromic(!addPhotochromic) },
                    { label: 'Antirreflejo', price: selectedLens.antireflective, checked: addAntireflective, toggle: () => setAddAntireflective(!addAntireflective) },
                  ].map((extra) => (
                    <button key={extra.label} onClick={extra.toggle} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${extra.checked ? 'border-[#D4AF37] bg-[#D4AF37]/5' : ''}`} style={{ background: '#111', border: `1px solid ${extra.checked ? '#D4AF37' : '#1a1a1a'}` }}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${extra.checked ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-[#333]'}`}>
                          {extra.checked && <Check size={12} className="text-black" />}
                        </div>
                        <span className="text-sm text-white">{extra.label}</span>
                      </div>
                      <span className={`text-sm font-medium ${extra.checked ? 'text-[#D4AF37]' : 'text-[#666]'}`}>+{formatCurrency(extra.price)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Profit Profile */}
              <div>
                <label className="text-xs text-[#666] uppercase mb-2 block">Perfil de Ganancia</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Básico', 'Estándar', 'Premium'] as const).map((profile) => (
                    <button key={profile} onClick={() => setProfitProfile(profile)} className={`p-3 rounded-xl text-center transition-all ${profitProfile === profile ? 'gold-glow' : ''}`} style={{ background: '#111', border: `1px solid ${profitProfile === profile ? '#D4AF37' : '#1a1a1a'}` }}>
                      <p className="text-xs font-bold text-[#D4AF37]">{profile}</p>
                      <p className="text-lg font-bold text-white">{Math.round(getMargin(profile))}%</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Desglose de Precio</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Precio base</span><span>{formatCurrency(pricingCalc.base)}</span></div>
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Extras</span><span>{formatCurrency(pricingCalc.extrasTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Subtotal (costo)</span><span className="text-white font-medium">{formatCurrency(pricingCalc.cost)}</span></div>
                  <div className="flex justify-between"><span className="text-[#A0A0A0]">Margen ({Math.round(pricingCalc.marginPct)}%)</span><span className="text-green-400">{formatCurrency(pricingCalc.margin)}</span></div>
                  <div className="h-px bg-[#222]" />
                  <div className="flex justify-between items-center">
                    <span className="text-[#D4AF37] font-bold">PRECIO FINAL</span>
                    <span className="text-xl font-bold text-gold-gradient">{formatCurrency(pricingCalc.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {pricingCalc.finalPrice > 0 && (
                <button onClick={() => {
                  const extrasList = [];
                  if (addBlueFilter) extrasList.push('Filtro Azul');
                  if (addPhotochromic) extrasList.push('Fotocromático');
                  if (addAntireflective) extrasList.push('Antirreflejo');
                  const text = `👓 Juanita Pelaez Visión\n\nCotización:\nLente: ${selectedLens?.lens_type} (${selectedLens?.quality})\nProveedor: ${providers.find(p => p.id === selectedProvider)?.name}\nExtras: ${extrasList.join(', ') || 'Ninguno'}\nCosto: ${formatCurrency(pricingCalc.cost)}\nMargen: ${Math.round(pricingCalc.marginPct)}%\n\n💰 PRECIO: ${formatCurrency(pricingCalc.finalPrice)}`;
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

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const cats = providerLensData.reduce<Record<string, number>>((acc, r) => { acc[r.categoria] = (acc[r.categoria] || 0) + 1; return acc; }, {});
                  const catColors: Record<string, { bg: string; label: string }> = {
                    'Lentes Terminados': { bg: 'bg-yellow-500/20 border-yellow-600/30', label: '🟡 Terminados' },
                    'Blue Vision Sencilla': { bg: 'bg-sky-500/20 border-sky-600/30', label: '🔵 Blue Vision' },
                    'Bifocales': { bg: 'bg-green-500/20 border-green-600/30', label: '🟢 Bifocales' },
                    'Talla Convencional': { bg: 'bg-blue-800/30 border-blue-700/30', label: '🔷 Convencional' },
                  };
                  return Object.entries(catColors).map(([cat, { bg, label }]) => (
                    <div key={cat} className={`rounded-lg p-2.5 text-center border ${bg}`}>
                      <p className="text-lg font-bold text-white">{cats[cat] || 0}</p>
                      <p className="text-[10px] text-[#aaa]">{label}</p>
                    </div>
                  ));
                })()}
              </div>

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

              {/* Tablas coloreadas por categoría */}
              {providerLensData.length === 0 ? (
                <div className="text-center py-12 rounded-xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                  <Glasses size={40} className="text-[#333] mx-auto mb-3" />
                  <p className="text-sm text-[#666]">No hay lentes para {proveedorSubTab}</p>
                  <p className="text-xs text-[#444] mt-1">Agrega lentes usando el botón de arriba</p>
                </div>
              ) : (
                (() => {
                  const categoryOrder = ['Lentes Terminados', 'Blue Vision Sencilla', 'Bifocales', 'Talla Convencional'];
                  const categoryStyles: Record<string, { headerBg: string; headerText: string; rowBg: string; borderColor: string; accentColor: string }> = {
                    'Lentes Terminados': { headerBg: 'background: rgba(234,179,8,0.15)', headerText: 'color: #EAB308', rowBg: 'background: rgba(234,179,8,0.05)', borderColor: 'border-color: rgba(234,179,8,0.2)', accentColor: '#EAB308' },
                    'Blue Vision Sencilla': { headerBg: 'background: rgba(56,189,248,0.12)', headerText: 'color: #38BDF8', rowBg: 'background: rgba(56,189,248,0.04)', borderColor: 'border-color: rgba(56,189,248,0.2)', accentColor: '#38BDF8' },
                    'Bifocales': { headerBg: 'background: rgba(34,197,94,0.12)', headerText: 'color: #22C55E', rowBg: 'background: rgba(34,197,94,0.04)', borderColor: 'border-color: rgba(34,197,94,0.2)', accentColor: '#22C55E' },
                    'Talla Convencional': { headerBg: 'background: rgba(59,130,246,0.15)', headerText: 'color: #60A5FA', rowBg: 'background: rgba(59,130,246,0.04)', borderColor: 'border-color: rgba(59,130,246,0.2)', accentColor: '#60A5FA' },
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
                                {!(group.name === 'Bifocales') && <th className="text-left px-3 py-2 font-medium">Cilindro</th>}
                                {(group.name === 'Bifocales') && <th className="text-left px-3 py-2 font-medium">Adición</th>}
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
                                  {!(group.name === 'Bifocales') && <td className="px-3 py-2 text-[#ccc]">{item.cilindro || '—'}</td>}
                                  {(group.name === 'Bifocales') && <td className="px-3 py-2 text-[#ccc]">{item.adicion || '—'}</td>}
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
                  ...(currentUser?.role === 'admin' ? [{ id: 'users' as const, label: 'Usuarios', icon: <Users size={14} /> }] : []),
                  { id: 'database' as const, label: 'Base Datos', icon: <Database size={14} /> },
                ]).map((tab) => (
                  <button key={tab.id} onClick={() => { setSoporteSubTab(tab.id); if (tab.id === 'users') fetchUsers(); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${soporteSubTab === tab.id ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-[#111] text-[#888] border border-[#1a1a1a]'}`}>
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
