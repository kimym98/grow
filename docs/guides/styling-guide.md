# 스타일링 & 디자인 시스템 가이드

이 문서는 기존의 `docs/design-system.md`(디자인 토큰 참조)와 `docs/guides/styling-guide.md`(스타일링 규칙/모범 사례)를 통합한 문서입니다. TailwindCSS v4 + shadcn/ui 기반 스타일링 규칙과, `apps/desktop/app/globals.css`에 정의된 디자인 토큰(색상/타이포/간격)·다크모드 사용법을 함께 다룹니다.

**이 문서는 코드를 변경하지 않으며, 토큰 실제 값의 출처는 항상 `apps/desktop/app/globals.css`입니다.** 토큰 값이 바뀌면 이 문서의 표도 함께 갱신해야 합니다.

## 🎨 기술 스택 개요

- **TailwindCSS v4**: 유틸리티 기반 CSS 프레임워크
- **shadcn/ui**: Radix UI 기반 컴포넌트 라이브러리 (new-york style)
- **next-themes**: 다크모드 지원
- **tw-animate-css**: 애니메이션 라이브러리
- **CSS Variables (OKLCH)**: 동적 테마 시스템
- **prettier-plugin-tailwindcss**: 자동 클래스 정렬

## 1. 색상 토큰

색상은 [OKLCH](https://oklch.com/) 색공간으로 정의되어 있으며, `:root`(라이트)와 `.dark`(다크) 블록에서 각각 값을 갖습니다. Tailwind에서는 `bg-primary`, `text-muted-foreground`처럼 `--color-*` 별칭(`app/globals.css`의 `@theme inline` 블록)을 통해 클래스로 사용합니다.

| 변수명 | 라이트 | 다크 | 용도 |
| --- | --- | --- | --- |
| `--background` / `--foreground` | `oklch(0.9751 0.0127 244.2507)` / `oklch(0.3729 0.0306 259.7328)` | `#121212` / `oklch(0.8717 0.0093 258.3382)` | 앱 전체 배경/기본 텍스트 |
| `--card` / `--card-foreground` | `oklch(1 0 0)` / `oklch(0.3729 0.0306 259.7328)` | `#121212` / `oklch(0.8717 0.0093 258.3382)` | 카드 배경/텍스트 |
| `--popover` / `--popover-foreground` | `oklch(1 0 0)` / `oklch(0.3729 0.0306 259.7328)` | `oklch(0.2795 0.0368 260.0310)` / `oklch(0.8717 0.0093 258.3382)` | 팝오버, 드롭다운 배경/텍스트 |
| `--primary` / `--primary-foreground` | `oklch(0.7227 0.1920 149.5793)` / `oklch(1 0 0)` | `oklch(0.7227 0.1920 149.5793)` / `oklch(0.2077 0.0398 265.7549)` | 주요 액션(버튼 default, 강조) |
| `--secondary` / `--secondary-foreground` | `oklch(0.9514 0.0250 236.8242)` / `oklch(0.4461 0.0263 256.8018)` | `oklch(0.3351 0.0331 260.9120)` / `oklch(0.7118 0.0129 286.0665)` | 보조 액션 |
| `--muted` / `--muted-foreground` | `oklch(0.9670 0.0029 264.5419)` / `oklch(0.5510 0.0234 264.3637)` | `oklch(0.2463 0.0275 259.9628)` / `oklch(0.5510 0.0234 264.3637)` | 비활성/보조 텍스트, 스켈레톤 배경 |
| `--accent` / `--accent-foreground` | `oklch(0.9505 0.0507 163.0508)` / `oklch(0.3729 0.0306 259.7328)` | `oklch(0.3729 0.0306 259.7328)` / `#ffffff` | hover/활성 상태 강조 |
| `--destructive` / `--destructive-foreground` | `oklch(0.6368 0.2078 25.3313)` / `oklch(1 0 0)` | `oklch(0.6368 0.2078 25.3313)` / `oklch(0.2077 0.0398 265.7549)` | 위험/에러(삭제, ErrorState 등) |
| `--border` / `--input` | `oklch(0.9276 0.0058 264.5313)` | `oklch(1 0 0 / 20%)` / `oklch(0.4461 0.0263 256.8018)` | 테두리, 인풋 보더 |
| `--ring` | `oklch(0.7227 0.1920 149.5793)` | `oklch(0.7729 0.1535 163.2231)` | focus-visible 링 |
| `--chart-1` ~ `--chart-5` | 녹색 계열 5단계 그라데이션 | 녹색 계열 5단계 그라데이션(다크용 재조정) | 차트/데이터 시각화용 팔레트 |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` | `--secondary` 계열과 연동 | `--card`/`--accent` 계열과 연동 (단, `--sidebar-accent-foreground`는 다크에서 `#ffffff` 고정) | 사이드바 전용 토큰(`components/layout/sidebar.tsx`) |

사용 예:

```tsx
<div className="bg-card text-card-foreground border-border" />
<Button variant="destructive" /> {/* bg-destructive/10 text-destructive */}
```

### 색상 사용 규칙

```tsx
// ✅ 시맨틱 색상 클래스 사용
<div className="bg-background border-border">
  <h1 className="text-foreground">메인 텍스트</h1>
  <p className="text-muted-foreground">보조 텍스트</p>
  <Button className="bg-primary text-primary-foreground">버튼</Button>
</div>

// ❌ 직접 색상 지정 / 하드코딩된 색상
<div className="bg-white border-gray-200 dark:bg-black dark:text-white">
  <h1 className="text-gray-900">메인 텍스트</h1>
  <p className="text-gray-600">보조 텍스트</p>
</div>
```

## 2. 타이포그래피

| 변수명 | 값 | 용도 |
| --- | --- | --- |
| `--font-sans` | `DM Sans, sans-serif` | 기본 본문 폰트 (`html`에 `font-sans` 적용) |
| `--font-heading` | `var(--font-sans)` | 제목용(현재는 본문과 동일 폰트) |
| `--font-serif` | `Lora, serif` | 강조/인용 등 세리프가 필요한 경우 |
| `--font-mono` | `IBM Plex Mono, monospace` | 코드/수치 표시 |

텍스트 크기는 별도 커스텀 스케일 없이 Tailwind 기본 스케일(`text-xs` ~ `text-2xl` 등)을 그대로 사용합니다. `typography.tsx` 컴포넌트가 있다면 우선 재사용하고, 없는 크기는 Tailwind 유틸리티로 직접 지정합니다.

## 3. 간격 / Radius 스케일

`--radius: 0.5rem`을 기준으로 아래와 같이 파생됩니다.

| 변수명 | 계산식 | 실제 값 | Tailwind 클래스 |
| --- | --- | --- | --- |
| `--radius-sm` | `radius * 0.6` | `0.3rem` | `rounded-sm` |
| `--radius-md` | `radius * 0.8` | `0.4rem` | `rounded-md` |
| `--radius-lg` | `radius` | `0.5rem` | `rounded-lg` |
| `--radius-xl` | `radius * 1.4` | `0.7rem` | `rounded-xl` |
| `--radius-2xl` | `radius * 1.8` | `0.9rem` | `rounded-2xl` |
| `--radius-3xl` | `radius * 2.2` | `1.1rem` | `rounded-3xl` |
| `--radius-4xl` | `radius * 2.6` | `1.3rem` | `rounded-4xl` |

간격(`padding`/`gap`/`margin`)은 별도 커스텀 스케일 없이 Tailwind 기본 spacing(`--spacing: 0.25rem` 배수, 예: `p-2`, `gap-4`)을 그대로 사용합니다. 그림자(`--shadow-2xs` ~ `--shadow-2xl`)도 Tailwind의 `shadow-*` 클래스로 매핑되어 있으므로 커스텀 box-shadow를 직접 작성하지 않습니다.

## 4. TailwindCSS v4 사용 규칙

### 기본 원칙

```tsx
// ✅ 올바른 Tailwind 클래스 사용
<div className="flex items-center justify-between rounded-lg bg-background p-4 shadow-md">
  <h2 className="text-lg font-semibold text-foreground">제목</h2>
  <Button variant="outline" size="sm">버튼</Button>
</div>

// ❌ 인라인 스타일 사용 금지
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ fontSize: '18px' }}>제목</h2>
</div>
```

### 클래스 작성 순서

Prettier 플러그인(`prettier-plugin-tailwindcss`)이 자동으로 정렬하지만, 수동 작성 시 다음 순서를 따릅니다.

```tsx
<div className={cn(
  // 1. 레이아웃 (display, position)
  "flex absolute",

  // 2. 크기 (width, height, padding, margin)
  "w-full h-auto p-4 m-2",

  // 3. 타이포그래피 (font, text)
  "text-lg font-medium text-center",

  // 4. 배경 및 테두리
  "bg-background border border-border rounded-md",

  // 5. 효과 (shadow, opacity, transform)
  "shadow-lg opacity-90 hover:scale-105",

  // 6. 상호작용 (hover, focus, active)
  "hover:bg-accent focus:ring-2 active:scale-95",

  // 조건부 클래스
  isActive && "bg-primary text-primary-foreground",
  className
)}>
```

### 반응형 디자인

```tsx
// ✅ 모바일 우선 접근법
<div className={cn(
  "flex flex-col space-y-4 p-4",              // 기본 (모바일)
  "md:flex-row md:space-y-0 md:space-x-6 md:p-6", // 태블릿 (768px+)
  "lg:max-w-6xl lg:mx-auto lg:p-8",            // 데스크톱 (1024px+)
  "xl:max-w-7xl"                                // 대형 화면 (1280px+)
)}>

// ❌ 데스크톱 우선 접근법 지양
<div className="hidden lg:block md:hidden">
```

### 커스텀 클래스 최소화

```tsx
// ✅ Tailwind 유틸리티 클래스 우선 사용
<button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">

// ❌ 커스텀 CSS 클래스 지양
<button className="custom-button">
```

## 5. shadcn/ui 컴포넌트 활용

### 기본 사용법

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline">프로필 보기</Button>
      </CardContent>
    </Card>
  );
}
```

### 컴포넌트 변형 (Variants)

```tsx
// Button 컴포넌트 변형
<Button variant="default">기본 버튼</Button>
<Button variant="destructive">삭제 버튼</Button>
<Button variant="outline">아웃라인 버튼</Button>
<Button variant="secondary">보조 버튼</Button>
<Button variant="ghost">고스트 버튼</Button>
<Button variant="link">링크 버튼</Button>

