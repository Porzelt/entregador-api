import { config as loadEnv } from 'dotenv';
loadEnv();
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Entregador Demo API')
    .setDescription('API do app de entregador (projeto de estudo e portfólio, dados simulados).')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API em http://localhost:${port} (documentação em /docs)`);
}

bootstrap();
