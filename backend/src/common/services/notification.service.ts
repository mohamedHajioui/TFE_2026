import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../modules/order/entity/order.entity';

/**
 * Service de notifications.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly config: ConfigService) {}

  /* Helpers internes */

  private getRecipientEmail(order: Order): string | null {
    if (order.user?.email) return order.user.email;
    if (order.guestEmail) return order.guestEmail;
    return null;
  }

  /**
   * Envoie un SMS via Twilio REST API (pas de SDK, juste fetch).
   * On évite d'importer le SDK Twilio pour rester léger.
   */
  private async sendSms(to: string, body: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || !from) {
      this.logger.warn(
        '[SMS] Variables Twilio manquantes (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER). SMS non envoyé.',
      );
      return;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams({ To: to, From: from, Body: body });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`[SMS] Twilio erreur ${response.status}: ${text}`);
        return;
      }

      this.logger.log(`[SMS] Message envoyé à ${to}`);
    } catch (err) {
      this.logger.error(
        `[SMS] Erreur réseau Twilio: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /* Notifications ADMIN */

  /**
   * Notifie l'admin par SMS qu'une nouvelle commande vient d'être payée.
   * Appelé par PaymentService.onPaymentSuccess() après confirmation Stripe.
   */
  async notifyAdminNewOrder(order: Order): Promise<void> {
    const adminPhone = this.config.get<string>('ADMIN_PHONE') ?? '+32465412673';

    const typeLabel = order.type === 'DELIVERY' ? 'Livraison' : 'À emporter';
    const total = Number(order.total).toFixed(2);
    const client =
      order.guestEmail ??
      order.user?.displayName ??
      order.user?.email ??
      'Invité';

    const body =
      `Spot Gourmand — Nouvelle commande !\n` +
      `N° ${order.orderNumber}\n` +
      `Client : ${client}\n` +
      `Type : ${typeLabel}\n` +
      `Total : ${total} €\n` +
      `Connecte-toi au dashboard pour la traiter.`;

    await this.sendSms(adminPhone, body);
  }

  /* Notifications CLIENT (stubs) */

  /**
   * Notifie le client que sa commande est en cours de préparation.
   * Stub — brancher un vrai sender email ici (Resend, SMTP, etc.).
   */
  async notifyOrderTakenInCharge(order: Order): Promise<void> {
    const email = this.getRecipientEmail(order);
    if (!email) {
      this.logger.warn(
        `[EMAIL] Commande ${order.orderNumber} sans email — skip.`,
      );
      return;
    }
    this.logger.log(
      `[EMAIL STUB] → ${email} : commande ${order.orderNumber} en cours de préparation.`,
    );
    // TODO : envoyer un vrai email ici
  }

  async notifyPaymentConfirmed(order: Order): Promise<void> {
    const email = this.getRecipientEmail(order);
    if (!email) return;
    this.logger.log(
      `[EMAIL STUB] → ${email} : paiement confirmé pour ${order.orderNumber}.`,
    );
    // TODO : envoyer un vrai email ici
  }
}
