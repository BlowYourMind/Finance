import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      host: '127.0.0.1',
      password: '',
      port: 6379,
    },
  });
  await app.listen();
}
bootstrap();
