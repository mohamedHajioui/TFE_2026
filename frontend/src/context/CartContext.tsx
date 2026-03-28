import { createContext, useContext, useState, useCallback, type ReactNode, useMemo } from 'react';
import { ProductModel } from '@/models/product.model';
import { MenuModel } from '@/models/menu.model';
import type {MenuChoices, ProductCustomization} from '@/models/order.model';

//  Types

export interface CartProductItem {
    type: 'product';
    product: ProductModel;
    quantity: number;
    customization?: ProductCustomization;
    specialInstructions?: string;
    unitPrice: number;
}

export interface CartMenuItem {
    type: 'menu';
    menu: MenuModel;
    quantity: number;
    menuChoices: MenuChoices;
    specialInstructions?: string;
    unitPrice: number;
}

export type CartItem = CartProductItem | CartMenuItem;

interface CartContextValue {
    items: CartItem[];
    totalItems: number;
    subtotal: number;
    addProduct: (product: ProductModel, quantity?: number, customization?: ProductCustomization, specialInstructions?: string) => void;
    addMenu: (menu: MenuModel, menuChoices: MenuChoices, quantity?: number, specialInstructions?: string) => void;
    updateQuantity: (index: number, quantity: number) => void;
    removeItem: (index: number) => void;
    clearCart: () => void;
}


const CartContext = createContext<CartContextValue | null>(null);


function computeProductPrice(product: ProductModel, customization?: ProductCustomization): number {
    let price = product.basePrice;
    if (customization?.extra && product.productIngredients) {
        for (const ingredientId of customization.extra) {
            const pi = product.productIngredients.find(pi => pi.ingredient?.id === ingredientId);
            if (pi?.extraPrice) price += pi.extraPrice;
        }
    }
    return price;
}


export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addProduct = useCallback((
        product: ProductModel,
        quantity = 1,
        customization?: ProductCustomization,
        specialInstructions?: string,
    ) => {
        const unitPrice = computeProductPrice(product, customization);
        setItems(prev => {
            const existingIndex = prev.findIndex(item =>
                item.type === 'product' &&
                item.product.id === product.id &&
                JSON.stringify((item as CartProductItem).customization) === JSON.stringify(customization)
            );
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + quantity };
                return updated;
            }
            return [...prev, { type: 'product', product, quantity, customization, specialInstructions, unitPrice }];
        });
    }, []);

    const addMenu = useCallback((
        menu: MenuModel,
        menuChoices: MenuChoices,
        quantity = 1,
        specialInstructions?: string,
    ) => {
        setItems(prev => [...prev, { type: 'menu', menu, quantity, menuChoices, specialInstructions, unitPrice: menu.price }]);
    }, []);

    const updateQuantity = useCallback((index: number, quantity: number) => {
        if (quantity <= 0) {
            setItems(prev => prev.filter((_, i) => i !== index));
            return;
        }
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], quantity };
            return updated;
        });
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

    return (
        <CartContext.Provider value={{ items, totalItems, subtotal, addProduct, addMenu, updateQuantity, removeItem, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}


export function useCart(): CartContextValue {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart doit être utilisé dans un <CartProvider>');
    return context;
}