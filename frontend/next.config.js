/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable webpack 5 Web Worker support via the `new Worker(new URL(..., import.meta.url))` pattern
  // This is the standard way to use Workers in Next.js 13+ App Router projects.
  webpack(config) {
    config.output.globalObject = 'globalThis';
    return config;
  },
};

module.exports = nextConfig;
