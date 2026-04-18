import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../order/entity/order.entity';
import { TimeSlot } from '../time-slot/entity/time-slot.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';

/**
 * Service de paiement Stripe.
 *
 * Compatible avec stripe@22.x (API version 2026-03-25.dahlia).
 * Si tu upgrades stripe plus tard, mets à jour la version d'API ci-dessous
 * pour qu'elle corresponde à celle du SDK.
 *
 * Flow :
 *  1. Commande créée (PENDING/PENDING, créneau non réservé)
 *  2. POST /payments/checkout-session → crée une Stripe Checkout Session
 *  3. User payé sur Stripe → webhook checkout.session.completed
 *  4. onPaymentSuccess() → réserve le créneau + PAID + CONFIRMED
 *  5. Échec/expire → FAILED + CANCELLED
 */
@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepo: Repository<TimeSlot>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  onModuleInit(): void {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      this.logger.warn(
        'STRIPE_SECRET_KEY manquante — les paiements échoueront. Vérifiez votre .env.',
      );
      return;
    }
    // apiVersion fixée à celle de stripe@22.x
    this.stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
  }

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new InternalServerErrorException(
        'Stripe non configuré. Définissez STRIPE_SECRET_KEY dans le .env.',
      );
    }
    return this.stripe;
  }

  /** Checkout session — USER CONNECTÉ */
  async createCheckoutSession(
    orderId: number,
    userId: number,
  ): Promise<{ url: string; sessionId: string }> {
    const order = await this.loadOrder(orderId);

    if (order.user?.id !== userId) {
      throw new ForbiddenException("Cette commande n'est pas la vôtre");
    }

    return await this.buildCheckoutSession(order, order.user.email);
  }

  /** Checkout session — INVITÉ */
  async createGuestCheckoutSession(
    orderId: number,
    guestEmail: string,
  ): Promise<{ url: string; sessionId: string }> {
    const order = await this.loadOrder(orderId);

    if (order.user !== null) {
      throw new ForbiddenException(
        'Cette commande nécessite une authentification',
      );
    }
    if (order.guestEmail !== guestEmail) {
      throw new ForbiddenException(
        'Email ne correspondant pas à cette commande',
      );
    }

    return await this.buildCheckoutSession(order, guestEmail);
  }

  private async loadOrder(orderId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product', 'items.menu'],
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Commande déjà payée');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Commande annulée');
    }
    return order;
  }

  private async buildCheckoutSession(
    order: Order,
    customerEmail: string,
  ): Promise<{ url: string; sessionId: string }> {
    const stripe = this.ensureStripe();

    // Typage explicite via StripeSdk namespace import
    const lineItems: StripeSdk.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => {
        const name =
          item.menu?.name ?? item.product?.name ?? `Article #${item.id}`;
        return {
          price_data: {
            currency: 'eur',
            product_data: { name },
            unit_amount: Math.round(Number(item.unitPrice) * 100),
          },
          quantity: item.quantity,
        };
      });

    if (Number(order.deliveryFee) > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: Math.round(Number(order.deliveryFee) * 100),
        },
        quantity: 1,
      });
    }

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'bancontact'],
      line_items: lineItems,
      customer_email: customerEmail,
      success_url: `${frontendUrl}/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout/cancel?order=${order.id}`,
      metadata: {
        orderId: String(order.id),
        orderNumber: order.orderNumber,
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        "Stripe n'a pas retourné d'URL de checkout",
      );
    }

    order.internalNote = `stripe_session:${session.id}`;
    await this.orderRepo.save(order);

    return { url: session.url, sessionId: session.id };
  }

  /** Vérifie la signature du webhook à partir du raw body. */
  verifyWebhookSignature(rawBody: Buffer, signature: string): StripeSdk.Event {
    const stripe = this.ensureStripe();
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET manquant dans le .env',
      );
    }

    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signature invalide';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException(`Webhook invalide : ${message}`);
    }
  }

  async handleWebhookEvent(event: StripeSdk.Event): Promise<void> {
    this.logger.log(`Webhook Stripe reçu : ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeSdk.Checkout.Session;
        await this.onPaymentSuccess(session);
        break;
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as StripeSdk.Checkout.Session;
        await this.onPaymentFailed(session);
        break;
      }
      default:
        this.logger.debug(`Event Stripe ignoré : ${event.type}`);
    }
  }

  private async onPaymentSuccess(
    session: StripeSdk.Checkout.Session,
  ): Promise<void> {
    const orderId = Number(session.metadata?.orderId);
    if (!orderId) {
      this.logger.error('Webhook success sans metadata.orderId');
      return;
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['timeSlot'],
    });
    if (!order) {
      this.logger.error(`Webhook success : commande ${orderId} introuvable`);
      return;
    }

    // Idempotence
    if (order.paymentStatus === PaymentStatus.PAID) {
      this.logger.log(`Commande ${order.orderNumber} déjà PAID — skip`);
      return;
    }

    // Réserver le créneau maintenant (option B)
    if (order.timeSlot) {
      const slot = await this.timeSlotRepo.findOne({
        where: { id: order.timeSlot.id },
      });

      if (!slot) {
        this.logger.error(
          `Créneau ${order.timeSlot.id} disparu pour ${order.orderNumber}`,
        );
      } else if (slot.currentBookings >= slot.maxCapacity) {
        this.logger.error(
          `Créneau ${slot.id} complet pour ${order.orderNumber} ALORS QU'ON EST PAYÉ — remboursement à faire`,
        );
        order.paymentStatus = PaymentStatus.PAID;
        order.status = OrderStatus.CANCELLED;
        order.internalNote =
          'Paiement reçu mais créneau complet — remboursement manuel requis.';
        await this.orderRepo.save(order);
        // TODO : stripe.refunds.create({ payment_intent: session.payment_intent })
        return;
      } else {
        slot.currentBookings += 1;
        await this.timeSlotRepo.save(slot);
      }
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.CONFIRMED;
    order.internalNote = `stripe_session:${session.id} · paid`;
    await this.orderRepo.save(order);

    this.logger.log(
      `Commande ${order.orderNumber} marquée PAID + CONFIRMED, créneau réservé.`,
    );
  }

  private async onPaymentFailed(
    session: StripeSdk.Checkout.Session,
  ): Promise<void> {
    const orderId = Number(session.metadata?.orderId);
    if (!orderId) return;

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;
    if (order.paymentStatus === PaymentStatus.PAID) return;

    order.paymentStatus = PaymentStatus.FAILED;
    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);

    this.logger.log(
      `Commande ${order.orderNumber} marquée FAILED + CANCELLED (paiement échoué).`,
    );
  }
}
