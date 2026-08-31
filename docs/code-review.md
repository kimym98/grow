# 코드 리뷰: AI 취준 비서 데스크탑 앱

**리뷰 일자**: 2026-08-31

## 📋 코드 리뷰 요약

Electron + Next.js(App Router) 하이브리드 데스크탑 앱으로, 1차 개발을 마친 상태의 전반적인 완성도는 양호합니다. Electron의 `contextIsolation`/`nodeIntegration` 설정, Supabase Edge Function의 인증·인가 분리, 스크래핑 소스별 실패 격리, `react-window` 기반 리스트 가상화 등 기본기가 탄탄하게 갖춰져 있습니다.

다만 다음 네 가지가 우선 조치 대상입니다.

1. `lib/llm-keys.ts`의 `testLlmKey`가 사용자 API 키를 **렌더러(클라이언트) 프로세스에서 직접** LLM API로 호출하는 구조 — 실제 채점/첨삭 경로(Edge Function)와의 일관성이 깨져 있고 노출 표면이 넓어집니다.
2. `lib/auth-test.ts`의 테스트 계정 자격증명 하드코딩이 실제 프로덕션 빌드 산출물에서 제거되는지 확인되지 않았습니다.
3. LLM 프로바이더 호출/프롬프트 로직이 `packages/shared`, `grade-short-answer`, `review-document` 세 곳에 사실상 동일하게 3중 복제되어 있어 드리프트 위험이 있습니다.
4. 웹 스크레이핑(잡코리아 등)이 정규식 기반 HTML 파싱 + rate limiting 부재로 구조적으로 취약합니다.

성능 측면은 리스트 가상화가 이미 적용되어 있어 급한 불은 없으나, 메모이제이션 누락과 페이지네이션 부재가 데이터가 누적될수록 문제를 키울 수 있습니다.

## ✅ 잘한 점

- **Electron 기본 보안 원칙 준수**: `electron/main.ts`에서 `contextIsolation: true`, `nodeIntegration: false`로 preload를 통한 안전한 IPC 노출을 구성했습니다.
- **탐색 하이재킹 방지**: `will-navigate`/`setWindowOpenHandler`로 앱 외부 URL을 OS 기본 브라우저로 리다이렉트하여 인앱 피싱·OAuth 흐름 문제를 예방했습니다.
- **Edge Function 인증/인가 분리가 명확함**: `review-document`는 사용자 JWT(`auth: ["user"]`) + RLS 클라이언트로 소유권까지 검증하고, `collect-*` 함수는 `auth: ["secret"]`로 서버 간 호출만 허용하는 등 함수별 신뢰 경계가 잘 구분되어 있습니다.
- **실시간 구독 설계의 근거가 명확함**: `lib/realtime-sync.ts`가 공개 채널을 구독하는 이유(“SELECT RLS가 무조건 허용되는 공개 데이터”)를 주석으로 명시해두어 판단 근거를 추적할 수 있습니다.
- **스크래핑 실패 격리**: `collect-job-postings`/`collect-tech-news` 모두 소스별로 try/catch를 격리해 한 소스의 실패가 전체 수집을 막지 않고, 수집 로그 테이블에 기록까지 남깁니다.
- **리스트 가상화 적용**: `jobs-page-client.tsx`, `news-feed.tsx`가 `react-window`로 대량 리스트를 가상 스크롤 처리해 DOM 노드 폭증을 방지했습니다.
- **파일 업로드 보상 트랜잭션**: `document-upload.ts`에서 storage 업로드 후 DB insert 실패 시 업로드 파일을 롤백 삭제하는 처리가 되어 있습니다.
- **패키징 이슈 문서화**: `docs/guides/electron-packaging-troubleshooting.md`에 과거 발생했던 패키징 전용 버그(Sentry 정적 import 크래시 등)를 상세히 기록해 재발 시 디버깅 시간을 단축할 수 있게 해두었습니다.

## 🔍 개선 필요 사항

### 🚨 심각도: 높음

#### 1. LLM API 키가 렌더러 프로세스에서 직접 외부로 전송됨

