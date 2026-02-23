import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile server packages for compatibility
  transpilePackages: ['three'],

  // Allow the Three.js canvas to work with strict mode
  reactStrictMode: true,

  // Empty turbopack config since Next.js 16 uses Turbopack by default
  turbopack: {},

  // Proxy /api requests to the backend so ad blockers don't block cross-origin calls
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
