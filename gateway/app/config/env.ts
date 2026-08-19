const devJWTSecret = 'clerk-dev-secret'
const devWebhookSecret = 'clerk-dev-webhook'

export const clerkEnv = process.env.CLERK_ENV ?? 'development'
export const isDev = clerkEnv === 'development'

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 3000),
  coreUrl: process.env.CORE_URL ?? 'http://localhost:8080',
  sessionDir: process.env.SESSION_DIR ?? './data/sessions',
  jwtSecret: process.env.JWT_SECRET ?? devJWTSecret,
  webhookSecret: process.env.WEBHOOK_SECRET ?? (isDev ? devWebhookSecret : '')
}

export function validateStartup(): void {
  if (isDev) {
    return
  }
  if (!env.jwtSecret || env.jwtSecret === devJWTSecret) {
    throw new Error('JWT_SECRET must be set to a strong value when CLERK_ENV is not development')
  }
  if (!env.webhookSecret) {
    throw new Error('WEBHOOK_SECRET must be set when CLERK_ENV is not development')
  }
}