- **문제**: `apps/desktop/lib/llm-keys.ts`의 `testLlmKey` 함수가 사용자가 입력한 Anthropic/Gemini API 키를 클라이언트(Electron 렌더러)에서 직접 `fetch()`로 외부 LLM API에 호출합니다. Anthropic 호출 시 `anthropic-dangerous-direct-browser-access: true` 헤더까지 명시적으로 설정하고, Gemini 호출은 `?key=${apiKey}` 형태로 URL 쿼리 스트링에 키를 그대로 담습니다.
- **영향**: 실제 채점(`grade-short-answer`)·문서 리뷰(`review-document`) 경로는 Edge Function에서 서버 측 복호화 키로 안전하게 처리되는데, 키 검증(`testLlmKey`)만 예외적으로 클라이언트에서 실행되어 경로 간 일관성이 깨집니다. `contextIsolation`이 켜져 있어도 렌더러는 웹 콘텐츠이므로 XSS, 의존성 취약점, 개발자도구를 통한 네트워크 탭 노출 등으로 유효한 API 키가 유출될 위험이 있습니다. URL 쿼리 스트링에 담긴 키는 프록시/로그에 평문으로 남을 가능성도 있습니다.
- **해결방안**: 키 검증도 Edge Function을 경유하도록 통일하는 것을 권장합니다. 예를 들어 `validate-llm-key`라는 경량 Edge Function을 하나 두고, 렌더러는 이 함수를 호출해 서버가 대신 외부 API에 최소 비용(1토큰) 요청을 보내 유효성만 반환받는 방식입니다. 부득이 클라이언트 직접 호출을 유지해야 한다면 최소한 Gemini 키는 쿼리 스트링 대신 헤더로 전달하도록 변경하고, CSP로 이 호출을 허용된 origin으로 제한하세요.

```typescript
// 개선 예시: Edge Function 경유로 통일
// apps/desktop/lib/llm-keys.ts
export async function testLlmKey(provider: LlmProvider, apiKey: string) {
  const { data, error } = await supabase.functions.invoke("validate-llm-key", {
    body: { provider, apiKey }, // 여전히 전송되지만 최소한 서버가 결과만 반환하고 키를 저장/로깅하지 않도록 통제 가능
  });
  if (error) return { valid: false, message: error.message };
  return data;
}
```

#### 2. 하드코딩된 테스트 계정 자격증명의 프로덕션 노출 여부 미확인

- **문제**: `apps/desktop/lib/auth-test.ts`에 `TEST_ACCOUNT_EMAIL`/`TEST_ACCOUNT_PASSWORD`가 평문으로 하드코딩되어 있습니다. 주석에는 "프로덕션 빌드에서는 렌더링되지 않는다"고 되어 있지만, 파일 자체에는 `NODE_ENV`에 따른 조건부 export나 트리쉐이킹을 보장하는 장치가 보이지 않습니다.
- **영향**: Next.js 정적 export 특성상 이 상수들이 조건 없이 클라이언트 번들에 포함되면, 배포된 앱 바이너리(`asar` 압축 해제, 문자열 추출)에서 테스트 계정 자격증명이 그대로 발견될 수 있습니다. 실제 서비스 계정이라면 계정 탈취로 이어질 수 있습니다.
- **해결방안**: 빌드된 프로덕션 산출물(`dist`/`out`)을 직접 문자열 검색(`grep -r "TEST_ACCOUNT" out/`)해 실제로 번들에 포함되는지 확인하십시오. 포함된다면 (a) 해당 코드를 별도 dev-only 진입점으로 분리해 프로덕션 빌드 자체에서 파일을 제외하거나, (b) 테스트 계정을 아예 코드에서 제거하고 환경변수/로컬 개발 서버 전용 시드 스크립트로 옮기는 것을 권장합니다.

### ⚠️ 심각도: 중간

#### 1. LLM 호출/프롬프트 로직 3중 복제

