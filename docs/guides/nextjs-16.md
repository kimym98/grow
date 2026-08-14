# Next.js 16 개발 지침

이 문서는 Claude Code에서 Next.js 16 프로젝트를 개발할 때 따라야 할 핵심 규칙과 가이드라인을 제공합니다.

> **⚠️ 사전 요구사항**: Next.js 16은 **Node.js 20.9+**, **TypeScript 5.1+**, Chrome/Edge/Firefox 111+, Safari 16.4+ 를 요구합니다. Node.js 18 지원은 완전히 종료되었습니다.
>
> **업그레이드 명령어**
>
> ```bash
> # 자동 업그레이드 CLI (권장)
> npx @next/codemod@canary upgrade latest
>
> # 수동 업그레이드
> npm install next@latest react@latest react-dom@latest
> ```

## 🚀 필수 규칙 (엄격 준수)

### App Router 아키텍처

```typescript
// ✅ 올바른 방법: App Router 사용
app/
├── layout.tsx          // 루트 레이아웃
├── page.tsx           // 메인 페이지
├── loading.tsx        // 로딩 UI
├── error.tsx          // 에러 UI
├── not-found.tsx      // 404 페이지
└── dashboard/
    ├── layout.tsx     // 대시보드 레이아웃
    └── page.tsx       // 대시보드 페이지

// ❌ 금지: Pages Router 사용
pages/
├── index.tsx
└── dashboard.tsx
```

### Server Components 우선 설계

```typescript
// 🚀 필수: 기본적으로 모든 컴포넌트는 Server Components
export default async function UserDashboard() {
  // 서버에서 데이터 가져오기
  const user = await getUser()

  return (
    <div>
      <h1>{user.name}님의 대시보드</h1>
      {/* 클라이언트 컴포넌트가 필요한 경우에만 분리 */}
      <InteractiveChart data={user.analytics} />
    </div>
  )
}

// ✅ 클라이언트 컴포넌트는 최소한으로 사용
'use client'

import { useState } from 'react'

export function InteractiveChart({ data }: { data: Analytics[] }) {
  const [selectedRange, setSelectedRange] = useState('week')
  // 상호작용 로직만 클라이언트에서 처리
  return <Chart data={data} range={selectedRange} />
}
```

### async request APIs 완전 강제화

Next.js 15에서 도입된 비동기 요청 API가 16에서는 **동기 접근이 완전히 제거**되었습니다. `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` 는 반드시 `await` 해야 합니다.

```typescript
import { cookies, headers } from 'next/headers'

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // 🚀 필수: async request APIs 올바른 처리
  const { id } = await params
  const query = await searchParams
  const cookieStore = await cookies()
  const headersList = await headers()

  const user = await getUser(id)

  return <UserProfile user={user} />
}

// ❌ 금지: 동기식 접근 (16.x에서 완전히 제거됨, 빌드/런타임 에러 발생)
export default function Page({ params }: { params: { id: string } }) {
  const user = getUser(params.id)
  return <UserProfile user={user} />
}
```

### 🔄 New: 전역 타입 헬퍼 (PageProps / LayoutProps / RouteContext)

`typedRoutes`가 정식(stable) 기능이 되면서, Next.js가 파일 구조를 기반으로 `PageProps`, `LayoutProps`, `RouteContext` 전역 타입을 **자동 생성**합니다. 별도 import 없이 라우트 경로만 제네릭으로 넘기면 됩니다.

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true, // ✅ 정식 기능 (이전에는 experimental.typedRoutes)
};

export default nextConfig;
```

```typescript
// ✅ 임포트 없이 바로 사용 가능한 전역 타입
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
  return <h1>Blog: {slug}</h1>
}

export default function DashboardLayout(props: LayoutProps<'/dashboard'>) {
  return (
    <>
      {props.children}
      {props.analytics}
      {props.team}
    </>
  )
}
```

라우트 타입만 갱신하려면 개발 서버 없이 다음 CLI를 사용할 수 있습니다.

```bash
npx next typegen
```

### Typed Routes 활용

```typescript
// 🚀 필수: Typed Routes로 타입 안전성 보장
import Link from 'next/link'

