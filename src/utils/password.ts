import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.bcryptRounds);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, env.bcryptRounds);
}

export async function compareToken(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/** Generates a random URL-safe token (used for password reset). */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
