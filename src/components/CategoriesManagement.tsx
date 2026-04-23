import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  slug: string;
  icon: string;
  order: number;
  isActive: boolean;
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  slug: '',
  icon: 'package',
  order: 0,
  isActive: true
};

export function CategoriesManagement() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      console.log('📂 Loading categories from server...');

      const result = await apiClient.get<any>('/categories');

      if (result.success) {
        console.log('✅ Categories loaded successfully:', result.categories?.length || 0);
        setCategories(result.categories || []);
      } else {
        throw new Error(result.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      
      // Set default categories as fallback
      const defaultCategories = [
        {
          id: 'productos',
          name: 'Productos',
          description: 'Productos para productos y rehabilitación',
          slug: 'productos',
          icon: 'activity',
          order: 0,
          isActive: true,
          productCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cosmetica',
          name: 'Cosmética',
          description: 'Productos de belleza y cuidado personal',
          slug: 'cosmetica',
          icon: 'sparkles',
          order: 1,
          isActive: true,
          productCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      console.log('🚨 Using fallback categories due to error');
      setCategories(defaultCategories);
      
      alert(`${t('admin.categories.loadError')}: ${error.message}\n\nUsing default categories as fallback.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      ...initialFormData,
      order: categories.length
    });
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug,
      icon: category.icon,
      order: category.order,
      isActive: category.isActive
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug from name
      if (field === 'name') {
        updated.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      return updated;
    });
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return t('admin.categories.nameRequired');
    }
    
    if (!formData.slug.trim()) {
      return t('admin.categories.slugRequired');
    }
    
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      return t('admin.categories.slugInvalid');
    }
    
    // Check for duplicate slug
    const existingCategory = categories.find(cat => 
      cat.slug === formData.slug && cat.id !== editingCategory?.id
    );
    if (existingCategory) {
      return 'Ya existe una categoría con este slug';
    }
    
    return null;
  };

  const handleSaveCategory = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = editingCategory !== null;

      const result = isEditing
        ? await apiClient.put<any>(`/admin/categories/${editingCategory.id}`, { category: formData })
        : await apiClient.post<any>('/admin/categories', { category: formData });

      if (result.success) {
        const successMessage = isEditing 
          ? t('admin.categories.updateSuccess')
          : t('admin.categories.createSuccess');
        
        alert(`✅ ${successMessage}`);
        setIsModalOpen(false);
        setFormData(initialFormData);
        setEditingCategory(null);
        await loadCategories();
      } else {
        throw new Error(result.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('❌ Error saving category:', error);
      const errorMessage = editingCategory 
        ? t('admin.categories.updateError')
        : t('admin.categories.createError');
      
      alert(`❌ ${errorMessage}: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`${t('admin.categories.deleteConfirm')}\n\n"${category.name}"\n\n${t('admin.categories.deleteWarning')}`)) {
      return;
    }

    try {
      const result = await apiClient.delete<any>(`/admin/categories/${category.id}`);

      if (result.success) {
        alert(`✅ ${t('admin.categories.deleteSuccess')}`);
        await loadCategories();
      } else {
        throw new Error(result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      alert(`❌ ${t('admin.categories.deleteError')}: ${error.message}`);
    }
  };

  const handleResetToDefaultCategories = async () => {
    if (!confirm('⚠️ ATENCIÓN: Esto eliminará TODAS las categorías existentes y creará solo 2 nuevas: Productos y Cosmética.\n\n¿Estás seguro de que quieres continuar?')) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await apiClient.post<any>('/admin/categories/reset', {});

      if (result.success) {
        alert(`✅ ${result.message}\n\nCategorías creadas:\n- Productos\n- Cosmética`);
        await loadCategories(); // Reload the categories list
      } else {
        throw new Error(result.error || 'Failed to reset categories');
      }
    } catch (error) {
      console.error('❌ Error resetting categories:', error);
      alert(`❌ Error al resetear categorías: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.categories.title')}</h2>
          <p className="text-muted-foreground">
            Gestiona las categorías de productos para organizar tu catálogo
          </p>
          {/* Temporary Reset Button */}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleResetToDefaultCategories}
            className="mt-2 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Reset to Default Categories
          </Button>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddCategory} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('admin.categories.addCategory')}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t('admin.categories.editCategory') : t('admin.categories.addCategory')}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Modify the category details below.' 
                  : 'Create a new category to organize your products.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="categoryName">{t('admin.categories.nameLabel')}</Label>
                <Input
                  id="categoryName"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder={t('admin.categories.namePlaceholder')}
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">{t('admin.categories.descriptionLabel')}</Label>
                <Textarea
                  id="categoryDescription"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder={t('admin.categories.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
              
              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="categorySlug">{t('admin.categories.slugLabel')}</Label>
                <Input
                  id="categorySlug"
                  value={formData.slug}
                  onChange={(e) => handleFormChange('slug', e.target.value)}
                  placeholder={t('admin.categories.slugPlaceholder')}
                />
              </div>
              
              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="categoryIcon">{t('admin.categories.iconLabel')}</Label>
                <Input
                  id="categoryIcon"
                  value={formData.icon}
                  onChange={(e) => handleFormChange('icon', e.target.value)}
                  placeholder={t('admin.categories.iconPlaceholder')}
                />
              </div>
              
              {/* Order */}
              <div className="space-y-2">
                <Label htmlFor="categoryOrder">{t('admin.categories.orderLabel')}</Label>
                <Input
                  id="categoryOrder"
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleFormChange('order', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              
              {/* Active status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="categoryActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleFormChange('isActive', checked)}
                />
                <Label htmlFor="categoryActive">{t('admin.categories.isActive')}</Label>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  {t('admin.categories.cancel')}
                </Button>
                <Button
                  onClick={handleSaveCategory}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingCategory ? t('admin.categories.save') : t('admin.categories.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Categories List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">{t('general.loading')}</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('admin.categories.noCategories')}</h3>
          <p className="text-muted-foreground mb-4">{t('admin.categories.noCategoriesDescription')}</p>
          <Button onClick={handleAddCategory} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('admin.categories.addCategory')}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">{t('admin.categories.name')}</th>
                <th className="px-4 py-3 text-left">{t('admin.categories.description')}</th>
                <th className="px-4 py-3 text-left">{t('admin.categories.products')}</th>
                <th className="px-4 py-3 text-left">{t('admin.categories.status')}</th>
                <th className="px-4 py-3 text-left">{t('admin.categories.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-muted-foreground">/{category.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate" title={category.description}>
                      {category.description || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{category.productCount || 0}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {category.isActive ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        {t('admin.categories.active')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" />
                        {t('admin.categories.inactive')}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCategory(category)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        {t('admin.categories.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t('admin.categories.delete')}
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
  );
}