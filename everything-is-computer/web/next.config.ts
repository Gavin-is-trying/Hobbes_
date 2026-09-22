import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {

  trailingSlash: true,
  turbopack: { root: path.resolve(process.cwd(), "../..") },
};

export default config;
