# AI Agent 개발 표준 (grow 프로젝트)

## 프로젝트 개요

- npm workspaces 모노레포: `apps/desktop`(Next.js 16 App Router + React 19 랜딩 페이지 + Electron), `apps/mobile`(placeholder, Task 016 예정), `packages/shared`(공용 코드)
- shadcn/ui(style: `radix-nova`, baseColor: `neutral`) + Tailwind CSS v4
- Zod로 유효성 검사, React Hook Form과 조합
- 다크모드: `next-themes`

## 디렉토리 규칙 (파일 배치 결정 트리)

- 새 페이지 → `apps/desktop/app/[route]/page.tsx` 생성. `apps/desktop/app/layout.tsx`가 Header+main+Footer+ThemeProvider+Toaster를 이미 감싸므로 페이지 파일에서 다시 감싸지 말 것.
- 홈페이지 섹션(Hero, Features, Stats, CTA, FAQ 유형) → `apps/desktop/components/sections/*.tsx`
- 헤더/푸터/전역 내비게이션류 → `apps/desktop/components/layout/*.tsx`
- shadcn/ui 원자 컴포넌트(button, card, input 등) → `apps/desktop/components/ui/*.tsx`만. 비즈니스 로직을 이 폴더에 넣지 말 것.
- 순수 유틸 함수 → `apps/desktop/lib/*.ts` (예: 포맷팅은 `lib/format.ts`, 문자열 처리는 `lib/string.ts`)
- Zod 스키마 → 반드시 `apps/desktop/lib/validators.ts`에 추가/수정. 컴포넌트 파일 내부에 인라인 스키마를 새로 만들지 말 것.
- 사이트 전역 설정(이름, 설명, nav, footer 링크) → `apps/desktop/lib/constants.ts`의 `SITE_CONFIG`, `NAV_ITEMS`, `FOOTER_LINKS`에서만 관리. 다른 곳에 하드코딩 금지.
- 공용 TypeScript 타입 → `apps/desktop/types/index.ts`
- shadcn/ui 신규 컴포넌트 추가 시 `apps/desktop/components.json`의 alias(`@/components`, `@/lib`, `@/components/ui`, `@/hooks`)를 그대로 사용.
- 여러 워크스페이스(apps/desktop, apps/mobile)에서 공유해야 하는 코드만 `packages/shared/src/*`에 두고, `@shared/*` 별칭(apps/desktop에서 `packages/shared/src`를 가리킴)으로 import. 단일 앱에서만 쓰는 코드를 shared로 옮기지 말 것.
- Electron 메인/프리로드 코드 → `apps/desktop/electron/*.ts`. Next.js 렌더러 코드(`app/`, `components/` 등)와 별도 도메인으로 취급.

## 코드 작성 규칙

- 모든 신규 컴포넌트 파일은 `.tsx`.
- 클라이언트 훅(`useState`, `useTheme`, 이벤트 핸들러 등) 사용 시에만 파일 최상단에 `"use client"` 추가. 그 외는 서버 컴포넌트로 유지.
- 클래스 병합은 항상 `cn()` (`apps/desktop/lib/utils.ts`, `clsx` + `tailwind-merge`) 사용. `className` 문자열 직접 이어붙이기 금지.
- 컴포넌트별 개별 CSS 파일 생성 금지 — 전역 스타일 변경은 `apps/desktop/app/globals.css`만 수정.
- import 경로는 항상 `@/` 별칭 사용 (`@/components`, `@/lib`, `@/types` 등, apps/desktop 내부 기준). 워크스페이스 간 공유 코드는 `@shared/*` 별칭 사용. 상대경로(`../../`) 다단계 사용 금지.
- 폼 구현 시 React Hook Form + `apps/desktop/lib/validators.ts`의 Zod 스키마 조합 사용. 새 유효성 검사 규칙은 `lib/validators.ts`에 먼저 추가 후 폼에서 import.
- 주석은 한국어로만 작성 (CLAUDE.md 규정과 동일).

## 다중 파일 연동 규칙

- `apps/desktop/app/layout.tsx` 수정 시 (예: Provider 추가) → `ThemeProvider`/`Toaster` 중복 선언 여부를 반드시 확인. Toaster는 `apps/desktop/app/layout.tsx`에서 한 번만 존재해야 함.
- 새 nav 항목 추가 시 → `apps/desktop/lib/constants.ts`의 `NAV_ITEMS` 수정과 동시에 `apps/desktop/components/layout/header.tsx`, `apps/desktop/components/layout/mobile-menu.tsx`가 해당 배열을 그대로 렌더링하는지 확인(하드코딩된 메뉴 추가 금지).
- 새 footer 링크 추가 시 → `apps/desktop/lib/constants.ts`의 `FOOTER_LINKS` 수정과 `apps/desktop/components/layout/footer.tsx` 렌더링 로직을 함께 확인.
- 신규 페이지(`apps/desktop/app/[name]/page.tsx`) 추가 시 → 해당 페이지로 연결되는 링크가 필요하면 `NAV_ITEMS` 또는 `FOOTER_LINKS`도 함께 갱신.
- shadcn/ui 컴포넌트를 신규 추가할 때 `apps/desktop/components.json`의 `style`/`baseColor`/`cssVariables` 설정과 충돌하는 별도 테마 파일을 만들지 말 것.

## 금지 사항

- `apps/desktop/app/page.tsx` 등 페이지 파일에서 `<Header>`/`<Footer>`/`<ThemeProvider>`를 직접 import해 재선언하지 말 것 (레이아웃에서 자동 상속됨).
- 사이트명/설명/URL 등을 컴포넌트에 직접 문자열로 하드코딩하지 말 것 — 반드시 `SITE_CONFIG` 참조.
- 컴포넌트 스타일링에 인라인 `style` 속성이나 별도 `.css`/`.module.css` 파일 사용 금지 — Tailwind 유틸리티 클래스만 사용.
- 순환 참조를 유발하는 상호 import 금지 (`apps/desktop/components/sections` ↔ `apps/desktop/components/layout` 간 상호 참조 금지, 단방향으로만 구성: layout/sections → ui).
- Electron 메인/프리로드 코드(`apps/desktop/electron/*`)와 Next.js 렌더러 코드(`apps/desktop/app/`, `apps/desktop/components/` 등) 간 직접 import 금지. 렌더러는 반드시 `preload.ts`가 `contextBridge`로 노출한 `window.electronAPI`를 통해서만 Electron 기능과 통신할 것.
- `docs/` 하위 문서(`docs/prd.md`, `docs/ROADMAP.md`, `docs/guides/*.md`) 및 프로젝트 내 모든 `.md` 파일은 한국어로만 작성.
