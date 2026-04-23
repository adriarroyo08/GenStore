import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminInventoryImportProps {
  onClose: () => void;
  onImported: () => void;
}

interface PreviewRow {
  [key: string]: string;
}

interface ImportResult {
  created?: number;
  updated?: number;
  errors?: string[];
}

export function AdminInventoryImport({ onClose, onImported }: AdminInventoryImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      setError('El archivo CSV debe tener al menos una cabecera y una fila de datos');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: PreviewRow[] = [];

    for (let i = 1; i < lines.length && i <= 20; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: PreviewRow = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? '';
      });
      rows.push(row);
    }

    setPreviewHeaders(headers);
    setPreviewRows(rows);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      setError('Solo se permiten archivos CSV');
      return;
    }

    setFile(selected);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        parseCSV(text);
      }
    };
    reader.readAsText(selected);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('file', file);

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/v1/admin/inventory/import', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(body.error ?? `Error ${res.status}`);
      }

      const data: ImportResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar CSV');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDone = () => {
    onImported();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-labelledby="import-csv-title">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 id="import-csv-title" className="text-lg font-semibold text-white">Importar inventario desde CSV</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* File input */}
          <div>
            <input
              ref={fileInputRef}
              id="field-admin-csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Seleccionar archivo CSV para importar"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label={file ? `Archivo seleccionado: ${file.name}. Pulsar para cambiar` : 'Seleccionar archivo CSV'}
              className="flex items-center gap-3 w-full px-4 py-6 bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <div className="text-left">
                <p className="font-medium">
                  {file ? file.name : 'Seleccionar archivo CSV'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Formato esperado: columnas separadas por comas con cabecera
                </p>
              </div>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Preview */}
          {previewRows.length > 0 && !result && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-medium text-gray-300">
                  Vista previa ({previewRows.length} filas mostradas)
                </h4>
              </div>
              <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700">
                <table className="w-full text-sm" aria-label="Vista previa del CSV">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {previewHeaders.map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="text-left py-2 px-3 text-xs text-gray-400 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {previewHeaders.map((h) => (
                          <td key={h} className="py-2 px-3 text-gray-300 whitespace-nowrap">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-green-400">Importación completada</h4>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                {result.created != null && (
                  <p>Productos creados: <span className="text-white font-medium">{result.created}</span></p>
                )}
                {result.updated != null && (
                  <p>Productos actualizados: <span className="text-white font-medium">{result.updated}</span></p>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-400 font-medium">Errores ({result.errors.length}):</p>
                    <ul className="list-disc list-inside text-red-400 text-xs mt-1 space-y-0.5">
                      {result.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {result.errors.length > 10 && (
                        <li>...y {result.errors.length - 10} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            {result ? (
              <button
                onClick={handleDone}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Listo
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={!file || isUploading || previewRows.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Importando...' : 'Confirmar importación'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
