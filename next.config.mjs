/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in some subpaths; Next handles it, but be explicit.
  transpilePackages: ['three'],
};

export default nextConfig;
