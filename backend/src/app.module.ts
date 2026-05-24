import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { typeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ProductModule } from './modules/products/product.module';
import { IngredientModule } from './modules/ingredients/ingredient.module';
import { TimeSlotModule } from './modules/time-slot/time-slot.module';
import { UserModule } from './modules/users/user.module';
import { AddressModule } from './modules/adress/address.module';
import { MenuModule } from './modules/menus/menu.module';
import { OrderModule } from './modules/order/order.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UploadModule } from './modules/upload/upload.module';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    // Servir les fichiers uploadés (images produits/menus)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    ProductModule,
    IngredientModule,
    TimeSlotModule,
    MenuModule,
    UserModule,
    AddressModule,
    SettingsModule,
    OrderModule,
    PaymentModule,
    UploadModule,
    CartModule,
  ],
  providers: [
    // Validation globale des DTOs
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Retire les propriétés non définies dans le DTO
        forbidNonWhitelisted: false, // Ne pas rejeter les requêtes avec des propriétés supplémentaires
        transform: true, // Transforme automatiquement les types
        skipMissingProperties: false,
        validationError: { target: false, value: false },
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
    // Protection JWT globale
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
