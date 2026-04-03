/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["upscaler", "@upscalerjs/default-model", "@tensorflow/tfjs"],
};

export default nextConfig;
