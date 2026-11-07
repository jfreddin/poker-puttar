import type { NextConfig } from "next";

// On GitHub Actions the site lives at https://<user>.github.io/poker-pot-next/
const onPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: onPages ? "/poker-pot-next" : "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
