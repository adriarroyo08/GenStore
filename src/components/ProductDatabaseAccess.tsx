import React from 'react';
import { Database, Eye, ExternalLink } from 'lucide-react';

interface ProductDatabaseAccessProps {
  onAccessDatabase: () => void;
}

export function ProductDatabaseAccess({ onAccessDatabase }: ProductDatabaseAccessProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-primary" />
        <h3 className="font-bold text-lg text-foreground">
          Visor de Base de Datos
        </h3>
      </div>
      
      <p className="text-muted-foreground mb-4">
        Visualiza y gestiona todos los productos almacenados en la base de datos con funciones 
        de búsqueda avanzada, filtrado por categorías y estadísticas detalladas.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4 text-blue-600" />
          <span>Visualización completa</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="w-4 h-4 text-green-600" />
          <span>Estadísticas en tiempo real</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="w-4 h-4 text-purple-600" />
          <span>Búsqueda y filtros</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="w-4 h-4 text-orange-600" />
          <span>Gestión de productos</span>
        </div>
      </div>
      
      <button
        onClick={onAccessDatabase}
        className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Database className="w-5 h-5" />
        <span>Acceder al Visor de Base de Datos</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}