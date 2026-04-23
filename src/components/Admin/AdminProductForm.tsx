import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminProduct, AdminCategory, ProductFormData, AdminSupplier } from './types';

interface AdminProductFormProps {
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm: ProductFormData = {
  nombre: '',
  sku: '',
  precio: 0,
  precio_original: 0,
  stock: 0,
  stock_minimo: 5,
  categoria_id: '',
  marca: '',
  descripcion: '',
  imagenes: '',
  tags: '',
  activo: true,
  supplier_id: '',
  precio_coste: 0,
  supplier_sku: '',
  supplier_url: '',
  origen: 'ES',
  peso_gramos: 0,
  largo_cm: 0,
  ancho_cm: 0,
  alto_cm: 0,
  tiempo_envio_min: 0,
  tiempo_envio_max: 0,
  notas_internas: '',
  meta_title: '',
  meta_description: '',
  en_oferta: false,
  porcentaje_descuento: 0,
  modelo: '',
  features: '',
  colors: '[]',
  specs: '{}',
};

const SECTION_IDS = ['basica', 'proveedor', 'inventario', 'contenido', 'seo', 'notas'] as const;
type SectionId = (typeof SECTION_IDS)[number];

const sectionConfig: Record<SectionId, { label: string; borderColor: string }> = {
  basica: { label: 'Informacion Basica', borderColor: 'border-l-blue-500' },
  proveedor: { label: 'Proveedor y Costes', borderColor: 'border-l-emerald-500' },
  inventario: { label: 'Inventario y Envio', borderColor: 'border-l-amber-500' },
  contenido: { label: 'Contenido', borderColor: 'border-l-purple-500' },
  seo: { label: 'SEO', borderColor: 'border-l-pink-500' },
  notas: { label: 'Notas Internas', borderColor: 'border-l-gray-500' },
};

export function AdminProductForm({ product, onClose, onSaved }: AdminProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    () => new Set(SECTION_IDS)
  );

