import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get<number>('DB_PORT') || 5432,
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [
      configService.get('NODE_ENV') === 'production'
        ? 'dist/database/migrations/*.js'
        : 'database/migrations/*.js',
    ],
    migrationsRun: true,
    synchronize: true,
    logging: configService.get('NODE_ENV') === 'development',
  }),
  inject: [ConfigService],
};
