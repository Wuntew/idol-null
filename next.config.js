const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

/** @type {import('next').NextConfig} */
const baseConfig = {
  experimental: { serverActions: { allowedOrigins: ['*'] } },
}

module.exports = phase => ({
  ...baseConfig,
  // Keep `next build` from invalidating assets used by a running dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
})
