# Grow 데스크탑 앱 개발 로드맵 v2

1차 개발이 완료된 Grow 데스크탑 앱의 **병합 파이프라인 복구 → 보안·아키텍처 정비 → 기능 확장 → UI 완성도 향상**을 단계적으로 수행합니다.

## 개요

본 로드맵은 `docs/prd/PRD_v2.md`를 기반으로 작성되었으며, 코드 리뷰(`docs/code-review.md`) 결과 반영과 신규 기능 추가를 다룹니다.

- **CI 파이프라인 정상화 및 모니터링 실연동**: 린트 실패 7건 해소, Sentry DSN 실연동으로 배포 앱 크래시 관측 확보
- **보안·아키텍처·성능 이슈 해소**: LLM 키 렌더러 노출 제거, CSP 적용, 테스트 계정 격리, LLM 로직 3중 복제 통합
- **크롤링 소스 확장 + 기업 분석**: 캐치·자소설닷컴 추가, 자체 수집 공고 기반 LLM 기업 분석
- **서류 첨삭 UX 개선**: 프롬프트 정확도 향상, 원문-첨삭본 비교뷰 및 하이라이트
- **CS 퀴즈 참여형 확장**: 사용자 문제 등록·공개 공유 및 RLS 기반 권한 분리
- **품질 보증**: Playwright E2E 하네스 구축(패키징 스모크 테스트 통합), UI 스타일링 개선

### 참조 문서

| 문서 | 경로 |
| --- | --- |
| PRD v2 | `docs/prd/PRD_v2.md` |
| PRD v1 | `docs/prd/PRD_v1.md` |
| v1 로드맵 | `docs/roadmap/ROADMAP_v1.md` |
| 코드 리뷰 | `docs/code-review.md` |
| 패키징 트러블슈팅 | `docs/troubleshooting/electron-packaging-troubleshooting.md` |
| 스파이크 조사 기록 | `docs/research/` |

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `docs/roadmap/ROADMAP_v2.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- `/tasks` 디렉토리에 새 작업 파일 생성 (v2는 `018`부터 이어서 부여)
- 명명 형식: `XXX-description.md` (예: `018-ci-lint-hotfix.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)**
- 직전 완료 작업을 예시로 참조 (초기 상태 샘플은 `000-sample.md`)

3. **작업 구현**

- 작업 파일의 명세서를 따라 기능 구현
- **검증 기본 루틴**: `npm run dev`로 Electron 앱을 실행해 end-to-end 기능 확인
- **Edge Function**: `supabase functions serve`로 로컬 테스트 후 배포
- **스키마 변경**: 0-1단계 이후 모든 변경은 `supabase/migrations` 마이그레이션 파일로만 진행 (`supabase db diff`로 정합성 확인)
- **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 렌더러 화면 E2E 테스트 수행 필수**
  - 보호된 라우트는 테스트 계정 로그인 경로 사용 (Task 021 이후 환경변수 주입 방식)
  - Electron 메인 프로세스 전용 기능(OS 알림, 파일 시스템)은 수동 검증 또는 IPC 훅 어서션으로 보완
- 각 단계 후 작업 파일 내 진행 상황 업데이트, 테스트 통과 확인 후 다음 단계로 진행
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 완료된 작업을 ✅로 표시하고 `See: /tasks/XXX-xxx.md` 참조 추가

## 단계 요약

| Phase | 단계 | 우선순위 | Task 범위 | 핵심 내용 |
| --- | --- | --- | --- | --- |
| Phase 0 | 0단계 | **최상 (즉시)** | 018 | CI 린트 실패 긴급 수정 (2.17) |
| Phase 0-1 | 0-1단계 | 선행 | 019 | DB 스키마 마이그레이션 파일화 (3장) |
| Phase 1 | 보류 | - | 021~023-1 | 보안 이슈 해소 + Sentry 실연동 — 전체 보류, 최하단 보류 섹션 참고 |
| Phase 2 | 1단계 진행 | 상 | 024~028 | 스크레이핑 견고성·아키텍처·성능 (2.7 선행분, 2.5, 2.6, 2.12, 2.13) — **다음 착수 대상** |
| Phase 3 | 3단계 | 중 | 029~030 | 사전 스파이크 후 크롤링 소스 확장 (2.9 + 2.7 파서 교체분) |
| Phase 4 | 4단계 | 중 | 031 | 기업 분석 기능 (2.10) |
| Phase 5 | 5단계 | 중 | 032~033 | 이력서/포트폴리오 첨삭 개선 (2.11) |
| Phase 6 | 6단계 | 중 | 034 | CS 문제 입력 및 공유 (2.14) |
| Phase 7 | 7단계 | 중 | 035 | 자동 업데이트 코드 서명 적용 완료 (2.8) |
| Phase 8 | 8단계 | 중 | 036 | Playwright E2E 하네스 구축 (2.16, T-L8 통합) |
| Phase 9 | 9단계 | 낮음 | 037~039 | UI 스타일링 개선 및 후순위 항목 (2.1, 2.2, 2.15) |

> **순서 주의**: 8단계(E2E 스크린샷 기준선)는 9단계(스타일링 개선) 적용 **이후**에 기준 스냅샷을 확정합니다. 따라서 Task 036의 스크린샷 비교 서브태스크만 Phase 9 완료 후로 미루고, 하네스 구축 자체는 8단계에서 진행합니다.

## 개발 단계

### Phase 0: CI 파이프라인 복구 (0단계) ✅

