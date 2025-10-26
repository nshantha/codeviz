import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment variable schema with validation
const EnvSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // OpenAI GPT-5
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-5'),
  OPENAI_MAX_TOKENS: z.string().transform(Number).default('4000'),
  OPENAI_TEMPERATURE: z.string().transform(Number).default('0.7'),

  // Supabase
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default('*'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Config = z.infer<typeof EnvSchema>;

// Validate and export config
export const config = EnvSchema.parse(process.env);

// Export individual configs for convenience
export const serverConfig = {
  env: config.NODE_ENV,
  port: config.PORT,
  allowedOrigins: config.ALLOWED_ORIGINS.split(','),
};

export const openaiConfig = {
  apiKey: config.OPENAI_API_KEY,
  model: config.OPENAI_MODEL,
  maxTokens: config.OPENAI_MAX_TOKENS,
  temperature: config.OPENAI_TEMPERATURE,
};

export const supabaseConfig = {
  url: config.SUPABASE_URL,
  anonKey: config.SUPABASE_ANON_KEY,
  serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
};
