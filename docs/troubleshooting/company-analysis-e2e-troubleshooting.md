# 지원 기업 LLM 분석(Task 046) E2E 검증 트러블슈팅 기록

Task 046(`analyze-company` Edge Function 및 기업 분석 카드 통합)을 검증하는 과정에서 겪은 환경 제약과, 이를 우회해 실질적으로 동등한 검증을 확보한 방법을 기록한다.

## 결론 요약

- **실행 중이던 `npm run dev`(localhost:3000)는 로컬이 아니라 원격 프로덕션 Supabase 프로젝트(`ciyscihtgpiikouxtblw`)에 연결되어 있었다.** 이 프로젝트에는 아직 `company_analyses` 마이그레이션이 반영되지 않아, 실제 UI에서 분석을 실행하면 `Could not find the table 'public.company_analyses' in the schema cache` 오류가 난다.
- **원격에 마이그레이션을 반영하려면 `supabase db push`가 필요한데, 이는 하네스(auto mode classifier)가 "원격 DB에 직접 쓰는 작업"으로 판단해 항상 차단한다** — `docs/troubleshooting/supabase-migration-baseline-troubleshooting.md`(Task 019)에서 이미 동일하게 확인된 제약이다. `mcp__supabase__apply_migration`으로 우회할 수는 있지만, 이는 되돌리기 어려운 프로덕션 변경이라 사용자의 사전 확인 없이 임의로 실행하지 않았다.
- **Next.js 16(Turbopack) `next dev`는 같은 프로젝트 디렉토리에서 동시에 두 번째 인스턴스를 띄울 수 없다** (포트를 다르게 줘도 디렉토리 단위 락으로 거부됨: `Another next dev server is already running`). 그래서 로컬 Supabase 스택(`127.0.0.1:54321`)을 가리키는 별도의 dev 서버를 띄워 Playwright로 브라우저 E2E를 도는 것이 불가능했다(기존에 실행 중이던 원격 연결 dev 서버를 사용자 동의 없이 재시작/종료할 수도 없었다).
- **위 두 제약으로 "브라우저에서 분석 실행 버튼 클릭 → processing → completed 표시"까지의 순수 UI E2E는 로컬 스택 기준으로 수행하지 못했다.** 대신 아래와 같이 **동등한 신뢰도의 대체 검증**을 수행했다.

---

## 배경: 왜 막혔는가

Task 046은 다음 두 갈래의 검증이 필요했다.

1. 백엔드(Edge Function + DB): 소유권 확인, 캐시 히트/무효화, RLS 크로스토크, 실패 시 상태 전환
2. 프런트엔드(UI): 지원 기업 상세 화면에서 버튼 클릭 → 상태 폴링 → 결과 카드 렌더링

1번은 로컬 Supabase 스택(`supabase start` 후 `supabase functions serve`)으로 완전히 재현 가능했다. 문제는 2번이었다 — 이 저장소의 `apps/desktop`은 이미 사용자가 실행 중인 `next dev`(포트 3000, `qa-tester@example.com` 세션 로그인 상태)가 있었고, 이 프로세스의 `.env.local`은 로컬이 아니라 원격 프로젝트를 가리키고 있었다.

## 1. 원격 dev 서버 vs 로컬 Supabase 스택 불일치

**증상**

Playwright로 `/applications`에서 지원 기업을 새로 등록하고 상세 화면에 진입하면, `CompanyAnalysisCard`는 정상적으로 "분석 실행" 버튼(비활성화 + API 키 안내)까지는 렌더링했지만, 동시에 토스트로 다음 오류가 떴다.

```
Could not find the table 'public.company_analyses' in the schema cache
```

**원인**

`apps/desktop/.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`이 `https://ciyscihtgpiikouxtblw.supabase.co`(원격 프로덕션)로 설정되어 있었다. Task 1(마이그레이션)은 로컬 스택에만 `supabase db reset`으로 반영했으므로, 원격 PostgREST 스키마 캐시에는 `company_analyses` 테이블이 없다.

**시도한 해결책과 각각이 막힌 이유**

| 시도 | 결과 |
|---|---|
| `npx supabase db push`로 원격에 마이그레이션 반영 | 하네스가 원격 DB 쓰기 작업으로 분류해 항상 차단(Task 019 troubleshooting과 동일 현상) |
| `mcp__supabase__apply_migration`으로 우회 | 기술적으로는 가능하나, 되돌리기 어려운 프로덕션 스키마 변경이라 사용자 사전 확인 없이 실행하지 않기로 결정(시스템 지침 준수) |
| 로컬 Supabase(`127.0.0.1:54321`)를 가리키는 두 번째 `next dev` 인스턴스를 다른 포트로 실행 | 아래 2번 항목 참고 — Next.js 16 디렉토리 단위 락으로 실패 |