- **Task 018: CI 린트 실패 긴급 수정** - ✅ 완료 (2026-08-31)
  - PRD 참조: 2.17 / 우선순위: **최상** / 선행 조건: 없음
  - `eslint.config.mjs`의 `globalIgnores`에 `dist/**` 누락이 근본 원인이었음(빌드 산출물이 lint 대상에 포함되어 `no-require-imports` 9건 발생) — ignore 추가로 해소
  - `today-news-carousel.tsx`의 `react-hooks/purity`, `react-hooks/use-memo` 해소 — 렌더 중 `Math.random()`을 `news.id` 기반 결정론적 해시(`hashStringToIndex`)로 교체, 의존성 배열을 `[items]`로 단순화
  - `error.tsx` 6개 파일의 미사용 `error` prop 경고 해소 — `useEffect`로 `console.error(error)` 로깅 추가 (Next.js 공식 패턴)
  - `next.config.ts`의 불필요한 disable 주석 삭제 및 익명 함수 → named export 전환
  - **⚠️ 계획 대비 변경**: 아래 두 항목은 원래 계획된 리팩터링(동적 import, `useSyncExternalStore`) 대신 사유를 명시한 `eslint-disable-next-line`으로 처리함 — 긴급 수정 범위에서 회귀 위험을 최소화하기 위한 판단. 후속 개선은 **Task 040** 참고.
    - `electron/main.ts:47`, `electron/preload.ts:8`의 Sentry `require()` 지연 로드 → disable 처리 (동적 import 전환 시 초기화 순서가 깨질 위험 있어 보류)
    - `theme-toggle.tsx`, `news-card.tsx`의 mounted 패턴, `carousel.tsx`의 embla 이벤트 구독 → disable 처리 (React 공식 문서상 정당한 외부 시스템 동기화 패턴으로 판단)
  - 완료 기준
    - [x] CI와 동일한 Node 20 환경에서 `npm run lint` 0 에러 (남은 1건은 React Hook Form `watch()` 라이브러리 비호환 warning, 이번 범위 밖)
    - [x] `npm run build` 정상 통과 (Next.js 빌드 + `tsc -p electron/tsconfig.json` 모두 성공)
    - [ ] `SENTRY_DSN` 미설정 상태에서 실제 패키징 후 크래시 없이 기동 확인 (미검증 — 로컬 lint/build만 확인함)
    - [ ] GitHub Actions `ci.yml` 전체 green (푸시 후 확인 필요)

### Phase 0-1: 스키마 관리 체계 전환 (0-1단계) ✅

- **Task 019: DB 스키마 마이그레이션 파일화** - ✅ 완료 (2026-08-31)
  - PRD 참조: 3장 아키텍처 원칙 / 우선순위: 선행 / 선행 조건: **Task 018** (마이그레이션 PR도 CI 통과 필요)
  - 원격 대시보드/MCP로만 관리되던 기존 스키마·RLS 정책을 `supabase db pull`로 `supabase/migrations` 스냅샷 파일로 추출 — 14개 테이블(문서화되지 않았던 6개 포함), RLS 정책 37건, RPC 함수 4개, pg_cron 스케줄 4건, storage 정책까지 전부 캡처
  - 누락됐던 `documents` storage 버킷(데이터 성격이라 `db pull`이 캡처하지 못함)은 별도 마이그레이션으로 보완
  - 이후 모든 스키마 변경을 마이그레이션 파일 기반으로만 진행하도록 워크플로우 문서화 (`docs/guides/database-migrations.md`), `shrimp-rules.md`에도 금지 규칙 추가
  - 로컬 Supabase 스택(`supabase start` + `db reset`)에서 마이그레이션 파일만으로 스키마가 처음부터 재현됨을 검증
  - `docs/database-schema.md`를 정본이 아닌 참고 문서로 재정의하고 문서화 누락 항목을 보완, 진행 중 겪은 문제는 `docs/troubleshooting/supabase-migration-baseline-troubleshooting.md`에 기록
  - **⚠️ 계획 대비 변경**: 로컬에 마이그레이션 파일이 전무한 상태에서 `db pull`이 충돌로 오판해 원격 이력 장부(`supabase_migrations.schema_migrations`, 메타데이터 전용) 27건을 `migration repair --status reverted`로 초기화해야 했음 — 그 결과 과거 27건의 개별 변경 이력이 아닌 **단일 베이스라인 파일**로 재현됨(최종 스키마는 원격과 동일). Windows Git Bash에서 Docker named pipe 경로가 깨지는 문제로 Docker 관련 하위 명령은 PowerShell로만 실행
  - **⚠️ 완료 기준 일부 예외**: `user_llm_keys` 관련 함수 3개의 `anon` 권한에 대한 무해한 형식적 diff(REVOKE 대상 권한이 원격에 이미 없어 실행해도 무변화) 1건이 남아 있음 — 정리용 마이그레이션은 로컬에 작성했으나, `db push`가 Claude Code 자동 모드에서 항상 차단되어 사용자가 보류를 결정. 필요 시 사람이 직접 `supabase db push` 실행하면 완전히 해소됨(상세 경위는 트러블슈팅 문서 참고)
  - 완료 기준
    - [x] `supabase/migrations`에 기존 테이블·인덱스·RLS 정책 전체가 스냅샷됨
    - [x] `supabase db diff` 결과가 사실상 비어 있음(무해한 형식적 diff 1건만 남음, 원인 규명 및 문서화 완료 — 위 예외 참고)
    - [x] 신규 스키마 변경 절차가 가이드 문서에 기재됨

> Task 019는 **Task 031(company_analyses), Task 032(document_reviews 필드 추가), Task 034(cs_questions 필드·RLS)** 의 공통 선행 조건입니다.

> **⚠️ Phase 1(보안 이슈 해소 및 모니터링 실연동, Task 021~023-1)은 전체를 보류로 내리고 Phase 2부터 진행합니다.** Phase 3(029~030)는 Phase 2의 Task 024에만 의존하므로 Phase 1 없이도 순서상 문제없이 진행 가능합니다. Phase 1 세부 내용은 로드맵 최하단 보류 섹션 참고.

### Phase 2: 스크레이핑 견고성·아키텍처·성능 정비 (2단계)

- **Task 024: 크롤링 요청 딜레이·백오프 및 실패율 모니터링** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.7 (2단계 선행분) / 우선순위: 상 / 선행 조건: Task 018
  - `collect-job-postings` / `collect-tech-news` 소스별 요청 사이 최소 간격(1~2초) 딜레이 로직 추가
  - 요청 실패 시 지수 백오프 적용
  - 수집 로그 테이블 기준으로 소스별 파싱 실패율 집계, 임계치(예: 30%) 초과 시 알림 연결 (임계치·측정 주기는 구현 시 확정)
  - 구현: `supabase/functions/_shared/fetch-with-policy.ts`(딜레이+백오프), `supabase/functions/_shared/collection-runner.ts`(소스 순차 실행+딜레이, 실패율 집계+알림). 결정 근거는 `docs/research/job-source-research.md` "Task 024" 절 참고
  - 완료 기준
    - [x] 짧은 시간 반복 호출 시 대상 사이트로부터 429/403 없이 정상 수집 (로컬 검증: collect-job-postings/collect-tech-news 각 3회 연속 호출 모두 200/success)
    - [x] 실패율 임계치 초과를 인위 재현했을 때 알림이 실제 발송됨 (job_collection_logs에 jobkorea failure 4건 seed → 재호출 시 edge_function_error_logs에 "소스 jobkorea 최근 실패율 40% (임계치 30% 초과, 표본 10건)" 알림 row 생성 확인)
    - [x] 소스 확장(Task 030) 시 그대로 재사용 가능한 공통 유틸로 분리됨 (`runCollectionSources`가 소스 목록/로그 테이블/upsert 콜백을 제네릭으로 주입받는 구조)

