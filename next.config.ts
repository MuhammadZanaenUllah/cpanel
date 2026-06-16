import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow self-signed certs from the backend in dev
  experimental: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
};

export default nextConfig;
