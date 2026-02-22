import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile server packages for compatibility
  transpilePackages: ['three'],

  // Allow the Three.js canvas to work with strict mode
  reactStrictMode: true,

  // Empty turbopack config since Next.js 16 uses Turbopack by default
  turbopack: {},
};

export default nextConfig;