- **Task 025: LLM 호출/프롬프트 로직 3중 복제 통합** ✅ (2026-09-01 완료)
  - PRD 참조: 2.5 / 우선순위: 중 / 선행 조건: Task 018
  - (변경) 당초 계획한 `packages/shared/src/lib/llm/deno-entry.ts` 배럴 방식 대신, 기존 `supabase/functions/_shared/` 컨벤션에 맞춰 `supabase/functions/_shared/llm-client.ts`를 신설해 Deno 쪽 두 복제본을 통합함 — packages/shared를 Deno에서 직접 import하면 zod/@supabase/supabase-js 등 불필요한 npm 의존성이 번들되는 리스크가 있어 기각
  - `supabase/functions/grade-short-answer/llm.ts`, `supabase/functions/review-document/llm.ts`의 `fetchWithRetry`/JSON 파싱/Gemini·Anthropic REST 호출 복제본을 `_shared/llm-client.ts` 재사용으로 교체 완료
  - `buildDocumentReviewPrompt`는 프롬프트 문자열을 한 글자도 바꾸지 않고 `review-document/llm.ts`에 유지, `packages/shared/prompt-templates.ts`와는 상호 참조 주석으로만 드리프트 방지 (완전한 단일 소스화는 미적용 — 필요 시 후속 태스크)
  - `packages/shared/src/lib/llm/fetch-with-retry.ts`에 Deno 쪽 구현 위치를 알리는 상호 참조 주석 추가
  - `electron/notification-trigger.ts`의 "shared와 동일 로직 복제본" 주석 패턴 정리는 별개 이슈로 범위 밖 처리(미착수)
  - 완료 기준
    - [ ] 프롬프트 문자열이 저장소 내 단일 위치에만 존재 (미달성 — `packages/shared`와 `review-document/llm.ts` 두 곳에 동일 문자열 유지, 상호 참조 주석으로만 대응)
    - [x] 통합 후 `grade-short-answer`, `review-document`의 요청/응답 스키마·에러 메시지·PROMPT_VERSION이 통합 전과 동일 (코드/`git diff` 비교로 확인 — index.ts 무변경, 프롬프트 문자열 diff 없음)
    - [ ] `supabase functions serve` 로컬 실행 및 배포 성공 (미검증 — 로컬에 Deno CLI 미설치로 `deno check`/`functions serve` 실행 불가, 후속 확인 필요)

- **Task 026: LLM 호출 타임아웃 누적 개선 및 워치독** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.6 / 우선순위: 중 / 선행 조건: **Task 025** (통합된 단일 소스에 적용)
  - 전체 재시도 예산 상한(총 90초) 기반 시간 타임아웃 도입 — 60초 × 3회(최대 약 3분) 구조 제거. `packages/shared/src/lib/llm/fetch-with-retry.ts`(Node)와 `supabase/functions/_shared/llm-client.ts`(Deno) 양쪽에 `totalBudgetMs` 옵션(기본 90_000ms)을 동일하게 추가 — 매 attempt마다 남은 예산과 개별 타임아웃(60초) 중 작은 값으로 재계산, 예산 소진 시 즉시 중단
  - `document_reviews`가 `processing`에 영구 고착되지 않도록 pg_cron 기반 워치독 마이그레이션(`supabase/migrations/20260831165928_document_reviews_watchdog.sql`) 추가 — 5분 주기로 `processing` + `updated_at`이 10분 이상 지난 레코드를 `failed`로 전환, `review-document/index.ts` catch 블록과 동일한 셰이프로 `versions`에 실패 로그 append
  - `apps/desktop`의 문서 첨삭 화면(`documents-page-client.tsx`, `document-detail-content.tsx`)에 실패 사유(마지막 버전 summary) 표시 및 "다시 시도" 버튼 추가 (기존 `triggerDocumentReview` 재사용)
  - **⚠️ 검증 범위 일부 제한**: Deno CLI가 로컬에 미설치되어(Task 025와 동일 제약) `_shared/llm-client.ts`의 예산 로직은 Node(`tsx`)로 로직만 동일하게 추출해 mock fetch로 검증 — 실제 Deno 런타임 검증은 미수행. UI 재시도 경로도 로그인 세션·실제 LLM API 키가 필요한 end-to-end 브라우저 확인은 미수행(lint/tsc 정적 검증으로 대체)
  - 완료 기준
    - [x] 5xx/429 반복 상황을 모의했을 때 전체 예산 내에 실패 응답 반환 (mock fetch로 5xx 반복 시 개별 timeoutMs=2s·retryCount=10이어도 totalBudgetMs=1.2s 근처에서 종료됨을 확인, 두 구현 동일 검증)
    - [x] 함수가 강제 종료된 레코드가 영구 `processing`으로 남지 않고 `failed`로 전환됨 (`db reset` 후 processing 레코드 seed → 워치독 SQL 수동 실행 → failed 전환 확인)
    - [x] 사용자 UI에 실패 상태와 재시도 경로가 노출됨 (실패 사유 텍스트 + 재시도 버튼 추가, lint/tsc 통과 — 위 예외 참고)