  const toggleSection = useCallback((id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        nombre: product.nombre,
        sku: product.sku,
        precio: product.precio,
        precio_original: product.precio_original ?? 0,
        stock: product.stock,
        stock_minimo: product.stock_minimo,
        categoria_id: product.categoria_id ?? '',
        marca: product.marca ?? '',
        descripcion: product.descripcion ?? '',
        imagenes: (product.imagenes ?? []).join(', '),
        tags: (product.tags ?? []).join(', '),
        activo: product.activo,
        supplier_id: product.supplier_id ?? '',
        precio_coste: product.precio_coste ?? 0,
        supplier_sku: product.supplier_sku ?? '',
        supplier_url: product.supplier_url ?? '',
        origen: product.origen ?? 'ES',
        peso_gramos: product.peso_gramos ?? 0,
        largo_cm: product.largo_cm ?? 0,
        ancho_cm: product.ancho_cm ?? 0,
        alto_cm: product.alto_cm ?? 0,
        tiempo_envio_min: product.tiempo_envio_min ?? 0,
        tiempo_envio_max: product.tiempo_envio_max ?? 0,
        notas_internas: product.notas_internas ?? '',
        meta_title: product.meta_title ?? '',
        meta_description: product.meta_description ?? '',
        en_oferta: product.en_oferta ?? false,
        porcentaje_descuento: product.porcentaje_descuento ?? 0,
        modelo: product.modelo ?? '',
        features: (product.features ?? []).join('\n'),
        colors: JSON.stringify(product.colors ?? [], null, 2),
        specs: JSON.stringify(product.specs ?? {}, null, 2),
      });
    } else {
      setForm(emptyForm);
    }
  }, [product]);

  useEffect(() => {
    apiClient
      .get<{ categories: AdminCategory[] }>('/admin/categories')
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]));

    apiClient
      .get<{ suppliers: AdminSupplier[] }>('/admin/suppliers?limit=100&active=true')
      .then((data) => setSuppliers(data.suppliers ?? []))
      .catch(() => setSuppliers([]));
  }, []);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === form.supplier_id) ?? null,
    [suppliers, form.supplier_id]
  );

  const margin = useMemo(() => {
    if (form.precio_coste > 0 && form.precio > 0) {
      return ((form.precio - form.precio_coste) / form.precio) * 100;
    }
    return null;
  }, [form.precio, form.precio_coste]);

  const handleChange = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrecioCosteChange = (newCoste: number) => {
    setForm((prev) => {
      const updated = { ...prev, precio_coste: newCoste };
      const supplier = suppliers.find((s) => s.id === prev.supplier_id);
      if (supplier && newCoste > 0) {
        const margen = supplier.margen_defecto / 100;
        updated.precio = Math.round((newCoste / (1 - margen)) * 100) / 100;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!form.sku.trim()) {
      setError('El SKU es obligatorio');
      return;
    }
    if (form.precio <= 0) {
      setError('El precio debe ser mayor que 0');
      return;
    }

    // Parse features
    const featuresArr = form.features
      ? form.features.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    // Parse colors
    let colorsArr: any[] = [];
    if (form.colors.trim()) {
      try {
        colorsArr = JSON.parse(form.colors);
      } catch {
        setError('El campo Colors no contiene JSON valido');
        return;
      }
    }

    // Parse specs
    let specsObj: Record<string, any> = {};
    if (form.specs.trim()) {
      try {
        specsObj = JSON.parse(form.specs);
      } catch {
        setError('El campo Specs no contiene JSON valido');
        return;
      }
    }

    const payload = {
      nombre: form.nombre.trim(),
      sku: form.sku.trim(),
      precio: form.precio,
      precio_original: form.precio_original || null,
      stock: form.stock,
      stock_minimo: form.stock_minimo,
      categoria_id: form.categoria_id !== '' ? Number(form.categoria_id) : null,
      marca: form.marca.trim() || null,
      modelo: form.modelo.trim() || null,
      descripcion: form.descripcion.trim() || null,
      imagenes: form.imagenes
        ? form.imagenes.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      tags: form.tags
        ? form.tags.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      features: featuresArr,
      colors: colorsArr,
      specs: specsObj,
      activo: form.activo,
      en_oferta: form.en_oferta,
      porcentaje_descuento: form.porcentaje_descuento || 0,
      supplier_id: form.supplier_id || null,
      precio_coste: form.precio_coste || null,
      supplier_sku: form.supplier_sku.trim() || null,
      supplier_url: form.supplier_url.trim() || null,
      origen: form.origen.trim() || null,
      peso_gramos: form.peso_gramos || null,
      largo_cm: form.largo_cm || null,
      ancho_cm: form.ancho_cm || null,
      alto_cm: form.alto_cm || null,
      tiempo_envio_min: form.tiempo_envio_min || null,
      tiempo_envio_max: form.tiempo_envio_max || null,
      notas_internas: form.notas_internas.trim() || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
    };

    setIsSaving(true);
    try {
      if (product) {
        await apiClient.put(`/admin/products/${product.id}`, payload);
      } else {
        await apiClient.post('/admin/products', payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  function SectionHeader({ id }: { id: SectionId }) {
    const cfg = sectionConfig[id];
    const isOpen = openSections.has(id);
    return (
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-750 hover:bg-gray-700 rounded-lg border-l-4 ${cfg.borderColor} transition-colors`}
      >
        <span className="text-sm font-semibold text-white">{cfg.label}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h3 id="product-form-title" className="text-lg font-semibold text-white">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}

          {/* ── Section 1: Informacion Basica ── */}
          <SectionHeader id="basica" />
          {openSections.has('basica') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <label htmlFor="field-nombre" className={labelCls}>
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className={inputCls}
                  placeholder="Nombre del producto"
                  required
                  aria-required="true"
                />
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="field-sku" className={labelCls}>
                  SKU <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-sku"
                  type="text"
                  value={form.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  className={inputCls}
                  placeholder="SKU-001"
                  required
                  aria-required="true"
                />
              </div>

              {/* Marca */}
              <div>
                <label htmlFor="field-marca" className={labelCls}>
                  Marca
                </label>
                <input
                  id="field-marca"
                  type="text"
                  value={form.marca}
                  onChange={(e) => handleChange('marca', e.target.value)}
                  className={inputCls}
                  placeholder="Marca"
                />
              </div>

              {/* Modelo */}
              <div>
                <label htmlFor="field-modelo" className={labelCls}>
                  Modelo
                </label>
                <input
                  id="field-modelo"
                  type="text"
                  value={form.modelo}
                  onChange={(e) => handleChange('modelo', e.target.value)}
                  className={inputCls}
                  placeholder="Modelo"
                />
              </div>

              {/* Categoria */}
              <div>
                <label htmlFor="field-categoria" className={labelCls}>
                  Categoria
                </label>
                <select
                  id="field-categoria"
                  value={form.categoria_id}
                  onChange={(e) =>
                    handleChange('categoria_id', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={inputCls}
                >
                  <option value="">Sin categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activo */}
              <div className="flex items-center gap-3 pt-6">
                <label htmlFor="field-activo" className="text-sm font-medium text-gray-300">
                  Activo
                </label>
                <button
                  id="field-activo"
                  type="button"
                  role="switch"
                  aria-checked={form.activo}
                  aria-label={form.activo ? 'Producto activo' : 'Producto inactivo'}
                  onClick={() => handleChange('activo', !form.activo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.activo ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.activo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── Section 2: Proveedor y Costes ── */}
          <SectionHeader id="proveedor" />
          {openSections.has('proveedor') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4">
              {/* Supplier */}
              <div>
                <label htmlFor="field-supplier" className={labelCls}>
                  Proveedor
                </label>
                <select
                  id="field-supplier"
                  value={form.supplier_id}
                  onChange={(e) => handleChange('supplier_id', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Sin proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier SKU */}
              <div>
                <label htmlFor="field-supplier-sku" className={labelCls}>
                  SKU Proveedor
                </label>
                <input
                  id="field-supplier-sku"
                  type="text"
                  value={form.supplier_sku}
                  onChange={(e) => handleChange('supplier_sku', e.target.value)}
                  className={inputCls}
                  placeholder="REF-PROV-001"
                />
              </div>

              {/* Supplier URL */}
              <div className="sm:col-span-2">
                <label htmlFor="field-supplier-url" className={labelCls}>
                  URL Proveedor
                </label>
                <input
                  id="field-supplier-url"
                  type="url"
                  value={form.supplier_url}
                  onChange={(e) => handleChange('supplier_url', e.target.value)}
                  className={inputCls}
                  placeholder="https://proveedor.com/producto/123"
                />
              </div>

              {/* Precio coste */}
              <div>
                <label htmlFor="field-precio-coste" className={labelCls}>
                  Precio coste ({'\u20AC'})
                </label>
                <input
                  id="field-precio-coste"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_coste}
                  onChange={(e) => handlePrecioCosteChange(parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              {/* Precio PVP */}
              <div>
                <label htmlFor="field-precio" className={labelCls}>
                  Precio PVP ({'\u20AC'}) <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={(e) => handleChange('precio', parseFloat(e.target.value) || 0)}
                  className={inputCls}
                  required
                  aria-required="true"
                />
              </div>

              {/* Precio original */}
              <div>
                <label htmlFor="field-precio-original" className={labelCls}>
                  Precio original ({'\u20AC'})
                </label>
                <input
                  id="field-precio-original"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_original}
                  onChange={(e) => handleChange('precio_original', parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              {/* Margin display */}
              <div className="flex items-end">
                {margin !== null && (
                  <div className="pb-2">
                    <span className="text-sm text-gray-400">Margen: </span>
                    <span
                      className={`text-sm font-semibold ${
                        margin < 15 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {margin.toFixed(1)}%
                    </span>
                    {selectedSupplier && (
                      <span className="text-xs text-gray-500 ml-2">
                        (defecto: {selectedSupplier.margen_defecto}%)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* En oferta */}
              <div className="flex items-center gap-3 pt-4">
                <label htmlFor="field-en-oferta" className="text-sm font-medium text-gray-300">
                  En oferta
                </label>
                <button
                  id="field-en-oferta"
                  type="button"
                  role="switch"
                  aria-checked={form.en_oferta}
                  onClick={() => handleChange('en_oferta', !form.en_oferta)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.en_oferta ? 'bg-emerald-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.en_oferta ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Porcentaje descuento */}
              {form.en_oferta && (
                <div>
                  <label htmlFor="field-porcentaje-descuento" className={labelCls}>
                    Descuento (%)
                  </label>
                  <input
                    id="field-porcentaje-descuento"
                    type="number"
                    min="0"
                    max="100"
                    value={form.porcentaje_descuento}
                    onChange={(e) =>
                      handleChange('porcentaje_descuento', parseInt(e.target.value) || 0)
                    }
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Section 3: Inventario y Envio ── */}
          <SectionHeader id="inventario" />
          {openSections.has('inventario') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4">
              {/* Stock */}
              <div>
                <label htmlFor="field-stock" className={labelCls}>
                  Stock
                </label>
                <input
                  id="field-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              {/* Stock minimo */}
              <div>
                <label htmlFor="field-stock-minimo" className={labelCls}>
                  Stock minimo
                </label>
                <input
                  id="field-stock-minimo"
                  type="number"
                  min="0"
                  value={form.stock_minimo}
                  onChange={(e) => handleChange('stock_minimo', parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              {/* Peso */}
              <div>
                <label htmlFor="field-peso" className={labelCls}>
                  Peso (gramos)
                </label>
                <input
                  id="field-peso"
                  type="number"
                  min="0"
                  value={form.peso_gramos}
                  onChange={(e) => handleChange('peso_gramos', parseInt(e.target.value) || 0)}
                  className={inputCls}
                  placeholder="0"
                />
              </div>

              {/* Origen */}
              <div>
                <label htmlFor="field-origen" className={labelCls}>
                  Origen
                </label>
                <input
                  id="field-origen"
                  type="text"
                  value={form.origen}
                  onChange={(e) => handleChange('origen', e.target.value)}
                  className={inputCls}
                  placeholder="ES"
                />
              </div>

              {/* Dimensiones */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Dimensiones (cm)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      id="field-largo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.largo_cm}
                      onChange={(e) => handleChange('largo_cm', parseFloat(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="Largo"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Largo</span>
                  </div>
                  <div>
                    <input
                      id="field-ancho"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.ancho_cm}
                      onChange={(e) => handleChange('ancho_cm', parseFloat(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="Ancho"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Ancho</span>
                  </div>
                  <div>
                    <input
                      id="field-alto"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.alto_cm}
                      onChange={(e) => handleChange('alto_cm', parseFloat(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="Alto"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Alto</span>
                  </div>
                </div>
              </div>

              {/* Tiempo envio */}
              <div>
                <label htmlFor="field-envio-min" className={labelCls}>
                  Envio minimo (dias)
                </label>
                <input
                  id="field-envio-min"
                  type="number"
                  min="0"
                  value={form.tiempo_envio_min}
                  onChange={(e) => handleChange('tiempo_envio_min', parseInt(e.target.value) || 0)}
                  className={inputCls}
                  placeholder="1"
                />
              </div>
              <div>
                <label htmlFor="field-envio-max" className={labelCls}>
                  Envio maximo (dias)
                </label>
                <input
                  id="field-envio-max"
                  type="number"
                  min="0"
                  value={form.tiempo_envio_max}
                  onChange={(e) => handleChange('tiempo_envio_max', parseInt(e.target.value) || 0)}
                  className={inputCls}
                  placeholder="5"
                />
              </div>
            </div>
          )}

          {/* ── Section 4: Contenido ── */}
          <SectionHeader id="contenido" />
          {openSections.has('contenido') && (
            <div className="grid grid-cols-1 gap-4 pl-4">
              {/* Descripcion */}
              <div>
                <label htmlFor="field-descripcion" className={labelCls}>
                  Descripcion
                </label>
                <textarea
                  id="field-descripcion"
                  value={form.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Descripcion del producto..."
                />
              </div>

              {/* Features */}
              <div>
                <label htmlFor="field-features" className={labelCls}>
                  Caracteristicas (una por linea)
                </label>
                <textarea
                  id="field-features"
                  value={form.features}
                  onChange={(e) => handleChange('features', e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder={'Material resistente\nFacil de limpiar\nGarantia 2 anos'}
                />
              </div>

              {/* Specs */}
              <div>
                <label htmlFor="field-specs" className={labelCls}>
                  Especificaciones (JSON)
                </label>
                <textarea
                  id="field-specs"
                  value={form.specs}
                  onChange={(e) => handleChange('specs', e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none font-mono text-sm`}
                  placeholder={'{\n  "material": "Acero",\n  "peso": "1.5kg"\n}'}
                />
              </div>

              {/* Imagenes */}
              <div>
                <label htmlFor="field-imagenes" className={labelCls}>
                  Imagenes (URLs separadas por coma)
                </label>
                <input
                  id="field-imagenes"
                  type="text"
                  value={form.imagenes}
                  onChange={(e) => handleChange('imagenes', e.target.value)}
                  className={inputCls}
                  placeholder="https://ejemplo.com/img1.jpg, https://ejemplo.com/img2.jpg"
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="field-tags" className={labelCls}>
                  Tags (separados por coma)
                </label>
                <input
                  id="field-tags"
                  type="text"
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className={inputCls}
                  placeholder="productos, masaje, rehabilitacion"
                />
              </div>

              {/* Colors */}
              <div>
                <label htmlFor="field-colors" className={labelCls}>
                  Colores (JSON array)
                </label>
                <textarea
                  id="field-colors"
                  value={form.colors}
                  onChange={(e) => handleChange('colors', e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none font-mono text-sm`}
                  placeholder={'[\n  { "name": "Azul", "value": "blue", "hex": "#0000FF" }\n]'}
                />
              </div>
            </div>
          )}

          {/* ── Section 5: SEO ── */}
          <SectionHeader id="seo" />
          {openSections.has('seo') && (
            <div className="grid grid-cols-1 gap-4 pl-4">
              {/* Meta title */}
              <div>
                <label htmlFor="field-meta-title" className={labelCls}>
                  Meta Title
                </label>
                <input
                  id="field-meta-title"
                  type="text"
                  value={form.meta_title}
                  onChange={(e) => handleChange('meta_title', e.target.value)}
                  className={inputCls}
                  placeholder="Titulo para buscadores (max 60 chars)"
                  maxLength={70}
                />
                <span className="text-xs text-gray-500 mt-1 block">
                  {form.meta_title.length}/70 caracteres
                </span>
              </div>

              {/* Meta description */}
              <div>
                <label htmlFor="field-meta-description" className={labelCls}>
                  Meta Description
                </label>
                <textarea
                  id="field-meta-description"
                  value={form.meta_description}
                  onChange={(e) => handleChange('meta_description', e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Descripcion para buscadores (max 160 chars)"
                  maxLength={170}
                />
                <span className="text-xs text-gray-500 mt-1 block">
                  {form.meta_description.length}/170 caracteres
                </span>
              </div>
            </div>
          )}

          {/* ── Section 6: Notas Internas ── */}
          <SectionHeader id="notas" />
          {openSections.has('notas') && (
            <div className="pl-4">
              <div>
                <label htmlFor="field-notas-internas" className={labelCls}>
                  Notas internas (solo visible para admins)
                </label>
                <textarea
                  id="field-notas-internas"
                  value={form.notas_internas}
                  onChange={(e) => handleChange('notas_internas', e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Notas privadas sobre este producto..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
