import { supabase } from '../lib/supabase';

export interface SupplierType {
  id: string;
  value: string;
  label: string;
  icon: string;
  searchQuery: string;
  searchTerms: string[];
  searchRadius: number;
}

// Get suppliers from Supabase
export const getSuppliers = async (): Promise<SupplierType[]> => {
  const { data, error } = await supabase
    .from('supplier_settings')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching supplier settings:', error);
    return [];
  }

  return data.map(supplier => ({
    id: supplier.id,
    value: supplier.value,
    label: supplier.label,
    icon: supplier.icon,
    searchQuery: supplier.search_query,
    searchTerms: supplier.search_terms,
    searchRadius: supplier.search_radius
  }));
};

// Save suppliers to Supabase
export const saveSuppliers = async (suppliers: SupplierType[]): Promise<boolean> => {
  try {
    // First, delete all non-default suppliers
    const { error: deleteError } = await supabase
      .from('supplier_settings')
      .delete()
      .eq('is_default', false);

    if (deleteError) throw deleteError;

    // Then insert the new suppliers
    const { error: insertError } = await supabase
      .from('supplier_settings')
      .insert(
        suppliers
          .filter(s => !s.id.includes('default'))
          .map(supplier => ({
            value: supplier.value,
            label: supplier.label,
            icon: supplier.icon,
            search_query: supplier.searchQuery,
            search_terms: supplier.searchTerms,
            search_radius: supplier.searchRadius,
            is_default: false
          }))
      );

    if (insertError) throw insertError;

    return true;
  } catch (error) {
    console.error('Error saving supplier settings:', error);
    return false;
  }
};