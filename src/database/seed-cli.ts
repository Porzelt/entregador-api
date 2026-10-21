import { config as loadEnv } from 'dotenv';
loadEnv();
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/configuration';
import { seedDatabase } from './seed';

async function main() {
  const ds = new DataSource(dataSourceOptions());
  await ds.initialize();
  await ds.runMigrations();
  await seedDatabase(ds);
  await ds.destroy();
  console.log('Migrations aplicadas e seed concluído.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
