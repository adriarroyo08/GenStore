import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Warehouse,
  Truck,
  Users,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminOrders } from './AdminOrders';
import { AdminInventory } from './AdminInventory';
import { AdminUsers } from './AdminUsers';
import { AdminSettings } from './AdminSettings';
import { AdminSuppliers } from './AdminSuppliers';

type Section =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'inventory'
  | 'suppliers'
  | 'users'
  | 'settings';

interface NavItem {
  key: Section;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'products', label: 'Productos', icon: <Package className="w-5 h-5" /> },
  { key: 'categories', label: 'Categorías', icon: <FolderTree className="w-5 h-5" /> },
  { key: 'orders', label: 'Pedidos', icon: <ShoppingCart className="w-5 h-5" /> },
  { key: 'inventory', label: 'Inventario', icon: <Warehouse className="w-5 h-5" /> },
  { key: 'suppliers', label: 'Proveedores', icon: <Truck className="w-5 h-5" /> },
  { key: 'users', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
  { key: 'settings', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
];

function renderSection(section: Section) {
  switch (section) {
    case 'dashboard':
      return <AdminDashboard />;
    case 'products':
      return <AdminProducts />;
    case 'categories':
      return <AdminCategories />;
    case 'orders':
      return <AdminOrders />;
    case 'inventory':
      return <AdminInventory />;
    case 'suppliers':
      return <AdminSuppliers />;
    case 'users':
      return <AdminUsers />;
    case 'settings':
      return <AdminSettings />;
    default:
      return <AdminDashboard />;
  }
}

export function AdminLayout() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 border-r border-gray-700 flex flex-col transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white">Panel de Administración</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Navegación de administración" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveSection(item.key);
                setSidebarOpen(false);
              }}
              aria-current={activeSection === item.key ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center px-4 py-3 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors mr-3"
            aria-label="Abrir menú lateral"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">Panel de Administración</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {renderSection(activeSection)}
        </main>
      </div>
    </div>
  );
}
