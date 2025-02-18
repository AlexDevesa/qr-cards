import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ❌ Ignora los errores de ESLint durante la build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ❌ Permite que la build continúe aunque TypeScript tenga errores
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;