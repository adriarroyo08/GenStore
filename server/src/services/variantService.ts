import { supabaseAdmin } from '../config/supabase.js';

export interface VariantInput {
  sku: string;
  attributes: Record<string, string>;
  precio: number;
  precio_coste?: number | null;
  stock?: number;
  stock_minimo?: number;
  imagenes?: string[];
  activo?: boolean;
}

export interface BulkGenerateInput {
  attributeDefinitions: { name: string; values: string[] }[];
  baseSku: string;
  basePrecio: number;
  basePrecioCoste?: number | null;
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);
  return first.flatMap(val => restProduct.map(combo => [val, ...combo]));
}

export async function listVariants(productId: string) {
  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createVariant(productId: string, input: VariantInput) {
  // Verify product exists
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, has_variants')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }

  // Check for duplicate attributes (compare sorted JSON keys)
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('product_variants')
    .select('id, attributes')
    .eq('product_id', productId);

  if (existingError) throw new Error(existingError.message);

  const normalizedInput = JSON.stringify(
    Object.fromEntries(Object.entries(input.attributes).sort(([a], [b]) => a.localeCompare(b)))
  );

  for (const variant of existing ?? []) {
    const normalizedExisting = JSON.stringify(
      Object.fromEntries(Object.entries(variant.attributes as Record<string, string>).sort(([a], [b]) => a.localeCompare(b)))
    );
    if (normalizedExisting === normalizedInput) {
      throw Object.assign(new Error('Ya existe una variante con estos atributos'), { status: 400 });
    }
  }

  // Insert variant
  const { data: created, error: insertError } = await supabaseAdmin
    .from('product_variants')
    .insert({
      product_id: productId,
      sku: input.sku,
      attributes: input.attributes,
      precio: input.precio,
      precio_coste: input.precio_coste ?? null,
      stock: input.stock ?? 0,
      stock_minimo: input.stock_minimo ?? 0,
      imagenes: input.imagenes ?? [],
      activo: input.activo ?? true,
    })
    .select('*')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      throw Object.assign(new Error('El SKU ya está en uso'), { status: 400 });
    }
    throw new Error(insertError.message);
  }

  // Auto-set product.has_variants = true if not already
  if (!product.has_variants) {
    await supabaseAdmin
      .from('products')
      .update({ has_variants: true })
      .eq('id', productId);
  }

  return created;
}

export async function createVariants(productId: string, inputs: VariantInput[]) {
  const results = [];
  for (const input of inputs) {
    const created = await createVariant(productId, input);
    results.push(created);
  }
  return results;
}

export async function updateVariant(variantId: string, input: Partial<VariantInput>) {
  const updatePayload: Record<string, unknown> = {};

  if (input.sku !== undefined) updatePayload.sku = input.sku;
  if (input.attributes !== undefined) updatePayload.attributes = input.attributes;
  if (input.precio !== undefined) updatePayload.precio = input.precio;
  if ('precio_coste' in input) updatePayload.precio_coste = input.precio_coste ?? null;
  if (input.stock !== undefined) updatePayload.stock = input.stock;
  if (input.stock_minimo !== undefined) updatePayload.stock_minimo = input.stock_minimo;
  if (input.imagenes !== undefined) updatePayload.imagenes = input.imagenes;
  if (input.activo !== undefined) updatePayload.activo = input.activo;

  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .update(updatePayload)
    .eq('id', variantId)
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw Object.assign(new Error('Variante no encontrada'), { status: 404 });
    }
    if (error.code === '23505') {
      throw Object.assign(new Error('El SKU ya está en uso'), { status: 400 });
    }
    throw new Error(error.message);
  }

  return data;
}

export async function deleteVariant(variantId: string) {
  const { error } = await supabaseAdmin
    .from('product_variants')
    .update({ activo: false })
    .eq('id', variantId);

  if (error) throw new Error(error.message);
}

export async function bulkGenerateVariants(productId: string, input: BulkGenerateInput) {
  const { attributeDefinitions, baseSku, basePrecio, basePrecioCoste } = input;

  // Validate product exists
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }

  // Build cartesian product of all attribute values
  const valueArrays = attributeDefinitions.map(def => def.values.map(value => ({ name: def.name, value })));
  const combinations = cartesianProduct(valueArrays);

  if (combinations.length > 100) {
    throw Object.assign(
      new Error(`Demasiadas combinaciones: ${combinations.length}. El máximo permitido es 100.`),
      { status: 400 }
    );
  }

  // Delete existing variants first
  const { error: deleteError } = await supabaseAdmin
    .from('product_variants')
    .delete()
    .eq('product_id', productId);

  if (deleteError) throw new Error(deleteError.message);

  // Build and insert new variants
  const variantsToInsert = combinations.map(combo => {
    const attributes: Record<string, string> = {};
    const skuParts: string[] = [baseSku];

    for (const { name, value } of combo) {
      attributes[name] = value;
      skuParts.push(value.slice(0, 3).toUpperCase());
    }

    return {
      product_id: productId,
      sku: skuParts.join('-'),
      attributes,
      precio: basePrecio,
      precio_coste: basePrecioCoste ?? null,
      stock: 0,
      stock_minimo: 0,
      imagenes: [] as string[],
      activo: true,
    };
  });

  const { data: created, error: insertError } = await supabaseAdmin
    .from('product_variants')
    .insert(variantsToInsert)
    .select('*');

  if (insertError) throw new Error(insertError.message);

  // Set has_variants = true
  await supabaseAdmin
    .from('products')
    .update({ has_variants: true })
    .eq('id', productId);

  return created ?? [];
}

export async function bulkUpdateVariants(
  productId: string,
  updates: { precio?: number; stock?: number; activo?: boolean }
) {
  const updatePayload: Record<string, unknown> = {};

  if (updates.precio !== undefined) updatePayload.precio = updates.precio;
  if (updates.stock !== undefined) updatePayload.stock = updates.stock;
  if (updates.activo !== undefined) updatePayload.activo = updates.activo;

  if (Object.keys(updatePayload).length === 0) {
    throw Object.assign(new Error('No se proporcionaron campos para actualizar'), { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .update(updatePayload)
    .eq('product_id', productId)
    .select('*');

  if (error) throw new Error(error.message);
  return data ?? [];
}