export function Navigation() {
  return (
    <nav>
      {/* ✅ 타입 안전한 링크 */}
      <Link href="/dashboard/users/123">사용자 상세</Link>
      <Link href={{
        pathname: '/products/[id]',
        params: { id: 'abc' }
      }}>제품 상세</Link>

      {/* ❌ 컴파일 에러: 존재하지 않는 경로 */}
      <Link href="/nonexistent-route">잘못된 링크</Link>
    </nav>
  )
}
```

## ✅ 권장 사항 (성능 최적화)

### Streaming과 Suspense 활용

```typescript
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>대시보드</h1>

      {/* ✅ 빠른 컨텐츠는 즉시 렌더링 */}
      <QuickStats />

      {/* ✅ 느린 컨텐츠는 Suspense로 감싸기 */}
      <Suspense fallback={<SkeletonChart />}>
        <SlowChart />
      </Suspense>

      <Suspense fallback={<SkeletonTable />}>
        <SlowDataTable />
      </Suspense>
    </div>
  )
}

async function SlowChart() {
  await new Promise(resolve => setTimeout(resolve, 2000))
  const data = await getComplexAnalytics()

  return <Chart data={data} />
}
```

### after() API 활용 (안정화 유지)

```typescript
import { after } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const result = await processUserData(body);

  // 🔄 비블로킹 작업은 after()로 처리
  after(async () => {
    await sendAnalytics(result);
    await updateCache(result.id);
    await sendNotification(result.userId);
  });

  return Response.json({ success: true, id: result.id });
}
```

### 🔄 New: Cache Components + `"use cache"` — 캐싱 모델의 핵심 변화

Next.js 16의 가장 큰 아키텍처 변화입니다. **이전 버전(15 이하)에서 존재했던 암묵적(implicit) 캐싱이 완전히 사라졌습니다.** 이제 `"use cache"` 지시어를 명시적으로 붙이지 않는 한 어떤 페이지·레이아웃·API 라우트의 동적 코드도 기본적으로 매 요청마다 서버에서 실행됩니다.

```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true, // ✅ 신규 옵션 (기존 experimental.dynamicIO / experimental.ppr 대체)
};

export default nextConfig;
```

```typescript
// ✅ 함수/컴포넌트 단위로 명시적 캐싱
async function getProduct(id: string) {
  'use cache'
  const data = await db.products.findUnique({ where: { id } })
  return data
}

export default async function ProductPage({ id }: { id: string }) {
  const product = await getProduct(id)
  return <ProductDetail product={product} />
}
```

> ⚠️ **마이그레이션 주의**: 15에서 암묵적 캐싱에 의존하던 Server Component나 데이터 함수는 16으로 업그레이드 후 **기본적으로 캐시되지 않고 매 요청마다 실행**됩니다. API 호출량이 급증할 수 있으니 데이터 페칭 레이어를 반드시 감사(audit)하고, 캐시가 필요한 지점에 `"use cache"`를 명시적으로 추가하세요.

### 🔄 New: 캐시 무효화 API 3종 — `revalidateTag()` / `updateTag()` / `refresh()`

`revalidateTag()`의 시그니처가 변경되어 이제 `cacheLife` 프로필을 **두 번째 인자로 필수** 요구합니다. 또한 읽기-쓰기 일관성이 필요한 경우를 위한 `updateTag()`, 캐시와 무관한 데이터 새로고침을 위한 `refresh()`가 새로 추가되었습니다.

```typescript
import { revalidateTag } from "next/cache";

// ✅ built-in cacheLife 프로필 사용 (대부분의 경우 'max' 권장)
revalidateTag("products", "max");
revalidateTag("news-feed", "hours");

// 또는 커스텀 만료 시간
revalidateTag("products", { expire: 3600 });

// ⚠️ Deprecated: 단일 인자 형태는 더 이상 사용하지 마세요
// revalidateTag('products')
```

```typescript
"use server";

import { updateTag } from "next/cache";

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile);

  // 🔄 New: 캐시를 즉시 만료시키고 같은 요청 안에서 최신 데이터를 읽음 (read-your-writes)
  updateTag(`user-${userId}`);
}
```

```typescript
"use server";

import { refresh } from "next/cache";

