import {Expose, Transform, Type} from 'class-transformer';
import {UserModel} from './user.model';
import {AddressModel} from './address.model';
import {TimeSlotModel} from './time-slot.model';
import {ProductModel} from './product.model';
import {MenuModel} from './menu.model';

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    IN_PREPARATION = 'IN_PREPARATION',
    READY = 'READY',
    IN_DELIVERY = 'IN_DELIVERY',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum OrderType {
    PICKUP = 'PICKUP',
    DELIVERY = 'DELIVERY',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export const OrderStatusLabel: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'En attente',
    [OrderStatus.CONFIRMED]: 'Confirmée',
    [OrderStatus.IN_PREPARATION]: 'En préparation',
    [OrderStatus.READY]: 'Prête',
    [OrderStatus.IN_DELIVERY]: 'En livraison',
    [OrderStatus.COMPLETED]: 'Terminée',
    [OrderStatus.CANCELLED]: 'Annulée',
};

export const OrderTypeLabel: Record<OrderType, string> = {
    [OrderType.PICKUP]: 'À emporter',
    [OrderType.DELIVERY]: 'Livraison',
};

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'En attente',
    [PaymentStatus.PAID]: 'Payé',
    [PaymentStatus.FAILED]: 'Échoué',
    [PaymentStatus.REFUNDED]: 'Remboursé',
};

export interface MenuChoices {
    sandwich?: number;
    drink?: number;
    dessert?: number;
    side?: number;
}

export interface ProductCustomization {
    removed?: number[];
    extra?: number[];
    breadType?: string;
    notes?: string;
}

export class OrderItemModel {
    @Expose()
    id: number;

    @Expose()
    itemType: 'product' | 'menu';

    @Expose()
    @Type(() => ProductModel)
    product: ProductModel | null;

    @Expose()
    @Type(() => MenuModel)
    menu: MenuModel | null;

    @Expose()
    quantity: number;

    @Expose()
    @Transform(({value}) => parseFloat(value))
    unitPrice: number;

    @Expose()
    @Transform(({value}) => parseFloat(value))
    totalPrice: number;

    @Expose()
    menuChoices: MenuChoices | null;

    @Expose()
    customization: ProductCustomization | null;

    @Expose()
    specialInstructions: string | null;

    @Expose()
    @Transform(({value}) => (value ? new Date(value) : null))
    createdAt: Date | null;

    get label(): string {
        if (this.itemType === 'menu' && this.menu) return this.menu.name;
        if (this.product) return this.product.name;
        return 'Produit inconnu';
    }

    get formattedUnitPrice(): string {
        return `${this.unitPrice.toFixed(2)} €`;
    }

    get formattedTotalPrice(): string {
        return `${this.totalPrice.toFixed(2)} €`;
    }
}

export class OrderModel {
    @Expose()
    id: number;

    @Expose()
    orderNumber: string;

    @Expose()
    type: OrderType;

    @Expose()
    status: OrderStatus;

    @Expose()
    paymentStatus: PaymentStatus;

    @Expose()
    @Transform(({value}) => parseFloat(value))
    subtotal: number;

    @Expose()
    @Transform(({value}) => parseFloat(value))
    deliveryFee: number;

    @Expose()
    @Transform(({value}) => parseFloat(value))
    total: number;

    @Expose()
    customerNote: string | null;

    @Expose()
    internalNote: string | null;

    @Expose()
    @Type(() => UserModel)
    user: UserModel | null;

    @Expose()
    @Type(() => AddressModel)
    deliveryAddress: AddressModel | null;

    @Expose()
    @Type(() => TimeSlotModel)
    timeSlot: TimeSlotModel;

    @Expose()
    @Type(() => OrderItemModel)
    items: OrderItemModel[];

    @Expose()
    guestToken: string | null;

    @Expose()
    guestEmail: string | null;

    @Expose()
    guestName: string | null;

    @Expose()
    guestPhone: string | null;

    @Expose()
    guestStreet: string | null;

    @Expose()
    guestNumber: string | null;

    @Expose()
    guestBox: string | null;

    @Expose()
    guestPostalCode: string | null;

    @Expose()
    guestCity: string | null;

    @Expose()
    guestCountry: string | null;

    @Expose()
    guestAddressComplement: string | null;

    @Expose()
    @Transform(({value}) => (value ? new Date(value) : null))
    createdAt: Date | null;

    @Expose()
    @Transform(({value}) => (value ? new Date(value) : null))
    updatedAt: Date | null;

    @Expose()
    @Transform(({value}) => (value ? new Date(value) : null))
    completedAt: Date | null;

    get statusLabel(): string {
        return OrderStatusLabel[this.status];
    }

    get typeLabel(): string {
        return OrderTypeLabel[this.type];
    }

    get paymentStatusLabel(): string {
        return PaymentStatusLabel[this.paymentStatus];
    }

    get formattedTotal(): string {
        return `${this.total.toFixed(2)} €`;
    }

    get isCancellable(): boolean {
        return ![
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
            OrderStatus.IN_DELIVERY,
        ].includes(this.status);
    }

    get isActive(): boolean {
        return ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(this.status);
    }

    /**
     * Retourne le nom/email du client, qu'il soit connecté ou invité.
     * Utile dans le dashboard admin.
     */
    get clientLabel(): string {
        if (this.user?.displayName) return this.user.displayName;
        if (this.user?.email) return this.user.email;
        if (this.guestName) return this.guestName;
        if (this.guestEmail) return this.guestEmail;
        return 'Invité';
    }

    /**
     * Adresse de livraison sous forme de chaîne lisible,
     * que l'adresse vienne d'un user ou d'un invité.
     */
    get deliveryAddressLabel(): string | null {
        if (this.type !== OrderType.DELIVERY) return null;

        if (this.guestStreet) {
            const parts = [
                `${this.guestStreet} ${this.guestNumber ?? ''}`.trim(),
                this.guestBox ? `bte ${this.guestBox}` : null,
                `${this.guestPostalCode ?? ''} ${this.guestCity ?? ''}`.trim(),
            ].filter(Boolean);
            return parts.join(', ');
        }

        if (this.deliveryAddress) {
            const {street, number, box, postalCode, city} = this.deliveryAddress;
            const parts = [
                `${street} ${number ?? ''}`.trim(),
                box ? `bte ${box}` : null,
                `${postalCode ?? ''} ${city ?? ''}`.trim(),
            ].filter(Boolean);
            return parts.join(', ');
        }

        return null;
    }
}