- **문제**: `fetchWithRetry`, JSON 파싱, 프롬프트 템플릿 로직이 `packages/shared/src/lib/llm/*`, `supabase/functions/grade-short-answer/llm.ts`, `supabase/functions/review-document/llm.ts` 세 곳에 사실상 동일하게 복제되어 있습니다. `review-document/llm.ts`의 프롬프트 문자열은 `packages/shared`의 `buildDocumentReviewPrompt`와 완전히 동일합니다. `electron/notification-trigger.ts`에도 주석으로 "shared와 동일 로직의 복제본, 함께 갱신 필요"라고 명시된 유사 패턴이 있습니다.
- **영향**: 한쪽 프롬프트나 재시도 정책만 수정하고 다른 쪽을 놓치는 드리프트가 발생하기 쉽습니다. 현재는 "Deno ESM이 확장자 없는 상대 임포트를 지원하지 않는다"는 이유로 복제를 택했지만, 이는 진입점 설계로 해결 가능한 문제입니다.
- **해결방안**: `packages/shared`에 Deno 호환 전용 배럴 파일(예: `src/lib/llm/deno-entry.ts`, 확장자 포함 상대 경로만 사용)을 만들어 Edge Function에서 `import { fetchWithRetry } from "../../../packages/shared/src/lib/llm/deno-entry.ts"` 형태로 재사용하도록 리팩토링하세요. 최소한 프롬프트 템플릿만이라도 단일 소스로 통합하는 것을 우선순위로 두는 것을 권장합니다.

#### 2. LLM 호출 타임아웃 누적이 Edge Function 실행 한도를 초과할 위험

- **문제**: `fetch-with-retry.ts` 및 두 Edge Function 복제본 모두 60초 타임아웃 × 최대 3회 재시도 정책을 사용합니다. 5xx/429 응답이 반복되면 최악의 경우 약 3분간 대기하게 됩니다.
- **영향**: Supabase Edge Function의 실행 시간 제한을 초과해 함수가 강제 종료될 수 있습니다. 특히 `review-document`는 PDF 파싱까지 포함되어 있어, 함수가 타임아웃으로 kill되면 `catch` 블록의 `status = "failed"` 업데이트조차 실행되지 못하고 리뷰 레코드가 `processing` 상태로 영구히 멈춰있을 수 있습니다.
- **해결방안**: 전체 재시도 예산에 상한을 두는 시간 기반 타임아웃(예: 전체 90초 초과 시 즉시 실패 처리)을 도입하고, DB에 `processing` 상태로 일정 시간 이상 머무른 레코드를 감지해 `failed`로 전환하는 워치독(스케줄 함수 또는 클라이언트 폴링 시 타임아웃 판정)을 추가하세요.

#### 3. 웹 스크레이핑의 견고성 부족과 rate limiting 부재

- **문제**: `collect-job-postings/sources/jobkorea.ts`가 정규식으로 HTML을 직접 파싱합니다. 대상 사이트의 DOM 구조가 조금만 바뀌어도 파싱 전체가 깨질 수 있는 구조입니다. 또한 `collect-job-postings`/`collect-tech-news` 어디에도 요청 간 딜레이나 백오프 로직이 없어, 주기적 cron 실행 시 짧은 시간에 반복 요청이 나가면 대상 사이트로부터 IP 차단을 당할 위험이 있습니다.
- **영향**: 파싱 실패가 잦아지면 데이터 수집 기능 자체의 신뢰성이 떨어지고, 과도한 요청은 대상 사이트에 부담을 주며 서비스 이용약관 위반으로 이어질 수 있습니다.
- **해결방안**: 가능하면 정규식 파싱을 공식 API나 DOM 파서(`deno-dom` 등 Deno 호환 라이브러리)로 교체해 구조 변경에 대한 내성을 높이세요. 소스별 요청 사이에 최소 간격(예: 1~2초)을 두는 딜레이 로직을 추가하고, 파싱 실패율이 일정 임계치를 넘으면 알림을 보내는 모니터링을 두는 것을 권장합니다.

#### 4. 자동 업데이트 코드 서명 검증 비활성화

