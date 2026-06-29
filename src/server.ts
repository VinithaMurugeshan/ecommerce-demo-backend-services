import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/prisma";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(env.port, () => {
    /* eslint-disable no-console */
    console.log(`\n  E-Commerce API running`);
    console.log(`  → API:   http://localhost:${env.port}${env.apiPrefix}`);
    console.log(`  → Docs:  http://localhost:${env.port}/docs`);
    console.log(`  → Spec:  http://localhost:${env.port}/docs.json`);
    console.log(`  → Env:   ${env.nodeEnv}\n`);
    /* eslint-enable no-console */
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