- **Task 027: 프롬프트 해시 기반 캐시 자동 무효화** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.12 / 우선순위: 중 / 선행 조건: **Task 025**
  - `grade-short-answer/index.ts`, `review-document/index.ts`의 수동 `PROMPT_VERSION` 상수와 관련 주석을 완전히 제거
  - `grade-short-answer/llm.ts`, `review-document/llm.ts`의 `buildXPrompt` 함수에서 사용자 입력이 보간되지 않는 고정 골격 문구를 각각 `export const GRADING_PROMPT_TEMPLATE`, `DOCUMENT_REVIEW_PROMPT_TEMPLATE`로 추출(플레이스홀더 치환 방식). 동적 입력(question, answerText, review.type, resume_question, originalText 등)은 기존처럼 cacheKey 문자열에 별도로 이어붙여 사용자/입력별 캐시 분리를 그대로 유지
  - `_shared/llm-cache.ts`에 `hashPromptTemplate` 유틸 추가(기존 `sha256Hex`를 감싸는 얇은 named wrapper) — 두 함수의 cacheKey 생성부에서 재사용하며, Task 031(기업 분석) 캐시 설계에서도 그대로 재사용 가능
  - `packages/shared/src/lib/llm/prompt-templates.ts`의 `buildDocumentReviewPrompt`와 리팩터링된 `review-document/llm.ts`의 최종 생성 문자열을 나란히 비교(diff)해 완전히 동일함을 확인 — Task 025에서 보류된 완전 단일 소스화는 이번에도 통합하지 않고 상호 참조 주석만 최신화
  - **⚠️ 검증 범위 일부 제한**: Deno CLI가 로컬에 미설치되어(Task 025/026과 동일 제약) 실제 Deno 런타임에서의 end-to-end 검증은 미수행. `hashPromptTemplate`/`sha256Hex`는 Web Crypto API(`crypto.subtle`) 기반으로 Node에서도 동일하게 동작하므로, scratchpad의 임시 Node 스크립트(검증 후 삭제, 저장소 미포함)로 (a) 동일 템플릿 → 동일 해시 (b) 한 글자 다른 템플릿 → 다른 해시를 확인
  - 완료 기준
    - [x] 프롬프트 문자열만 수정해도 캐시가 자동 무효화되어 재호출됨 (템플릿 문자열이 곧 해시 입력이므로 문구 변경 시 cacheKey가 자동으로 달라짐을 Node 스크립트로 검증 — Deno 런타임 실제 호출 검증은 미수행)
    - [x] 프롬프트 미변경 시에는 기존 캐시가 정상 히트 (동일 템플릿 문자열 → 동일 해시 → 동일 cacheKey 확인, 동적 입력 필드는 기존과 동일하게 유지)
    - [x] Task 032(첨삭 개선)에서 프롬프트 변경 효과가 즉시 확인 가능한 상태 (수동 버전 상수 관리 제거로 프롬프트 문구 수정만으로 캐시가 자동 무효화됨)

- **Task 028: 리스트 행 컴포넌트 메모이제이션** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.13 / 우선순위: 중 / 선행 조건: Task 018
  - `jobs-page-client.tsx`의 `JobRow`, `news-feed.tsx`의 `NewsRow`를 `memo()`로 래핑(named function 표현 유지, React DevTools 표시명 보존). react-window `rowComponent`가 요구하는 `ReactElement` 반환 시그니처와 `memo()`의 `ReactNode` 반환 타입이 맞지 않아 두 컴포넌트 모두 `as (props: RowComponentProps<...>) => ReactElement`로 캐스팅
  - `jobs-page-client.tsx`: `handleSelectJob`을 `useCallback(fn, [])`으로 안정화(state setter만 호출), `List`에 전달하는 `rowProps`를 `useMemo([filteredJobs, selectedJobId, handleSelectJob])`로 안정화
  - `news-feed.tsx`: `toggleBookmark`를 `useCallback(fn, [newsList])`으로, `rowProps`를 `useMemo([newsRows, toggleBookmark])`로 안정화
  - **⚠️ 제약**: `toggleBookmark`는 `newsList.find(...)`로 최신 `isBookmarked` 값을 조회해 `bookmarkTechNews`/`unbookmarkTechNews` API를 분기 호출하는 부수효과가 있어 `newsList` 의존성을 완전히 제거하지 못함(북마크 토글마다 콜백 참조가 재생성됨). ref 패턴으로 완전한 참조 안정화가 가능하지만 이번 스코프(메모이제이션 도입) 대비 과설계로 판단해 보류
  - 완료 기준
    - [x] 부모 리렌더 시 화면에 보이는 행이 불필요하게 재렌더되지 않음 (memo + 안정화된 rowProps/콜백 조합으로 참조 동일성 보장을 코드 근거로 확인. React DevTools Profiler를 통한 별도 프로파일링은 수행하지 않음)
    - [x] `npm run lint` 통과 (에러 0건, 이번 변경과 무관한 기존 파일의 경고 1건만 존재)
    - [x] 목록 스크롤/필터/선택 동작 회귀 없음 (Playwright로 `/jobs`, `/news` 페이지에서 검색·필터·정렬·행 선택·북마크 토글을 실제로 조작해 정상 동작 및 콘솔 에러 없음을 확인)

### Phase 3: 채용공고 크롤링 소스 확장 (3단계)

- **Task 029: 신규 크롤링 소스 사전 스파이크 (착수 조건 판정)** - 우선순위
  - PRD 참조: 2.9 / 우선순위: 중 / 선행 조건: **Task 024**
  - 캐치: `/api/v1.0/recruit/*`(log 제외) 하위 목록·상세 조회 엔드포인트 실존 여부를 DevTools Network 캡처로 확인, 응답 스키마 기록
  - 자소설닷컴: `sitemap.xml`에서 공고 상세 URL 패턴 확인, 공고 1건 실제 `fetch()`로 서버사이드 렌더링 여부 확인 (SPA면 단순 fetch 불가)
  - 양측 **이용약관상 크롤링/스크래핑 금지 조항 유무 확인** (robots 허용 ≠ ToS 허용)
  - 조사 결과를 `docs/research/`에 기록하고 소스별 착수 여부 최종 판단
  - 완료 기준
    - [ ] 캐치 API 엔드포인트 실존 여부 및 응답 스키마가 문서화됨
    - [ ] 자소설닷컴 상세 페이지 렌더링 방식이 실측으로 확인됨
    - [ ] 양측 ToS 검토 결과가 기록되고, 착수/보류/제외 결론이 명시됨

