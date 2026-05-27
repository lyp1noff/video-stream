import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@vidstack/react", "media-captions"],
};

export default nextConfig;
