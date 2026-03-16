/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  async rewrites() {
    return [
      {
        source: '/api/openapi.json',
        destination: '/api/docs',
      },
    ];
  },
};

module.exports = nextConfig;
