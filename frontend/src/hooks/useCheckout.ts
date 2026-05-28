import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePublicSettings } from '@/hooks/useSettings';
import { useDeliveryEstimate } from '@/hooks/useDeliveryEstimate';
import { addressesApi } from '@/api/addresses.api';
import { timeSlotsApi } from '@/api/time-slots.api';
import { ordersApi, type CreateOrderData, type CreateOrderItemData } from '@/api/orders.api';
import { paymentApi } from '@/api/payment.api';
import { AddressModel } from '@/models/address.model';
import { TimeSlotModel } from '@/models/time-slot.model';
import { OrderType } from '@/models/order.model';
import { getApiErrorMessage } from '@/utils/validation';
import type { ResolvedAddress } from '@/hooks/useAddressAutocomplete';

export interface AddressForm {
    street: string;
    number: string;
    box: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string;
}

export const EMPTY_ADDRESS: AddressForm = {
    street: '',
    number: '',
    box: '',
    postalCode: '',
    city: '',
    country: 'Belgium',
    complement: '',
};

function isAddressValid(a: AddressForm): boolean {
    return Boolean(a.street && a.number && a.postalCode && a.city);
}

export function useCheckout() {
    const navigate = useNavigate();
    const { items, subtotal } = useCart();
    const { isAuthenticated, user } = useAuth();
    const { deliveryEnabled, isLoading: settingsLoading } = usePublicSettings();

    const [orderType, setOrderType] = useState<OrderType>(OrderType.PICKUP);
    const [slots, setSlots] = useState<TimeSlotModel[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

    const [userAddresses, setUserAddresses] = useState<AddressModel[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState<AddressForm>(EMPTY_ADDRESS);
    const [newAddressQuery, setNewAddressQuery] = useState('');

    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestAddress, setGuestAddress] = useState<AddressForm>(EMPTY_ADDRESS);
    const [guestAddressQuery, setGuestAddressQuery] = useState('');

    const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number | null; lng: number | null }>({
        lat: null,
        lng: null,
    });

    const [customerNote, setCustomerNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const pendingSubmit = useRef(false);

    const { fee: deliveryFee, label: deliveryLabel, outOfRange, distanceKm } =
        useDeliveryEstimate(deliveryCoords.lat, deliveryCoords.lng);

    const total = subtotal + (orderType === OrderType.DELIVERY ? deliveryFee : 0);

    useEffect(() => {
        if (items.length === 0) navigate('/');
    }, [items.length, navigate]);

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const usable = await timeSlotsApi.getAvailableSlots(todayStr);
                setSlots(usable);
                if (usable.length > 0) setSelectedSlotId(usable[0].id);
            } catch {
                setError('Impossible de charger les créneaux horaires');
            }
        };
        fetchSlots();
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchAddresses = async () => {
            try {
                const addrs = await addressesApi.getMyAddresses();
                setUserAddresses(addrs);
                const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0];
                if (defaultAddr) setSelectedAddressId(defaultAddr.id);
                if (addrs.length === 0) setShowNewAddressForm(true);
            } catch {
                setShowNewAddressForm(true);
            }
        };
        fetchAddresses();
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) return;
        if (orderType !== OrderType.DELIVERY) return;
        if (!guestEmail || !guestEmail.includes('@')) return;

        const storedToken = localStorage.getItem('guestToken');
        if (!storedToken) return;

        const handle = setTimeout(async () => {
            try {
                const last = await ordersApi.getLastGuestAddress(guestEmail, storedToken);
                if (!last?.street) return;

                setGuestAddress((prev) => {
                    if (prev.street || prev.number || prev.postalCode) return prev;
                    return {
                        street: last.street ?? '',
                        number: last.number ?? '',
                        box: last.box ?? '',
                        postalCode: last.postalCode ?? '',
                        city: last.city ?? '',
                        country: last.country ?? 'Belgium',
                        complement: last.complement ?? '',
                    };
                });
                setGuestAddressQuery(
                    `${last.street ?? ''} ${last.number ?? ''}, ${last.postalCode ?? ''} ${last.city ?? ''}`,
                );
                if (last.name && !guestName) setGuestName(last.name);
                if (last.phone && !guestPhone) setGuestPhone(last.phone);
            } catch {
                // silencieux
            }
        }, 600);
        return () => clearTimeout(handle);
    }, [guestEmail, isAuthenticated, orderType, guestName, guestPhone]);

    useEffect(() => {
        if (!deliveryEnabled && orderType === OrderType.DELIVERY) {
            setOrderType(OrderType.PICKUP);
        }
    }, [deliveryEnabled, orderType]);

    const handleAddressResolved = (resolved: ResolvedAddress, isGuest: boolean) => {
        const form: AddressForm = {
            street: resolved.street,
            number: resolved.number,
            box: '',
            postalCode: resolved.postalCode,
            city: resolved.city,
            country: resolved.country || 'Belgium',
            complement: '',
        };

        if (isGuest) {
            setGuestAddress(form);
        } else {
            setNewAddress(form);
        }

        setDeliveryCoords({ lat: resolved.lat, lng: resolved.lng });
    };

    const doSubmit = async () => {
        setError(null);

        if (!selectedSlotId) {
            setError('Veuillez choisir un créneau horaire');
            return;
        }

        if (orderType === OrderType.DELIVERY && outOfRange) {
            setError('Votre adresse est hors zone de livraison (maximum 10 km).');
            return;
        }

        const orderItems: CreateOrderItemData[] = items.map((item) => {
            if (item.type === 'product') {
                return {
                    itemType: 'product',
                    productId: item.product.id,
                    quantity: item.quantity,
                    customization: item.customization,
                    specialInstructions: item.specialInstructions,
                };
            }
            return {
                itemType: 'menu',
                menuId: item.menu.id,
                menuChoices: item.menuChoices,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions,
            };
        });

        setSubmitting(true);
        try {
            let checkoutResponse: { url: string };

            if (isAuthenticated && user) {
                const data: CreateOrderData = {
                    type: orderType,
                    timeSlotId: selectedSlotId,
                    items: orderItems,
                    customerNote: customerNote || undefined,
                    customerLat: deliveryCoords.lat ?? undefined,
                    customerLng: deliveryCoords.lng ?? undefined,
                };

                if (orderType === OrderType.DELIVERY) {
                    if (showNewAddressForm) {
                        if (!isAddressValid(newAddress)) {
                            setError("Veuillez remplir les champs obligatoires de l'adresse");
                            setSubmitting(false);
                            return;
                        }
                        const created = await addressesApi.create({
                            street: newAddress.street,
                            number: newAddress.number,
                            box: newAddress.box || undefined,
                            postalCode: newAddress.postalCode,
                            city: newAddress.city,
                            country: newAddress.country || undefined,
                            complement: newAddress.complement || undefined,
                        });
                        data.deliveryAddressId = created.id;
                    } else {
                        if (!selectedAddressId) {
                            setError('Veuillez choisir une adresse');
                            setSubmitting(false);
                            return;
                        }
                        data.deliveryAddressId = selectedAddressId;
                    }
                }

                const order = await ordersApi.create(data);
                checkoutResponse = await paymentApi.createCheckoutSession(order.id);
            } else {
                if (!guestName || !guestEmail || !guestPhone) {
                    setError('Veuillez renseigner vos coordonnées (nom, email, téléphone)');
                    setSubmitting(false);
                    return;
                }

                const data: CreateOrderData = {
                    type: orderType,
                    timeSlotId: selectedSlotId,
                    items: orderItems,
                    guest: { name: guestName, email: guestEmail, phone: guestPhone },
                    customerNote: customerNote || undefined,
                    customerLat: deliveryCoords.lat ?? undefined,
                    customerLng: deliveryCoords.lng ?? undefined,
                };

                if (orderType === OrderType.DELIVERY) {
                    if (!isAddressValid(guestAddress)) {
                        setError("Veuillez remplir les champs obligatoires de l'adresse");
                        setSubmitting(false);
                        return;
                    }
                    data.guestAddress = {
                        street: guestAddress.street,
                        number: guestAddress.number,
                        box: guestAddress.box || undefined,
                        postalCode: guestAddress.postalCode,
                        city: guestAddress.city,
                        country: guestAddress.country || undefined,
                        complement: guestAddress.complement || undefined,
                    };
                }

                const order = await ordersApi.createGuest(data);
                if (order.guestToken) {
                    localStorage.setItem('guestToken', order.guestToken);
                }
                checkoutResponse = await paymentApi.createGuestCheckoutSession(order.id, guestEmail, order.guestToken!);
            }

            window.location.href = checkoutResponse.url;
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isAuthenticated && user && !user.phoneNumber) {
            pendingSubmit.current = true;
            setShowPhoneModal(true);
            return;
        }

        await doSubmit();
    };

    const handlePhoneModalSuccess = () => {
        setShowPhoneModal(false);
        if (pendingSubmit.current) {
            pendingSubmit.current = false;
            void doSubmit();
        }
    };

    const handlePhoneModalClose = () => {
        setShowPhoneModal(false);
        pendingSubmit.current = false;
    };

    return {
        settingsLoading,
        deliveryEnabled,
        isAuthenticated,

        orderType,
        setOrderType,

        slots,
        selectedSlotId,
        setSelectedSlotId,

        userAddresses,
        selectedAddressId,
        setSelectedAddressId,
        showNewAddressForm,
        setShowNewAddressForm,
        newAddress,
        setNewAddress,
        newAddressQuery,
        setNewAddressQuery,

        guestName,
        setGuestName,
        guestEmail,
        setGuestEmail,
        guestPhone,
        setGuestPhone,
        guestAddress,
        setGuestAddress,
        guestAddressQuery,
        setGuestAddressQuery,

        deliveryCoords,
        deliveryFee,
        deliveryLabel,
        outOfRange,
        distanceKm,
        handleAddressResolved,

        customerNote,
        setCustomerNote,

        items,
        subtotal,
        total,

        submitting,
        error,
        handleSubmit,

        showPhoneModal,
        handlePhoneModalSuccess,
        handlePhoneModalClose,
    };
}
