/** @type {import('next').NextConfig} */
const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3000'
const coreUrl = process.env.CORE_URL ?? 'http://localhost:8080'

const nextConfig = {
  allowedDevOrigins: ['172.20.10.2', 'localhost', '127.0.0.1'],
  serverExternalPackages: ['@tailwindcss/postcss', '@tailwindcss/oxide', 'lightningcss'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'api.navii.dev', pathname: '/avatar/**' }],
  },
  // Stable across deploys so stale tabs don't spam "Failed to find Server Action".
  // Override with NEXT_SERVER_ACTIONS_ENCRYPTION_KEY at build time if needed.
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        // Never cache HTML/RSC shells — they embed build-specific action IDs.
        source: '/((?!_next/static|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/core/:path*',
        destination: `${coreUrl}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
