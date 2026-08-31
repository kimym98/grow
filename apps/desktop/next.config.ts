import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  if (isDev) {
    // next dev는 여러 경로를 각자의 URL로 서빙하므로 상대경로 assetPrefix가
    // 루트가 아닌 라우트(/login 등)에서 정적 자산 경로를 깨뜨린다.
    return {};
  }

  return {
    output: "export",
    // electron/main.ts가 out/을 app:// 커스텀 프로토콜(정식 origin)로 서빙하므로
    // 절대경로(/_next/...)가 앱 루트 기준으로 정상 해석된다. 과거 file://로 직접 열던
    // 시절 상대경로(assetPrefix: "./")로 강제했던 설정은 이제 필요 없을 뿐 아니라,
    // trailingSlash와 결합해 /login/, /settings/ 같은 라우트별 페이지에서 "./_next/..."가
    // 현재 디렉터리(/login/_next/...) 기준으로 잘못 해석되어 모든 자산이 404가 나는
    // 원인이었다 — 절대경로를 쓰도록 되돌린다.
    trailingSlash: true,
  };
};

export default nextConfig;
