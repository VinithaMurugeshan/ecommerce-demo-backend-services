import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT ?? "4000", 10),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",

  databaseUrl: required("DATABASE_URL", "postgresql://ecommerce:ecommerce@localhost:5432/ecommerce?schema=public"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    currency: process.env.STRIPE_CURRENCY ?? "usd",
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? "10", 10),
};
