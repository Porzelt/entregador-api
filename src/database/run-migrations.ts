import { config as loadEnv } from 'dotenv';
loadEnv();
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/configuration';

async function main() {
  const ds = new DataSource(dataSourceOptions());
  await ds.initialize();
  await ds.runMigrations();
  await ds.destroy();
  console.log('Migrations aplicadas.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
