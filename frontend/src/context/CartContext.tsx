import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    type ReactNode,
    useMemo,
    useEffect,
} from 'react';
import { ProductModel } from '@/models/product.model';
import { MenuModel } from '@/models/menu.model';
import type { MenuChoices, ProductCustomization } from '@/models/order.model';
import { useAuth } from '@/context/AuthContext';
import { cartApi, type CartItemResponse, type AddCartItemData } from '@/api/cart.api';
import { toModel } from '@/api/transform.helper';

export interface CartProductItem {
    type: 'product';
    dbId?: number; // ID en DB (uniquement si mode connecté)
    product: ProductModel;
    quantity: number;
    customization?: ProductCustomization;
    specialInstructions?: string;
    unitPrice: number;
}

export interface CartMenuItem {
    type: 'menu';
    dbId?: number;
    menu: MenuModel;
    quantity: number;
    menuChoices: MenuChoices;
    specialInstructions?: string;
    unitPrice: number;
}

export type CartItem = CartProductItem | CartMenuItem;

export interface CartToastState {
    id: number;
    label: string;
    imageUrl?: string | null;
}

interface CartContextValue {
    items: CartItem[];
    totalItems: number;
    subtotal: number;

    addProduct: (
        product: ProductModel,
        quantity?: number,
        customization?: ProductCustomization,
        specialInstructions?: string,
    ) => void;
    addMenu: (
        menu: MenuModel,
        menuChoices: MenuChoices,
        quantity?: number,
        specialInstructions?: string,
    ) => void;
    updateQuantity: (index: number, quantity: number) => void;
    removeItem: (index: number) => void;
    clearCart: () => void;

    isDrawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;

    toast: CartToastState | null;
    dismissToast: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = 'spot_gourmand_guest_cart';

function saveGuestCart(items: CartItem[]): void {
    try {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch { /* quota exceeded → on ignore */ }
}

function loadGuestCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as CartItem[];
    } catch {
        return [];
    }
}

function clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
}

function computeProductPrice(
    product: ProductModel,
    customization?: ProductCustomization,
): number {
    let price = Number(product.basePrice);
    if (customization?.extra && product.productIngredients) {
        for (const ingredientId of customization.extra) {
            const pi = product.productIngredients.find(
                (pi) => pi.ingredient?.id === ingredientId,
            );
            if (pi?.extraPrice) price += Number(pi.extraPrice);
        }
    }
    return price;
}

/**
 * Convertit les données brutes de l'API en CartItem[].
 */
function apiResponseToCartItems(data: CartItemResponse[]): CartItem[] {
    return data
        .map((item): CartItem | null => {
            if (item.itemType === 'product' && item.product) {
                const product = toModel(ProductModel, item.product);
                return {
                    type: 'product',
                    dbId: item.id,
                    product,
                    quantity: item.quantity,
                    customization: item.customization ?? undefined,
                    specialInstructions: item.specialInstructions ?? undefined,
                    unitPrice: computeProductPrice(product, item.customization ?? undefined),
                };
            }
            if (item.itemType === 'menu' && item.menu) {
                const menu = toModel(MenuModel, item.menu);
                return {
                    type: 'menu',
                    dbId: item.id,
                    menu,
                    quantity: item.quantity,
                    menuChoices: item.menuChoices ?? {},
                    specialInstructions: item.specialInstructions ?? undefined,
                    unitPrice: Number(menu.price),
                };
            }
            return null;
        })
        .filter((item): item is CartItem => item !== null);
}

/**
 * Convertit les items locaux en données pour l'API sync.
 */
