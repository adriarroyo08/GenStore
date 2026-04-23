import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/apiClient';

import { ImageWithFallback } from './figma/ImageWithFallback';
import { ProductVerifier } from './ProductVerifier';
import { ProductDiagnostic } from './ProductDiagnostic';
import { ProductImagesDiagnostic } from './ProductImagesDiagnostic';
import { ImageQuickFix } from './ImageQuickFix';
import { CategoriesManagement } from './CategoriesManagement';
import { ServerHealthCheck } from './ServerHealthCheck';
import { SimpleServerTest } from './SimpleServerTest';
import { WishlistEndpointTest } from './WishlistEndpointTest';
import { DatabaseCleanupTool } from './DatabaseCleanupTool';
import { DatabaseCleanupAdvanced } from './DatabaseCleanupAdvanced';
import { WishlistEndpointTestAdvanced } from './WishlistEndpointTestAdvanced';
import { WishlistEndpointDiagnostic } from './WishlistEndpointDiagnostic';
import { ProductLoadDiagnostic } from './ProductLoadDiagnostic';
import { EmergencyReset } from './EmergencyReset';
import { ServerConnectivityTest } from './ServerConnectivityTest';
import { ServerStatusChecker } from './ServerStatusChecker';
import { SystemTestingAccess } from './SystemTestingAccess';
import { ProductDatabaseViewer } from './ProductDatabaseViewer';


import { Upload, X, Plus, Save, Package, Image as ImageIcon, Bug, RefreshCw, Eye, Trash2, Settings, Edit, Download, Link, Server, ArrowUp, ArrowDown, RotateCcw, Copy, Check, AlertCircle, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  brand: string;
  model: string;
  sku: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  availability: string;
  images: string[];
  specifications: Record<string, string>;
  features: string[];
  dimensions: string;
  weight: string;
  colors: Array<{ name: string; code: string }>;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  slug: string;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  shortDescription: '',
  category: '',
  brand: '',
  model: '',
  sku: '',
  price: 0,
  originalPrice: 0,
  discount: 0,
  stock: 0,
  availability: 'inStock',
  images: [],
  specifications: {},
  features: [],
  dimensions: '',
  weight: '',
  colors: [],
  metaTitle: '',
  metaDescription: '',
  keywords: '',
  slug: ''
};

