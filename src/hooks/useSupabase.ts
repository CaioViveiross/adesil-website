// Exemplo de hooks React para usar as APIs
import { useState, useEffect } from 'react';
import type { Product, Category, Order, BusinessCategory } from '@/types/supabase';

// Hook para buscar produtos
export function useProducts(category?: string, businessCategory?: string, limit = 20) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (category) params.set('category', category);
        if (businessCategory) params.set('business_category', businessCategory);

        const response = await fetch(`/api/products?${params}`);
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, businessCategory, limit]);

  return { products, loading, error };
}

// Hook para buscar categorias de negócio
export function useBusinessCategories() {
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessCategories = async () => {
      try {
        const response = await fetch('/api/business-categories');
        const data = await response.json();
        setBusinessCategories(data);
      } catch (error) {
        console.error('Error fetching business categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessCategories();
  }, []);

  return { businessCategories, loading };
}