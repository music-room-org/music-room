import "dotenv/config";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from "express";


async function bootstrap() {
  console.log("DATABASE_URL =", process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(json({ limit: '10mb' }));
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend server running on http://localhost:${port}`);
}
bootstrap();