- **문제**: `apps/desktop/package.json`에서 `verifyUpdateCodeSignature: false`로 설정되어 있습니다. `docs/guides/electron-release-guide.md`에 "코드 서명 인증서가 없어 임시로 비활성화했다"고 문서화는 되어 있습니다.
- **영향**: GitHub Releases 배포 채널이 탈취되거나 전송 계층이 손상될 경우, 서명 검증 없이 임의의 실행 파일이 사용자 PC에 자동 설치될 수 있는 구조적 위험이 있습니다.
- **해결방안**: 장기적으로는 코드 서명 인증서(EV 인증서 또는 최소한 표준 인증서)를 발급받아 `verifyUpdateCodeSignature: true`로 전환하는 로드맵을 잡으시길 권장합니다. 단기적으로는 배포 시 릴리스 아티팩트의 체크섬(SHA256)을 릴리스 노트에 함께 게시해 최소한의 무결성 확인 수단을 제공하는 것도 도움이 됩니다.

#### 5. 리스트 행 컴포넌트의 메모이제이션 누락

- **문제**: `jobs-page-client.tsx`, `news-feed.tsx`에서 `react-window`로 가상화는 되어 있지만 각 행 컴포넌트(`JobRow`, `NewsRow`)에 `React.memo`가 적용되어 있지 않고, `itemData`로 넘기는 `rowProps` 객체와 `handleSelectJob` 콜백이 매 렌더마다 새로 생성됩니다(`useCallback`/`useMemo` 미사용).
- **영향**: 가상화로 DOM 노드 수는 줄였지만, 부모 리렌더 시마다 화면에 보이는 모든 행이 다시 렌더링되어 가상화의 이점이 상쇄됩니다.
- **해결방안**: 행 컴포넌트를 `React.memo`로 감싸고, `rowProps`와 이벤트 핸들러를 `useMemo`/`useCallback`으로 안정화하세요.

```tsx
// 개선 예시
const JobRow = React.memo(function JobRow({ index, style, data }: RowProps) {
  // ...
});

const handleSelectJob = useCallback((id: string) => setSelectedJobId(id), []);
const rowProps = useMemo(
  () => ({ jobs: filteredJobs, selectedJobId, onSelect: handleSelectJob }),
  [filteredJobs, selectedJobId, handleSelectJob]
);
```

#### 6. 캐시 무효화가 수동 버전 관리에 의존

- **문제**: `grade-short-answer/index.ts`, `review-document/index.ts`의 `PROMPT_VERSION` 상수를 프롬프트 변경 시 사람이 수동으로 올려야 캐시가 무효화됩니다.
- **영향**: 프롬프트를 수정하고 버전을 올리는 것을 잊으면, 이전 프롬프트 기준으로 캐시된 결과가 계속 재사용되어 품질 저하를 인지하기 어렵습니다.
- **해결방안**: 캐시 키 생성 시 프롬프트 템플릿 문자열 자체의 해시를 포함시켜 자동으로 무효화되도록 바꾸는 것을 권장합니다.

### 💡 심각도: 낮음