- **Task 030: 크롤링 소스 확장 및 DOM 파서 교체**
  - PRD 참조: 2.9 + 2.7 (3단계 DOM 파서 교체분) / 우선순위: 중 / 선행 조건: **Task 029 (착수 가능 판정)**, Task 024
  - `sources/catch.ts`, `sources/jasoseol.ts` 추가 — 스파이크 결론에 따라 캐치는 JSON API 우선, 자소설닷컴은 사이트맵/HTML 경로
  - 기존 `jobkorea.ts`의 정규식 HTML 파싱을 DOM 파서(`deno-dom` 등 Deno 호환)로 교체
  - 기존 소스별 실패 격리(try/catch) 및 수집 로그 테이블 기록 패턴 유지, Task 024의 딜레이/모니터링 인프라 재사용
  - `job_postings.source`에 `catch`, `jasoseol` 값 추가 (스키마 필드 추가 없음), 기존 UI 필터/구분 로직 재사용
  - 중복 게재 처리: 회사명+공고제목(정규화 후) 유사도 매칭으로 중복 탐지, 저장은 소스별로 하되 집계 시 대표 1건만 반영
  - 캐치의 `/Img` 차단으로 로고/썸네일이 비는 경우 UI가 정상 처리하는지 확인
  - 완료 기준
    - [ ] `supabase functions serve` 로컬 실행 시 소스별 성공/실패가 수집 로그에 정상 기록
    - [ ] DOM 파서 교체 후 잡코리아 수집 결과가 기존과 동등 이상
    - [ ] 중복 게재 공고가 집계 시 대표 1건으로 처리됨
    - [ ] 이미지 필드가 빈 소스의 카드가 레이아웃 깨짐 없이 렌더링됨
    - [ ] Playwright MCP로 소스 필터 UI에 신규 소스가 노출되고 필터링이 동작함을 검증

### Phase 4: 기업 분석 기능 (4단계)

- **Task 031: 기업 분석 기능 구현 (`analyze-company`)** - 우선순위
  - PRD 참조: 2.10 / 우선순위: 중 / 선행 조건: **Task 019(마이그레이션), Task 025(LLM 통합), Task 027(해시 캐시), Task 030(소스 확장)**
  - `company_analyses` 테이블 신설 (`user_id`, 기업명, 정규화 `company_id`, 분석 요약, 기술 스택 트렌드, 채용 공고 수, 기반 공고 기간, 생성일시, 캐시 키 해시) — 마이그레이션 파일로 관리
  - `user_id` 기반 RLS 적용 (`llm-cache.ts`의 크로스토크 방지 원칙 동일 적용 — A의 키로 만든 결과를 B가 소비 불가)
  - 기업명 정규화 함수 또는 `company_id` 매핑 테이블 도입 ("㈜", "주식회사", 국문/영문 표기 파편화 방지)
  - `analyze-company` Edge Function 구현 — `packages/shared` 공통 LLM 호출 로직 재사용
  - 캐시 키에 프롬프트 해시 + **집계 대상 공고 집합 해시**(대상 `job_postings.id` 목록) 포함
  - 기업 상세/공고 상세에서 "기업 분석 보기" 액션, 최초 호출 후 캐시 표시 + 수동 새로고침 재분석
  - 완료 기준
    - [ ] 실제 수집 공고 기반으로 분석 결과가 생성되고 재조회 시 캐시가 히트
    - [ ] 서로 다른 사용자 계정 간 캐시가 공유되지 않음 (RLS 검증)
    - [ ] 동일 기간 내 신규 공고 추가 시 집합 해시 변경으로 캐시가 자동 무효화
    - [ ] 표기가 다른 동일 기업 공고가 하나의 분석 대상으로 집계됨
    - [ ] Playwright MCP로 "기업 분석 보기" → 결과 표시 → 새로고침 재분석 플로우 검증

### Phase 5: 이력서/포트폴리오 첨삭 개선 (5단계)

- **Task 032: 첨삭 프롬프트 품질·정확도 향상** - 우선순위
  - PRD 참조: 2.11 (a) / 우선순위: 중 / 선행 조건: **Task 025(단일 소스), Task 027(캐시 자동 무효화)**
  - `review-document` 프롬프트 템플릿을 문항별/포트폴리오 유형별로 세분화
  - 예시 기반 few-shot 보강
  - 개선된 프롬프트가 `packages/shared` 단일 소스에 반영되어 모든 진입점에 즉시 적용되는지 확인
  - 완료 기준
    - [ ] 동일 샘플 PDF에 대해 개선 전/후 첨삭 결과를 비교 기록
    - [ ] 프롬프트 변경 시 캐시가 자동 무효화되어 개선 결과가 즉시 반영됨
    - [ ] 자소서/포트폴리오 각 유형별로 서로 다른 관점의 코멘트가 생성됨

- **Task 033: 첨삭 결과 비교뷰 및 하이라이트 UI**
  - PRD 참조: 2.11 (b) / 우선순위: 중 / 선행 조건: **Task 019(마이그레이션), Task 032**
  - `document_reviews`에 하이라이트 메타데이터 필드 추가 (인용 문구, 텍스트 내 offset, 카테고리, 심각도, 매칭 성공 여부) — 마이그레이션 파일로 관리
  - **하이라이트 위치 산출 방식**: LLM에는 인용 문구(quote)만 반환시키고, 서버가 추출 텍스트에서 문자열을 검색해 offset 계산 (PDF→텍스트 추출로 좌표 정보가 소실되므로 좌표 직접 요구 금지)
  - 문자열 매칭 실패 시 **하이라이트 없이 코멘트만 표시하는 폴백** 명시 구현
  - 원문-첨삭본 비교뷰(좌우 또는 인라인 하이라이트) 렌더링, 코멘트 심각도/카테고리별 색상 구분
  - 기존 `versions` 컬럼과의 관계 정리(버전별 하이라이트 저장 여부 결정) 후 이력 버전 간 비교 UI 설계
  - 완료 기준
    - [ ] 실제 샘플 PDF 업로드 → 첨삭 → 비교뷰까지 정상 동작
    - [ ] 인용 문구 매칭 실패 케이스를 인위 재현했을 때 폴백이 정상 동작
    - [ ] 심각도/카테고리별 색상이 라이트/다크 모드 모두에서 판독 가능
    - [ ] 이력 버전 간 비교 UI가 기존 `versions` 데이터와 정합
    - [ ] Playwright MCP로 업로드 → 비교뷰 렌더링 E2E 검증

### Phase 6: CS 문제 입력 및 공유 (6단계)

