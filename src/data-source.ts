import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.NEST_DB_HOST,
  port: Number(process.env.NEST_DB_PORT),
  username: process.env.NEST_DB_USERNAME,
  password: process.env.NEST_DB_PASSWORD,
  database: process.env.NEST_DB_NAME,
  entities: [path.join(__dirname, 'data/entities', '**', '*.entity.{ts,js}')],
  synchronize: true,
  logging: true,
});

AppDataSource.initialize()
  .then(() => console.log('✅ Data Source Initialized'))
  .catch((err) => console.error('❌ Error initializing Data Source:', err));
