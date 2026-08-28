# PDF 첨삭 파이프라인 사전 조사 (Task 013)

Task 013(PDF 첨삭 파이프라인 + LLM Provider)을 구현하기 전에 확정해야 하는 두 가지 기술 사항을 조사한 결과다.

## 1. Edge Function 사용자 JWT 인증 방식

### 배경

기존 Edge Function 2개(`collect-job-postings`, `collect-tech-news`)는 모두 `withSupabase({ auth: ["secret"] }, ...)` 패턴을 사용한다. 이 모드는 크론/서비스 롤 전용으로 `ctx.supabaseAdmin`이 RLS를 우회하므로, "요청한 사용자 본인" 스코프로 동작해야 하는 `review-document` 함수에는 그대로 재사용할 수 없다.

### 확인된 사실

[`@supabase/server`](https://www.npmjs.com/package/@supabase/server) 패키지의 `withSupabase`는 `auth` 옵션으로 네 가지 인증 모드를 지원한다.

| 모드 | 용도 | 컨텍스트 |
|---|---|---|
| `"user"` | 로그인한 사용자가 호출하는 함수. 사용자의 세션 JWT를 검증하고 해당 사용자의 RLS 정책이 적용된 클라이언트를 제공 | `ctx.supabase` (RLS 스코프), `ctx.userClaims`, `ctx.jwtClaims` |
| `"secret"` (`"secret:<name>"`으로 특정 키만 허용 가능) | 크론/서버 간 호출. RLS 우회 | `ctx.supabaseAdmin` |
| `"publishable"` | 익명(anon) 호출, RLS는 적용됨 | `ctx.supabase` (anon role) |
| `"none"` | 헬스체크 등 완전 공개 함수 (`verify_jwt = false` 필요) | 없음 |

기존 함수들이 쓰던 `"secret"`과 달리, `review-document`는 **`auth: "user"`** 모드로 작성해야 한다.

### 적용 패턴 (review-document용)

```typescript
// supabase/functions/review-document/index.ts
import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    // ctx.supabase: 호출한 사용자의 RLS가 적용된 클라이언트
    // document_reviews를 조회하면 본인 소유 행만 자동으로 걸러짐
    const { data: review } = await ctx.supabase
      .from("document_reviews")
      .select("*")
      .eq("id", documentId)
      .single()

    // 사용자별 LLM 키처럼 RLS로 막혀있고 서비스 롤로만 복호화해야 하는 리소스는
    // SECURITY DEFINER RPC를 ctx.supabase(사용자 컨텍스트)로 호출해 위임한다.
    const { data: apiKey } = await ctx.supabase.rpc("get_user_llm_key", { p_provider: "gemini" })

    // ...
  }),
}
```

- 사용자 소유권 검증은 별도 코드 없이 RLS가 자동으로 처리한다(`ctx.supabase`로 조회 시 타 사용자 행은 아예 반환되지 않음).
- 서비스 롤이 필요한 최소한의 작업(예: Vault 복호화)은 `ctx.supabaseAdmin`이 아니라, **사용자 컨텍스트로 호출하되 내부적으로 SECURITY DEFINER로 격상되는 RPC**를 통해서만 수행한다. 이렇게 하면 함수 코드 전체가 서비스 롤 권한을 갖는 것을 피하고, 권한 상승 지점을 DB 함수 하나로 한정할 수 있다.
- `supabase/functions/_shared/auth.ts`로 위 패턴(사용자 인증 확인 + 소유권 체크 헬퍼)을 공용화해 Task 014(퀴즈 LLM 꼬리질문)에서도 재사용한다.

### 참고 자료

- [Server: withSupabase | Supabase Docs](https://supabase.com/docs/reference/server/middleware-withsupabase)
- [Securing Edge Functions | Supabase Docs](https://supabase.com/docs/guides/functions/auth)
- [GitHub - supabase/server](https://github.com/supabase/server)
- [@supabase/server - npm](https://www.npmjs.com/package/@supabase/server)

---

## 2. PDF 텍스트 추출 라이브러리 Deno 호환성

### 결론: `unpdf` 채택

`pdf-parse`는 Node.js 전용 API(`fs`, Buffer 스트림 등)에 의존해 Deno Edge Runtime에서 그대로 동작하지 않을 가능성이 높다. 반면 **[unpdf](https://github.com/unjs/unpdf)** 는 처음부터 서버리스/엣지 환경을 겨냥해 설계된 라이브러리다.

- Mozilla PDF.js를 캔버스 렌더링 없이(엣지 런타임엔 `canvas` 자체가 없으므로) 최소화해 재번들링한 버전을 내장.
- Cloudflare Workers, Vercel Edge Functions 대상으로 테스트됨 — Deno Edge Function도 동일한 제약(Node API 부재) 환경이라 호환된다.
- Node.js, Deno, Bun, 브라우저를 모두 공식 지원 대상으로 명시.

### 사용 예시

```typescript
// supabase/functions/review-document/index.ts
import { extractText, getDocumentProxy } from "npm:unpdf"

async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(pdfBytes)
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}
```

- Deno에서는 `npm:` 접두사로 npm 패키지를 그대로 import할 수 있으므로, 기존 `deno.json`의 `imports` 맵에 `"unpdf": "npm:unpdf@^1"` 형태로 등록해 사용한다(기존 `@supabase/server`, `@supabase/functions-js` 등록 방식과 동일 컨벤션).
- Storage에서 받은 PDF는 `ArrayBuffer` → `Uint8Array`로 변환해 `getDocumentProxy`에 전달한다.

### 참고 자료

- [unpdf - npm](https://www.npmjs.com/package/unpdf)
- [unjs/unpdf README](https://github.com/unjs/unpdf/blob/main/README.md)
- [unjs.io/packages/unpdf](https://unjs.io/packages/unpdf/)

---

## 후속 태스크에 대한 영향

- **DB(Task 2)**: `get_user_llm_key` RPC는 SECURITY DEFINER로 작성하고, `EXECUTE` 권한을 `authenticated` 롤에만 부여(익명 접근 차단). 사용자 컨텍스트(`ctx.supabase`, RLS 적용된 JWT)로 호출해도 함수 내부에서만 Vault 원문에 접근하도록 한다.
- **shared(Task 4)**: LlmProvider 구현체는 이 조사와 무관하게 REST 호출 기반으로 그대로 진행 가능.
- **Edge Function(Task 5)**: `review-document`는 `withSupabase({ auth: "user" }, ...)` + `unpdf`를 채택해 구현한다. `deno.json`에 `unpdf` 의존성을 추가해야 한다.
