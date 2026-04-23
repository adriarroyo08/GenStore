import { supabaseAdmin } from '../config/supabase.js';
import type { Supplier } from '../types';

export async function getSuppliers(params: {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}): Promise<{ suppliers: Supplier[]; total: number }> {
  const { page = 1, limit = 15, search, active } = params;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('suppliers')
    .select('*', { count: 'exact' });

  if (search) {
    const sanitized = search.replace(/[%_]/g, '\\$&');
    query = query.or(`nombre.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
  }
  if (active !== undefined) {
    query = query.eq('activo', active);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  return { suppliers: data ?? [], total: count ?? 0 };
}

export async function getSupplierById(id: string): Promise<Supplier> {
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw Object.assign(new Error('Proveedor no encontrado'), { status: 404 });
  return data;
}

export async function createSupplier(input: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .insert(input)
    .select()
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 400 });
  return data;
}

export async function updateSupplier(id: string, input: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 400 });
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('suppliers')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
}

export async function getSupplierProductCount(supplierId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', supplierId)
    .eq('activo', true);

  if (error) return 0;
  return count ?? 0;
}
