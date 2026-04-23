import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, ShieldCheck, User } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AdminUser } from './types';

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ users: AdminUser[] }>('/admin/users');
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Usuarios</h2>
          <p className="text-gray-400 mt-1">Listado de usuarios registrados</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
          <span className="text-gray-400">Cargando usuarios...</span>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay usuarios registrados</p>
            </div>
          ) : (
            <table className="w-full" aria-label="Lista de usuarios">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50">
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Usuario
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Email
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Rol
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Pedidos
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Registro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                          {user.role === 'admin' ? (
                            <ShieldCheck className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className="text-white font-medium">
                          {[user.nombre, user.apellidos].filter(Boolean).join(' ') || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                            : 'bg-blue-900/30 text-blue-400 border border-blue-700'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {user.order_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {formatDate(user.creado_en)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="text-sm text-gray-500">
        {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
