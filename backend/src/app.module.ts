import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    AuthModule,
    ProductModule,
    IngredientModule,
    TimeSlotModule,
    MenuModule,
    UserModule,
    AddressModule,
    OrderModule,
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
