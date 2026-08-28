import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  if (isDev) {
    // next dev는 여러 경로를 각자의 URL로 서빙하므로 상대경로 assetPrefix가
    // 루트가 아닌 라우트(/login 등)에서 정적 자산 경로를 깨뜨린다.
    return {};
  }

  return {
    output: "export",
    // Electron이 file://out/index.html을 직접 여는 SPA라 절대경로(/_next/...)로는
    // 정적 자산을 찾지 못한다. 상대경로로 내보내도록 강제한다. (빌드/export 전용)
    assetPrefix: "./",
    trailingSlash: true,
  };
};
