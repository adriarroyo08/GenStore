import { supabaseAdmin } from '../config/supabase.js';

// ── Constants ──

const BUCKET = 'product-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 5;

// ── Helpers ──

function generateFilename(prefix: string, originalName: string): string {
  const ext = originalName.split('.').pop() ?? 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}.${ext}`;
}

function extractStoragePath(url: string): string {
  return url.split('/storage/v1/object/public/product-images/')[1];
}

// ── Public API ──

export async function validateImageFile(file: File): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Tipo de archivo no permitido. Se aceptan: ${ALLOWED_TYPES.join(', ')}`;
  }
  if (file.size > MAX_SIZE) {
    return `El archivo supera el tamaño máximo de ${MAX_SIZE / 1024 / 1024} MB`;
  }
  return null;
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  // Validate file
  const validationError = await validateImageFile(file);
  if (validationError) {
    throw Object.assign(new Error(validationError), { status: 400 });
  }

  // Fetch current product
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('imagenes')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }

  const currentImages: string[] = product.imagenes ?? [];
  if (currentImages.length >= MAX_IMAGES) {
    throw Object.assign(
      new Error(`Se ha alcanzado el límite de ${MAX_IMAGES} imágenes por producto`),
      { status: 400 }
    );
  }

  // Upload to storage
  const filename = generateFilename(`main`, file.name);
  const filePath = `${productId}/${filename}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw Object.assign(new Error(`Error al subir imagen: ${uploadError.message}`), { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // Append URL to product.imagenes
  const { error: updateError } = await supabaseAdmin
    .from('products')
    .update({ imagenes: [...currentImages, publicUrl] })
    .eq('id', productId);

  if (updateError) {
    // Best-effort cleanup
    await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
    throw Object.assign(new Error(`Error al actualizar producto: ${updateError.message}`), { status: 500 });
  }

  return publicUrl;
}

export async function deleteProductImage(productId: string, imageIndex: number): Promise<void> {
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('imagenes')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }

  const currentImages: string[] = product.imagenes ?? [];
  if (imageIndex < 0 || imageIndex >= currentImages.length) {
    throw Object.assign(new Error('Índice de imagen fuera de rango'), { status: 400 });
  }

  const imageUrl = currentImages[imageIndex];
  const storagePath = extractStoragePath(imageUrl);

  // Remove from storage
  await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);

  // Remove from product.imagenes
  const updatedImages = currentImages.filter((_, i) => i !== imageIndex);
  const { error: updateError } = await supabaseAdmin
    .from('products')
    .update({ imagenes: updatedImages })
    .eq('id', productId);

  if (updateError) {
    throw Object.assign(new Error(`Error al actualizar producto: ${updateError.message}`), { status: 500 });
  }
}

export async function reorderProductImages(productId: string, newOrder: number[]): Promise<string[]> {
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('imagenes')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  }

  const currentImages: string[] = product.imagenes ?? [];

  if (newOrder.length !== currentImages.length) {
    throw Object.assign(new Error('El nuevo orden debe contener todos los índices de imágenes'), { status: 400 });
  }

  const validIndices = new Set(newOrder);
  for (let i = 0; i < currentImages.length; i++) {
    if (!validIndices.has(i)) {
      throw Object.assign(new Error(`Índice ${i} no presente en el nuevo orden`), { status: 400 });
    }
  }

  const reordered = newOrder.map((idx) => currentImages[idx]);

  const { error: updateError } = await supabaseAdmin
    .from('products')
    .update({ imagenes: reordered })
    .eq('id', productId);

  if (updateError) {
    throw Object.assign(new Error(`Error al reordenar imágenes: ${updateError.message}`), { status: 500 });
  }

  return reordered;
}

export async function uploadVariantImage(variantId: string, file: File): Promise<string> {
  // Validate file
  const validationError = await validateImageFile(file);
  if (validationError) {
    throw Object.assign(new Error(validationError), { status: 400 });
  }

  // Fetch current variant (and its product_id)
  const { data: variant, error: fetchError } = await supabaseAdmin
    .from('product_variants')
    .select('imagenes, product_id')
    .eq('id', variantId)
    .single();

  if (fetchError || !variant) {
    throw Object.assign(new Error('Variante no encontrada'), { status: 404 });
  }

  const currentImages: string[] = variant.imagenes ?? [];
  if (currentImages.length >= MAX_IMAGES) {
    throw Object.assign(
      new Error(`Se ha alcanzado el límite de ${MAX_IMAGES} imágenes por variante`),
      { status: 400 }
    );
  }

  // Upload to storage under {product_id}/variants/{variantId}-...
  const filename = generateFilename(variantId, file.name);
  const filePath = `${variant.product_id}/variants/${filename}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw Object.assign(new Error(`Error al subir imagen: ${uploadError.message}`), { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // Append URL to variant.imagenes
  const { error: updateError } = await supabaseAdmin
    .from('product_variants')
    .update({ imagenes: [...currentImages, publicUrl] })
    .eq('id', variantId);

  if (updateError) {
    await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
    throw Object.assign(new Error(`Error al actualizar variante: ${updateError.message}`), { status: 500 });
  }

  return publicUrl;
}

export async function deleteVariantImage(variantId: string, imageIndex: number): Promise<void> {
  const { data: variant, error: fetchError } = await supabaseAdmin
    .from('product_variants')
    .select('imagenes')
    .eq('id', variantId)
    .single();

  if (fetchError || !variant) {
    throw Object.assign(new Error('Variante no encontrada'), { status: 404 });
  }

  const currentImages: string[] = variant.imagenes ?? [];
  if (imageIndex < 0 || imageIndex >= currentImages.length) {
    throw Object.assign(new Error('Índice de imagen fuera de rango'), { status: 400 });
  }

  const imageUrl = currentImages[imageIndex];
  const storagePath = extractStoragePath(imageUrl);

  // Remove from storage
  await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);

  // Remove from variant.imagenes
  const updatedImages = currentImages.filter((_, i) => i !== imageIndex);
  const { error: updateError } = await supabaseAdmin
    .from('product_variants')
    .update({ imagenes: updatedImages })
    .eq('id', variantId);

  if (updateError) {
    throw Object.assign(new Error(`Error al actualizar variante: ${updateError.message}`), { status: 500 });
  }
}