export async function markNotificationAsRead(notificationId: string) {
  await db.notifications.markAsRead(notificationId);

  // 🔄 New: 캐시되지 않은 데이터만 새로고침 (캐시 자체는 건드리지 않음)
  refresh();
}
```

| API                           | 용도               | 특징                                            |
| ----------------------------- | ------------------ | ----------------------------------------------- |
| `revalidateTag(tag, profile)` | 정적 콘텐츠 무효화 | stale-while-revalidate, 즉시 최신 데이터 보장 X |
| `updateTag(tag)`              | Server Action 전용 | read-your-writes, 같은 요청 내 즉시 반영        |
| `refresh()`                   | Server Action 전용 | 캐시되지 않은 데이터만 새로고침                 |

### Turbopack — 이제 기본 번들러 (stable)

Next.js 16부터 **Turbopack이 모든 신규 프로젝트의 기본 번들러**입니다. Webpack 대비 빌드 2–5배, Fast Refresh 최대 10배 빠릅니다. 설정도 `experimental.turbo`에서 최상위 `turbopack` 키로 이동했습니다.

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ 최상위 turbopack 설정 (experimental.turbo는 제거됨)
  turbopack: {
    rules: {
      "*.module.css": {
        loaders: ["css-loader"],
        as: "css",
      },
    },
  },
  // ✅ 패키지 import 최적화 (여전히 experimental)
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "lodash-es",
    ],
    // 🔄 New: 파일시스템 캐싱(beta) — 대형 프로젝트의 재시작/컴파일 속도 대폭 개선
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
```

기존 Webpack 설정을 유지해야 한다면 명시적으로 옵트아웃할 수 있습니다.

```bash
next dev --webpack
next build --webpack
```

### React Compiler 지원 (stable)

React Compiler 1.0 릴리스에 맞춰 `reactCompiler` 옵션이 `experimental`에서 정식 옵션으로 승격되었습니다. 기본값은 여전히 비활성화이며, Babel 기반이라 활성화 시 컴파일 시간이 늘어날 수 있습니다.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
```

```bash
npm install babel-plugin-react-compiler@latest
```

## ⚠️ Breaking Changes 대응

### React 19.2 호환성

App Router가 React Canary 채널의 React 19.2 기능을 사용합니다. View Transitions, `useEffectEvent`, `<Activity />` 등이 새로 포함되었습니다.

```typescript
// ✅ 새로운 방식: useFormStatus 훅
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? '제출 중...' : '제출'}
    </button>
  )
}

// ✅ Server Actions와 form 통합
export async function createUser(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const email = formData.get('email') as string

  await saveUser({ name, email })
  redirect('/users')
}

export default function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <SubmitButton />
    </form>
  )
}
```

```typescript
// 🔄 New: useEffectEvent — Effect에서 비반응형 로직 분리
"use client";

import { useEffectEvent, useEffect } from "react";

function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected!", theme); // theme은 항상 최신 값을 참조
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", onConnected);
    return () => connection.disconnect();
  }, [roomId]); // theme을 의존성 배열에 넣지 않아도 됨
}
```

### 🔄 New: `middleware.ts` → `proxy.ts` 이름 변경 (중요)

Next.js 16에서 `middleware.ts`가 **`proxy.ts`로 이름이 바뀌었습니다.** 네트워크 경계를 더 명확히 표현하기 위함이며, `proxy.ts`는 Node.js 런타임에서만 동작합니다. 로직 자체는 동일하게 유지하면 됩니다.

```typescript
// proxy.ts (기존 middleware.ts)
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

// 🔄 New: 함수 이름도 middleware → proxy 로 변경
export default function proxy(request: NextRequest) {
  // 🔄 Node.js Runtime이 기본이므로 Node.js API 사용 가능
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256");

  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

> **⚠️ 마이그레이션**: `middleware.ts` 파일은 Edge Runtime이 꼭 필요한 경우를 위해 당분간 남아있지만 **deprecated**되었고 향후 버전에서 완전히 제거될 예정입니다. 가능한 한 빨리 `proxy.ts`로 이름과 export 함수명을 함께 변경하세요.

### 🔄 New: unauthorized/forbidden API

```typescript
// app/api/admin/route.ts
import { unauthorized, forbidden } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request);

  if (!session) {
    return unauthorized();
  }

  if (!session.user.isAdmin) {
    return forbidden();
  }

  const data = await getAdminData();
  return Response.json(data);
}
```

### next/image 설정 기본값 변경 (보안 강화)

이미지 최적화 관련 다수의 기본값이 보안 및 성능 목적으로 변경되었습니다.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    // 🔄 변경: 60초 → 4시간(14400s). cache-control 헤더가 없는 이미지의 재검증 비용 절감
    minimumCacheTTL: 14400,

    // 🔄 변경: 기본 imageSizes에서 16 제거 (전체 사용률 4.2%에 불과했음)
    imageSizes: [32, 48, 64, 96, 128, 256, 384],

    // 🔄 변경: 기본 quality가 [1..100] → [75] 로 축소. quality prop은 가장 가까운 값으로 보정됨
    qualities: [75],

    // 🔄 New: 로컬 IP 최적화가 기본적으로 차단됨. 사설 네트워크에서만 true로 설정
    dangerouslyAllowLocalIP: false,

    // 🔄 변경: 무제한 → 최대 3회 리다이렉트. 0으로 설정 시 비활성화
    maximumRedirects: 3,

    // ⚠️ Deprecated: domains 대신 remotePatterns 사용
    remotePatterns: [{ protocol: "https", hostname: "cdn.example.com" }],

    // 🔄 New: 쿼리 스트링이 붙은 로컬 src를 쓰려면 localPatterns 설정이 필수 (열거 공격 방지)
    localPatterns: [{ pathname: "/assets/**", search: "" }],
  },
};

