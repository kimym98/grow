# Electron 패키징/런타임 트러블슈팅 기록

Task 017(정적 export 정합성 확보) 이후 실제로 설치 파일을 빌드·설치·실행해보며 발견된 문제들과 원인, 수정 내용을 기록한다. 모두 "로컬 개발 서버(`next dev`)에서는 재현되지 않고 패키징된 프로덕션 빌드에서만 나타나는" 문제라는 공통점이 있다 — 즉 앞으로 유사한 변경을 할 때는 반드시 `npm run build` + `electron-builder`로 실제 설치 파일을 만들어 실행까지 해봐야 한다.

## 결론 요약

- **`@sentry/electron/main`을 최상단에서 정적 import하면 안 된다.** npm workspaces 모노레포에서 `@sentry/browser-utils`(전이 의존성)가 루트 `node_modules`에만 hoisting되어 electron-builder의 의존성 계산에서 누락되기 쉽고, 그러면 앱이 시작하자마자 `Cannot find module '@sentry/browser-utils'`로 크래시한다. SENTRY_DSN이 실제로 설정된 경우에만 `require`로 지연 로드해야 한다. `preload.ts`의 `@sentry/electron/preload`도 같은 이유로 `try/catch`로 감싸야 한다 — 감싸지 않으면 preload 스크립트 전체가 죽어 `window.electronAPI`가 통째로 사라진다.
- **asar 내부에서 `out/`은 `dist/electron`과 같은 레벨(루트)에 있다.** `path.join(__dirname, "../out/index.html")`처럼 한 단계만 올라가면 `dist/out/index.html`을 찾게 되어 잘못된 경로다. `dist/electron` → `dist` → 루트, 즉 두 단계를 올라가야 한다.
- **Next.js 정적 export는 기본적으로 `/_next/...` 절대경로로 CSS/JS를 참조한다.** `file://`로 직접 열면 "루트"라는 개념이 없어 전부 로드 실패해 스타일 없는 UI가 뜬다. `next.config.ts`에 `assetPrefix: "./"` + `trailingSlash: true`가 필요하다.
- **`file://`에서 Next의 클라이언트 라우팅(`router.push`/`replace`, `<Link href="/...">`)은 근본적으로 깨진다.** RSC payload를 가져오려는 `fetch()`가 `file://`에서 차단되고, 폴백으로 시도하는 "브라우저 네비게이션"에서 절대경로(`/login` 등)가 도메인 루트가 아니라 **드라이브 루트**로 해석되어 `file:///C:/login/`이라는 존재하지 않는 경로를 찾다가 `ERR_FILE_NOT_FOUND`로 흰 화면이 뜬다. 근본 해결은 `file://` 대신 커스텀 프로토콜(`app://`)로 정적 파일을 서빙해 정식 origin을 만들어주는 것이다.
- **패키징(`file://`) 전용 `next.config.ts` 설정(`assetPrefix: "./"`, `trailingSlash: true`, `output: "export"`)을 `next dev`에도 무조건 적용하면 안 된다.** `next dev`는 각 라우트를 실제 HTTP 경로로 서빙하는데 상대경로 `assetPrefix`가 현재 URL 기준으로 해석되어, 루트가 아닌 라우트(`/login` 등)에서 모든 JS/CSS 청크가 404가 나 하이드레이션이 죽는다. `next/constants`의 `PHASE_DEVELOPMENT_SERVER`로 분기해 dev에서는 이 설정들을 끄자.
- **인증 상태를 확인하는 비동기 호출(`getSession()` 등)에는 반드시 에러 처리를 붙여야 한다.** 실패 시 로딩 상태(`isLoading`)가 영구히 풀리지 않아, 그 상태에 의존하는 리다이렉트 로직 자체가 실행되지 않는 무한 로딩으로 이어질 수 있다.

---

## 1. `Cannot find module '@sentry/browser-utils'` — main 프로세스 크래시

**증상**: 설치 후 앱 실행 시 "A JavaScript error occurred in the main process" 다이얼로그와 함께 `Error: Cannot find module '@sentry/browser-utils'`.

**원인**: `apps/desktop/electron/main.ts`가 `@sentry/electron/main`을 최상단에서 정적 import하고, 그 전이 의존성인 `@sentry/browser-utils`가 npm workspaces 모노레포 구조상 루트 `node_modules`에만 존재한다. electron-builder가 `apps/desktop` 기준으로 프로덕션 의존성을 계산할 때 이를 놓치고 asar 패키징에서 빠뜨렸다.