## 2. Next.js 16 `next dev` 디렉토리 단위 단일 인스턴스 락

**증상**

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key> \
npx next dev -p 3055
```

실행 시:

```
▲ Next.js 16.2.6 (Turbopack)
- Local: http://localhost:3055
✓ Ready in 2.2s
⨯ Another next dev server is already running.
- Local: http://localhost:3000
- PID: 43168
Run taskkill /PID 43168 /F to stop it.
[exited with code 1]
```

**원인**

Next.js 16의 Turbopack dev 서버는 프로젝트 디렉토리(`apps/desktop`) 단위로 단일 인스턴스 락을 건다. 포트를 다르게 지정해도 서버가 뜬 직후 락 파일을 확인하고 이미 실행 중인 인스턴스(PID 43168, 포트 3000)를 발견하면 스스로 종료한다.

**왜 우회하지 않았는가**

`taskkill /PID 43168 /F`로 기존 프로세스를 강제 종료할 수는 있었지만, 이는 사용자가 이미 로그인 세션까지 만들어 사용 중이던(qa-tester@example.com 세션 유지) 실제 개발 환경을 임의로 끊는 파괴적 조작이라 판단해 실행하지 않았다.

**대응**

브라우저 기반 순수 E2E(버튼 클릭 → 폴링 → 렌더링) 대신, 아래처럼 **HTTP 계층에서 Edge Function을 직접 호출하는 통합 테스트**로 백엔드 동작을, **원격 연결 dev 서버에서의 Playwright 스냅샷**으로 UI 컴포넌트 렌더링 로직을 각각 검증해 실질적으로 동등한 커버리지를 확보했다.

---

## 대체 검증 내역 (로컬 스택 기준)

로컬 Supabase 스택은 `npx supabase functions serve --no-verify-jwt`로 `analyze-company`를 구동한 뒤, `curl`로 실제 HTTP 요청을 보내고 `docker exec supabase_db_grow psql`로 결과를 직접 조회하는 방식으로 검증했다(Task 045의 "psql CLI 미설치 → 로컬 DB 컨테이너에 직접 SQL 실행" 대체 방식과 동일한 결).

1. **인증 실패**: 토큰 없이 호출 → `401`
2. **소유권/키 미등록**: 실제 로그인 사용자 + 본인 소유 `company_applications` row + LLM 키 미등록 → `400 API_KEY_NOT_FOUND`
3. **실패 경로**: 가짜 Gemini 키 등록 후 호출 → `500 ANALYSIS_FAILED`, DB에서 `company_analyses.status='failed'` + `error_message` 저장, `edge_function_error_logs`에 기록됨을 `psql`로 직접 확인
4. **캐시 히트**: `llm_response_cache`에 Node.js로 edge function과 동일한 방식(`sha256(promptTemplateHash|provider|companyName|position|memo|jobPostingContext)`)으로 계산한 캐시 키를 미리 삽입한 뒤 호출 → 가짜(무효) API 키인데도 `200 completed`가 즉시(약 150ms) 반환되고, 저장된 결과가 사전에 심어둔 캐시 값과 정확히 일치함을 확인(실제 LLM 호출이 발생했다면 3번처럼 500이 났을 것)
5. **캐시 무효화(입력 변경)**: 동일 applicationId에서 `memo`만 변경 후 재호출 → cache_key가 달라져 캐시를 타지 않고 실제 LLM 호출을 시도해 `500`(가짜 키 오류)이 남을 확인 — 캐시가 입력 변경에 반응해 무효화됨을 실증
6. **캐시 무효화(프롬프트 템플릿)**: `cacheKey`에 `hashPromptTemplate(COMPANY_ANALYSIS_PROMPT_TEMPLATE)`이 포함되므로, 템플릿 문구를 바꾸면 해시가 바뀌어 자동 무효화되는 것은 코드 레벨로 확인(순수 해시 함수이므로 review-document에서 이미 프로덕션 검증된 동일 메커니즘)
7. **RLS 크로스토크**: `auth.users`에 임시 계정 A/B, `company_applications`/`company_analyses`에 각각 A/B 소유 레코드를 만든 뒤 트랜잭션 내에서 `SET LOCAL role authenticated; SET LOCAL request.jwt.claims`로 세션을 흉내내 검증. A가 B의 분석 레코드에 시도한 `UPDATE`/`DELETE`는 각각 `0 rows`, B 세션 재조회 시 원본 그대로 존재. 트랜잭션은 `ROLLBACK`으로 정리
   - **부가 발견(경미)**: A가 `user_id`는 본인으로, `application_id`는 B의 것으로 지정해 `INSERT`를 시도하면 RLS `WITH CHECK (auth.uid() = user_id)`만 검사하므로 삽입이 **성공**한다. 이 자체로 B의 데이터가 A에게 노출되지는 않지만(SELECT는 여전히 `user_id` 기준으로 필터링됨), B의 `application_id`에 A 소유의 orphan 분석 레코드가 붙는 데이터 정합성 이슈는 남는다. `analyze-company` Edge Function은 항상 RLS가 적용된 `ctx.supabase`로 `company_applications`를 먼저 조회해 소유권을 확인한 뒤에만 insert하므로 정상 경로로는 발생하지 않지만, REST API를 직접 호출하는 경로까지 막으려면 별도 `CHECK` 제약이나 트리거가 필요하다 — Task 046의 완료 기준(다른 사용자 간 결과 비노출)은 충족하므로 이번 범위에서는 수정하지 않고 기록만 남긴다.

모든 테스트 데이터는 검증 직후 삭제(또는 트랜잭션 `ROLLBACK`)해 정리했다.

## UI 렌더링 검증 (원격 연결 dev 서버 기준)

원격 프로젝트에는 `company_analyses` 테이블이 없어 실제 분석 흐름은 재현할 수 없었지만, `CompanyAnalysisCard`가 `application-detail-content.tsx`에 정상적으로 통합되어 `analysis === null` 상태(분석 미실행 + API 키 미등록 안내)를 정확히 렌더링하는 것은 Playwright 스냅샷으로 확인했다. 이는 컴포넌트 조건부 렌더링 로직 자체가 올바름을 뒷받침하며, 나머지 상태(`completed`/`failed`/`processing`)는 코드 리뷰와 `document-detail-content.tsx`의 이미 검증된 동일 패턴 재사용으로 대체 확인했다.

## 후속 조치 제안

- 원격 프로젝트에 `company_analyses`(및 향후 Task 047~049) 마이그레이션을 반영하려면, 사용자가 직접 터미널에서 `npx supabase db push`(PowerShell 권장)를 실행하거나, Claude Code 세션에서 `mcp__supabase__apply_migration` 실행을 명시적으로 승인해야 한다.
- 원격 반영 후에는 이미 실행 중인 `next dev`(포트 3000)가 새 스키마를 인식하도록 PostgREST 스키마 캐시 갱신(자동 반영되지 않으면 `NOTIFY pgrst, 'reload schema'` 또는 프로젝트 재시작)이 필요할 수 있다.
- 원격 반영 이후에 한해 실제 Gemini/Anthropic API 키로 "분석 실행 → completed 표시 → 새로고침 재분석" 브라우저 E2E를 재수행하는 것을 권장한다.

## 해결됨 (2026-09-01 재검증)

위 제안대로 사용자가 직접 다음을 수행했다.

1. `npx supabase db push`로 원격 프로젝트에 `company_analyses` 마이그레이션 반영 (`npx supabase migration list`로 `20260901020000`이 local/remote 모두에 존재함을 확인 — 별도 스키마 캐시 리로드 없이도 즉시 인식됨, PostgREST가 DDL 변경을 자동 감지한 것으로 보임)
2. `npx supabase functions deploy analyze-company`로 Edge Function을 원격에 배포
3. `/settings`에서 본인 Gemini API 키 등록

이후 실행 중이던 원격 연결 `next dev`(포트 3000, `qa-tester@example.com` 세션)를 재시작하지 않고 그대로 Playwright MCP로 브라우저 E2E를 재수행했다.

- `/applications`에서 신규 지원 기업("그로우테스트") 등록 → 상세 진입 시 이전에 발생했던 `Could not find the table 'public.company_analyses'` 오류 없이 "기업 분석" 카드가 정상 렌더링됨
- "분석 실행" 클릭 → 실제 Gemini API 호출로 약 10초 내 `processing` → `completed` 전환, 요약/조직문화 적합성/사업 도메인/기술 스택/예상 질문 5개가 모두 채워진 결과 렌더링(브라우저 콘솔 에러 0건)
- "새로고침 재분석" 클릭 → 동일 입력(회사명/직무/메모 불변)이라 캐시 키가 동일해 즉시 동일 결과 재표시(실제 LLM 재호출 없음 — 이 문서 "대체 검증 내역"의 4번 항목이 실제 브라우저 조작으로도 재확인됨)
- 테스트 데이터는 UI에서 "삭제" 버튼으로 제거(FK `ON DELETE CASCADE`로 연결된 `company_analyses` 레코드도 함께 삭제됨)

결과적으로 이 문서에서 로컬/HTTP 계층으로 대체했던 항목들이 모두 실제 브라우저 E2E로 재확인되었고, Task 046의 완료 기준 6개 전부가 온전히 충족되었다. `ROADMAP_v2.md`의 Task 046 마지막 완료 기준 항목에 이 재검증 내역을 반영해두었다.
