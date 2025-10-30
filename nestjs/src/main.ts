import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  // Bật CORS nếu cần gọi từ frontend
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation cho DTO (bạn đã có; thêm vài option nếu muốn)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // tự động bỏ field thừa
      forbidNonWhitelisted: true,     // gặp field thừa thì báo lỗi
      transform: true,                // biến req body -> DTO class
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Nest running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