**시도했다가 근본 해결이 아니었던 방법**: `@sentry/browser-utils`를 `apps/desktop/package.json`에 direct dependency로 추가. 로컬의 일시적인 `node_modules` 상태에서는 asar에 포함됐지만, CI가 `npm ci`로 완전히 새로 설치하면 npm의 실제 hoisting 결과(루트에만 존재)가 그대로라 다시 빠졌다. **의존성 선언만으로는 해결되지 않는 문제였다.**

**최종 해결**: `initSentryIfConfigured()` 내부에서 `SENTRY_DSN`이 실제로 설정된 경우에만 `require("@sentry/electron/main")`을 호출하도록 지연 로드로 변경. 지금은 DSN이 아예 없으므로 이 모듈 자체가 로드되지 않아 hoisting 문제가 있어도 크래시하지 않는다.

**부수 발견**: `electron/preload.ts`도 `@sentry/electron/preload`를 정적 import하고 있었는데, 이건 SENTRY_DSN 여부와 무관하게 항상 로드를 시도한다. 이 import가 실패하면 **preload 스크립트 전체가 로드되지 않아 `contextBridge.exposeInMainWorld("electronAPI", ...)`도 실행되지 않는다** — 딥링크 인증 콜백, 알림 동기화, 트레이/자동실행 설정 등 IPC 관련 기능이 전부 조용히 죽는 심각한 실패 모드였다. `try { require(...) } catch {}`로 감싸 무해하게 만들었다.

---

## 2. `ERR_FILE_NOT_FOUND: .../dist/out/index.html` — 빈 화면

**증상**: 위 크래시를 고친 뒤에도 창이 뜨지만 완전히 빈 화면.

**원인**: `electron/main.ts`가 프로덕션에서 `path.join(__dirname, "../out/index.html")`로 `out/index.html`을 찾는데, asar 내부에서 `dist/electron/main.js`의 `__dirname`은 `resources/app.asar/dist/electron`이다. 한 단계(`..`)만 올라가면 `resources/app.asar/dist`가 되고, 거기에 `out/index.html`을 붙이면 `dist/out/index.html`을 찾게 된다. 그런데 electron-builder의 `files: ["dist/electron/**/*", "out/**/*"]` 설정 때문에 실제 `out/`은 asar **루트**(`dist`와 같은 레벨)에 있다. `npx asar list app.asar | grep index.html`로 확인한 결과 `\out\index.html`이 루트에 있었다.

**해결**: `../../out/index.html`(두 단계)로 수정.

---

## 3. UI가 스타일 없이 날것으로 렌더링됨 (CSS/JS 미적용)

**증상**: 앱은 뜨지만 Tailwind 스타일이 전혀 적용되지 않은 상태(밑줄 친 링크, 정렬 안 된 아이콘)로 렌더링됨.

**원인**: Next.js 정적 export는 기본적으로 `<link href="/_next/static/....css">`처럼 **절대경로**로 자산을 참조한다. `file://out/index.html`을 직접 여는 구조에서는 "루트(`/`)"에 대응하는 실제 위치가 없어서 이 절대경로들이 전부 해석 실패한다.

**해결**: `next.config.ts`에 추가.
```ts
const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: "./",
  trailingSlash: true,
};
```
빌드 후 `out/index.html`을 열어 `href="./_next/static/..."`처럼 상대경로로 바뀌었는지 확인.

---

## 4. 로그인/메뉴 이동 시 흰 화면 (가장 근본적인 문제)

**증상**: 스타일까지 정상 적용된 화면이 잠시 보였다가, 로그인 여부를 확인한 직후 흰 화면으로 바뀜.

**처음 의심했던 가설(틀림)**: "로그인 체크 로직 자체가 없어서 바로 메인 화면으로 진입하는 것 아니냐" — `components/auth/auth-guard.tsx`를 확인한 결과 세션이 없으면 `router.replace("/login")`을 호출하는 로직이 **실제로 존재하고 정상 실행됨**을 확인했다. 이 가설은 근거로 반증됨.

