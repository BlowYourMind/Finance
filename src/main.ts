import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: parseInt(process.env.REDIS_PORT),
      }
    },
  );
  await app.listen();
}
bootstrap();
