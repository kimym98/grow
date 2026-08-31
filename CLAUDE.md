# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js 16 기반의 마케팅/랜딩 페이지 프로젝트입니다. 다크모드 지원, shadcn/ui 컴포넌트, Tailwind CSS를 활용합니다.

## 주요 명령어

```bash
npm run dev       # 개발 서버 실행 (localhost:3000)
npm run build     # 프로덕션 빌드
npm run start     # 빌드된 앱 실행
npm run lint      # ESLint 검사
```

## 프로젝트 구조

### Pages (App Router)

- `app/page.tsx` - 홈페이지 (Hero, Features, Stats, CTA, FAQ 섹션)
- `app/docs/page.tsx` - 문서
- `app/about/page.tsx` - 소개
- `app/blog/page.tsx` - 블로그
- `app/contact/page.tsx` - 연락처

### Components 구조

```
components/
├── ui/           # shadcn/ui 컴포넌트 (button, card, input 등)
├── layout/       # 재사용 레이아웃 (header, footer, theme-toggle)
└── sections/     # 페이지 섹션 컴포넌트 (hero, features, stats, cta, faq)
```

### Utilities

- `lib/utils.ts` - 유틸리티 함수 (cn(), clsx + tailwind-merge)
- `lib/constants.ts` - 사이트 설정 (SITE_CONFIG)
- `lib/validators.ts` - Zod 스키마
- `lib/format.ts` - 포맷팅 함수
- `lib/string.ts` - 문자열 처리 함수

## 아키텍처 패턴

### 테마 시스템

- `next-themes` + `ThemeProvider`로 다크모드 구현
- `app/layout.tsx`에서 `enableSystem`, `disableTransitionOnChange` 설정
- 클라이언트 컴포넌트에서 `useTheme()` 훅 사용

### 섹션 기반 홈페이지

- 각 섹션은 독립적인 컴포넌트로 분리
- 페이지에서 섹션들을 조합하여 구성
- 섹션 재사용 가능하도록 설계

### UI 컴포넌트

- shadcn/ui 기반 컴포넌트들
- Tailwind CSS + CVA (class-variance-authority)로 스타일링
- `cn()` 함수로 클래스 병합 (tailwind-merge 사용)

## 개발 가이드라인

### 새 컴포넌트 생성

1. `components/` 폴더에 적절한 카테고리 선택 (ui, layout, sections)
2. `.tsx` 파일로 컴포넌트 작성
3. 클라이언트 전용 기능은 `"use client"` 지시어 추가
4. shadcn/ui 컴포넌트 재사용 최우선

### 새 페이지 추가

1. `app/` 폴더에 `[name]/page.tsx` 생성
2. 레이아웃은 자동 상속 (app/layout.tsx)
3. 페이지는 서버 컴포넌트 기본값 (필요시 "use client" 추가)

### 유효성 검사

- Zod 스키마를 `lib/validators.ts`에 정의
- 폼에서 React Hook Form + Zod 조합 사용

### 스타일링

- 모든 스타일은 Tailwind CSS 사용
- 컴포넌트별 별도 CSS 파일 없음 (globals.css만 사용)
- 동적 스타일은 CVA 또는 조건부 className 사용

### 경로 별칭

- `@/*` = 프로젝트 루트
- `@/components`, `@/lib` 등으로 import

## 상세 가이드 문서

더 자세한 규칙과 패턴은 `docs/guides/` 하위 문서를 참고하세요.

- [프로젝트 구조 가이드](docs/guides/project-structure.md) - 폴더 구조, 파일 조직, 네이밍 컨벤션
- [Next.js 16 개발 지침](docs/guides/nextjs-16.md) - App Router 아키텍처 및 핵심 규칙
- [컴포넌트 패턴 가이드](docs/guides/component-patterns.md) - 재사용 가능한 컴포넌트 작성 패턴
- [스타일링 & 디자인 시스템 가이드](docs/guides/styling-guide.md) - Tailwind CSS 토큰, 다크모드
- [React Hook Form + Zod 가이드](docs/guides/forms-react-hook-form.md) - Server Actions 포함 폼 처리 패턴
- [Electron 데스크탑 앱 배포 가이드](docs/guides/electron-release-guide.md) - 빌드 및 릴리스 실행 절차
- [DB 스키마 마이그레이션 가이드](docs/guides/database-migrations.md) - Supabase 마이그레이션 파일 생성부터 원격 반영까지 절차

## 주의사항

- 기본 언어는 한국어 (layout.tsx에서 `lang="ko"`)
- 모든 페이지는 Header + main + Footer 구조 자동 적용
- Toaster 컴포넌트는 layout.tsx에서 한 번만 정의
- ThemeProvider는 필수 (다크모드 지원)
- 모든 문서 및 마크다운 파일은 한국어로 작성

## 의존성 특징

- `sonner`: 토스트 알림 표시
- `radix-ui`: 접근성 좋은 UI 원시 요소
- `clsx + tailwind-merge`: className 병합 유틸
- `date-fns`: 날짜 포맷팅
- `lucide-react`: 아이콘 라이브러리

## 실행 전 고려 사항

- 질문에 대한 추측이나 추론은 하지 않고 모호한 부분은 다시 질문
- 수정 사항이 많다면 질문 후 수정한다
