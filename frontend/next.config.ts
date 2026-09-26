import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: an unrelated package-lock.json exists higher up the tree.
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow the Base44 preview origin to access dev assets/HMR.
  allowedDevOrigins: ["3000-" + (process.env.BASE44_PUBLIC_HOST_SUFFIX ?? "")].filter(Boolean),
};

export default nextConfig;