function localItemsToSyncData(items: CartItem[]): AddCartItemData[] {
    return items.map((item) => {
        if (item.type === 'product') {
            return {
                itemType: 'product' as const,
                productId: item.product.id,
                quantity: item.quantity,
                customization: item.customization,
                specialInstructions: item.specialInstructions,
            };
        }
        return {
            itemType: 'menu' as const,
            menuId: item.menu.id,
            quantity: item.quantity,
            menuChoices: item.menuChoices,
            specialInstructions: item.specialInstructions,
        };
    });
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [items, setItems] = useState<CartItem[]>(() => loadGuestCart());
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [toast, setToast] = useState<CartToastState | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastIdRef = useRef(0);

    const isDbMode = isAuthenticated && !authLoading;
    const hasLoadedFromDb = useRef(false);
    const prevUserId = useRef<number | null>(null);

    useEffect(() => {
        if (authLoading) return;

        const currentUserId = user?.id ?? null;

        if (currentUserId && prevUserId.current === null) {
            const localItems = items;

            if (localItems.length > 0) {
                cartApi
                    .syncCart({ items: localItemsToSyncData(localItems) })
                    .then((data) => {
                        setItems(apiResponseToCartItems(data));
                        clearGuestCart();
                    })
                    .catch(console.error);
            } else if (!hasLoadedFromDb.current) {
                cartApi
                    .getCart()
                    .then((data) => setItems(apiResponseToCartItems(data)))
                    .catch(console.error);
            }
            hasLoadedFromDb.current = true;
        }

        if (!currentUserId && prevUserId.current !== null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setItems([]);
            clearGuestCart();
            hasLoadedFromDb.current = false;
        }

        if (currentUserId && !hasLoadedFromDb.current) {
            clearGuestCart();
            cartApi
                .getCart()
                .then((data) => setItems(apiResponseToCartItems(data)))
                .catch(console.error);
            hasLoadedFromDb.current = true;
        }

        prevUserId.current = currentUserId;
    }, [authLoading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!isDbMode) {
            saveGuestCart(items);
        }
    }, [items, isDbMode]);

    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    const showToast = useCallback((label: string, imageUrl?: string | null) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastIdRef.current += 1;
        setToast({ id: toastIdRef.current, label, imageUrl });
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    }, []);

    const dismissToast = useCallback(() => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(null);
    }, []);

    const addProduct = useCallback(
        (
            product: ProductModel,
            quantity = 1,
            customization?: ProductCustomization,
            specialInstructions?: string,
        ) => {
            const unitPrice = computeProductPrice(product, customization);

            if (isDbMode) {
                cartApi
                    .addItem({
                        itemType: 'product',
                        productId: product.id,
                        quantity,
                        customization,
                        specialInstructions,
                    })
                    .then((data) => setItems(apiResponseToCartItems(data)))
                    .catch(console.error);
            } else {
                setItems((prev) => {
                    const existingIndex = prev.findIndex(
                        (item) =>
                            item.type === 'product' &&
                            item.product.id === product.id &&
                            JSON.stringify((item as CartProductItem).customization) ===
                            JSON.stringify(customization),
                    );
                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            quantity: updated[existingIndex].quantity + quantity,
                        };
                        return updated;
                    }
                    return [
                        ...prev,
                        {
                            type: 'product',
                            product,
                            quantity,
                            customization,
                            specialInstructions,
                            unitPrice,
                        },
                    ];
                });
            }
            showToast(product.name, product.imageUrl);
        },
        [isDbMode, showToast],
    );

    const addMenu = useCallback(
        (
            menu: MenuModel,
            menuChoices: MenuChoices,
            quantity = 1,
            specialInstructions?: string,
        ) => {
            if (isDbMode) {
                cartApi
                    .addItem({
                        itemType: 'menu',
                        menuId: menu.id,
                        quantity,
                        menuChoices,
                        specialInstructions,
                    })
                    .then((data) => setItems(apiResponseToCartItems(data)))
                    .catch(console.error);
            } else {
                setItems((prev) => [
                    ...prev,
                    {
                        type: 'menu',
                        menu,
                        quantity,
                        menuChoices,
                        specialInstructions,
                        unitPrice: Number(menu.price),
                    },
                ]);
            }
            const firstImage = menu.allowedProducts?.find((p) => p.imageUrl)?.imageUrl ?? null;
            showToast(menu.name, firstImage);
        },
        [isDbMode, showToast],
    );

    const updateQuantity = useCallback(
        (index: number, quantity: number) => {
            if (quantity <= 0) {
                if (isDbMode) {
                    const item = items[index];
                    if (item?.dbId) {
                        cartApi
                            .removeItem(item.dbId)
                            .then((data) => setItems(apiResponseToCartItems(data)))
                            .catch(console.error);
                    }
                } else {
                    setItems((prev) => prev.filter((_, i) => i !== index));
                }
                return;
            }
            if (isDbMode) {
                const item = items[index];
                if (item?.dbId) {
                    cartApi
                        .updateQuantity(item.dbId, quantity)
                        .then((data) => setItems(apiResponseToCartItems(data)))
                        .catch(console.error);
                }
            } else {
                setItems((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], quantity };
                    return updated;
                });
            }
        },
        [isDbMode, items],
    );

    const removeItem = useCallback(
        (index: number) => {
            if (isDbMode) {
                const item = items[index];
                if (item?.dbId) {
                    cartApi
                        .removeItem(item.dbId)
                        .then((data) => setItems(apiResponseToCartItems(data)))
                        .catch(console.error);
                }
            } else {
                setItems((prev) => prev.filter((_, i) => i !== index));
            }
        },
        [isDbMode, items],
    );

    const clearCart = useCallback(() => {
        if (isDbMode) {
            cartApi
                .clearCart()
                .then(() => setItems([]))
                .catch(console.error);
        } else {
            setItems([]);
        }
    }, [isDbMode]);

    const openDrawer = useCallback(() => setDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    const totalItems = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items],
    );
    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        [items],
    );

    return (
        <CartContext.Provider
            value={{
                items, totalItems, subtotal,
                addProduct, addMenu, updateQuantity, removeItem, clearCart,
                isDrawerOpen, openDrawer, closeDrawer,
                toast, dismissToast,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart doit être utilisé dans un <CartProvider>');
    return context;
}
