import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '1234',
  database: 'tfe_2026',
  entities: ['src/**/*.entity.ts'],
  migrations: ['database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
