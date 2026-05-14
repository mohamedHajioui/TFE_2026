import { useState, useEffect, useCallback } from 'react';
import { productsApi, type QueryProductsParams } from '@/api';
import { ProductModel, ProductCategory } from '@/models';

interface UseProductsReturn {
    products: ProductModel[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Récupère la liste des produits avec filtres optionnels
 */
export function useProducts(params?: QueryProductsParams): UseProductsReturn {
    const [products, setProducts] = useState<ProductModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await productsApi.findAll(params);
            setProducts(data);
        } catch {
            setError('Impossible de charger les produits');
        } finally {
            setIsLoading(false);
        }
    }, [JSON.stringify(params)]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { products, isLoading, error, refetch: fetchProducts };
}

/**
 * Récupère un produit par ID
 */
export function useProduct(id: number) {
    const [product, setProduct] = useState<ProductModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await productsApi.findOne(id);
                setProduct(data);
            } catch {
                setError('Produit introuvable');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [id]);

    return { product, isLoading, error };
}

/**
 * Récupère les produits par catégorie
 */
export function useProductsByCategory(category: ProductCategory) {
    const [products, setProducts] = useState<ProductModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await productsApi.findByCategory(category);
                setProducts(data);
            } catch {
                setError('Impossible de charger les produits');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [category]);

    return { products, isLoading, error };
}