export default nextConfig;
```

### `revalidateTag()` 시그니처 변경 (재확인)

```typescript
// ❌ Deprecated: 단일 인자 형태
revalidateTag(`product-${id}`);

// ✅ 필수: cacheLife 프로필을 두 번째 인자로 전달
revalidateTag(`product-${id}`, "max");
revalidateTag("products", "max");
```

## 🔄 New Features 활용

### Route Groups 고급 패턴

```typescript
// ✅ Route Groups로 레이아웃 분리
app/
├── (marketing)/
│   ├── layout.tsx     // 마케팅 레이아웃
│   ├── page.tsx       // 홈페이지
│   └── about/
│       └── page.tsx   // 소개 페이지
├── (dashboard)/
│   ├── layout.tsx     // 대시보드 레이아웃
│   └── analytics/
│       └── page.tsx   // 분석 페이지
└── (auth)/
    ├── login/
    │   └── page.tsx
    └── register/
        └── page.tsx

// (marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="marketing-layout">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  )
}
```

### Parallel Routes 활용 (⚠️ 16에서 `default.js` 필수)

Next.js 16부터 **모든 Parallel Route 슬롯에 명시적인 `default.js`가 없으면 빌드가 실패**합니다. 이전 버전의 암묵적 fallback 동작을 원한다면 `notFound()`를 호출하거나 `null`을 반환하는 `default.js`를 직접 추가해야 합니다.

```typescript
// ✅ Parallel Routes로 동시 렌더링
app/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── @analytics/
│   │   ├── page.tsx
│   │   └── default.tsx   // 🚀 필수: 없으면 빌드 실패
│   └── @notifications/
│       ├── page.tsx
│       └── default.tsx   // 🚀 필수: 없으면 빌드 실패

// @analytics/default.tsx — 이전 버전의 암묵적 fallback을 재현
export default function Default() {
  return null
}

// dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  notifications,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  notifications: React.ReactNode
}) {
  return (
    <div className="dashboard-grid">
      <main>{children}</main>
      <aside className="analytics-panel">
        <Suspense fallback={<AnalyticsSkeleton />}>
          {analytics}
        </Suspense>
      </aside>
      <div className="notifications-panel">
        <Suspense fallback={<NotificationsSkeleton />}>
          {notifications}
        </Suspense>
      </div>
    </div>
  )
}
```

### Intercepting Routes

```typescript
// ✅ Intercepting Routes로 모달 구현
app/
├── gallery/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx    // 전체 페이지 보기
└── @modal/
    └── (.)gallery/
        └── [id]/
            └── page.tsx // 모달 보기

// @modal/(.)gallery/[id]/page.tsx
import { Modal } from '@/components/modal'

export default async function PhotoModal({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const photo = await getPhoto(id)

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  )
}
```

### 향상된 라우팅과 프리페칭 (자동 적용, 코드 변경 불필요)

Next.js 16은 프리페칭/네비게이션 시스템을 전면 개편했습니다.

- **레이아웃 중복 제거**: 동일 레이아웃을 공유하는 여러 링크를 프리페치할 때 레이아웃을 한 번만 다운로드 (예: 상품 링크 50개 → 레이아웃 1회만 전송)
- **점진적 프리페칭**: 캐시에 없는 부분만 프리페치, 뷰포트를 벗어나면 요청 취소, hover/재진입 시 우선순위 상승
- 코드 수정 없이 자동으로 적용되며, 개별 프리페치 요청 수는 늘 수 있지만 총 전송량은 감소합니다.

### Next.js DevTools MCP (신규)

Next.js 16은 AI 에이전트를 위한 **Model Context Protocol(MCP) 통합**을 제공합니다. 라우팅/캐싱/렌더링 동작에 대한 컨텍스트, 브라우저·서버 로그 통합, 자동 에러 스택 트레이스, 현재 라우트 인지 기능을 제공하여 AI 기반 디버깅 워크플로우를 지원합니다.

## ❌ 금지 사항 / 제거된 기능

### Pages Router 사용 금지

```typescript
// ❌ 절대 금지: Pages Router 패턴
pages/
├── _app.tsx
├── _document.tsx
├── index.tsx
└── api/
    └── users.ts

