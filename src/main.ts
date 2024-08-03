import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';

import { AppModule } from './app.module';
import { DatabaseService } from './database/database.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const databaseService = app.get(DatabaseService);
  await databaseService.$connect();

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  const corsOptions: cors.CorsOptions = {
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:3001'],
  };
  app.use(cors(corsOptions));

  await app.listen(parseInt(process.env.PORT || '3000'));
}
bootstrap();
