import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getKvValue(key: string): Promise<any> {
  const { data, error } = await supabase
    .from('kv_store_1a49d4b8')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw new Error(`KV read error for ${key}: ${error.message}`);
  return data?.value;
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateSku(name: string, index: number): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  return `FIS-${prefix}-${String(index).padStart(3, '0')}`;
}

async function migrateCategories() {
  console.log('Migrating categories...');
  const kvCategories = await getKvValue('all_categories');
  if (!kvCategories || !Array.isArray(kvCategories)) {
    console.log('No categories found in KV store');
    return;
  }

  for (const cat of kvCategories) {
    const slug = slugify(cat.name ?? cat.nombre ?? cat.id);
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      nombre: cat.name ?? cat.nombre ?? cat.id,
      slug,
      descripcion: cat.description ?? cat.descripcion ?? null,
      imagen_url: cat.image ?? cat.imagen_url ?? null,
      activo: true,
      orden: cat.order ?? 0,
    }, { onConflict: 'id' });

    if (error) console.error(`  Error migrating category ${cat.id}: ${error.message}`);
    else console.log(`  Migrated category: ${slug}`);
  }
}

async function migrateProducts() {
  console.log('Migrating products...');
  const kvProducts = await getKvValue('all_products');
  if (!kvProducts || !Array.isArray(kvProducts)) {
    console.log('No products found in KV store');
    return;
  }

  for (let i = 0; i < kvProducts.length; i++) {
    const p = kvProducts[i];
    const nombre = p.name ?? p.nombre ?? 'Producto sin nombre';
    const slug = slugify(nombre) + '-' + (p.id ?? i);
    const sku = p.sku ?? generateSku(nombre, i + 1);

    // Try to match category
    let categoryId = null;
    if (p.category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .ilike('nombre', `%${p.category}%`)
        .limit(1)
        .maybeSingle();
      categoryId = cat?.id ?? null;
    }

    const { error } = await supabase.from('products').upsert({
      nombre,
      slug,
      sku,
      descripcion: p.description ?? p.descripcion ?? null,
      precio: Number(p.price ?? p.precio ?? 0),
      precio_original: p.originalPrice ?? p.precio_original ?? null,
      en_oferta: p.onSale ?? p.en_oferta ?? false,
      porcentaje_descuento: p.salePercentage ?? p.porcentaje_descuento ?? 0,
      marca: p.brand ?? p.marca ?? null,
      modelo: p.model ?? p.modelo ?? null,
      stock: Number(p.stock ?? 0),
      stock_minimo: 5,
      imagenes: [p.image, ...(p.additionalImages ?? p.imagenes ?? [])].filter(Boolean),
      specs: p.specs ?? {},
      features: p.features ?? [],
      colors: p.colors ?? [],
      tags: p.tags ?? [],
      rating: 0,
      review_count: 0,
      category_id: categoryId,
      activo: true,
    }, { onConflict: 'sku' });

    if (error) console.error(`  Error migrating product ${sku}: ${error.message}`);
    else console.log(`  Migrated: ${sku} - ${nombre}`);
  }
}

async function main() {
  console.log('=== Starting KV → PostgreSQL migration ===\n');
  await migrateCategories();
  console.log('');
  await migrateProducts();
  console.log('\n=== Migration complete ===');
}

main().catch(console.error);