// 크기 변형
<Button size="default">기본 크기</Button>
<Button size="sm">작은 크기</Button>
<Button size="lg">큰 크기</Button>
<Button size="icon">아이콘만</Button>
```

### 컴포넌트 커스터마이징

```tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ✅ 기존 컴포넌트 확장
export function CustomButton({ className, ...props }) {
  return (
    <Button
      className={cn(
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
      {...props}
    />
  );
}

// ❌ 처음부터 새로 만들기 (긴 클래스 나열)
export function MyButton({ className, ...props }) {
  return <button className="bg-blue-500... px-4 py-2" {...props} />;
}
```

### 새 shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog

# 모든 컴포넌트 확인
npx shadcn@latest add
```

## 6. 다크모드

- `next-themes`의 `ThemeProvider`가 `app/layout.tsx`에서 `enableSystem`, `disableTransitionOnChange` 옵션과 함께 설정되어 있습니다.
- 다크모드는 `<html>` 요소에 `.dark` 클래스를 토글하는 방식이며, `globals.css`의 `@custom-variant dark (&:is(.dark *))` 선언으로 Tailwind의 `dark:` 접두사가 이 클래스 기준으로 동작합니다.
- 클라이언트 컴포넌트에서 테마를 읽거나 변경할 때는 `useTheme()` 훅을 사용합니다. 하이드레이션 불일치를 피하기 위해 `mounted` 상태로 최초 렌더를 가드하는 패턴을 따릅니다.

```tsx
// providers/theme-provider.tsx
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
```

```tsx
"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeAwareWidget() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>테마 전환</button>
}
```

참고 구현: `apps/desktop/components/layout/theme-toggle.tsx`

### 다크모드 대응 스타일링

```tsx
// ✅ 시맨틱 색상 변수 사용 (자동으로 다크모드 대응)
<div className="bg-background text-foreground">
  <h1 className="text-primary">제목</h1>
  <p className="text-muted-foreground">설명</p>
</div>

// ❌ 하드코딩된 색상 + 수동 dark: 분기
<div className="bg-white text-black dark:bg-black dark:text-white">
  <h1 className="text-blue-600 dark:text-blue-400">제목</h1>
</div>
```

## 7. 애니메이션 가이드

```tsx
import 'tw-animate-css'

// ✅ 내장 애니메이션 사용
<div className="animate-fadeIn">페이드 인</div>
<div className="animate-slideUp">슬라이드 업</div>

// ✅ Tailwind transition 활용
<button className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
  호버 효과
</button>
```

성능을 고려할 때는 `will-change`를 남발하지 말고 `hover:will-change-transform`처럼 상호작용 시점에만 적용해 렌더링 비용을 최소화합니다.

## 8. 반응형 디자인 패턴

```tsx
// ✅ 반응형 컨테이너
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">{/* 컨텐츠 */}</div>
</div>

// ✅ 그리드 레이아웃
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>

// ✅ 반응형 네비게이션 (모바일 메뉴 분리)
<nav className="flex items-center justify-between p-4">
  <div className="flex items-center space-x-4">
    <Logo />
    <div className="hidden md:flex md:space-x-6">
      <NavLink href="/about">소개</NavLink>
    </div>
  </div>
  <div className="md:hidden">
    <MobileMenu />
  </div>
</nav>
```

## 9. 유틸리티 함수와 조건부 스타일링

```tsx
import { cn } from '@/lib/utils'

// ✅ cn() 함수로 클래스 조합 (마지막에 className을 병합해 오버라이드 허용)
<Button
  className={cn(
    "base-button-styles",
    isLoading && "opacity-50 cursor-not-allowed",
    variant === 'destructive' && "bg-destructive text-destructive-foreground",
    size === 'sm' && "px-2 py-1 text-sm",
    className
  )}
  disabled={isLoading}
/>

// ❌ 수동 문자열 조합 / 중첩 삼항 연산자
<div className={`base-classes ${condition ? 'conditional-classes' : ''} ${className || ''}`}>
```

## 10. 컴포넌트 작성 규칙

새 컴포넌트를 추가하거나 기존 컴포넌트를 확장할 때는 다음 규칙을 지킵니다.

1. **커스텀 CSS 파일을 만들지 않는다.** 스타일은 Tailwind 유틸리티 클래스만 사용하고, 전역 스타일이 필요하면 `app/globals.css`에만 추가한다.
2. **클래스 병합은 항상 `cn()`을 사용한다.** (`lib/utils.ts`의 `cn = (...) => twMerge(clsx(inputs))`) `className` prop을 마지막에 병합해 호출부에서 오버라이드 가능하게 한다.
3. **변형(variant)이 필요한 컴포넌트는 `class-variance-authority`(`cva`)를 사용한다.** `components/ui/button.tsx`, `components/ui/tabs.tsx`가 참조 예시다.
4. **shadcn/ui 원자 컴포넌트는 `components/ui/`, 여러 원자를 조합한 상태/레이아웃 컴포넌트는 `components/common/`, 앱 레이아웃 전용 컴포넌트는 `components/layout/`에 둔다.**
5. **디자인 토큰(색상/간격/라운드)은 항상 이 문서의 변수와 Tailwind 클래스를 통해 참조하고, 색상 값을 하드코딩하지 않는다.**
6. **다크모드 대응은 별도 분기 없이 토큰 기반 클래스(`bg-card`, `text-muted-foreground` 등)로 자동 처리되도록 하고, 불가피하게 `dark:` 접두사가 필요한 경우에만 명시적으로 추가한다.**

## 🚫 금지사항

```tsx
// 인라인 스타일 사용
<div style={{ backgroundColor: 'red' }}>

// 긴 클래스명 하드코딩
<div className="w-full h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-2xl shadow-2xl rounded-lg border-4 border-white">

// 중복된 스타일 정의
<div className="p-4 padding-4 pt-4 pb-4 pl-4 pr-4">

// !important 남용
<div className="!text-red-500 !bg-blue-500">

// Tailwind와 CSS 모듈 혼재
<div className={`${styles.customClass} flex items-center`}>

// 하드코딩된 색상 / 다크모드 미고려 / 저대비
<div className="bg-gray-100 text-gray-900">
<div className="bg-white text-black">
<button className="bg-red-200 text-red-300">저대비 버튼</button>
```

## ✅ 스타일링 체크리스트

새 컴포넌트 작성 시 확인사항:

### 기본 사항

- [ ] TailwindCSS 유틸리티 클래스 우선 사용
- [ ] cn() 함수로 클래스 조합
- [ ] 시맨틱 색상 변수(토큰) 사용
- [ ] 반응형 디자인 적용

### 다크모드

- [ ] 다크모드 대응 색상 사용 (토큰 기반, 하드코딩 없음)
- [ ] 테마 전환 시 깨짐 없음

### 성능

- [ ] 불필요한 애니메이션 없음
- [ ] will-change 적절히 사용
- [ ] 인라인 스타일 없음

### 접근성

- [ ] 충분한 색상 대비
- [ ] 포커스 상태 스타일링 (`focus-visible:ring`)
- [ ] 스크린 리더 고려

### 유지보수

- [ ] 일관된 클래스 순서
- [ ] 재사용 가능한 컴포넌트 활용
- [ ] 의미있는 클래스 조합
