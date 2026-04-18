import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entity/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGuestCheckoutSessionDto } from './dto/create-guest-session.dto';

@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** Checkout session — USER CONNECTÉ */
  @Post('checkout-session')
  async createCheckoutSession(
    @CurrentUser() user: User,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string; sessionId: string }> {
    return await this.paymentService.createCheckoutSession(
      dto.orderId,
      user.id,
    );
  }

  /** Checkout session — INVITÉ */
  @Public()
  @Post('guest/checkout-session')
  async createGuestCheckoutSession(
    @Body() dto: CreateGuestCheckoutSessionDto,
  ): Promise<{ url: string; sessionId: string }> {
    return await this.paymentService.createGuestCheckoutSession(
      dto.orderId,
      dto.email,
    );
  }

  /**
   * Webhook Stripe.
   * Nécessite main.ts avec NestFactory.create(AppModule, { rawBody: true }).
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!req.rawBody) {
      throw new Error(
        'rawBody indisponible : activez rawBody:true dans NestFactory.create',
      );
    }

    const event = this.paymentService.verifyWebhookSignature(
      req.rawBody,
      signature,
    );
    await this.paymentService.handleWebhookEvent(event);

    return { received: true };
  }
}