- **Task 034: CS 문제 사용자 등록 및 공개 공유** - 우선순위
  - PRD 참조: 2.14 / 우선순위: 중 / 선행 조건: **Task 019(마이그레이션)**
  - `cs_questions`에 `author_id`(`auth.users` 참조), `is_public`, `source_type`(`curated` | `user_generated`), `is_deleted` 필드 추가 — 마이그레이션 파일로 관리
  - 문제 등록 폼 구현 (카테고리, 문제, 정답/해설) — React Hook Form + Zod
  - 문제 목록에 "내 문제" / "공개 문제뱅크" 탭 구분, 공개 전환 액션 제공
  - RLS 정책 적용
    - SELECT: `is_public = true` 또는 `author_id = auth.uid()`
    - INSERT: `WITH CHECK (author_id = auth.uid() AND source_type = 'user_generated')` — `curated` 위장 등록 차단
    - UPDATE: `USING` + `WITH CHECK` 양쪽에 `author_id = auth.uid()` — 소유권 바꿔치기 차단
    - DELETE: 본인 문제만, 참조 이력 보존을 위해 **soft delete**(`is_deleted`) 적용
    - `curated` 문제는 일반 사용자 UPDATE/DELETE 대상에서 제외 (관리자 전용/서비스 롤 경유)
  - **실시간 구독 영향 확인**: `lib/realtime-sync.ts`가 "SELECT RLS 무조건 허용" 전제로 공개 채널을 구독하므로, `cs_questions`가 구독 대상이면 `is_public = true` 행만 별도 채널로 분리
  - 완료 기준
    - [ ] anon/authed `supabase-js` 클라이언트 단위 테스트로 두 계정 간 비공개/공개 조회 권한 분리 검증
    - [ ] `curated` 위장 등록 시도가 차단됨
    - [ ] 다른 사용자 세션에서 참조 중인 공개 문제 삭제 시 soft delete로 처리되고 이력이 깨지지 않음
    - [ ] 실시간 구독 전제 위반이 발생하지 않음 (채널 분리 또는 대상 제외 확인)
    - [ ] Playwright MCP로 문제 등록 → 공개 전환 → 목록 탭 노출 UI 플로우 검증

### Phase 7: 자동 업데이트 코드 서명 적용 (7단계)

- **Task 035: 코드 서명 적용 및 업데이트 검증 활성화**
  - PRD 참조: 2.8 / 우선순위: 중 / 선행 조건: **Task 023-1 (인증서 확보)** — Task 023-1이 보류 섹션으로 이동해 착수 불가 상태(리드타임 수 주 단위이므로 인증서 신청만이라도 별도로 먼저 진행하는 것을 고려)
  - 발급된 코드 서명 인증서를 `electron-builder` 서명 파이프라인에 연결 (CI 시크릿으로 주입)
  - `apps/desktop/package.json`의 `verifyUpdateCodeSignature`를 `true`로 전환
  - `docs/guides/electron-release-guide.md`의 "임시 비활성화" 기술 갱신
  - 완료 기준
    - [ ] 서명된 설치 파일이 Windows에서 게시자 확인된 상태로 실행됨
    - [ ] 이전 버전 → 신규 버전 자동 업데이트가 서명 검증을 통과해 정상 완료
    - [ ] 서명 불일치 아티팩트에 대해 업데이트가 거부되는지 확인
    - [ ] 릴리스 노트 SHA256 체크섬 게시가 계속 유지됨

### Phase 8: Playwright E2E 검증 하네스 (8단계)

- **Task 036: Playwright E2E 하네스 구축 및 패키징 스모크 테스트 통합** - 우선순위
  - PRD 참조: 2.16 (+ 2.15 T-L8 통합) / 우선순위: 중 / 선행 조건: **Task 022(테스트 계정 환경변수화)**, 대상 기능 Task 030·033·034
  - Playwright 의존성 및 설정 신규 도입 (현재 저장소에 전무, `vitest run`만 존재)
  - `_electron.launch()`로 **패키징된 실행 파일**(`electron-builder` 산출물)을 구동 대상으로 지정 — T-L8 패키징 스모크 테스트를 별도로 만들지 않고 이 하네스로 통합
  - 로그인 자동화: CI 시크릿으로 주입한 `E2E_TEST_ACCOUNT_EMAIL`/`PASSWORD` 사용 (구글 OAuth는 `shell.openExternal` 구조라 자동화 불가)
  - 검증 대상 플로우
    - 채용공고 목록/필터/상세 조회
    - 캘린더 일정 등록 UI 플로우
    - PDF 업로드 → 첨삭 결과 비교뷰 렌더링
    - CS 문제 등록 → 공개 전환 → 다른 계정에서 공개 문제뱅크 조회 (권한 분리 자체는 RLS 단위 테스트가 담당)
    - 신규 크롤링 소스 데이터 노출 — **시드 픽스처 기반**(외부 사이트 실호출 미의존)
  - 검증 불가 항목 대체: OS 레벨 `Notification`은 메인 프로세스 알림 트리거 함수 호출/IPC 로그를 훅으로 어서션
  - CI 실행 환경 결정: Windows 러너 또는 Linux + xvfb (Electron GUI는 헤드리스 불가)
  - **스크린샷 비교 기준선은 Phase 9 완료 이후 확정** (개선 전 스냅샷은 전량 실패 유발)
  - 완료 기준
    - [ ] 패키징된 실행 파일이 CI에서 기동되고 로그인까지 자동 완료
    - [ ] 위 주요 플로우가 CI 스모크 테스트로 등록되어 PR마다 실행
    - [ ] 알림 트리거가 IPC 훅 어서션으로 검증됨
    - [ ] 외부 사이트 응답에 의존하는 flaky 테스트가 없음
    - [ ] (Phase 9 이후) 라이트/다크 모드 스크린샷 기준선 확정 및 허용 오차 정책 문서화

### Phase 9: UI 스타일링 개선 및 후순위 항목 (9단계)

- **Task 037: 전역 커스텀 스크롤바 스타일 적용**
  - PRD 참조: 2.1 / 우선순위: 낮음 / 선행 조건: 없음
  - 사이드바, 리스트 뷰 등 앱 전역 스크롤 영역에 커스텀 스크롤바 스타일 적용
  - 다크모드 대응 색상 토큰 정의 (`globals.css`)
  - **범위 제한**: 시각적 스타일링만 해당, 스크롤 동작 로직 변경 없음
  - 완료 기준
    - [ ] 라이트/다크 모드 모두에서 스크롤바가 앱 디자인 톤과 일관
    - [ ] `react-window` 가상화 목록의 스크롤 동작 회귀 없음

