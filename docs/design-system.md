# 디자인 시스템 가이드

이 문서는 `apps/desktop/app/globals.css`에 이미 정의되어 있는 디자인 토큰(색상/타이포/간격)과 다크모드 사용법을 정리한 참조 가이드입니다. **이 문서는 코드를 변경하지 않으며, 실제 값의 출처는 항상 `apps/desktop/app/globals.css`입니다.** 토큰 값이 바뀌면 이 문서도 함께 갱신해야 합니다.

## 1. 색상 토큰

색상은 [OKLCH](https://oklch.com/) 색공간으로 정의되어 있으며, `:root`(라이트)와 `.dark`(다크) 블록에서 각각 값을 갖습니다. Tailwind에서는 `bg-primary`, `text-muted-foreground`처럼 `--color-*` 별칭(`app/globals.css`의 `@theme inline` 블록)을 통해 클래스로 사용합니다.

| 변수명 | 라이트 | 다크 | 용도 |
| --- | --- | --- | --- |
| `--background` / `--foreground` | `oklch(0.9751 0.0127 244.2507)` / `oklch(0.3729 0.0306 259.7328)` | `oklch(0.2077 0.0398 265.7549)` / `oklch(0.8717 0.0093 258.3382)` | 앱 전체 배경/기본 텍스트 |
| `--card` / `--card-foreground` | `oklch(1 0 0)` / `oklch(0.3729 0.0306 259.7328)` | `oklch(0.2795 0.0368 260.0310)` / `oklch(0.8717 0.0093 258.3382)` | 카드 배경/텍스트 |
| `--popover` / `--popover-foreground` | `oklch(1 0 0)` / `oklch(0.3729 0.0306 259.7328)` | `oklch(0.2795 0.0368 260.0310)` / `oklch(0.8717 0.0093 258.3382)` | 팝오버, 드롭다운 배경/텍스트 |
| `--primary` / `--primary-foreground` | `oklch(0.7227 0.1920 149.5793)` / `oklch(1 0 0)` | `oklch(0.7729 0.1535 163.2231)` / `oklch(0.2077 0.0398 265.7549)` | 주요 액션(버튼 default, 강조) |
| `--secondary` / `--secondary-foreground` | `oklch(0.9514 0.0250 236.8242)` / `oklch(0.4461 0.0263 256.8018)` | `oklch(0.3351 0.0331 260.9120)` / `oklch(0.7118 0.0129 286.0665)` | 보조 액션 |
| `--muted` / `--muted-foreground` | `oklch(0.9670 0.0029 264.5419)` / `oklch(0.5510 0.0234 264.3637)` | `oklch(0.2463 0.0275 259.9628)` / `oklch(0.5510 0.0234 264.3637)` | 비활성/보조 텍스트, 스켈레톤 배경 |
| `--accent` / `--accent-foreground` | `oklch(0.9505 0.0507 163.0508)` / `oklch(0.3729 0.0306 259.7328)` | `oklch(0.3729 0.0306 259.7328)` / `oklch(0.7118 0.0129 286.0665)` | hover/활성 상태 강조 |
| `--destructive` / `--destructive-foreground` | `oklch(0.6368 0.2078 25.3313)` / `oklch(1 0 0)` | `oklch(0.6368 0.2078 25.3313)` / `oklch(0.2077 0.0398 265.7549)` | 위험/에러(삭제, ErrorState 등) |
| `--border` / `--input` | `oklch(0.9276 0.0058 264.5313)` | `oklch(0.4461 0.0263 256.8018)` | 테두리, 인풋 보더 |
| `--ring` | `oklch(0.7227 0.1920 149.5793)` | `oklch(0.7729 0.1535 163.2231)` | focus-visible 링 |
| `--chart-1` ~ `--chart-5` | 녹색 계열 5단계 그라데이션 | 녹색 계열 5단계 그라데이션(다크용 재조정) | 차트/데이터 시각화용 팔레트 |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` | `--secondary` 계열과 연동 | `--card` 계열과 연동 | 사이드바 전용 토큰(`components/layout/sidebar.tsx`) |

사용 예:

```tsx
<div className="bg-card text-card-foreground border-border" />
<Button variant="destructive" /> {/* bg-destructive/10 text-destructive */}
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

## 4. 다크모드

- `next-themes`의 `ThemeProvider`가 `app/layout.tsx`에서 `enableSystem`, `disableTransitionOnChange` 옵션과 함께 설정되어 있습니다.
- 다크모드는 `<html>` 요소에 `.dark` 클래스를 토글하는 방식이며, `globals.css`의 `@custom-variant dark (&:is(.dark *))` 선언으로 Tailwind의 `dark:` 접두사가 이 클래스 기준으로 동작합니다.
- 클라이언트 컴포넌트에서 테마를 읽거나 변경할 때는 `useTheme()` 훅을 사용합니다. 하이드레이션 불일치를 피하기 위해 `mounted` 상태로 최초 렌더를 가드하는 패턴을 따릅니다.

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

## 5. 컴포넌트 작성 규칙

새 컴포넌트를 추가하거나 기존 컴포넌트를 확장할 때는 다음 규칙을 지킵니다.

1. **커스텀 CSS 파일을 만들지 않는다.** 스타일은 Tailwind 유틸리티 클래스만 사용하고, 전역 스타일이 필요하면 `app/globals.css`에만 추가한다.
2. **클래스 병합은 항상 `cn()`을 사용한다.** (`lib/utils.ts`의 `cn = (...) => twMerge(clsx(inputs))`) `className` prop을 마지막에 병합해 호출부에서 오버라이드 가능하게 한다.
3. **변형(variant)이 필요한 컴포넌트는 `class-variance-authority`(`cva`)를 사용한다.** `components/ui/button.tsx`, `components/ui/tabs.tsx`가 참조 예시다.
4. **shadcn/ui 원자 컴포넌트는 `components/ui/`, 여러 원자를 조합한 상태/레이아웃 컴포넌트는 `components/common/`, 앱 레이아웃 전용 컴포넌트는 `components/layout/`에 둔다.**
5. **디자인 토큰(색상/간격/라운드)은 항상 이 문서의 변수와 Tailwind 클래스를 통해 참조하고, 색상 값을 하드코딩하지 않는다.**
6. **다크모드 대응은 별도 분기 없이 토큰 기반 클래스(`bg-card`, `text-muted-foreground` 등)로 자동 처리되도록 하고, 불가피하게 `dark:` 접두사가 필요한 경우에만 명시적으로 추가한다.**
