import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // rawBody: true → nécessaire pour vérifier la signature des webhooks Stripe.
  // Sans ça, le body est parsé en JSON et la signature calculée par Stripe
  // ne correspond plus au body reçu.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Activer le parsing des cookies
  app.use(cookieParser());

  // Activer CORS (pour que le frontend puisse communiquer)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Préfixe global pour toutes les routes
  app.setGlobalPrefix('api'); // Toutes les routes commenceront par /api

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API endpoints available at: http://localhost:${port}/api`);
}

void bootstrap();