- **에러 메시지 원문 노출**: `grade-short-answer/index.ts`, `review-document/index.ts`가 LLM 응답 파싱 실패 시 `error.message`에 `rawText`(LLM 원문 응답)를 포함해 그대로 클라이언트에 반환합니다. 정보 노출 최소화 관점에서 사용자에게는 일반화된 메시지만 보여주고 원문은 서버 로그에만 남기는 것이 바람직합니다.
- **`setWindowOpenHandler`의 화이트리스트 부재**: `electron/main.ts`에서 모든 외부 URL을 무조건 `shell.openExternal`로 여는데, `https://` 스킴 등으로 제한하는 화이트리스트 검증이 없습니다. 실익보다는 방어적 코딩 관점의 개선입니다.
- **CSP 미설정**: `app://` 프로토콜 응답에 Content-Security-Policy 헤더가 없어 XSS에 대한 심층방어 계층이 부재합니다. `meta` 태그 또는 프로토콜 핸들러 응답 헤더로 최소한의 CSP를 추가하는 것을 권장합니다.
- **데이터 페칭에 페이지네이션 없음**: `job-postings.ts`, `tech-news.ts`가 전체 레코드를 한 번에 `select("*")`로 가져옵니다. 현재는 가상 스크롤로 렌더링 비용이 상쇄되지만, 데이터가 수천 건 이상 누적되면 네트워크/파싱 비용이 선형으로 증가합니다. 커서 기반 페이지네이션 도입을 고려하십시오.
- **`quiz-session-list`의 가상화 부재**: 단순 `.map()` 렌더링이라 세션 수가 매우 많아지면 문제될 수 있으나 현재 데이터 규모상 우선순위는 낮습니다.
- **`news-feed`의 리사이즈 디바운스 없음**: `useNewsColumnCount`가 `resize` 이벤트마다 즉시 `setState`하여 컬럼 재계산을 유발합니다. 디바운스 처리를 추가하면 리사이즈 중 렌더링 부담을 줄일 수 있습니다.
- **Electron 메인 프로세스의 알림 캐시 신뢰성**: `electron/main.ts`가 렌더러가 IPC로 push하는 캐시에만 의존해 알림을 트리거하므로, 앱 재시작 직후나 트레이 상태에서 sync가 지연되면 알림 누락이 발생할 수 있습니다. 설계상 트레이드오프이나 사용자에게 영향이 있을 수 있어 인지해둘 필요가 있습니다.
- **패키징 스모크 테스트 부재**: `package.json`의 테스트 스크립트는 단위 테스트(`vitest run`)뿐이며, 실제 패키징된 앱을 실행해보는 CI 스모크 테스트가 없습니다. `docs/guides/electron-packaging-troubleshooting.md`에 기록된 과거 이슈들이 "로컬 dev에서는 재현 안 되고 패키징 후에만 발생"하는 유형이 많았던 점을 고려하면, 최소한 `electron-builder`로 빌드 후 앱이 정상 기동하는지 확인하는 스모크 테스트를 CI에 추가할 가치가 있습니다.

## 📚 추가 권장사항

- **LLM 프로바이더 추상화 리팩토링**: `packages/shared/src/lib/llm/create-llm-provider.ts`를 중심으로 Deno/Node 양쪽에서 재사용 가능한 단일 진입점을 설계하면, 앞서 지적한 3중 복제 문제와 프롬프트 드리프트 문제를 동시에 해결할 수 있습니다. 빌드 타임에 Deno용 `.ts` 확장자 포함 배럴을 생성하는 스크립트를 두는 것도 방법입니다.
- **RLS 정책 문서화/검토**: 이번 리뷰에서는 DB 마이그레이션 파일을 확인하지 못했습니다. `llm-cache.ts`의 캐시 크로스토크 방지가 전적으로 `user_id` 기반 RLS 정책에 의존하고 있으므로, 별도로 마이그레이션 파일을 검토해 RLS 정책이 실제로 의도대로 걸려 있는지 (`supabase db diff`, `get_advisors` 등으로) 확인하는 후속 작업을 권장합니다.
- **데이터 페칭 레이어 통일**: 현재 각 페이지 컴포넌트가 개별적으로 `useEffect` + 직접 fetch 패턴을 반복하고 있습니다(`jobs-page-client.tsx`, `news-feed.tsx` 등). React Query나 SWR 도입을 검토하면 캐싱, 재검증, 로딩/에러 상태 관리의 보일러플레이트를 크게 줄일 수 있습니다.
- **API 키 검증 UX 개선과 보안을 동시에**: 서버 프록시 경유로 전환할 때, 사용자가 키를 입력하자마자 즉시 피드백을 받을 수 있도록 짧은 타임아웃(5~10초)의 경량 검증 함수를 별도로 두는 것을 권장합니다.
- **코드 서명 로드맵 수립**: 자동 업데이트 서명 검증은 사용자 신뢰와 직결되는 사안이므로, 예산이 허락하는 시점에 코드 서명 인증서 발급을 로드맵에 포함하는 것을 권장합니다.
