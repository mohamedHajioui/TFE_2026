import { Injectable, Logger } from '@nestjs/common';
import { Order } from '../../modules/order/entity/order.entity';

/**
 * Service de notifications (stub).
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Récupère l'email du destinataire, qu'il soit user connecté ou invité.
   */
  private getRecipientEmail(order: Order): string | null {
    if (order.user?.email) return order.user.email;
    if (order.guestEmail) return order.guestEmail;
    return null;
  }

  /**
   * Notifie le client que sa commande vient d'être prise en charge
   * par un employé (passage en IN_PREPARATION).
   */
  async notifyOrderTakenInCharge(order: Order): Promise<void> {
    const email = this.getRecipientEmail(order);
    if (!email) {
      this.logger.warn(
        `[notifyOrderTakenInCharge] Commande ${order.orderNumber} sans email — skip.`,
      );
      return;
    }

    this.logger.log(
      `[EMAIL STUB] → ${email} : votre commande ${order.orderNumber} est en cours de préparation.`,
    );

    // TODO: brancher l'envoi réel ici.
  }

  async notifyPaymentConfirmed(order: Order): Promise<void> {
    const email = this.getRecipientEmail(order);
    if (!email) return;
    this.logger.log(
      `[EMAIL STUB] → ${email} : paiement confirmé pour ${order.orderNumber}.`,
    );
  }
}
