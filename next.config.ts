import type { NextConfig } from "next";

// On GitHub Actions the site lives at https://<user>.github.io/<repo>/
const repoName = (process.env.GITHUB_REPOSITORY ?? "").split("/")[1] ?? "";
const onPages = process.env.GITHUB_ACTIONS === "true" && repoName !== "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: onPages ? `/${repoName}` : "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
