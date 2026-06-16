import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, Upload } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { ImageUploader } from './ImageUploader';

// ── Types ────────────────────────────────────────────────────────────────────

interface AttributeDefinition {
  id: string; // local-only uuid for React keys
  name: string;
  values: string[];
}

interface ProductVariant {
  id: string;
  sku: string;
  precio: number;
  precio_coste: number | null;
  stock: number;
  activo: boolean;
  imagenes: string[];
  attributes: Record<string, string>; // { Color: 'Rojo', Talla: 'M' }
}

export interface VariantManagerProps {
  productId: string | null;
  productSku: string;
  productPrecio: number;
  productPrecioCoste: number | null;
  hasVariants: boolean;
  onHasVariantsChange: (val: boolean) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Reconstruct attribute definitions from a flat list of variants. */
function reconstructAttributes(variants: ProductVariant[]): AttributeDefinition[] {
  if (!variants.length) return [];
  const map = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [name, value] of Object.entries(v.attributes ?? {})) {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name)!.add(value);
    }
  }
  return Array.from(map.entries()).map(([name, valSet]) => ({
    id: uid(),
    name,
    values: Array.from(valSet),
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface AttributeRowProps {
  attr: AttributeDefinition;
  onChange: (updated: AttributeDefinition) => void;
  onRemove: () => void;
}

function AttributeRow({ attr, onChange, onRemove }: AttributeRowProps) {
  const addValue = () => {
    onChange({ ...attr, values: [...attr.values, ''] });
  };

  const updateValue = (idx: number, val: string) => {
    const values = [...attr.values];
    values[idx] = val;
    onChange({ ...attr, values });
  };

  const removeValue = (idx: number) => {
    onChange({ ...attr, values: attr.values.filter((_, i) => i !== idx) });
  };

  return (
    <div className="border border-border/50 rounded-lg p-3 space-y-2 bg-muted/10">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={attr.name}
          onChange={(e) => onChange({ ...attr, name: e.target.value })}
          placeholder="Nombre del atributo (ej. Color)"
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          aria-label="Eliminar atributo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="pl-2 space-y-1.5">
        {attr.values.map((val, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={val}
              onChange={(e) => updateValue(idx, e.target.value)}
              placeholder={`Valor ${idx + 1}`}
              className="flex-1 px-3 py-1 bg-background border border-border rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => removeValue(idx)}
              className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              aria-label="Eliminar valor"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addValue}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors py-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir valor
        </button>
      </div>
    </div>
  );
}

// ── Inline-editable cell ──────────────────────────────────────────────────────

interface EditableCellProps {
  value: string | number;
  type?: 'text' | 'number';
  step?: string;
  onCommit: (val: string) => void;
  className?: string;
}

function EditableCell({ value, type = 'text', step, onCommit, className = '' }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== String(value)) onCommit(draft);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        className={`w-full px-2 py-0.5 bg-gray-800 border border-blue-500 rounded text-sm text-white focus:outline-none ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer px-2 py-0.5 rounded hover:bg-muted/40 transition-colors text-sm ${className}`}
      title="Clic para editar"
    >
      {value}
    </span>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  id?: string;
}

function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-300 cursor-pointer">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function VariantManager({
  productId,
  productSku,
  productPrecio,
  productPrecioCoste,
  hasVariants,
  onHasVariantsChange,
}: VariantManagerProps) {
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedImgRow, setExpandedImgRow] = useState<string | null>(null);

  // Bulk-action state
  const [bulkPrecio, setBulkPrecio] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // Load existing variants on mount (or when productId becomes available)
  useEffect(() => {
    if (!productId || !hasVariants) return;

    setIsLoading(true);
    setError(null);
    apiClient
      .get<{ variants: ProductVariant[] }>(`/admin/products/${productId}/variants`)
      .then((data) => {
        const loaded = data.variants ?? [];
        setVariants(loaded);
        if (loaded.length > 0) {
          setAttributes(reconstructAttributes(loaded));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error cargando variantes');
      })
      .finally(() => setIsLoading(false));
  }, [productId, hasVariants]);

  // ── Attribute builder ─────────────────────────────────────────────────────

  const addAttribute = () => {
    setAttributes((prev) => [...prev, { id: uid(), name: '', values: [''] }]);
  };

  const updateAttribute = useCallback((id: string, updated: AttributeDefinition) => {
    setAttributes((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const removeAttribute = useCallback((id: string) => {
    setAttributes((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Generate variants ─────────────────────────────────────────────────────

  const canGenerate =
    productId !== null &&
    attributes.length > 0 &&
    attributes.every(
      (a) => a.name.trim() !== '' && a.values.some((v) => v.trim() !== '')
    );

  const handleGenerate = async () => {
    if (!productId || !canGenerate) return;
    setIsGenerating(true);
    setError(null);

    const attributeDefinitions = attributes.map((a) => ({
      name: a.name.trim(),
      values: a.values.map((v) => v.trim()).filter(Boolean),
    }));

    try {
      const data = await apiClient.post<{ variants: ProductVariant[] }>(
        `/admin/products/${productId}/variants/bulk`,
        {
          attributeDefinitions,
          baseSku: productSku,
          basePrecio: productPrecio,
          basePrecioCoste: productPrecioCoste,
        }
      );
      setVariants(data.variants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando variantes');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Per-variant inline update ─────────────────────────────────────────────

  const updateVariantField = useCallback(
    async (variantId: string, field: keyof ProductVariant, raw: string) => {
      let value: unknown = raw;
      if (field === 'precio' || field === 'precio_coste') value = parseFloat(raw) || 0;
      if (field === 'stock') value = parseInt(raw, 10) || 0;

      // Optimistic UI update
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v))
      );

      try {
        await apiClient.put(`/admin/variants/${variantId}`, { [field]: value });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error actualizando variante');
        // rollback is hard without prior snapshot; just show error
      }
    },
    []
  );

  const toggleVariantActivo = useCallback(async (variant: ProductVariant) => {
    const newVal = !variant.activo;
    setVariants((prev) =>
      prev.map((v) => (v.id === variant.id ? { ...v, activo: newVal } : v))
    );
    try {
      await apiClient.put(`/admin/variants/${variant.id}`, { activo: newVal });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando variante');
    }
  }, []);

  // ── Bulk actions ──────────────────────────────────────────────────────────

  const handleBulkApply = async (field: 'precio' | 'stock') => {
    if (!productId) return;
    const raw = field === 'precio' ? bulkPrecio : bulkStock;
    const value = field === 'precio' ? parseFloat(raw) : parseInt(raw, 10);
    if (isNaN(value)) return;

    setIsApplyingBulk(true);
    setError(null);
    try {
      const data = await apiClient.put<{ variants: ProductVariant[] }>(
        `/admin/products/${productId}/variants/bulk`,
        { [field]: value }
      );
      if (data.variants) setVariants(data.variants);
      else {
        // update locally if API does not return updated list
        setVariants((prev) => prev.map((v) => ({ ...v, [field]: value })));
      }
      if (field === 'precio') setBulkPrecio('');
      else setBulkStock('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error aplicando cambios masivos');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // ── Attribute column names derived from current variants ──────────────────

  const attrNames: string[] =
    variants.length > 0
      ? Object.keys(variants[0].attributes ?? {})
      : attributes.filter((a) => a.name.trim()).map((a) => a.name.trim());

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <ToggleSwitch
        id="has-variants-toggle"
        checked={hasVariants}
        onChange={onHasVariantsChange}
        label="Este producto tiene variantes"
      />

      {!hasVariants && null}

      {hasVariants && (
        <>
          {/* Warning: product not yet saved */}
          {!productId && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-amber-900/20 border border-amber-600/40 text-amber-400 rounded-lg p-3 text-sm"
            >
              <span className="mt-0.5">⚠</span>
              <span>Guarda el producto primero para poder gestionar variantes.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando variantes...
            </div>
          )}

          {/* ── Attribute builder ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Atributos</span>
              <button
                type="button"
                onClick={addAttribute}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Atributo
              </button>
            </div>

            {attributes.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Ningún atributo definido. Añade uno para generar combinaciones.
              </p>
            )}

            {attributes.map((attr) => (
              <AttributeRow
                key={attr.id}
                attr={attr}
                onChange={(updated) => updateAttribute(attr.id, updated)}
                onRemove={() => removeAttribute(attr.id)}
              />
            ))}
          </div>

          {/* Generate button */}
          {productId && (
            <div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isGenerating ? 'Generando...' : 'Generar combinaciones'}
              </button>
              {!canGenerate && attributes.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Asegúrate de que todos los atributos tienen nombre y al menos un valor.
                </p>
              )}
            </div>
          )}

          {/* ── Variant table ── */}
          {variants.length > 0 && (
            <div className="space-y-3">
              {/* Bulk actions */}
              <div className="flex flex-wrap gap-3 p-3 bg-muted/10 border border-border/50 rounded-lg">
                <span className="text-sm font-medium text-gray-400 self-center">
                  Acciones masivas:
                </span>

                {/* Bulk precio */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkPrecio}
                    onChange={(e) => setBulkPrecio(e.target.value)}
                    placeholder="Precio €"
                    className="w-28 px-2 py-1 bg-background border border-border rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleBulkApply('precio')}
                    disabled={isApplyingBulk || !bulkPrecio}
                    className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {isApplyingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar precio a todas'}
                  </button>
                </div>

                {/* Bulk stock */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    placeholder="Stock"
                    className="w-24 px-2 py-1 bg-background border border-border rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleBulkApply('stock')}
                    disabled={isApplyingBulk || !bulkStock}
                    className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {isApplyingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar stock a todas'}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {attrNames.map((name) => (
                        <th
                          key={name}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                          {name}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Precio €
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Imgs
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Activo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {variants.map((variant) => (
                      <React.Fragment key={variant.id}>
                        <tr className="hover:bg-muted/30 transition-colors">
                          {/* Attribute value cells */}
                          {attrNames.map((name) => (
                            <td key={name} className="px-3 py-2 text-gray-300">
                              {variant.attributes?.[name] ?? '—'}
                            </td>
                          ))}

                          {/* SKU */}
                          <td className="px-3 py-2 font-mono text-gray-300">
                            <EditableCell
                              value={variant.sku}
                              onCommit={(val) => updateVariantField(variant.id, 'sku', val)}
                            />
                          </td>

                          {/* Precio */}
                          <td className="px-3 py-2 text-gray-300">
                            <EditableCell
                              value={variant.precio}
                              type="number"
                              step="0.01"
                              onCommit={(val) => updateVariantField(variant.id, 'precio', val)}
                            />
                          </td>

                          {/* Stock */}
                          <td className="px-3 py-2 text-gray-300">
                            <EditableCell
                              value={variant.stock}
                              type="number"
                              onCommit={(val) => updateVariantField(variant.id, 'stock', val)}
                            />
                          </td>

                          {/* Images count / expand */}
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedImgRow(
                                  expandedImgRow === variant.id ? null : variant.id
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-xs transition-colors"
                              title="Gestionar imágenes"
                            >
                              <Upload className="w-3 h-3" />
                              {variant.imagenes?.length ?? 0}
                            </button>
                          </td>

                          {/* Activo toggle */}
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={variant.activo}
                              aria-label={variant.activo ? 'Variante activa' : 'Variante inactiva'}
                              onClick={() => toggleVariantActivo(variant)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                variant.activo ? 'bg-blue-600' : 'bg-gray-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  variant.activo ? 'translate-x-[18px]' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable image row */}
                        {expandedImgRow === variant.id && (
                          <tr>
                            <td
                              colSpan={attrNames.length + 5}
                              className="px-4 py-3 bg-gray-900/50 border-b border-border/30"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Imágenes — {variant.sku}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedImgRow(null)}
                                    className="text-gray-500 hover:text-gray-300 transition-colors"
                                    aria-label="Cerrar gestor de imágenes"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <ImageUploader
                                  endpoint={`/admin/variants/${variant.id}/images`}
                                  existingImages={variant.imagenes ?? []}
                                  onImagesChange={(imgs) =>
                                    setVariants((prev) =>
                                      prev.map((v) =>
                                        v.id === variant.id ? { ...v, imagenes: imgs } : v
                                      )
                                    )
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-500">
                {variants.length} variante{variants.length !== 1 ? 's' : ''} — Haz clic en
                cualquier celda de SKU, precio o stock para editar en línea.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
