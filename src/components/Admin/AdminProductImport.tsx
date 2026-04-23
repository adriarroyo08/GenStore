import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Upload, Download, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminSupplier } from './types';

interface AdminProductImportProps {
  onClose: () => void;
  onImported: () => void;
}

type Step = 'upload' | 'mapping' | 'result';

interface FieldMapping {
  csvColumn: string;
  productField: string;
}

const PRODUCT_FIELDS = [
  { key: 'nombre', label: 'Nombre *', required: true },
  { key: 'supplier_sku', label: 'SKU Proveedor *', required: true },
  { key: 'precio_coste', label: 'Precio coste *', required: true },
  { key: 'descripcion', label: 'Descripcion', required: false },
  { key: 'categoria', label: 'Categoria', required: false },
  { key: 'imagenes', label: 'Imagenes', required: false },
  { key: 'marca', label: 'Marca', required: false },
  { key: 'stock', label: 'Stock', required: false },
];

const AUTO_MAP_ALIASES: Record<string, string[]> = {
  nombre: ['nombre', 'name', 'producto', 'product', 'titulo', 'title'],
  supplier_sku: ['supplier_sku', 'sku_proveedor', 'sku', 'ref', 'referencia', 'reference', 'codigo', 'code'],
  precio_coste: ['precio_coste', 'coste', 'cost', 'precio', 'price', 'pvp', 'precio_unitario', 'unit_price'],
  descripcion: ['descripcion', 'description', 'desc'],
  categoria: ['categoria', 'category', 'cat'],
  imagenes: ['imagenes', 'imagen', 'image', 'images', 'foto', 'photo', 'img', 'url_imagen'],
  marca: ['marca', 'brand'],
  stock: ['stock', 'cantidad', 'quantity', 'qty', 'inventario'],
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',' || ch === ';') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function autoMapColumns(csvHeaders: string[]): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const normalizedHeaders = csvHeaders.map((h) => h.toLowerCase().trim());

  for (const field of PRODUCT_FIELDS) {
    const aliases = AUTO_MAP_ALIASES[field.key] ?? [field.key];
    const matchIdx = normalizedHeaders.findIndex((h) =>
      aliases.some((alias) => h === alias || h.includes(alias))
    );
    if (matchIdx !== -1) {
      mappings.push({ csvColumn: csvHeaders[matchIdx], productField: field.key });
    }
  }
  return mappings;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export function AdminProductImport({ onClose, onImported }: AdminProductImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [supplierId, setSupplierId] = useState('');

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  // Result state
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ suppliers: AdminSupplier[] }>('/admin/suppliers?limit=100&active=true')
      .then((data) => setSuppliers(data.suppliers ?? []))
      .catch(() => setSuppliers([]));
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const { headers, rows } = parseCSV(text);
        if (headers.length === 0) {
          setError('El archivo CSV esta vacio o no tiene cabeceras');
          return;
        }
        setCsvHeaders(headers);
        setCsvRows(rows);
        const autoMappings = autoMapColumns(headers);
        setMappings(autoMappings);
        setStep('mapping');
      };
      reader.readAsText(file);
    },
    []
  );

  const handleDownloadTemplate = useCallback(() => {
    const header = 'nombre;supplier_sku;precio_coste;descripcion;categoria;marca;stock;imagenes';
    const example = 'Producto ejemplo;REF-001;10.50;Descripcion del producto;Categoria;Marca;100;https://ejemplo.com/img.jpg';
    const blob = new Blob([header + '\n' + example + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_productos.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const updateMapping = useCallback(
    (csvColumn: string, productField: string) => {
      setMappings((prev) => {
        // Remove any existing mapping for this productField (except empty)
        const filtered = prev.filter(
          (m) => m.productField !== productField && m.csvColumn !== csvColumn
        );
        if (productField) {
          filtered.push({ csvColumn, productField });
        }
        return filtered;
      });
    },
    []
  );

  const getMappedField = useCallback(
    (csvColumn: string): string => {
      return mappings.find((m) => m.csvColumn === csvColumn)?.productField ?? '';
    },
    [mappings]
  );

  const previewRows = useMemo(() => csvRows.slice(0, 5), [csvRows]);

  const requiredFieldsMapped = useMemo(() => {
    const mapped = new Set(mappings.map((m) => m.productField));
    return PRODUCT_FIELDS.filter((f) => f.required).every((f) => mapped.has(f.key));
  }, [mappings]);

  const handleImport = useCallback(async () => {
    if (!supplierId) {
      setError('Selecciona un proveedor');
      return;
    }
    if (!requiredFieldsMapped) {
      setError('Mapea todos los campos obligatorios (*)');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      // Build mapped product rows
      const products = csvRows.map((row) => {
        const obj: Record<string, string> = {};
        for (const mapping of mappings) {
          const colIdx = csvHeaders.indexOf(mapping.csvColumn);
          if (colIdx !== -1) {
            obj[mapping.productField] = row[colIdx] ?? '';
          }
        }
        return obj;
      });

      const data = await apiClient.post<ImportResult>('/admin/products/import', {
        supplier_id: supplierId,
        products,
      });
      setResult(data);
      setStep('result');
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar productos');
    } finally {
      setIsImporting(false);
    }
  }, [supplierId, requiredFieldsMapped, csvRows, csvHeaders, mappings, onImported]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
    >
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 id="import-title" className="text-lg font-semibold text-white">
            Importar catalogo de productos
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['upload', 'mapping', 'result'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <ArrowRight className="w-4 h-4 text-gray-600" />}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {s === 'upload'
                    ? '1. Subir CSV'
                    : s === 'mapping'
                    ? '2. Mapear campos'
                    : '3. Resultado'}
                </span>
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-3 text-sm mb-4"
            >
              {error}
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Supplier selector */}
              <div>
                <label
                  htmlFor="import-supplier"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Proveedor <span className="text-red-400">*</span>
                </label>
                <select
                  id="import-supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Archivo CSV
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-2">
                    Arrastra o selecciona un archivo CSV
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block mx-auto text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                </div>
              </div>

              {/* Download template */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar plantilla CSV
              </button>
            </div>
          )}

          {/* STEP 2: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              {/* Column mapping */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Mapeo de columnas
                </h4>
                <div className="space-y-2">
                  {csvHeaders.map((header) => (
                    <div
                      key={header}
                      className="flex items-center gap-3 bg-gray-900 rounded-lg p-2"
                    >
                      <span className="text-sm text-gray-300 w-40 truncate font-mono">
                        {header}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <select
                        value={getMappedField(header)}
                        onChange={(e) => updateMapping(header, e.target.value)}
                        className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {PRODUCT_FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Vista previa (primeras {previewRows.length} filas)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" aria-label="Vista previa CSV">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {csvHeaders.map((h) => (
                            <th
                              key={h}
                              scope="col"
                              className="text-left py-2 px-2 text-gray-400 font-medium"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, ri) => (
                          <tr key={ri} className="border-b border-gray-700/50">
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="py-1.5 px-2 text-gray-300 truncate max-w-[150px]"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting || !requiredFieldsMapped || !supplierId}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting
                    ? 'Importando...'
                    : `Importar ${csvRows.length} productos`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-900/20 border border-green-700 rounded-lg p-4">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-medium">Importacion completada</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {result.created} creados, {result.updated} actualizados
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium text-sm">
                      {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-300">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