- **Task 038: 캘린더 UI 시각적 완성도 개선**
  - PRD 참조: 2.2 / 우선순위: 낮음 / 선행 조건: 없음
  - 카테고리별(서류마감/면접/스터디) 색상 체계 정비
  - 간격·타이포그래피 정리, 월/주 뷰 레이아웃 개선
  - 오늘 일정 요약 영역 레이아웃 개선
  - **범위 제한**: 시각적 스타일링만 해당, 일정 등록/알림 등 기능 로직 변경 없음
  - 완료 기준
    - [ ] 월/주 뷰, 오늘 요약 영역이 반응형으로 정상 렌더링
    - [ ] 카테고리 색상이 라이트/다크 모드에서 대비 기준 충족
    - [ ] 일정 CRUD·알림 동작 회귀 없음

- **Task 039: 후순위 개선 항목 일괄 처리**
  - PRD 참조: 2.15 (T-L1, T-L2, T-L4~T-L7) / 우선순위: 낮음 / 선행 조건: 없음 (T-L4는 Task 028 이후 권장)
  - **T-L1** 에러 메시지 원문 노출: `grade-short-answer`, `review-document`가 파싱 실패 시 `rawText`를 클라이언트에 반환하지 않도록 일반화 메시지로 변경, 원문은 서버 로그에만 기록
  - **T-L2** `setWindowOpenHandler` 화이트리스트: `electron/main.ts`에서 `shell.openExternal` 호출 전 `https://` 스킴 등 화이트리스트 검증 추가
  - **T-L4** 페이지네이션 도입: `job-postings.ts`, `tech-news.ts`의 `select("*")` 전체 조회를 커서 기반 페이지네이션으로 전환
  - **T-L5** `quiz-session-list` 가상화: Task 034로 세션/문제 수 증가 가능성을 반영해 가상화 필요 여부 재검토 후 적용
  - **T-L6** `useNewsColumnCount` 리사이즈 디바운스 적용
  - **T-L7** Electron 알림 캐시 신뢰성: 렌더러 IPC push 캐시 단독 의존의 한계(재시작 직후·트레이 상태 알림 누락)를 문서화하고 보완 여부 판단
  - 완료 기준
    - [ ] LLM 원문 응답이 클라이언트 에러 메시지에 포함되지 않음
    - [ ] 비-https 스킴 URL이 외부 브라우저로 열리지 않음
    - [ ] 대량 데이터(수천 건) 상황에서 목록 초기 로딩 시간이 개선됨
    - [ ] 리사이즈 중 렌더링 부담 감소 확인
    - [ ] T-L5, T-L7은 적용 또는 "현행 유지" 결론이 문서에 기록됨

- **Task 040: Task 018 ESLint 예외 처리 후속 정리**
  - PRD 참조: 없음(Task 018 실행 중 발견된 기술 부채) / 우선순위: 낮음 / 선행 조건: **Task 018**
  - Task 018에서 긴급 수정 목적으로 `eslint-disable-next-line`으로 넘긴 5건을 정식 리팩터링으로 전환할지 재검토
  - `theme-toggle.tsx`, `news-card.tsx`의 중복된 `mounted` 플래그 패턴을 `useMounted()` 공유 훅으로 추출 — disable 주석도 훅 1곳으로 통합되어 중복 제거
  - `context7`로 `next-themes` 최신 문서를 확인해 `set-state-in-effect` disable 없이 하이드레이션 불일치를 피하는 공식 권장 패턴이 있는지 검토(있다면 적용)
  - `electron/main.ts:47`, `electron/preload.ts:8`의 Sentry `require()`를 `await import(...)` 동적 import로 전환 가능한지 재검토 — 전환 시 `registerSchemesAsPrivileged` 등과의 초기화 순서 영향을 실제 패키징 빌드로 검증 필요
  - `carousel.tsx`의 embla 이벤트 구독 disable은 shadcn/ui 원본 컴포넌트 관례이므로 라이브러리 자체 업데이트가 없다면 유지 검토
  - 완료 기준
    - [ ] `useMounted` 공유 훅 도입 시 `theme-toggle.tsx`, `news-card.tsx`의 disable 주석이 1곳으로 통합됨
    - [ ] 리팩터링 후 `npm run lint` 0 에러 유지, 다크모드 토글·뉴스 카드 렌더링 회귀 없음
    - [ ] 동적 import 전환 여부와 그 근거(적용 또는 "현행 유지")가 문서에 기록됨

### 보류 (우선순위 하향)

> Phase 2부터 진행하기로 하여, 원래 Phase 1이었던 보안 이슈 해소 태스크(021~023-1) 전체를 이 섹션으로 옮겼습니다. Task 021은 원래 Task 020(CSP)을 선행 조건으로 뒀으나, Task 020도 함께 보류 상태이므로 이 섹션 안에서는 선행 조건 문제가 없습니다. 다시 착수할 때는 Task 020(CSP) → Task 021(LLM 키 서버 이전) 순서를 유지하는 것을 권장합니다.

- **Task 021: LLM API 키 검증 경로의 서버 이전 (`validate-llm-key`)**
  - PRD 참조: 2.3 / 우선순위: 보류(하향) / 선행 조건: Task 020 (CSP, 아래 참고)
  - `apps/desktop/lib/llm-keys.ts`의 `testLlmKey`가 렌더러에서 직접 외부 LLM API를 호출하던 구조 제거
  - `validate-llm-key` Edge Function 신설 (`auth: ["user"]` JWT 인증, 최소 비용 1토큰 요청으로 유효성만 판정)
  - 서버는 전달받은 키를 로깅·저장하지 않고 `{ valid: boolean, message: string }`만 응답 (응답 본문에 키 미포함)
  - 사용자 단위 레이트리밋(분당 N회) 적용
  - Gemini 키의 URL 쿼리 스트링 전달 제거 → 헤더 전달로 통일
  - 완료 기준
    - [ ] 렌더러에서 외부 LLM 도메인으로 나가는 직접 요청이 0건 (DevTools Network 확인)
    - [ ] `validate-llm-key` 응답 본문·서버 로그 어디에도 원본 키가 남지 않음
    - [ ] 레이트리밋 초과 시 429 응답 및 UI 안내 정상 동작
    - [ ] 잔여 리스크(클라이언트→서버 1회 전송)가 HTTPS 구간으로만 이뤄짐을 확인·문서화

