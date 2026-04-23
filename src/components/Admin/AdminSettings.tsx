import React, { useState, useEffect } from 'react';
import { Save, Building2, Truck, Receipt, CreditCard, Gift } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface Settings {
  razon_social: string;
  cif: string;
  direccion_fiscal: string;
  email_contacto: string;
  telefono_contacto: string;
  logo_url: string;
  envio_gratis_umbral: number;
  coste_envio_estandar: number;
  iva_porcentaje: number;
  moneda: string;
  stripe_enabled: boolean;
  puntos_enabled: boolean;
}

const defaults: Settings = {
  razon_social: '',
  cif: '',
  direccion_fiscal: '',
  email_contacto: '',
  telefono_contacto: '',
  logo_url: '',
  envio_gratis_umbral: 50,
  coste_envio_estandar: 9.99,
  iva_porcentaje: 21,
  moneda: 'EUR',
  stripe_enabled: true,
  puntos_enabled: true,
};

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Record<string, unknown>>('/admin/settings')
      .then((data) => {
        setSettings({
          razon_social: (data.razon_social as string) ?? defaults.razon_social,
          cif: (data.cif as string) ?? defaults.cif,
          direccion_fiscal: (data.direccion_fiscal as string) ?? defaults.direccion_fiscal,
          email_contacto: (data.email_contacto as string) ?? defaults.email_contacto,
          telefono_contacto: (data.telefono_contacto as string) ?? defaults.telefono_contacto,
          logo_url: (data.logo_url as string) ?? defaults.logo_url,
          envio_gratis_umbral: (data.envio_gratis_umbral as number) ?? defaults.envio_gratis_umbral,
          coste_envio_estandar: (data.coste_envio_estandar as number) ?? defaults.coste_envio_estandar,
          iva_porcentaje: (data.iva_porcentaje as number) ?? defaults.iva_porcentaje,
          moneda: (data.moneda as string) ?? defaults.moneda,
          stripe_enabled: (data.stripe_enabled as boolean) ?? defaults.stripe_enabled,
          puntos_enabled: (data.puntos_enabled as boolean) ?? defaults.puntos_enabled,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await apiClient.put('/admin/settings', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof Settings, value: any) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return <div className="flex justify-center py-12 text-gray-400">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Configuración</h2>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar todo'}
        </button>
      </div>

      {error && <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg" role="alert">{error}</div>}
      {success && <div className="bg-emerald-900/20 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg">Configuración guardada correctamente</div>}

      {/* Datos Fiscales */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Datos Fiscales</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Razón Social</label>
            <input type="text" value={settings.razon_social} onChange={(e) => update('razon_social', e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">CIF / NIF</label>
            <input type="text" value={settings.cif} onChange={(e) => update('cif', e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Dirección Fiscal</label>
          <input type="text" value={settings.direccion_fiscal} onChange={(e) => update('direccion_fiscal', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email de contacto</label>
            <input type="email" value={settings.email_contacto} onChange={(e) => update('email_contacto', e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Teléfono</label>
            <input type="tel" value={settings.telefono_contacto} onChange={(e) => update('telefono_contacto', e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">URL del Logo</label>
          <input type="url" value={settings.logo_url} onChange={(e) => update('logo_url', e.target.value)}
            placeholder="https://..." className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
      </section>

      {/* Envío */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Envío</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Envío gratis a partir de (EUR)</label>
            <input type="number" step="0.01" min="0" value={settings.envio_gratis_umbral}
              onChange={(e) => update('envio_gratis_umbral', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Coste envío estándar (EUR)</label>
            <input type="number" step="0.01" min="0" value={settings.coste_envio_estandar}
              onChange={(e) => update('coste_envio_estandar', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </section>

      {/* Impuestos */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Impuestos</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">IVA por defecto (%)</label>
            <input type="number" step="0.1" min="0" max="100" value={settings.iva_porcentaje}
              onChange={(e) => update('iva_porcentaje', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Moneda</label>
            <select value={settings.moneda} onChange={(e) => update('moneda', e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - Dólar</option>
              <option value="GBP">GBP - Libra</option>
            </select>
          </div>
        </div>
      </section>

      {/* Pagos */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Métodos de Pago</h3>
        </div>
        <p className="text-sm text-gray-400">Las credenciales se configuran por variables de entorno en GitHub Secrets.</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 border border-gray-700 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">Stripe</span>
              <span className="text-xs text-gray-400">Tarjetas de crédito/débito</span>
            </div>
            <input type="checkbox" checked={settings.stripe_enabled}
              onChange={(e) => update('stripe_enabled', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-blue-400" />
          </label>
        </div>
      </section>

      {/* Puntos y Recompensas */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Puntos y Recompensas</h3>
        </div>
        <p className="text-sm text-gray-400">
          Controla si los clientes acumulan puntos por sus compras y pueden canjear recompensas.
        </p>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 border border-gray-700 rounded-lg cursor-pointer">
            <div>
              <span className="text-white font-medium">Sistema de puntos</span>
              <p className="text-xs text-gray-400 mt-0.5">
                {settings.puntos_enabled
                  ? 'Los clientes ganan puntos progresivos con cada compra y pueden canjearlos por recompensas.'
                  : 'El sistema de puntos está desactivado. No se mostrarán puntos ni recompensas en el checkout.'}
              </p>
            </div>
            <input type="checkbox" checked={settings.puntos_enabled}
              onChange={(e) => update('puntos_enabled', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-blue-400" />
          </label>
        </div>
      </section>
    </div>
  );
}
