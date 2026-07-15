import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/ko",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
