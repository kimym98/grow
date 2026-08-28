import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Electron이 file://out/index.html을 직접 여는 SPA라 절대경로(/_next/...)로는
  // 정적 자산을 찾지 못한다. 상대경로로 내보내도록 강제한다.
  assetPrefix: "./",
  trailingSlash: true,
};

export default nextConfig;
