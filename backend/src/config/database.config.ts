import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    return {
      type: 'postgres' as const,
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT') || 5432,
      username: configService.get<string>('DB_USERNAME'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_DATABASE'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [
        isProduction
          ? 'dist/database/migrations/*.js'
          : 'database/migrations/*.js',
      ],
      migrationsRun: true,
      synchronize: configService.get<string>('DB_SYNC') === 'true' || !isProduction,
      logging: !isProduction,
      // SSL requis par les DB cloud (Neon, Azure, etc.)
      ssl: isProduction || configService.get<string>('DB_SSL') === 'true'
        ? { rejectUnauthorized: false }
        : false,
    };
  },
  inject: [ConfigService],
};
