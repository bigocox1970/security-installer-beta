import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SupplierSetting } from '../types/admin';

export function useSupplierSettings() {
  const [suppliers, setSuppliers] = useState<SupplierSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supplier_settings')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
      setIsEditing(false);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (id: string, field: keyof SupplierSetting, value: any) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === id ? { ...supplier, [field]: value } : supplier
    ));
    setIsEditing(true);
  };

  const addNewSupplier = () => {
    const newSupplier: SupplierSetting = {
      id: crypto.randomUUID(),
      value: '',
      label: '',
      icon: 'Store',
      search_query: '',
      search_terms: [],
      search_radius: 5000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSuppliers([...suppliers, newSupplier]);
    setIsEditing(true);
  };

  const handleSaveSuppliers = async () => {
    try {
      const suppliersWithTimestamps = suppliers.map(supplier => ({
        ...supplier,
        created_at: supplier.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('supplier_settings')
        .upsert(suppliersWithTimestamps, {
          onConflict: 'id'
        });

      if (error) throw error;
      alert('Supplier settings saved successfully!');
      setIsEditing(false);
      await fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier settings:', error);
      alert('Failed to save supplier settings');
    }
  };

  return {
    suppliers,
    loading,
    error,
    isEditing,
    handleSupplierChange,
    handleSaveSuppliers,
    addNewSupplier,
    refreshSuppliers: fetchSuppliers
  };
}