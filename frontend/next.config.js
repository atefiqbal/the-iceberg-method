/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't try to statically export dynamic pages
  output: undefined,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
