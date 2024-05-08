import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      host: '38.242.203.151',
      password: 'andjf8*d@GS',
      port: 6379,
    },
  });
  await app.listen();
}
bootstrap();
