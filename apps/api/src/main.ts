import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: true, credentials: true });
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT || 4000);
}

bootstrap();