**실제 원인**: 렌더러 콘솔을 직접 캡처(`webContents.on("console-message"/"did-fail-load")`)해 다음 로그를 확인했다.
```
[renderer-console] Failed to fetch RSC payload for file:///C:/login/. Falling back to browser navigation. TypeError: Failed to fetch ...
[did-fail-load] -6 ERR_FILE_NOT_FOUND file:///C:/login/
```
즉:
1. `router.replace("/login")` 호출 자체는 정상.
2. Next의 App Router 클라이언트 내비게이션이 목적지 라우트의 RSC payload를 `fetch()`로 가져오려 시도하는데, Chromium이 `file://` 스킴에 대한 `fetch()`를 차단해 실패.
3. Next가 이를 감지하고 "브라우저 네비게이션(전체 페이지 이동)"으로 폴백하는데, 이때 원래 전달된 절대경로 `"/login"`을 그대로 사용한다. `file://` 프로토콜에서 절대경로(`/`로 시작)는 **도메인 루트가 아니라 드라이브 루트**로 해석되어 `file:///C:/login/`이라는, 실제로 존재하지 않는 경로가 만들어진다.
4. 결과적으로 `ERR_FILE_NOT_FOUND`가 나고, 화면에는 아무것도 남지 않는다.

이 문제는 로그인 화면에만 국한되지 않는다 — `lib/constants.ts`의 `NAV_ITEMS`(대시보드/공고/뉴스/문서/퀴즈/설정 사이드바 메뉴)를 포함해 앱 전역에서 `<Link href="/jobs">`, `router.push("/settings")`처럼 **절대경로 기반 내비게이션을 광범위하게 사용**하고 있어서, 사실상 로그인 이후 어떤 메뉴를 눌러도 동일하게 깨질 구조였다.

**해결**: `file://`로 직접 여는 대신, Electron의 커스텀 프로토콜(`protocol.handle`)로 `out/`을 서빙해 `app://app/`이라는 정식 origin을 만들어준다. 이렇게 하면 절대경로가 "드라이브 루트"가 아니라 "앱 루트" 기준으로 정상 해석된다.

```ts
// app이 ready 되기 전에 호출해야 함 (모듈 최상단)
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

// app.whenReady() 안, createWindow() 이전에 등록
function registerAppProtocol() {
  protocol.handle("app", async (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "" || pathname.endsWith("/")) pathname += "index.html";
    const filePath = path.join(__dirname, "../../out", pathname);
    try {
      const data = await readFile(filePath); // Node fs — asar 가상 경로를 투명하게 읽음
      return new Response(data, { headers: { "content-type": MIME_TYPES[path.extname(filePath)] ?? "application/octet-stream" } });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  });
}

win.loadURL(process.env.NODE_ENV === "development" ? devUrl : "app://app/");
```

**주의**: `net.fetch(pathToFileURL(filePath))`로 구현하면 안 된다 — asar 내부 경로는 Chromium의 네트워크 스택(`net.fetch`)이 직접 이해하지 못해 asar 안의 모든 파일에 대해 `ERR_FILE_NOT_FOUND`가 난다. asar 가상 파일시스템을 투명하게 처리하는 Node의 `fs.readFile`로 직접 읽어 `Response` 객체를 만들어 반환해야 한다.

---

## 5. 비로그인 상태에서 무한 로딩 (`next dev`에서 `/login`으로 리다이렉트 안 됨)

**증상**: `npm run dev`(Next dev 서버 + Electron)로 비로그인 상태에서 앱을 실행하면 `/login`으로 리다이렉트되지 않고 메인 화면(대시보드)에서 로딩 스켈레톤이 무한히 유지됨.

**처음 의심했던 가설(부분적으로만 맞음)**: `providers/auth-provider.tsx`의 `supabase.auth.getSession().then(...)`에 `.catch`가 없어서, 세션 조회가 실패하면 `isLoading`이 영구히 `true`로 남아 `components/auth/auth-guard.tsx`의 `if (isLoading) return` 가드에 걸려 리다이렉트 자체가 실행되지 않는다는 가설. 실제로 이 코드에는 에러 처리가 빠져 있었고 방어 코드로서 고칠 가치는 있었지만(아래 참고), **Playwright로 콘솔/네트워크를 직접 캡처해보니 이것이 이번 증상의 진짜 원인은 아니었다** — `getSession()`은 로컬 스토리지만 읽어 정상적으로 resolve됐고, `isLoading`도 정상적으로 `false`가 됐다.

