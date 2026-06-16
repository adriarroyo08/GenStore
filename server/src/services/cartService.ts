import { supabaseAdmin } from '../config/supabase.js';
import type { CartItem } from '../types/index.js';

export async function getCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select('*, product:products(*), variant:product_variants(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CartItem[];
}

export async function addToCart(
  userId: string,
  productId: string,
  cantidad: number,
  opciones: Record<string, unknown> = {},
  variantId?: string
): Promise<CartItem> {
  // Verify product exists and is active
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, stock, activo, has_variants')
    .eq('id', productId)
    .single();

  if (productError || !product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  if (!product.activo) throw Object.assign(new Error('Producto no disponible'), { status: 400 });

  // Require variant selection when product has variants
  if (product.has_variants && !variantId) {
    throw Object.assign(new Error('Debes seleccionar una variante'), { status: 400 });
  }

  // Determine available stock (variant or product level)
  let availableStock = product.stock;
  if (variantId) {
    const { data: variant, error: variantError } = await supabaseAdmin
      .from('product_variants')
      .select('id, stock, activo')
      .eq('id', variantId)
      .eq('product_id', productId)
      .single();

    if (variantError || !variant) throw Object.assign(new Error('Variante no encontrada'), { status: 404 });
    if (!variant.activo) throw Object.assign(new Error('Variante no disponible'), { status: 400 });
    availableStock = variant.stock;
  }

  if (availableStock < cantidad) throw Object.assign(new Error('Stock insuficiente'), { status: 400 });

  // Upsert: if same product+variant exists, increment quantity
  const existingQuery = supabaseAdmin
    .from('cart_items')
    .select('id, cantidad')
    .eq('user_id', userId)
    .eq('product_id', productId);

  const { data: existing } = await (variantId
    ? existingQuery.eq('variant_id', variantId)
    : existingQuery.is('variant_id', null)
  ).maybeSingle();

  if (existing) {
    const newQty = existing.cantidad + cantidad;
    if (newQty > availableStock) throw Object.assign(new Error('Stock insuficiente'), { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ cantidad: newQty })
      .eq('id', existing.id)
      .select('*, product:products(*), variant:product_variants(*)')
      .single();

    if (error) throw new Error(error.message);
    return data as CartItem;
  }

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert({ user_id: userId, product_id: productId, cantidad, opciones, variant_id: variantId ?? null })
    .select('*, product:products(*), variant:product_variants(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function updateCartItem(userId: string, itemId: string, cantidad: number): Promise<CartItem> {
  // Verify ownership and stock
  const { data: item, error: itemError } = await supabaseAdmin
    .from('cart_items')
    .select('product_id')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (itemError || !item) throw Object.assign(new Error('Item no encontrado'), { status: 404 });

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('stock')
    .eq('id', item.product_id)
    .single();

  if (product && cantidad > product.stock) {
    throw Object.assign(new Error('Stock insuficiente'), { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .update({ cantidad })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select('*, product:products(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function removeCartItem(userId: string, itemId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function clearCart(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
