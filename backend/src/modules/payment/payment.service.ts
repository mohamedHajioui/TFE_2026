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
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Stripe = require('stripe');

import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../order/entity/order.entity';
import { TimeSlot } from '../time-slot/entity/time-slot.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';

/**
 * Service de paiement Stripe (compatible stripe@22.x, nodenext CJS).
 *
 * Flow :
 *  1. Commande créée (PENDING/PENDING, créneau non réservé)
 *  2. POST /payments/checkout-session → Stripe Checkout Session
 *  3. User paye → webhook checkout.session.completed
 *  4. onPaymentSuccess() → réserve le créneau + PAID + CONFIRMED
 *  5. Échec/expire → FAILED + CANCELLED
 */
@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private stripe!: Stripe.Stripe;

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
    this.stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
  }

  private ensureStripe(): Stripe.Stripe {
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

    const lineItems = order.items.map((item) => {
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

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

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
      throw new InternalServerErrorException("Stripe n'a pas retourné d'URL de checkout");
    }

    order.internalNote = `stripe_session:${session.id}`;
    await this.orderRepo.save(order);

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Vérifie la signature du webhook depuis le raw body.
   * Le type de retour est inféré depuis stripe.webhooks.constructEvent.
   */
  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
  ): ReturnType<Stripe.Stripe['webhooks']['constructEvent']> {
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

  async handleWebhookEvent(
    event: ReturnType<Stripe.Stripe['webhooks']['constructEvent']>,
  ): Promise<void> {
    this.logger.log(`Webhook Stripe reçu : ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onPaymentSuccess(event.data.object);
        break;
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
        await this.onPaymentFailed(event.data.object);
        break;
      default:
        this.logger.debug(`Event Stripe ignoré : ${event.type}`);
    }
  }

  private async onPaymentSuccess(session: unknown): Promise<void> {
    const s = session as Record<string, unknown>;
    const metadata = s['metadata'] as Record<string, string> | null;
    const orderId = Number(metadata?.['orderId']);
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

    // Réserver le créneau après confirmation paiement
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
          `Créneau ${slot.id} complet pour ${order.orderNumber} — remboursement requis`,
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

    const sessionId = String(s['id'] ?? '');
    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.CONFIRMED;
    order.internalNote = `stripe_session:${sessionId} · paid`;
    await this.orderRepo.save(order);

    this.logger.log(
      `Commande ${order.orderNumber} marquée PAID + CONFIRMED, créneau réservé.`,
    );
  }

  private async onPaymentFailed(session: unknown): Promise<void> {
    const s = session as Record<string, unknown>;
    const metadata = s['metadata'] as Record<string, string> | null;
    const orderId = Number(metadata?.['orderId']);
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
