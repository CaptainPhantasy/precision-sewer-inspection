const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  experimental: {
    outputFileTracingRoot: __dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'precisionsewerinspection.com' }],
        destination: 'https://precisionsewerinspections.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.precisionsewerinspection.com' }],
        destination: 'https://precisionsewerinspections.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
