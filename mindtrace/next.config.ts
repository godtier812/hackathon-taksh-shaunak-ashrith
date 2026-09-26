import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: an unrelated package-lock.json exists higher up the tree.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
