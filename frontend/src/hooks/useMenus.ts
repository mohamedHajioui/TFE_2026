import { useState, useEffect } from 'react';
import { menusApi } from '@/api';
import type {MenuModel} from "@/models/menu.model.ts";


export function useActiveMenus() {
    const [menus, setMenus] = useState<MenuModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await menusApi.getActiveMenus();
                setMenus(data);
            } catch {
                setError('Impossible de charger les menus');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    return { menus, isLoading, error };
}

export function useMenu(id: number) {
    const [menu, setMenu] = useState<MenuModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await menusApi.findOne(id);
                setMenu(data);
            } catch {
                setError('Menu introuvable');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [id]);

    return { menu, isLoading, error };
}