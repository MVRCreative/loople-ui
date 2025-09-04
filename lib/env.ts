import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_OR_PUBLISHABLE_KEY: z
    .string()
    .min(1, { message: "Supabase anon key is required" }),
  // Redis - support both Upstash and KV naming conventions
  REDIS_URL: z.string().url().optional(),
  REDIS_TOKEN: z.string().min(1).optional(),
});

type EnvShape = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: string;
  REDIS_URL?: string;
  REDIS_TOKEN?: string;
};

let cachedEnv: EnvShape | null = null;

export function getEnv(): EnvShape {
  if (cachedEnv) return cachedEnv;

  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  // Normalize Redis environment variables - support both naming conventions
  const redisUrl = 
    process.env.UPSTASH_REDIS_REST_URL ?? 
    process.env.KV_REST_API_URL ?? 
    process.env.REDIS_URL;
  
  const redisToken = 
    process.env.UPSTASH_REDIS_REST_TOKEN ?? 
    process.env.KV_REST_API_TOKEN ?? 
    process.env.REDIS_TOKEN;

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_OR_PUBLISHABLE_KEY: anon,
    REDIS_URL: redisUrl,
    REDIS_TOKEN: redisToken,
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const details = Object.entries(flattened)
      .map(([key, messages]) => `${key}: ${messages?.join(", ")}`)
      .join("; ");
    throw new Error(
      `Invalid environment configuration: ${details}. ` +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY)."
    );
  }

  cachedEnv = {
    NEXT_PUBLIC_SUPABASE_URL: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
      parsed.data.NEXT_PUBLIC_SUPABASE_ANON_OR_PUBLISHABLE_KEY,
    REDIS_URL: parsed.data.REDIS_URL,
    REDIS_TOKEN: parsed.data.REDIS_TOKEN,
  };

  return cachedEnv;
}

// Export normalized Redis environment variables
export const { REDIS_URL, REDIS_TOKEN } = getEnv();

