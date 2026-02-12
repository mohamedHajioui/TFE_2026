import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer le parsing des cookies
  app.use(cookieParser());

  // Activer CORS (pour que le frontend puisse communiquer)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200', // Vite par défaut
    credentials: true,
  });

  // Préfixe global pour toutes les routes
  app.setGlobalPrefix('api'); // Toutes les routes commenceront par /api

  // Validation globale (redondant si déjà dans app.module, mais bon à avoir)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API endpoints available at: http://localhost:${port}/api`);
}

void bootstrap();
