# GenStore - Sistema de Internacionalización

## 📋 Resumen

GenStore cuenta con un sistema completo de internacionalización que soporta inglés (en) y español (es) con más de 1,200+ claves de traducción.

## 🏗️ Arquitectura

### Componentes Principales

1. **LanguageContext** (`/contexts/LanguageContext.tsx`)
   - Maneja el estado global del idioma
   - Proporciona función de traducción `t()`
   - Persistencia en localStorage
   - Detección automática del idioma del navegador

2. **Archivos de Traducción**
   - `/data/translations/en.ts` - Traducciones en inglés
   - `/data/translations/es.ts` - Traducciones en español
   - `/data/translations/types.ts` - Tipos TypeScript

3. **Hooks Utilitarios**
   - `useTranslatedProducts` - Traduce productos dinámicos
   - `useTranslationDebug` - Herramientas de debugging

4. **Componentes**
   - `LanguageSelector` - Selector visual de idioma
   - `TranslationDebugPanel` - Panel de debugging (desarrollo)

## 🚀 Características

### ✅ Implementado

- **Cambio en tiempo real** sin recarga de página
- **Persistencia** del idioma seleccionado en localStorage
- **Detección automática** del idioma del navegador
- **Interpolación de parámetros** con sintaxis `{{parameter}}`
- **Fallback** al inglés para claves faltantes en español
- **Productos dinámicos** con traducción desde base de datos
- **Debug panel** para desarrollo
- **Navegación por objetos** anidados con notación de puntos
- **Logging mejorado** para troubleshooting

### 📊 Cobertura

#### Áreas Traducidas
- ✅ Navegación y header
- ✅ Hero section y páginas principales
- ✅ Catálogo de productos y filtros
- ✅ Carrito de compras y checkout
- ✅ Autenticación y cuenta de usuario
- ✅ Páginas de gestión (órdenes, direcciones, métodos de pago)
- ✅ Configuraciones y preferencias
- ✅ FAQ, soporte y contacto
- ✅ Términos de servicio y política de privacidad
- ✅ Sistema de recompensas y wishlist
- ✅ Notificaciones y mensajes del sistema
- ✅ Panel de administración
- ✅ Estados de error y carga

#### Estructura de Traducciones
```typescript
{
  nav: { ... },           // Navegación
  general: { ... },       // Elementos generales
  header: { ... },        // Encabezado
  hero: { ... },          // Sección principal
  categories: { ... },    // Categorías
  product: { ... },       // Productos
  cart: { ... },          // Carrito
  checkout: { ... },      // Proceso de compra
  auth: { ... },          // Autenticación
  account: { ... },       // Cuenta de usuario
  wishlist: { ... },      // Lista de deseos
  orders: { ... },        // Pedidos
  contact: { ... },       // Contacto
  faq: { ... },           // Preguntas frecuentes
  admin: { ... },         // Administración
  // ... y más
}
```

## 🛠️ Uso

### Básico
```typescript
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
}
```

### Con Parámetros
```typescript
// En el archivo de traducción:
// welcome: "Welcome {{name}}, you have {{count}} items"

// En el componente:
const message = t('welcome', { name: 'Juan', count: 5 });
// Resultado: "Welcome Juan, you have 5 items"
```

### Cambio de Idioma
```typescript
const { setLanguage } = useLanguage();

// Cambiar a español
setLanguage('es');

// Cambiar a inglés  
setLanguage('en');
```

## 🔧 Herramientas de Desarrollo

### Panel de Debug
```typescript
import { TranslationDebugPanel } from '../components/TranslationDebugPanel';

// Agregar al componente principal
<TranslationDebugPanel isDevelopment={process.env.NODE_ENV === 'development'} />
```

### Hook de Debug
```typescript
import { useTranslationDebug } from '../hooks/useTranslationDebug';

function MyComponent() {
  const { checkTranslationCoverage, validateTranslationStructure } = useTranslationDebug();
  
  // Verificar cobertura de traducciones
  const report = checkTranslationCoverage();
  
  // Validar que las estructuras coincidan
  const isValid = validateTranslationStructure();
}
```

## 📝 Mejores Prácticas

### 1. Estructura de Claves
```typescript
// ✅ Bueno - específico y organizado
t('product.details.specifications')
t('checkout.payment.methods.card')

// ❌ Malo - muy genérico
t('title')
t('button')
```

### 2. Parámetros
```typescript
// ✅ Bueno - nombres descriptivos
t('cart.itemCount', { count: items.length, total: totalPrice })

// ❌ Malo - parámetros no descriptivos
t('message', { x: items.length, y: totalPrice })
```

### 3. Fallbacks
```typescript
// El sistema automáticamente usa inglés como fallback
// si una clave no existe en español
t('some.missing.key') // Retorna la versión en inglés si existe
```

## 🚧 Mejoras Futuras

### Posibles Expansiones
- [ ] Soporte para más idiomas (francés, alemán, etc.)
- [ ] Pluralización inteligente
- [ ] Formateo de fechas y números por región
- [ ] Carga lazy de traducciones
- [ ] Integración con servicios de traducción automática
- [ ] Validación automática de traducciones faltantes en CI/CD

### Optimizaciones
- [ ] Tree shaking de traducciones no utilizadas
- [ ] Compresión de archivos de traducción
- [ ] Cache en memoria para traducciones frecuentes
- [ ] Métricas de uso de traducciones

## 🐛 Troubleshooting

### Problemas Comunes

1. **Traducción no aparece**
   ```bash
   # Verificar en consola:
   console.log(t('mi.clave.de.traduccion'));
   
   # Usar panel de debug para validar estructura
   ```

2. **Idioma no persiste**
   ```bash
   # Verificar localStorage en DevTools:
   localStorage.getItem('genstore-language');
   ```

3. **Estructuras no coinciden**
   ```bash
   # Ejecutar validación en consola:
   useTranslationDebug().validateTranslationStructure();
   ```

### Logging
El sistema incluye logging detallado:
- `🌐 [i18n]` - Mensajes del sistema de internacionalización
- `⚠️` - Advertencias sobre claves faltantes
- `🔄` - Uso de fallbacks
- `❌` - Errores críticos

## 📊 Estadísticas Actuales

- **Total de claves**: ~1,200+
- **Idiomas soportados**: 2 (en, es)
- **Cobertura**: 100% sincronizada
- **Productos dinámicos**: ✅ Soportado
- **Persistencia**: ✅ localStorage
- **Fallbacks**: ✅ Automático a inglés

## 📞 Soporte

Para problemas relacionados con traducciones:
1. Activar el panel de debug en desarrollo
2. Revisar los logs de consola para mensajes `🌐 [i18n]`
3. Usar el hook `useTranslationDebug` para análisis detallado
4. Verificar la estructura de los archivos de traducción

---

**Última actualización**: Diciembre 2024  
**Versión del sistema**: 2.0  
**Estado**: Producción estable