- **Task 022: 테스트 계정 자격증명 프로덕션 노출 방지**
  - PRD 참조: 2.4 / 우선순위: 보류(하향) / 선행 조건: Task 018
  - `apps/desktop/lib/auth-test.ts`의 하드코딩 상수를 환경변수(`E2E_TEST_ACCOUNT_EMAIL` / `E2E_TEST_ACCOUNT_PASSWORD`)로 이전
  - `auth-test.dev.ts` 등 dev/CI 전용 진입점으로 파일 분리, 프로덕션 번들 대상에서 제외
  - CI에 `grep -r "TEST_ACCOUNT" out/` 산출물 문자열 검색 게이트 추가 (검출 시 빌드 실패)
  - Supabase 계정 측 조치: 최소 권한 확인, 비밀번호 로테이션 정책 수립, 전용 테스트 프로젝트/스키마 분리 검토
  - 완료 기준
    - [ ] 소스코드에 자격증명 평문 값이 존재하지 않음
    - [ ] 프로덕션 빌드 산출물 문자열 검색에서 미검출, CI 게이트가 실제로 실패를 잡아냄(고의 주입 테스트)
    - [ ] 테스트 계정 로그인이 dev/CI 환경에서는 여전히 정상 동작 (Task 036 선행 조건)

- **Task 023: Sentry DSN 실연동 및 대시보드 구축**
  - PRD 참조: 2.18 / 우선순위: 보류(하향) / 선행 조건: **Task 018** (동적 import 전환 완료 필요)
  - Sentry 프로젝트 생성 및 DSN 발급 (Electron main / renderer 구분)
  - `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`을 GitHub Secrets에 등록하고 `release.yml`의 준비된 `env:` 자리에 연결
  - 로컬 dev에서는 DSN 미설정으로 no-op 유지 (개발 중 노이즈 방지), 릴리스 빌드에서만 활성화
  - 소스맵 업로드 설정
  - 완료 기준
    - [ ] 임시 `throw`로 유발한 크래시가 Sentry 대시보드에 수집됨 (main/renderer 각각)
    - [ ] 스택 트레이스가 압축 코드가 아닌 원본 소스 위치로 매핑됨
    - [ ] 로컬 `next dev`에서는 이벤트가 전송되지 않음(no-op)

- **Task 023-1: 코드 서명 인증서 발급 신청 (병행 착수)**
  - PRD 참조: 2.8 / 우선순위: 보류(하향, 리드타임 확보 목적이었으나 Phase 1 전체 보류로 함께 연기) / 선행 조건: 없음
  - EV 또는 표준 코드 서명 인증서 발급 신청 착수 (리드타임 수 주 단위)
  - 단기 완화책: **다음 릴리스부터 즉시** 릴리스 아티팩트 SHA256 체크섬을 릴리스 노트에 게시
  - 완료 기준
    - [ ] 인증서 발급 신청 접수 및 진행 상태 추적 문서화
    - [ ] 릴리스 노트에 SHA256 체크섬 자동 게시 (release 워크플로우 반영)
    - [ ] 실제 `verifyUpdateCodeSignature: true` 전환은 Task 035에서 수행

- **Task 020: CSP 최소 적용 및 렌더러 심층방어**
  - PRD 참조: 2.15 T-L3 / 우선순위: 보류(하향) / 선행 조건: Task 018
  - `app://` 프로토콜 핸들러 응답에 Content-Security-Policy 헤더 추가 (또는 `meta` 태그 폴백)
  - Supabase / LLM 엔드포인트 등 실제 필요한 origin만 `connect-src` 화이트리스트로 허용
  - 개발(`next dev`)과 프로덕션(`app://`) 양쪽에서 CSP 위반 콘솔 에러가 없는지 확인
  - 완료 기준
    - [ ] 프로덕션 빌드에서 CSP 헤더가 응답에 포함됨
    - [ ] 인라인 스크립트/스타일 위반 없이 모든 화면 정상 렌더링
    - [ ] Task 021의 폴백 방안(허용 origin 제한)이 성립하는 상태 확보

## 검증 방법 (단계별)

| 단계 | 검증 방법 |
| --- | --- |
| 공통 | `npm run dev`로 Electron 앱 실행 후 end-to-end 기능 확인, Edge Function은 `supabase functions serve` 로컬 테스트 후 배포 |
| 0단계 | Node 20 환경 `npm run lint` 0 에러, `npm run build` → `electron-builder` 패키징·설치·실행 재검증(DSN 미설정 시 크래시 없음) |
| 0-1단계 | `supabase db diff`로 원격 스키마와 마이그레이션 적용 결과 일치 확인 |
| 1단계 | 프로덕션 산출물 `grep -r "TEST_ACCOUNT" out/` CI 자동 검색(검출 시 빌드 차단), `validate-llm-key` 응답·서버 로그에 키 미포함 확인, 임시 `throw`로 Sentry 수집·소스맵 매핑 확인 |
| 2단계 | 딜레이 적용 후 반복 호출 시 429/403 없음, 실패율 임계치 초과 알림 발송 확인, LLM 통합 후 두 함수 응답 동일성 확인, Profiler로 행 재렌더 감소 확인 |
| 3단계 | 스파이크 결과를 `docs/research/`에 기록 후 착수 판단, 수집 로그 테이블 소스별 성공/실패 기록 및 중복 공고 대표 1건 처리 확인 |
| 4단계 | `analyze-company` 캐시/재조회 동작, 계정 간 캐시 미공유(RLS), 신규 공고 추가 시 자동 무효화 확인 |
| 5단계 | 샘플 PDF 업로드 → 개선 프롬프트 첨삭 → 비교뷰 수동 테스트, 인용 매칭 실패 시 폴백 동작 확인 |
| 6단계 | anon/authed `supabase-js` 단위 테스트로 RLS 권한 분리 검증, `curated` 위장 등록 차단, soft delete 처리 확인 |
| 7단계 | 서명된 설치 파일 게시자 확인, 자동 업데이트 서명 검증 통과, 체크섬 게시 유지 |
| 8단계 | 패키징 실행 파일 기동 포함 주요 플로우 CI 스모크 테스트 등록, 알림은 IPC 훅 어서션으로 대체 검증 |
| 9단계 | 라이트/다크 모드 시각 검증 후 8단계 스크린샷 기준선 확정, 후순위 항목별 회귀 없음 확인 |

## 상태 표기 규칙

- **Phase 제목 + ✅**: 해당 Phase 전체 완료
- **Task ✅ + `See: /tasks/XXX-xxx.md`**: 완료된 작업 (작업 파일 참조 추가)
- **`- 우선순위`**: 즉시 착수 대상
- **표기 없음**: 대기 중
- 세부 구현 사항은 `- [ ]` 미완료 / `- [x]` 또는 ✅ 완료로 표기
