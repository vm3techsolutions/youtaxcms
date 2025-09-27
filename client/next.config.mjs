/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: "export",
    reactStrictMode: true,
  swcMinify: true,
  output: undefined,
  images: {
    unoptimized: true
  },
};

export default nextConfig;