**실제 원인**: `next.config.ts`.
```ts
const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: "./",     // 상대경로 — 패키징(file://) 전용으로 추가한 설정
  trailingSlash: true,
};
```
이 설정은 원래 3번 항목(스타일 미적용) 문제를 고치기 위해 패키징된 `file://out/index.html` 빌드 전용으로 추가한 것인데, **`next dev`에도 그대로 적용되고 있었다.** `next dev`는 각 라우트를 실제 HTTP 경로로 서빙하므로:
1. `trailingSlash: true` 때문에 `/login` 접속 시 URL이 `/login/`이 된다.
2. `assetPrefix: "./"`(상대경로)로 내보낸 `<script src="./_next/static/...">`가 현재 URL(`/login/`) 기준으로 해석되어 `http://localhost:3000/login/_next/static/...`을 요청한다.
3. 실제 정적 자산은 사이트 루트(`http://localhost:3000/_next/...`)에만 존재하므로 **`/login` 페이지의 JS/CSS 청크가 전부 404**로 실패한다 (Playwright 콘솔에서 34개 에러로 직접 확인).
4. 루트(`/`)는 우연히 상대경로가 그대로 맞아떨어져 정상 로드되지만, `router.replace("/login")`으로 이동한 뒤에는 새 페이지의 스크립트가 전혀 로드되지 않아 화면이 죽은 채로 남는다 — 사용자 눈에는 "리다이렉트도 안 되고 무한 로딩만 계속되는" 것처럼 보인다.

**해결**: `next.config.ts`를 phase 기반 함수로 바꿔, `assetPrefix`/`trailingSlash`/`output: "export"`를 **`next build`(export) 때만** 적용하고 `next dev`에서는 적용하지 않는다.

```ts
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default (phase: string): NextConfig => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {};
  }

  return {
    output: "export",
    assetPrefix: "./",
    trailingSlash: true,
  };
};
```

Playwright로 재검증한 결과: 비로그인 상태로 `/`에 접속 → 콘솔 에러 0개 → `http://localhost:3000/login`으로 정상 리다이렉트되고 로그인 화면이 하이드레이션까지 정상 완료됨을 확인.

**부수적으로 함께 고친 것**: `providers/auth-provider.tsx`의 `getSession()`에도 `.catch` + `.finally(() => setIsLoading(false))`를 추가했다. 이번 증상의 직접 원인은 아니었지만, 세션 조회가 실패(네트워크 오류, 환경변수 누락 등)하는 경우에는 여전히 유효한 방어 코드다 — 이게 없으면 위 근본 원인과 별개로 동일한 무한 로딩이 재발할 수 있다.

```tsx
useEffect(() => {
  supabase.auth
    .getSession()
    .then(({ data }) => {
      setSession(data.session)
    })
    .catch((error) => {
      console.error("세션 조회 실패:", error)
      setSession(null)
    })
    .finally(() => {
      setIsLoading(false)
    })
  ...
```

**교훈**: 패키징(`file://`) 전용으로 추가한 `next.config.ts` 설정(`assetPrefix`, `trailingSlash`, `output: "export"`)은 `next dev`에도 무조건 적용된다는 점을 놓치기 쉽다. dev 서버와 프로덕션 export가 서로 다른 서빙 방식(HTTP 루트 vs 정적 파일)을 쓴다는 걸 감안해, 이런 설정은 `next/constants`의 `phase` 값으로 분기해야 한다.

---

## 검증 방법 (재발 시 참고)

렌더러에서 무슨 일이 일어나는지 보려면 `createWindow()`에서 임시로 아래를 추가하고 패키징된 exe를 실행해 stdout을 확인하면 된다(디버깅 후에는 반드시 제거).
```ts
win.webContents.on("console-message", (_e, level, message, line, sourceId) => {
  console.log("[renderer-console]", level, message, sourceId, line);
});
win.webContents.on("did-fail-load", (_e, code, desc, url) => {
  console.log("[did-fail-load]", code, desc, url);
});
```
이미 packaging된 `app.asar`를 patch해서 확인하면 **asar integrity 검증에 걸려 조용히 실패**하므로(출력이 아예 없음), 반드시 소스(`electron/main.ts`)를 수정하고 `npm run build` → `electron-builder --win --dir`로 다시 패키징한 뒤 확인해야 한다.

## 참고 자료

- `apps/desktop/electron/main.ts`, `apps/desktop/electron/preload.ts`
- `apps/desktop/next.config.ts`
- `docs/guides/electron-release-guide.md` — 빌드/배포 실행 절차
- `docs/deployment_research.md` — Electron 배포 원리 배경 설명