export function AdminPage() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'manage' | 'categories' | 'status' | 'images' | 'debug' | 'testing' | 'database'>('basic');
  const [adminProducts, setAdminProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<ProductFormData>(initialFormData);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Enhanced image management state
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [imagePreviewMode, setImagePreviewMode] = useState<'grid' | 'list'>('grid');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Check admin access
  const isAdmin = user?.email === 'admin@genstore.com' || user?.email === 'adriarroyo2002@gmail.com';

  // Load categories on component mount
  React.useEffect(() => {
    if (isAdmin) {
      loadCategories();
    }
  }, [isAdmin]);

  // Load products when switching to manage tab
  React.useEffect(() => {
    if (activeTab === 'manage') {
      loadAdminProducts();
    }
  }, [activeTab]);

  // Auto-save effect for product editing
  React.useEffect(() => {
    if (!autoSaveEnabled || !editingProduct || !isEditModalOpen || isAutoSaving) return;

    const timeoutId = setTimeout(() => {
      autoSaveProduct();
    }, 10000); // Auto-save every 10 seconds (less aggressive)

    return () => clearTimeout(timeoutId);
  }, [editFormData, autoSaveEnabled, editingProduct, isEditModalOpen, isAutoSaving]);

  // Check server health on component mount
  React.useEffect(() => {
    if (isAdmin) {
      checkServerHealth();
    }
  }, [isAdmin]);

  // Initialize default categories
  const initializeCategories = async () => {
    try {
      setIsLoading(true);

      const result = await apiClient.post<any>('/admin/categories/reset', {});

      if (result.success) {
        alert(`✅ Categorías inicializadas exitosamente!\n\n${result.message || ''}`);
        await loadCategories();
      } else {
        throw new Error(result.error || 'Failed to initialize categories');
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al inicializar categorías: ${errorMessage}\n\nPor favor intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load categories from database
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);

      const result = await apiClient.get<any>('/categories');

      // The /categories endpoint returns an array directly
      if (Array.isArray(result)) {
        setCategories(result);
      } else if (result.success && Array.isArray(result.categories)) {
        const activeCategories = result.categories
          .filter((cat: any) => cat.isActive || cat.activo)
          .sort((a: any, b: any) => (a.order ?? a.orden ?? 0) - (b.order ?? b.orden ?? 0));
        setCategories(activeCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };





  const createAdminUser = async () => {
    try {
      const result = await apiClient.post<any>('/admin/create-admin', {});

      if (result.success) {
        alert(`✅ Usuario administrador creado/verificado exitosamente!\n\nEmail: ${result.credentials?.email}\n\nUsa estas credenciales para iniciar sesión como administrador.`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      alert('Error al crear usuario administrador');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Access Card */}
          <div className="flex items-center justify-center">
            <div className="text-center p-8 max-w-md bg-card rounded-lg border">
              <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
              <p className="text-muted-foreground mb-6">Necesitas iniciar sesión para acceder al panel de administración</p>
              
              <div className="space-y-4">
                <Button onClick={() => window.location.href = '/login'} className="w-full">
                  Iniciar Sesión
                </Button>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    ¿No tienes credenciales de administrador?
                  </p>
                  <Button 
                    onClick={createAdminUser}
                    variant="outline"
                    className="w-full"
                  >
                    Crear Usuario Administrador
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Access Denied Card */}
          <div className="flex items-center justify-center">
            <div className="text-center p-8 max-w-md bg-card rounded-lg border">
              <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
              <p className="text-muted-foreground mb-6">
                No tienes permisos para acceder a esta página. Solo el usuario administrador puede acceder.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  ℹ️ Información de Acceso
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  Para acceder al panel de administración, necesitas iniciar sesión con:
                </p>
                <div className="text-left bg-white dark:bg-gray-900 p-3 rounded border text-sm font-mono">
                  <div><strong>Email:</strong> admin@genstore.com</div>
                  <div><strong>Contraseña:</strong> admin123456</div>
                </div>
                <Button 
                  onClick={createAdminUser}
                  className="mt-4 w-full"
                  size="sm"
                >
                  Crear/Verificar Usuario Admin
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔍 Preparing product data for server...');
      
      // Validate required fields
      const requiredFields = {
        name: formData.name?.trim(),
        price: formData.price,
        category: formData.category?.trim()
      };

      if (!requiredFields.name) {
        throw new Error('El nombre del producto es requerido');
      }
      
      if (!requiredFields.price || requiredFields.price <= 0) {
        throw new Error('El precio del producto debe ser mayor a 0');
      }
      
      if (!requiredFields.category) {
        throw new Error('La categoría del producto es requerida');
      }

      // Prepare product data
      const productData = {
        ...formData,
        name: requiredFields.name,
        price: requiredFields.price,
        category: requiredFields.category,
        id: Date.now().toString(),
        rating: 0,
        reviews: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to backend
      const result = await apiClient.post<any>('/admin/products', productData);

      alert('¡Producto guardado exitosamente en la base de datos!');
      
      // Auto-save: automatically refresh the page if needed
      if (autoSaveEnabled) {
        setLastSavedAt(new Date().toLocaleTimeString());
        
        // Automatically refresh products list regardless of current tab
        await loadAdminProducts();
        
        // If not on manage tab, show suggestion to switch
        if (activeTab !== 'manage') {
          const switchToManage = confirm('✅ Producto creado exitosamente.\n\n¿Quieres ir a la pestaña "Gestionar Productos" para ver el producto añadido?');
          if (switchToManage) {
            setActiveTab('manage');
          }
        }
      }
      
      // Reset form
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar el producto: ${errorMessage}\\n\\nPor favor intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Enhanced image file upload for new products
  const handleNewProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    // Enhanced validation
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        errors.push(`"${file.name}" no es una imagen válida`);
        continue;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        errors.push(`"${file.name}" es demasiado grande (máx. 5MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(`❌ Errores encontrados:\\n${errors.join('\\n')}`);
    }

    if (validFiles.length === 0) {
      event.target.value = '';
      return;
    }

    setIsProcessingImages(true);
    const processedImages: string[] = [];

    // Process files with progress indication
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error(`Error al leer ${file.name}`));
          reader.readAsDataURL(file);
        });

        processedImages.push(base64);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push(`Error al procesar "${file.name}"`);
      }
    }

    // Add all processed images at once
    if (processedImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...processedImages]
      }));
    }

    setIsProcessingImages(false);
    
    if (processedImages.length > 0) {
      alert(`✅ ${processedImages.length} imagen${processedImages.length > 1 ? 'es' : ''} agregada${processedImages.length > 1 ? 's' : ''} exitosamente`);
      
      // Auto-save if enabled
      if (autoSaveEnabled) {
        setLastSavedAt(new Date().toLocaleTimeString());
      }
    }

    event.target.value = '';
  };

  // Handle image URL addition for new products
  const handleNewProductImageUrl = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  // Handle image removal for new products
  const handleRemoveNewProductImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };



  const loadAdminProducts = async (isRetry = false) => {
    if (!isRetry) {
      setRetryCount(0);
    }
    setIsLoadingProducts(true);
    try {
      const result = await apiClient.get<any>('/admin/products');

      // Handle both response formats
      if (Array.isArray(result.data)) {
        setAdminProducts(result.data);
      } else if (result.success && Array.isArray(result.products)) {
        setAdminProducts(result.products);
      } else if (Array.isArray(result)) {
        setAdminProducts(result);
      } else {
        setAdminProducts([]);
      }
    } catch (error) {
      console.error('Error fetching admin products:', error);

      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadAdminProducts(true), 2000 * (retryCount + 1));
        return;
      }

      alert(`❌ Error al cargar productos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setAdminProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const deleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`⚠️ ¿Estás seguro de que quieres eliminar el producto "${productName}"?\\n\\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/products/${productId}`);
      alert(`✅ Producto "${productName}" eliminado exitosamente`);
      await loadAdminProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Error al eliminar producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const deleteAllProducts = async () => {
    if (!confirm(`⚠️ ¿Estás seguro de que quieres eliminar TODOS los productos del catálogo?\\n\\n🚨 ADVERTENCIA: Esta acción eliminará permanentemente todos los productos administrados y no se puede deshacer.\\n\\nEscribe "DELETE ALL" en el siguiente prompt para confirmar.`)) {
      return;
    }

    const confirmation = prompt('Para confirmar la eliminación de TODOS los productos, escribe exactamente: DELETE ALL');
    if (confirmation !== 'DELETE ALL') {
      alert('❌ Confirmación incorrecta. Operación cancelada.');
      return;
    }

    try {
      const result = await apiClient.delete<any>('/admin/products/delete-all');
      alert(`✅ Productos eliminados exitosamente del catálogo`);
      await loadAdminProducts();
    } catch (error) {
      console.error('Error deleting all products:', error);
      alert(`Error al eliminar todos los productos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };



  // Handle edit product
  const handleEditProduct = (product: any) => {
    console.log('🔧 Opening product for editing:', product.name);
    setEditingProduct(product);
    
    // Convert product data to form format
    const formData: ProductFormData = {
      name: product.name || '',
      description: product.description || '',
      shortDescription: product.shortDescription || product.description || '',
      category: product.category || '',
      brand: product.brand || '',
      model: product.model || '',
      sku: product.sku || '',
      price: typeof product.price === 'number' ? product.price : 0,
      originalPrice: typeof product.originalPrice === 'number' ? product.originalPrice : 0,
      discount: typeof product.discount === 'number' ? product.discount : 0,
      stock: typeof product.stock === 'number' ? product.stock : 0,
      availability: product.availability || 'inStock',
      images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
      specifications: typeof product.specifications === 'object' ? product.specifications : (product.specs || {}),
      features: Array.isArray(product.features) ? product.features : [],
      dimensions: product.dimensions || product.specs?.dimensions || '',
      weight: product.weight || product.specs?.weight || '',
      colors: Array.isArray(product.colors) ? product.colors : [],
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      keywords: product.keywords || '',
      slug: product.slug || ''
    };
    
    setEditFormData(formData);
    setIsEditModalOpen(true);
  };

  // Handle save edited product
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSavingEdit(true);
    try {
      console.log('💾 Saving edited product:', editingProduct.id);
      
      // Validate required fields
      if (!editFormData.name.trim()) {
        throw new Error('El nombre del producto es requerido');
      }
      if (!editFormData.price || editFormData.price <= 0) {
        throw new Error('El precio del producto debe ser mayor a 0');
      }
      if (!editFormData.category.trim()) {
        throw new Error('La categoría del producto es requerida');
      }

      // Prepare updated product data
      const updatedProduct = {
        ...editFormData,
        id: editingProduct.id,
        rating: editingProduct.rating || 0,
        reviews: editingProduct.reviews || 0,
        createdAt: editingProduct.createdAt,
        updatedAt: new Date().toISOString()
      };

      // Save to backend
      await apiClient.put(`/admin/products/${editingProduct.id}`, updatedProduct);

      alert('✅ Producto actualizado exitosamente');
      
      // Close modal
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setEditFormData(initialFormData);
      
      // Refresh products list
      await loadAdminProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al actualizar el producto: ${errorMessage}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle edit form changes
  const handleEditFormChange = (field: keyof ProductFormData, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Enhanced image file upload with better UX
  const handleEnhancedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    // Enhanced validation
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        errors.push(`"${file.name}" no es una imagen válida`);
        continue;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        errors.push(`"${file.name}" es demasiado grande (máx. 5MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(`❌ Errores encontrados:\\n${errors.join('\\n')}`);
    }

    if (validFiles.length === 0) {
      event.target.value = '';
      return;
    }

    setIsProcessingImages(true);
    const processedImages: string[] = [];

    // Process files with progress indication
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error(`Error al leer ${file.name}`));
          reader.readAsDataURL(file);
        });

        processedImages.push(base64);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push(`Error al procesar "${file.name}"`);
      }
    }

    // Add all processed images at once
    if (processedImages.length > 0) {
      setEditFormData(prev => ({
        ...prev,
        images: [...prev.images, ...processedImages]
      }));
    }

    setIsProcessingImages(false);
    
    if (processedImages.length > 0) {
      alert(`✅ ${processedImages.length} imagen${processedImages.length > 1 ? 'es' : ''} agregada${processedImages.length > 1 ? 's' : ''} exitosamente`);
    }

    event.target.value = '';
  };

  // Handle image file upload (legacy support for existing uploads)
  const handleImageFileUpload = handleEnhancedImageUpload;

  // Handle image URL addition (keep as alternative)
  const handleAddImageUrl = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url && url.trim()) {
      setEditFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  // Enhanced image management functions
  const handleRemoveImage = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setSelectedImages(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  // Move image up in order
  const moveImageUp = (index: number) => {
    if (index === 0) return;
    setEditFormData(prev => {
      const newImages = [...prev.images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return { ...prev, images: newImages };
    });
  };

  // Move image down in order
  const moveImageDown = (index: number) => {
    setEditFormData(prev => {
      if (index >= prev.images.length - 1) return prev;
      const newImages = [...prev.images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return { ...prev, images: newImages };
    });
  };

  // Handle drag start for image reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop for image reordering
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setEditFormData(prev => {
      const newImages = [...prev.images];
      const draggedImage = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);
      return { ...prev, images: newImages };
    });

    setDraggedIndex(null);
  };

  // Set image as primary (move to first position)
  const setAsPrimaryImage = (index: number) => {
    if (index === 0) return;
    setEditFormData(prev => {
      const newImages = [...prev.images];
      const primaryImage = newImages.splice(index, 1)[0];
      newImages.unshift(primaryImage);
      return { ...prev, images: newImages };
    });
  };

  // Duplicate image
  const duplicateImage = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      images: [
        ...prev.images.slice(0, index + 1),
        prev.images[index],
        ...prev.images.slice(index + 1)
      ]
    }));
  };

  // Remove selected images (bulk operation)
  const removeSelectedImages = () => {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedImages.length} imagen${selectedImages.length > 1 ? 'es' : ''}?`)) {
      return;
    }

    setEditFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => !selectedImages.includes(index))
    }));
    setSelectedImages([]);
  };

  // Toggle image selection
  const toggleImageSelection = (index: number) => {
    setSelectedImages(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Select all images
  const selectAllImages = () => {
    setSelectedImages(editFormData.images.map((_, index) => index));
  };

  // Clear image selection
  const clearImageSelection = () => {
    setSelectedImages([]);
  };

  // Enhanced auto-save functionality with error handling
  const autoSaveProduct = async () => {
    if (!autoSaveEnabled || !editingProduct || isAutoSaving) return;

    try {
      // Validate required fields before auto-saving
      if (!editFormData.name.trim() || !editFormData.price || editFormData.price <= 0 || !editFormData.category.trim()) {
        console.log('⚠️ Auto-save skipped: Required fields missing (name, price, category)');
        setAutoSaveStatus('error');
        return;
      }

      setIsAutoSaving(true);
      setAutoSaveStatus('saving');

      const updatedProduct = {
        ...editFormData,
        id: editingProduct.id,
        rating: editingProduct.rating || 0,
        reviews: editingProduct.reviews || 0,
        createdAt: editingProduct.createdAt,
        updatedAt: new Date().toISOString()
      };

      await apiClient.put(`/admin/products/${editingProduct.id}`, updatedProduct);
      setLastSavedAt(new Date().toLocaleTimeString());
      setAutoSaveStatus('success');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('❌ Auto-save error:', error);
      setAutoSaveStatus('error');
      
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('🌐 Auto-save failed due to network issues - will retry later');
      }
      
      // Reset error status after delay
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Handle specification addition
  const handleAddSpecification = () => {
    const key = prompt('Nombre de la especificación:');
    if (!key?.trim()) return;
    
    const value = prompt('Valor de la especificación:');
    if (!value?.trim()) return;
    
    setEditFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
  };

  // Handle specification removal
  const handleRemoveSpecification = (key: string) => {
    setEditFormData(prev => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications).filter(([k]) => k !== key)
      )
    }));
  };

  // Handle feature addition
  const handleAddFeature = () => {
    const feature = prompt('Nueva característica:');
    if (feature?.trim()) {
      setEditFormData(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }));
    }
  };

  // Handle feature removal
  const handleRemoveFeature = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Handle color addition
  const handleAddColor = () => {
    const name = prompt('Nombre del color:');
    if (!name?.trim()) return;
    
    const code = prompt('Código del color (ej. #FF0000):');
    if (!code?.trim()) return;
    
    setEditFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: name.trim(), code: code.trim() }]
    }));
  };

  // Handle color removal
  const handleRemoveColor = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  // Function to check server health and endpoints
  const checkServerHealth = async () => {
    try {
      const healthData = await apiClient.get<any>('/health');
      console.log('✅ Server health check passed:', healthData);

      const productsData = await apiClient.get<any>('/admin/products');
      console.log('✅ Products endpoint working');
    } catch (error) {
      console.error('Server health check failed:', error);
      alert(`❌ Server health check failed: ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Añadir Producto', icon: Plus },
    { id: 'manage', label: 'Gestionar Productos', icon: Settings },
    { id: 'categories', label: 'Categorías', icon: Package },
    { id: 'status', label: 'Estado Servidor', icon: Server },
    { id: 'images', label: 'Diagnóstico Imágenes', icon: ImageIcon },
    { id: 'debug', label: 'Debug', icon: Bug }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
              <p className="text-muted-foreground mt-2">
                {activeTab === 'basic' ? 'Añadir nuevos productos al catálogo' : 
                 activeTab === 'manage' ? 'Gestionar productos existentes' : 
                 activeTab === 'categories' ? 'Gestionar categorías de productos' :
                 activeTab === 'status' ? 'Verificar estado y conectividad del servidor' :
                 'Herramientas de depuración'}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Auto-save Toggle */}
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Auto-guardar
                </label>
                {lastSavedAt && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {lastSavedAt}
                  </span>
                )}
              </div>

              {/* Quick Server Test */}
              <Button
                onClick={checkServerHealth}
                variant="outline"
                size="sm"
                className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
              >
                <Server className="w-3 h-3 mr-1" />
                Diagnóstico Server
              </Button>

              {activeTab === 'manage' && (
                <>
                  <Button 
                    onClick={() => loadAdminProducts(false)}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingProducts}
                    className={retryCount > 0 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : ''}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                    {isLoadingProducts ? 'Cargando...' : retryCount > 0 ? `Reintentar (${retryCount})` : 'Recargar'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Server Diagnostics Section - At the top for immediate visibility */}


          {/* Navigation Tabs */}
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                      ${activeTab === tab.id 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Basic Information Tab - Add Product */}
          {activeTab === 'basic' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Nombre del Producto *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="ej. iPhone 15 Pro Max"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="shortDescription">Descripción Corta *</Label>
                    <Textarea
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                      placeholder="Breve descripción del producto..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción Completa *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descripción detallada del producto..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoría *</Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        required
                        disabled={isLoadingCategories}
                      >
                        <option value="">
                          {isLoadingCategories ? 'Cargando categorías...' : 'Seleccionar categoría'}
                        </option>
                        {categories.map((category) => (
                          <option key={category.id || category.slug} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                        {!isLoadingCategories && categories.length === 0 && (
                          <option value="" disabled>
                            No hay categorías disponibles
                          </option>
                        )}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="brand">Marca *</Label>
                      <Input
                        id="brand"
                        type="text"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="ej. Apple"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Precio ({currency.symbol}) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Precio Original ({currency.symbol})</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="availability">Disponibilidad</Label>
                      <select
                        id="availability"
                        value={formData.availability}
                        onChange={(e) => handleInputChange('availability', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      >
                        <option value="inStock">En Stock</option>
                        <option value="outOfStock">Agotado</option>
                        <option value="limitedStock">Stock Limitado</option>
                        <option value="preOrder">Pre-pedido</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        type="text"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        placeholder="ej. A2848"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        placeholder="ej. IPH15PM-256-TB"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Imágenes del Producto</Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="newProductImageUpload"
                      accept="image/*"
                      multiple
                      onChange={handleNewProductImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('newProductImageUpload')?.click()}
                      className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Archivos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNewProductImageUrl}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Agregar URL
                    </Button>
                  </div>
                </div>
                
                {formData.images.length === 0 ? (
                  <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                    <ImageIcon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-3">No hay imágenes agregadas</p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('newProductImageUpload')?.click()}
                        className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Imagen
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleNewProductImageUrl}
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Agregar URL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative bg-muted rounded-lg p-3">
                        <div className="aspect-square bg-background rounded-lg mb-2 overflow-hidden">
                          <ImageWithFallback
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            {image.startsWith('data:') ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                <Upload className="w-2.5 h-2.5 mr-1" />
                                Local
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                <Link className="w-2.5 h-2.5 mr-1" />
                                URL
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {image.startsWith('data:') 
                              ? `${(image.length / 1024).toFixed(1)} KB` 
                              : image}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveNewProductImage(index)}
                          className="w-full"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-border">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Guardar Producto'}
                </Button>
              </div>
            </form>
          )}

          {/* Product Inserters - Quick Product Creation */}
          {activeTab === 'basic' && (
            <div className="mt-8">

            </div>
          )}

          {/* Manage Products Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Gestionar Productos del Catálogo</h3>
                  <p className="text-muted-foreground mt-1">Ver, editar y eliminar productos existentes</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={loadAdminProducts}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingProducts}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                    Recargar
                  </Button>
                  <Button 
                    onClick={deleteAllProducts}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Todos
                  </Button>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-card rounded-lg border border-border">
                {isLoadingProducts ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Cargando productos...</p>
                  </div>
                ) : adminProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="text-lg font-medium text-foreground mb-2">No hay productos en el catálogo</h4>
                    <p className="text-muted-foreground mb-4">
                      Comienza añadiendo productos usando la pestaña &quot;Añadir Producto&quot; o el botón &quot;Insertar Air Fryer 6L&quot;
                    </p>
                    <Button 
                      onClick={() => setActiveTab('basic')}
                      className="mr-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir Primer Producto
                    </Button>
                    {/* Product insertion functionality moved to ProductInserters component */}
                    <div className="text-sm text-muted-foreground">
                      Ve a la pestaña &quot;Añadir Producto&quot; para usar la inserción rápida
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr className="bg-muted/50">
                          <th className="text-left p-4 font-medium text-foreground">Producto</th>
                          <th className="text-left p-4 font-medium text-foreground">Categoría</th>
                          <th className="text-left p-4 font-medium text-foreground">Precio</th>
                          <th className="text-left p-4 font-medium text-foreground">Stock</th>
                          <th className="text-left p-4 font-medium text-foreground">Estado</th>
                          <th className="text-right p-4 font-medium text-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminProducts.map((product: any, index: number) => (
                          <tr key={product.id || index} className="border-b border-border hover:bg-muted/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {product.images && product.images[0] ? (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                    <ImageWithFallback
                                      src={product.images[0]}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-foreground">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.brand} {product.model && `• ${product.model}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm capitalize">
                                {product.category}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="text-foreground">
                                {currency.symbol}{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                              </div>
                              {product.originalPrice && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {currency.symbol}{product.originalPrice.toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-sm ${
                                (product.stock || 0) > 10 ? 'bg-green-100 text-green-800' :
                                (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {product.stock || 0} unidades
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-sm ${
                                product.availability === 'inStock' ? 'bg-green-100 text-green-800' :
                                product.availability === 'limitedStock' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {product.availability === 'inStock' ? 'Disponible' :
                                 product.availability === 'limitedStock' ? 'Stock Limitado' :
                                 product.availability === 'preOrder' ? 'Pre-pedido' :
                                 'Agotado'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteProduct(product.id, product.name)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <CategoriesManagement />
          )}

          {/* Server Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Estado del Servidor</h3>
                <p className="text-muted-foreground mt-1">Verificación de conectividad y estado de los endpoints del servidor</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <ServerStatusChecker />
                </div>
                
              </div>
            </div>
          )}

          {/* Images Diagnostic Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <ImageQuickFix />
              <div className="bg-card border border-border rounded-lg p-6">
                <ProductImagesDiagnostic />
              </div>
            </div>
          )}

          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Herramientas de Depuración</h3>
                <p className="text-muted-foreground mt-1">Diagnóstico y verificación del sistema de productos</p>
              </div>
              
              {/* Category Management Section */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Gestión de Categorías</h4>
                    <p className="text-sm text-muted-foreground">Inicializar o restablecer las categorías del sistema</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={initializeCategories}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Inicializando...' : 'Inicializar Categorías Base'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Esto creará o restablecerá las categorías principales: Productos y Cosmética
                  </p>
                </div>
              </div>
              

              {/* Emergency Reset - Top Priority */}
              <EmergencyReset />
              
              {/* Database Cleanup Advanced */}
              <DatabaseCleanupAdvanced />
              
              {/* Product Load Diagnostic */}
              <ProductLoadDiagnostic />
              
              {/* Wishlist Tests */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WishlistEndpointTestAdvanced />
                <WishlistEndpointDiagnostic />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ProductVerifier />
                <ProductDiagnostic />
                <div className="bg-card border border-border rounded-lg p-6">
                  <ServerHealthCheck />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Product Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Producto: {editingProduct?.name}
              </DialogTitle>
              <DialogDescription>
                Modifica los detalles del producto. Los campos marcados con * son obligatorios.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="images">Imágenes</TabsTrigger>
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Nombre del Producto *</Label>
                      <Input
                        id="edit-name"
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        placeholder="ej. iPhone 15 Pro Max"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-brand">Marca *</Label>
                      <Input
                        id="edit-brand"
                        type="text"
                        value={editFormData.brand}
                        onChange={(e) => handleEditFormChange('brand', e.target.value)}
                        placeholder="ej. Apple"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-shortDescription">Descripción Corta *</Label>
                    <Textarea
                      id="edit-shortDescription"
                      value={editFormData.shortDescription}
                      onChange={(e) => handleEditFormChange('shortDescription', e.target.value)}
                      placeholder="Breve descripción del producto..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Descripción Completa *</Label>
                    <Textarea
                      id="edit-description"
                      value={editFormData.description}
                      onChange={(e) => handleEditFormChange('description', e.target.value)}
                      placeholder="Descripción detallada del producto..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-category">Categoría *</Label>
                      <select
                        id="edit-category"
                        value={editFormData.category}
                        onChange={(e) => handleEditFormChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        required
                        disabled={isLoadingCategories}
                      >
                        <option value="">
                          {isLoadingCategories ? 'Cargando categorías...' : 'Seleccionar categoría'}
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                        {/* Legacy categories for backward compatibility */}
                        {categories.length === 0 && !isLoadingCategories && (
                          <>
                            <option value="productos">Productos</option>
                            <option value="cosmetica">Cosmética</option>
                            <option value="smartphones">Smartphones</option>
                            <option value="laptops">Laptops</option>
                            <option value="headphones">Audífonos</option>
                            <option value="gaming">Gaming</option>
                            <option value="accessories">Accesorios</option>
                            <option value="wearables">Wearables</option>
                            <option value="tablets">Tablets</option>
                            <option value="kitchen">Cocina</option>
                            <option value="home-appliances">Electrodomésticos del Hogar</option>
                          </>
                        )}
                      </select>
                      {isLoadingCategories && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Cargando categorías desde la base de datos...
                        </p>
                      )}
                      {categories.length === 0 && !isLoadingCategories && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          No se encontraron categorías. Usa el botón &quot;Inicializar Categorías Base&quot; en la pestaña Debug.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="edit-model">Modelo</Label>
                      <Input
                        id="edit-model"
                        type="text"
                        value={editFormData.model}
                        onChange={(e) => handleEditFormChange('model', e.target.value)}
                        placeholder="ej. A2848"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-sku">SKU</Label>
                      <Input
                        id="edit-sku"
                        type="text"
                        value={editFormData.sku}
                        onChange={(e) => handleEditFormChange('sku', e.target.value)}
                        placeholder="ej. IPH15PM-256-TB"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-price">Precio ({currency.symbol}) *</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        value={editFormData.price}
                        onChange={(e) => handleEditFormChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-originalPrice">Precio Original ({currency.symbol})</Label>
                      <Input
                        id="edit-originalPrice"
                        type="number"
                        step="0.01"
                        value={editFormData.originalPrice}
                        onChange={(e) => handleEditFormChange('originalPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-stock">Stock *</Label>
                      <Input
                        id="edit-stock"
                        type="number"
                        min="0"
                        value={editFormData.stock}
                        onChange={(e) => handleEditFormChange('stock', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-availability">Disponibilidad</Label>
                    <select
                      id="edit-availability"
                      value={editFormData.availability}
                      onChange={(e) => handleEditFormChange('availability', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="inStock">En Stock</option>
                      <option value="outOfStock">Agotado</option>
                      <option value="limitedStock">Stock Limitado</option>
                      <option value="preOrder">Pre-pedido</option>
                    </select>
                  </div>
                </TabsContent>

                {/* Enhanced Images Tab */}
                <TabsContent value="images" className="space-y-4 mt-4">
                  {/* Image Management Header */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <Label className="text-lg">Gestión Avanzada de Imágenes</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Arrastra para reordenar • Click para seleccionar • Primera imagen = imagen principal
                      </p>
                    </div>
                    
                    {/* Auto-save indicator */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="modalAutoSave"
                          checked={autoSaveEnabled}
                          onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="modalAutoSave" className="text-sm cursor-pointer">
                          Auto-guardar
                        </label>
                      </div>
                      
                      {autoSaveEnabled && (
                        <div className="flex items-center gap-2 text-xs px-2 py-1 rounded transition-all duration-300">
                          {autoSaveStatus === 'saving' && (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                              <span className="text-blue-600 dark:text-blue-400">Guardando...</span>
                            </>
                          )}
                          
                          {autoSaveStatus === 'success' && lastSavedAt && (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                Guardado: {lastSavedAt}
                              </span>
                            </>
                          )}
                          
                          {autoSaveStatus === 'error' && (
                            <>
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                Error al guardar
                              </span>
                            </>
                          )}
                          
                          {autoSaveStatus === 'idle' && lastSavedAt && (
                            <span className="text-muted-foreground">
                              Último guardado: {lastSavedAt}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Upload Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      id="enhancedImageUpload"
                      accept="image/*"
                      multiple
                      onChange={handleEnhancedImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('enhancedImageUpload')?.click()}
                      disabled={isProcessingImages}
                      className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                    >
                      {isProcessingImages ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {isProcessingImages ? 'Procesando...' : 'Subir Imágenes'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddImageUrl}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Agregar URL
                    </Button>

                    {/* Bulk Selection Controls */}
                    {editFormData.images.length > 0 && (
                      <>
                        <div className="w-px h-6 bg-border" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={selectAllImages}
                          disabled={selectedImages.length === editFormData.images.length}
                        >
                          Seleccionar Todo
                        </Button>
                        
                        {selectedImages.length > 0 && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearImageSelection}
                            >
                              Limpiar ({selectedImages.length})
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeSelectedImages}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar Seleccionadas
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  
                  {editFormData.images.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h4 className="text-lg font-medium text-foreground mb-2">No hay imágenes</h4>
                      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Agrega imágenes del producto para mostrar a tus clientes. La primera imagen será la principal.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('enhancedImageUpload')?.click()}
                          disabled={isProcessingImages}
                          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Imágenes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddImageUrl}
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Agregar URL
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Images Grid with Drag & Drop */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {editFormData.images.map((image, index) => (
                          <div
                            key={`${image}-${index}`}
                            className={`relative bg-card rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              selectedImages.includes(index) 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : draggedIndex === index 
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 opacity-50'
                                  : 'border-border hover:border-primary/30'
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onClick={() => toggleImageSelection(index)}
                          >
                            {/* Primary Badge */}
                            {index === 0 && (
                              <div className="absolute top-2 left-2 z-10 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                                Principal
                              </div>
                            )}

                            {/* Selection Checkbox */}
                            <div className="absolute top-2 right-2 z-10">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedImages.includes(index) 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'bg-white border-gray-300'
                              }`}>
                                {selectedImages.includes(index) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </div>

                            {/* Image Preview */}
                            <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                              <ImageWithFallback
                                src={image}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Image Info */}
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                {image.startsWith('data:') ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                    <Upload className="w-3 h-3 mr-1" />
                                    Local ({(image.length / 1024).toFixed(0)} KB)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                    <Link className="w-3 h-3 mr-1" />
                                    URL
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-1">
                                {index !== 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAsPrimaryImage(index);
                                    }}
                                    className="text-xs px-2 py-1 h-auto text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                    title="Establecer como imagen principal"
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Principal
                                  </Button>
                                )}
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveImageUp(index);
                                  }}
                                  disabled={index === 0}
                                  className="text-xs px-2 py-1 h-auto"
                                  title="Mover hacia arriba"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveImageDown(index);
                                  }}
                                  disabled={index === editFormData.images.length - 1}
                                  className="text-xs px-2 py-1 h-auto"
                                  title="Mover hacia abajo"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateImage(index);
                                  }}
                                  className="text-xs px-2 py-1 h-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Duplicar imagen"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage(index);
                                  }}
                                  className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Eliminar imagen"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* URL Preview for external images */}
                              {!image.startsWith('data:') && (
                                <p className="text-xs text-muted-foreground truncate" title={image}>
                                  {image}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Instructions */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-2 text-sm">
                            <h5 className="font-medium text-blue-900 dark:text-blue-100">
                              Instrucciones de uso:
                            </h5>
                            <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                              <li>• <strong>Arrastra</strong> las imágenes para reordenarlas</li>
                              <li>• <strong>Click</strong> en una imagen para seleccionarla</li>
                              <li>• La <strong>primera imagen</strong> aparecerá como imagen principal del producto</li>
                              <li>• Usa <strong>&quot;Principal&quot;</strong> para mover cualquier imagen al primer lugar</li>
                              <li>• Sube máximo <strong>5MB por imagen</strong> (JPG, PNG, GIF, WebP)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-dimensions">Dimensiones</Label>
                      <Input
                        id="edit-dimensions"
                        type="text"
                        value={editFormData.dimensions}
                        onChange={(e) => handleEditFormChange('dimensions', e.target.value)}
                        placeholder="ej. 32.5 x 31.5 x 33.5 cm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-weight">Peso</Label>
                      <Input
                        id="edit-weight"
                        type="text"
                        value={editFormData.weight}
                        onChange={(e) => handleEditFormChange('weight', e.target.value)}
                        placeholder="ej. 4.5 kg"
                      />
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Especificaciones</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSpecification}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Especificación
                      </Button>
                    </div>
                    
                    {Object.entries(editFormData.specifications).length === 0 ? (
                      <div className="text-center py-4 bg-muted/30 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">No hay especificaciones</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(editFormData.specifications).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <strong className="flex-shrink-0">{key}:</strong>
                            <span className="flex-grow">{value}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSpecification(key)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Características</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddFeature}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Característica
                      </Button>
                    </div>
                    
                    {editFormData.features.length === 0 ? (
                      <div className="text-center py-4 bg-muted/30 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">No hay características</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editFormData.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <span className="flex-grow">{feature}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFeature(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Colors */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Colores Disponibles</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddColor}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Color
                      </Button>
                    </div>
                    
                    {editFormData.colors.length === 0 ? (
                      <div className="text-center py-4 bg-muted/30 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">No hay colores definidos</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {editFormData.colors.map((color, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <div
                              className="w-6 h-6 rounded-full border border-border"
                              style={{ backgroundColor: color.code }}
                            />
                            <span className="flex-grow">{color.name}</span>
                            <span className="text-xs text-muted-foreground">{color.code}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveColor(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="edit-metaTitle">Meta Título (SEO)</Label>
                    <Input
                      id="edit-metaTitle"
                      type="text"
                      value={editFormData.metaTitle}
                      onChange={(e) => handleEditFormChange('metaTitle', e.target.value)}
                      placeholder="Título para motores de búsqueda..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-metaDescription">Meta Descripción (SEO)</Label>
                    <Textarea
                      id="edit-metaDescription"
                      value={editFormData.metaDescription}
                      onChange={(e) => handleEditFormChange('metaDescription', e.target.value)}
                      placeholder="Descripción para motores de búsqueda..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-keywords">Palabras Clave (SEO)</Label>
                    <Input
                      id="edit-keywords"
                      type="text"
                      value={editFormData.keywords}
                      onChange={(e) => handleEditFormChange('keywords', e.target.value)}
                      placeholder="palabra1, palabra2, palabra3..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-slug">Slug de URL</Label>
                    <Input
                      id="edit-slug"
                      type="text"
                      value={editFormData.slug}
                      onChange={(e) => handleEditFormChange('slug', e.target.value)}
                      placeholder="url-amigable-del-producto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-discount">Descuento (%)</Label>
                      <Input
                        id="edit-discount"
                        type="number"
                        min="0"
                        max="100"
                        value={editFormData.discount}
                        onChange={(e) => handleEditFormChange('discount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingEdit}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}