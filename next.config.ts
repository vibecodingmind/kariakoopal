import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client"],
  allowedDevOrigins: [
    "preview-chat-505e3aa2-22f8-41ae-8b05-31389c236fbc.space-z.ai",
    ".space.chatglm.site",
    "localhost",
  ],
};

export default nextConfig;
