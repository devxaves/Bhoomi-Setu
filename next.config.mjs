import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Only override outputFileTracingRoot locally to avoid OneDrive root lockfile confusion; let Vercel handle tracing natively
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: __dirname }),
  // pg and tesseract.js are Node.js native/WASM — don't bundle
  serverExternalPackages: ['pg', 'tesseract.js'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
}

export default nextConfig
