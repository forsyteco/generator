import { NestFactory } from "@nestjs/core";
import { json } from "express";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: "10mb" }));

  const port = process.env.APPLICATION_PORT ?? process.env.PORT ?? 7050;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`forsyteco-generator listening on http://0.0.0.0:${port}`);
}

void bootstrap();
