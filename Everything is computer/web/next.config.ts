import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: { root: path.resolve(process.cwd(), "../..") },
};

export default config;
