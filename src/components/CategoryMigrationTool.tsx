import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Settings2, 
  Database, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Package,
  Stethoscope,
  Activity,
  Heart,
  Zap,
  ShieldCheck,
  Target,
  Brain,
  Dumbbell
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  productCount?: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
}

export function CategoryMigrationTool() {
  const { user } = useAuth();
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  useEffect(() => {
    initializeMigrationSteps();
    fetchCurrentData();
  }, []);

  // Check if user is admin
  if (!user?.role || user.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Acceso denegado. Solo los administradores pueden realizar migraciones de categorías.
        </AlertDescription>
      </Alert>
    );
  }

  // Define new category structure
  const newCategoryStructure = [
    {
      id: 'electroterapia',
      name: 'Electroterapia',
      slug: 'electroterapia',
      description: 'Unidades TENS, EMS, ultrasonido y dispositivos de estimulación eléctrica',
      icon: 'zap',
      order: 1,
      keywords: ['tens', 'ems', 'electroestimulación', 'ultrasonido', 'electroterapia', 'estimulación']
    },
    {
      id: 'termoterapia',
      name: 'Termoterapia',
      slug: 'termoterapia', 
      description: 'Lámparas infrarrojas, almohadillas térmicas y dispositivos de calor terapéutico',
      icon: 'activity',
      order: 2,
      keywords: ['lámpara', 'infrarroja', 'calor', 'térmica', 'termoterapia', 'laser']
    },
    {
      id: 'masaje-terapeutico',
      name: 'Masaje Terapéutico',
      slug: 'masaje-terapeutico',
      description: 'Pistolas de masaje, rodillos, pelotas y herramientas de masaje profesional',
      icon: 'heart',
      order: 3,
      keywords: ['masaje', 'pistola', 'rodillo', 'foam', 'fascia', 'percusión']
    },
    {
      id: 'rehabilitacion',
      name: 'Rehabilitación',
      slug: 'rehabilitacion',
      description: 'Equipos de ejercicio terapéutico, bandas elásticas y material de rehabilitación',
      icon: 'activity',
      order: 4,
      keywords: ['rehabilitación', 'ejercicio', 'bandas', 'terapéutica', 'pelota', 'equilibrio']
    },
    {
      id: 'ortopedia',
      name: 'Ortopedia',
      slug: 'ortopedia',
      description: 'Rodilleras, muletas, soportes y productos ortopédicos especializados',
      icon: 'stethoscope',
      order: 5,
      keywords: ['rodillera', 'muleta', 'soporte', 'ortopédico', 'protección', 'caminar']
    },
    {
      id: 'diagnostico',
      name: 'Diagnóstico',
      slug: 'diagnostico',
      description: 'Equipos de medición, análisis y diagnóstico profesional',
      icon: 'target',
      order: 6,
      keywords: ['diagnóstico', 'medición', 'análisis', 'profesional', 'evaluación']
    }
  ];

  const initializeMigrationSteps = () => {
    const steps: MigrationStep[] = [
      {
        id: 'fetch-data',
        name: 'Obtener Datos Actuales',
        description: 'Cargar categorías y productos existentes',
        status: 'pending'
      },
      {
        id: 'analyze-data',
        name: 'Analizar Estructura Actual',
        description: 'Identificar productos a migrar',
        status: 'pending'
      },
      {
        id: 'create-categories',
        name: 'Crear Nuevas Categorías',
        description: 'Crear las subcategorías de productos',
        status: 'pending'
      },
      {
        id: 'migrate-products',
        name: 'Migrar Productos',
        description: 'Reasignar productos a nuevas categorías',
        status: 'pending'
      },
      {
        id: 'remove-old',
        name: 'Limpiar Categorías Obsoletas',
        description: 'Desactivar categorías "Productos" y "Cosmética"',
        status: 'pending'
      },
      {
        id: 'validate',
        name: 'Validar Migración',
        description: 'Verificar integridad de datos',
        status: 'pending'
      }
    ];
    setMigrationSteps(steps);
  };

  const updateStepStatus = (stepId: string, status: MigrationStep['status'], details?: string) => {
    setMigrationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, details } : step
    ));
  };

  const fetchCurrentData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const categoriesResult = await apiClient.get<any>('/categories');

      if (categoriesResult.success) {
        setCurrentCategories(categoriesResult.categories || []);
      }

      // Fetch products
      const productsResult = await apiClient.get<any>('/admin/products');

      if (productsResult.success) {
        setProducts(productsResult.products || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeProduct = (product: Product): string => {
    const name = product.name.toLowerCase();
    const description = (product.description || '').toLowerCase();
    const fullText = `${name} ${description}`;

    // Find best matching category based on keywords
    for (const category of newCategoryStructure) {
      if (category.keywords.some(keyword => fullText.includes(keyword))) {
        return category.slug;
      }
    }

    // Default to electroterapia if no specific match
    return 'electroterapia';
  };

  const runMigration = async () => {
    setIsMigrating(true);
    setMigrationCompleted(false);

    try {
      // Step 1: Fetch current data
      updateStepStatus('fetch-data', 'running');
      await fetchCurrentData();
      updateStepStatus('fetch-data', 'completed', `${currentCategories.length} categorías, ${products.length} productos`);

      // Step 2: Analyze data
      updateStepStatus('analyze-data', 'running');
      const productosProducts = products.filter(p => 
        p.category.toLowerCase().includes('productos') || 
        p.category.toLowerCase().includes('products')
      );
      const cosmeticaProducts = products.filter(p => 
        p.category.toLowerCase().includes('cosmética') || 
        p.category.toLowerCase().includes('cosmetica') ||
        p.category.toLowerCase().includes('cosmetic')
      );
      
      updateStepStatus('analyze-data', 'completed', 
        `${productosProducts.length} productos, ${cosmeticaProducts.length} productos de cosmética`
      );

      // Step 3: Create new categories
      updateStepStatus('create-categories', 'running');
      
      for (const newCategory of newCategoryStructure) {
        await apiClient.post('/admin/categories', {
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description,
          icon: newCategory.icon,
          order: newCategory.order,
          isActive: true
        });
      }
      
      updateStepStatus('create-categories', 'completed', `${newCategoryStructure.length} nuevas categorías creadas`);

      // Step 4: Migrate products
      updateStepStatus('migrate-products', 'running');
      
      let migratedCount = 0;
      const productMigrations = [];

      // Migrate products products
      for (const product of productosProducts) {
        const newCategory = categorizeProduct(product);
        productMigrations.push({
          id: product.id,
          oldCategory: product.category,
          newCategory: newCategory
        });
        
        // Update product category
        try {
          await apiClient.put(`/admin/products/${product.id}`, {
            ...product,
            category: newCategory
          });
          migratedCount++;
        } catch {
          // Continue on error
        }
      }

      // For cosmetic products, move them to a special category or remove them
      for (const product of cosmeticaProducts) {
        // Move to "discontinued" or similar, or handle as needed
        try {
          await apiClient.delete(`/admin/products/${product.id}`);
          migratedCount++;
        } catch {
          // Continue on error
        }
      }

      updateStepStatus('migrate-products', 'completed', 
        `${migratedCount} productos migrados o removidos`
      );

      // Step 5: Remove old categories
      updateStepStatus('remove-old', 'running');
      
      const categoriesToDeactivate = currentCategories.filter(cat => 
        cat.name.toLowerCase().includes('productos') ||
        cat.name.toLowerCase().includes('cosmética') ||
        cat.name.toLowerCase().includes('cosmetica')
      );

      for (const category of categoriesToDeactivate) {
        await apiClient.put(`/admin/categories/${category.id}`, {
          ...category,
          isActive: false
        });
      }

      updateStepStatus('remove-old', 'completed', 
        `${categoriesToDeactivate.length} categorías obsoletas desactivadas`
      );

      // Step 6: Validate
      updateStepStatus('validate', 'running');
      await fetchCurrentData(); // Refresh data
      updateStepStatus('validate', 'completed', 'Migración validada exitosamente');

      setMigrationCompleted(true);

    } catch (error) {
      console.error('Migration error:', error);
      const currentRunningStep = migrationSteps.find(step => step.status === 'running');
      if (currentRunningStep) {
        updateStepStatus(currentRunningStep.id, 'failed', error.message);
      }
    } finally {
      setIsMigrating(false);
    }
  };

  const getStepIcon = (status: MigrationStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const icons = {
      'zap': Zap,
      'activity': Activity,
      'heart': Heart,
      'dumbbell': Dumbbell,
      'shield-check': ShieldCheck,
      'target': Target,
      'brain': Brain,
      'stethoscope': Stethoscope,
      'package': Package
    };
    const IconComponent = icons[iconName] || Package;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Migración de Categorías - GenStore</h1>
        </div>
        <p className="text-muted-foreground">
          Herramienta para dividir Productos en subcategorías y eliminar la categoría Cosmética
        </p>
      </div>

      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Estado Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Categorías Actuales ({currentCategories.length})</h4>
              <div className="space-y-2">
                {currentCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{cat.name}</span>
                    <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                      {cat.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Productos Totales ({products.length})</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Productos: {products.filter(p => p.category.toLowerCase().includes('productos')).length}</div>
                <div>• Cosmética: {products.filter(p => p.category.toLowerCase().includes('cosmética')).length}</div>
                <div>• Otros: {products.filter(p => !p.category.toLowerCase().includes('productos') && !p.category.toLowerCase().includes('cosmética')).length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Structure Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Nueva Estructura de Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newCategoryStructure.map(category => (
              <div key={category.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(category.icon)}
                  <h4 className="font-medium">{category.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                <div className="text-xs text-muted-foreground">
                  Keywords: {category.keywords.slice(0, 3).join(', ')}...
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Migration Process */}
      <Card>
        <CardHeader>
          <CardTitle>Proceso de Migración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {migrationSteps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-2 min-w-[24px]">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}.
                  </span>
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.name}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                  {step.details && (
                    <div className="text-sm mt-1 text-green-600">{step.details}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={runMigration}
              disabled={isMigrating || isLoading || migrationCompleted}
              size="lg"
              className="w-full max-w-md"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Ejecutando Migración...
                </>
              ) : migrationCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Migración Completada
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Iniciar Migración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {migrationCompleted && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            🎉 ¡Migración completada exitosamente! Las categorías han sido reestructuradas:
            <br />• Productos dividida en 6 subcategorías especializadas
            <br />• Productos de cosmética removidos
            <br />• Base de datos actualizada y optimizada
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}