// ❌ 금지: getServerSideProps, getStaticProps 사용
export async function getServerSideProps() {
  // 이 방식은 사용하지 마세요
}
```

### 16에서 완전히 제거된 기능

| 제거된 기능                                                              | 대체 방법                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| AMP 지원 (`useAmp`, `config.amp`)                                        | 전면 제거, 대체 없음                                                                              |
| `next lint` 명령어                                                       | ESLint 또는 Biome 직접 사용. `npx @next/codemod@canary next-lint-to-eslint-cli .` 로 마이그레이션 |
| `devIndicators`의 `appIsrStatus`/`buildActivity`/`buildActivityPosition` | 설정 옵션만 제거, 인디케이터 자체는 유지                                                          |
| `serverRuntimeConfig`, `publicRuntimeConfig`                             | 환경 변수(`.env`) 사용                                                                            |
| `experimental.turbopack` 위치                                            | 최상위 `turbopack` 키로 이동                                                                      |
| `experimental.dynamicIO`                                                 | `cacheComponents`로 이름 변경                                                                     |
| `experimental.ppr`, `export const experimental_ppr`                      | Cache Components 모델로 대체                                                                      |
| 동기 `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()`       | 모두 `await` 필수                                                                                 |
| 자동 `scroll-behavior: smooth`                                           | `<html data-scroll-behavior="smooth">` 로 옵트인                                                  |
| `next/image` 로컬 src + 쿼리스트링                                       | `images.localPatterns` 설정 필수                                                                  |

### 안티패턴 방지

```typescript
// ❌ 금지: 불필요한 'use client' 사용
'use client'

export default function SimpleComponent({ title }: { title: string }) {
  return <h1>{title}</h1>
}

// ✅ 올바른 방법: Server Component로 유지
export default function SimpleComponent({ title }: { title: string }) {
  return <h1>{title}</h1>
}

// ❌ 금지: 클라이언트에서 서버 함수 직접 호출
'use client'

import { getUser } from '@/lib/database' // 서버 전용 함수

export function UserProfile() {
  const user = getUser() // 에러 발생
  return <div>{user.name}</div>
}

// ✅ 올바른 방법: 서버에서 데이터 전달
export default async function UserPage() {
  const user = await getUser()
  return <UserProfile user={user} />
}

function UserProfile({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

## 코드 품질 체크리스트

`next lint`가 완전히 제거되었으므로 (`next build`도 더 이상 자동으로 린트를 실행하지 않음) ESLint 또는 Biome을 별도 스크립트로 직접 실행해야 합니다.

```bash
# 🚀 필수: 타입 체크
npm run typecheck

# 🚀 필수: 린트 검사 (ESLint 또는 Biome 직접 호출, next lint 아님)
npx eslint .
# 또는
npx biome check .

# ✅ 권장: 포맷 검사
npm run format:check

# 🚀 필수: 통합 검사
npm run check-all

# 🚀 필수: 빌드 테스트 (Turbopack이 기본, webpack 필요 시 --webpack)
npm run build
```

## 📋 마이그레이션 핵심 요약 (15 → 16)

1. **번들러**: Turbopack이 기본값 (webpack 쓰려면 `--webpack` 명시)
2. **캐싱**: 암묵적 캐싱 폐지 → `cacheComponents: true` + `"use cache"` 명시적 적용 필수
3. **미들웨어**: `middleware.ts` → `proxy.ts`, 함수명 `middleware` → `proxy`
4. **`revalidateTag()`**: 두 번째 인자로 `cacheLife` 프로필 필수, `updateTag()`/`refresh()` 신규 도입
5. **비동기 API**: `params`/`searchParams`/`cookies()`/`headers()` 동기 접근 완전 제거
6. **Parallel Routes**: 모든 슬롯에 `default.js` 필수
7. **이미지 설정**: `minimumCacheTTL`, `imageSizes`, `qualities`, `dangerouslyAllowLocalIP`, `maximumRedirects` 기본값 변경
8. **린트**: `next lint` 제거 → ESLint/Biome 직접 사용
9. **버전 요구사항**: Node.js 20.9+, TypeScript 5.1+

이 지침을 따라 Next.js 16의 모든 기능을 최대한 활용하여 현대적이고 성능 최적화된 애플리케이션을 개발하세요.
