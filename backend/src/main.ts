import "dotenv/config";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from "express";


async function bootstrap() {
  console.log("DATABASE_URL =", process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:8081",
  });

  app.use(json({ limit: "10mb" }));
  await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
}
bootstrap();
