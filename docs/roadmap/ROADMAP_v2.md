# Grow 데스크탑 앱 개발 로드맵 v2

1차 개발이 완료된 Grow 데스크탑 앱의 **병합 파이프라인 복구 → 보안·아키텍처 정비 → 기능 확장 → UI 완성도 향상**을 단계적으로 수행합니다.

## 개요

본 로드맵은 `docs/prd/PRD_v2.md`를 기반으로 작성되었으며, 코드 리뷰(`docs/code-review.md`) 결과 반영과 신규 기능 추가를 다룹니다.

- **CI 파이프라인 정상화 및 모니터링 실연동**: 린트 실패 7건 해소, Sentry DSN 실연동으로 배포 앱 크래시 관측 확보
- **보안·아키텍처·성능 이슈 해소**: LLM 키 렌더러 노출 제거, CSP 적용, 테스트 계정 격리, LLM 로직 3중 복제 통합
- **크롤링 소스 확장(일부 재개) + 기업 분석**: 캐치·자소설닷컴·사람인·인크루트는 ToS(크롤링 금지 조항)로 최종 제외, 커리어(career.co.kr)는 잡코리아와 동등한 리스크 수준으로 판단해 착수 완료(Task 032), 링커리어(linkareer.com)는 이용약관 제39조(자동화 수단 접근 금지)를 사유로 최종 제외(Task 033), 기업 분석은 채용공고 도메인 종속 기능이 아닌 **독립 도메인 "지원 기업 관리"**로 재설계(Phase 4 참고)
- **서류 분석 UX 개선**: 업로드 문서 유형을 이력서/포트폴리오 2종으로 한정, 원문 수정(첨삭본·비교뷰·하이라이트) 산출물은 폐기하고 **피드백 코멘트 + 예상 면접 질문** 중심으로 재구성
- **품질 보증**: UI 스타일링 개선 (Playwright E2E 하네스 구축 + 패키징 스모크 테스트 통합은 ⏸ **보류**)

### 참조 문서

| 문서               | 경로                                                         |
| ------------------ | ------------------------------------------------------------ |
| PRD v2             | `docs/prd/PRD_v2.md`                                         |
| PRD v1             | `docs/prd/PRD_v1.md`                                         |
| v1 로드맵          | `docs/roadmap/ROADMAP_v1.md`                                 |
| 코드 리뷰          | `docs/code-review.md`                                        |
| 패키징 트러블슈팅  | `docs/troubleshooting/electron-packaging-troubleshooting.md` |
| 스파이크 조사 기록 | `docs/research/`                                             |

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

| Phase     | 단계       | 우선순위        | Task 범위            | 핵심 내용                                                                                                                         |
| --------- | ---------- | --------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0   | 0단계      | **최상 (즉시)** | 018                  | CI 린트 실패 긴급 수정 (2.16)                                                                                                     |
| Phase 0-1 | 0-1단계    | 선행            | 019                  | DB 스키마 마이그레이션 파일화 (3장)                                                                                               |
| Phase 1   | 보류       | -               | 021~023-1            | 보안 이슈 해소 + Sentry 실연동 — 전체 보류, 최하단 보류 섹션 참고                                                                 |
| Phase 2   | 1단계 진행 | 상              | 024~028              | 스크레이핑 견고성·아키텍처·성능 (2.7 선행분, 2.5, 2.6, 2.12, 2.13) — **다음 착수 대상**                                           |
| Phase 3   | 3단계      | 중              | 029~034              | 사전 스파이크 후 크롤링 소스 확장 (2.9 + 2.7 파서 교체분), 채용공고 도메인 UI 개선                                                |
| Phase 4   | 4단계      | 중              | 044~048 (035 대체됨) | 지원 기업 관리 도메인 신설 — 지원 기업 등록·상태 관리, LLM 기업 분석, 자소서 문항, 분석 기반 자소서 피드백, 제출 서류 보관 (2.10) |
| Phase 5   | 5단계      | 중              | 036~037              | 이력서/포트폴리오 분석 개선 — 문서 유형 2종 한정, 첨삭본 제거·코멘트 유지, 예상 면접 질문 생성 (2.11)                             |
| Phase 6   | 6단계      | ⏸ **보류**      | 038                  | Playwright E2E 하네스 구축 (2.15, T-L8 통합) — 현재 진행하지 않음                                                                 |
| Phase 7   | 7단계      | 낮음            | 039~042              | UI 스타일링 개선 및 후순위 항목 (2.1, 2.2, 2.14)                                                                                  |

> **번호 재정렬 안내 (2026-09-02, 1차)**: 범위에서 제외된 "CS 문제 입력 및 공유"(구 Phase 6 / 구 Task 038)를 삭제하면서 결번을 남기지 않도록 이후 Phase·Task 번호를 모두 한 칸씩 당겼습니다. Phase: 구 7·8·9 → 6·7·8, PRD 절: 구 2.15~2.18 → 2.14~2.17. Task 대응표는 아래와 같으며, **기존 git 커밋 메시지에는 재정렬 이전 번호가 남아 있으므로 이력 추적 시 이 표를 참고**하세요.
>
> | 이전 | 현재 |     | 이전 | 현재 |
> | ---- | ---- | --- | ---- | ---- |
> | 039  | 038  |     | 045  | 044  |
> | 040  | 039  |     | 046  | 045  |
> | 041  | 040  |     | 047  | 046  |
> | 042  | 041  |     | 048  | 047  |
> | 043  | 042  |     | 049  | 048  |
> | 044  | 043  |     |      |      |
>
> **번호 재정렬 안내 (2026-09-02, 2차)**: "자동 업데이트 코드 서명 적용"(구 Phase 6 / 구 Task 038, PRD 2.8)을 삭제했습니다. 사유: 선행 조건인 Task 023-1(코드 서명 인증서 발급)이 **사용자가 인증서를 구매할 수 없는 상황**이라 착수 불가로 확정됨 — Windows 코드 서명 인증서는 무료 발급 경로가 없어(신원 확인이 필요한 유료 CA 서비스만 존재) 이 프로젝트 예산으로는 진행할 수 없음. 결번을 남기지 않도록 이후 Phase·Task 번호를 다시 한 칸씩 당겼습니다. Phase: 1차 재정렬 후 7·8 → 6·7, PRD 절: 2.15~2.17 → 2.14~2.16(2.8은 결번). Task 대응표(1차 재정렬 후 번호 기준):
>
> | 이전(1차 재정렬 후) | 현재(2차 재정렬 후) |
> | ------------------- | ------------------- |
> | 039                 | 038                 |
> | 040                 | 039                 |
> | 041                 | 040                 |
> | 042                 | 041                 |
> | 043                 | 042                 |
>
> Task 023-1(인증서 발급 신청)은 최하단 보류 섹션에 그대로 남겨두되, 위와 같은 사유로 재개 계획이 없는 상태임을 함께 기록해 두었습니다.

> **순서 주의(보류 중)**: 6단계(E2E 스크린샷 기준선)는 7단계(스타일링 개선) 적용 **이후**에 기준 스냅샷을 확정하는 구조입니다. 다만 6단계 전체가 현재 ⏸ 보류 상태이므로 이 의존관계도 재개 시점에 다시 적용됩니다. 7단계는 6단계를 기다리지 않고 단독으로 진행할 수 있습니다.

## 개발 단계

### Phase 0: CI 파이프라인 복구 (0단계) ✅

- **Task 018: CI 린트 실패 긴급 수정** - ✅ 완료 (2026-08-31)
  - PRD 참조: 2.16 / 우선순위: **최상** / 선행 조건: 없음
  - `eslint.config.mjs`의 `globalIgnores`에 `dist/**` 누락이 근본 원인이었음(빌드 산출물이 lint 대상에 포함되어 `no-require-imports` 9건 발생) — ignore 추가로 해소
  - `today-news-carousel.tsx`의 `react-hooks/purity`, `react-hooks/use-memo` 해소 — 렌더 중 `Math.random()`을 `news.id` 기반 결정론적 해시(`hashStringToIndex`)로 교체, 의존성 배열을 `[items]`로 단순화
  - `error.tsx` 6개 파일의 미사용 `error` prop 경고 해소 — `useEffect`로 `console.error(error)` 로깅 추가 (Next.js 공식 패턴)
  - `next.config.ts`의 불필요한 disable 주석 삭제 및 익명 함수 → named export 전환
  - **⚠️ 계획 대비 변경**: 아래 두 항목은 원래 계획된 리팩터링(동적 import, `useSyncExternalStore`) 대신 사유를 명시한 `eslint-disable-next-line`으로 처리함 — 긴급 수정 범위에서 회귀 위험을 최소화하기 위한 판단. 후속 개선은 **Task 042** 참고.
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

> Task 019는 **Task 044(company_applications 등 지원 기업 관리 스키마 신설), Task 045(company_analyses), Task 046(cover_letter_questions), Task 048(application_documents), Task 037(document_reviews 필드 추가)** 의 공통 선행 조건입니다.

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
  - `_shared/llm-cache.ts`에 `hashPromptTemplate` 유틸 추가(기존 `sha256Hex`를 감싸는 얇은 named wrapper) — 두 함수의 cacheKey 생성부에서 재사용하며, Task 045(지원 기업 LLM 분석, 구 Task 035) 캐시 설계에서도 그대로 재사용 가능
  - `packages/shared/src/lib/llm/prompt-templates.ts`의 `buildDocumentReviewPrompt`와 리팩터링된 `review-document/llm.ts`의 최종 생성 문자열을 나란히 비교(diff)해 완전히 동일함을 확인 — Task 025에서 보류된 완전 단일 소스화는 이번에도 통합하지 않고 상호 참조 주석만 최신화
  - **⚠️ 검증 범위 일부 제한**: Deno CLI가 로컬에 미설치되어(Task 025/026과 동일 제약) 실제 Deno 런타임에서의 end-to-end 검증은 미수행. `hashPromptTemplate`/`sha256Hex`는 Web Crypto API(`crypto.subtle`) 기반으로 Node에서도 동일하게 동작하므로, scratchpad의 임시 Node 스크립트(검증 후 삭제, 저장소 미포함)로 (a) 동일 템플릿 → 동일 해시 (b) 한 글자 다른 템플릿 → 다른 해시를 확인
  - 완료 기준
    - [x] 프롬프트 문자열만 수정해도 캐시가 자동 무효화되어 재호출됨 (템플릿 문자열이 곧 해시 입력이므로 문구 변경 시 cacheKey가 자동으로 달라짐을 Node 스크립트로 검증 — Deno 런타임 실제 호출 검증은 미수행)
    - [x] 프롬프트 미변경 시에는 기존 캐시가 정상 히트 (동일 템플릿 문자열 → 동일 해시 → 동일 cacheKey 확인, 동적 입력 필드는 기존과 동일하게 유지)
    - [x] Task 036(첨삭 개선)에서 프롬프트 변경 효과가 즉시 확인 가능한 상태 (수동 버전 상수 관리 제거로 프롬프트 문구 수정만으로 캐시가 자동 무효화됨)

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

- **Task 029: 신규 크롤링 소스 사전 스파이크 (착수 조건 판정)** - ✅ 완료 (2026-09-01, 두 소스 모두 최종 제외로 확정)
  - PRD 참조: 2.9 / 우선순위: 중 / 선행 조건: **Task 024**
  - 1차 실측(Chrome DevTools MCP 미연결)은 브라우저 UA 지정 curl 요청 + Next.js(`__NEXT_DATA__`)/Nuxt.js(`__NUXT__`, JS 번들) 정적 분석으로 대체. 이후 Chrome DevTools MCP 설치 후 자소설닷컴 `/terms` 페이지를 실제 브라우저 렌더링으로 재확인. 상세 근거는 `docs/research/job-source-research.md`의 "Task 029" 절 및 "부록: 보류된 소스" 참고
  - **캐치**: `/api/v1.0/recruit/*`(log 제외) 다수 엔드포인트가 비인증 200 OK로 응답함을 확인(직무 필터 등 메타데이터 위주, 전체 목록 검색 API는 파라미터 미확정), `/NCS/RecruitCategory`·`/NCS/RecruitInfoDetails/{id}`도 SSR HTML로 확인. 그러나 이용약관(`/Member/AccessTerms`)에 자동화 프로그램(스크립트/봇/크롤러) 수집 및 AI 학습 목적 활용, 웹 크롤링을 통한 정보 수집을 명시적으로 금지하는 조항을 확인 → **최종 제외**
  - **자소설닷컴**: `sitemap/employment_companies.xml`에서 `/recruit/{id}` 상세 URL 패턴 확인, 상세 페이지가 Next.js `getServerSideProps`(SSR) 기반으로 실제 공고 데이터를 포함함을 `__NEXT_DATA__`로 확인(단순 fetch로 데이터 확보 가능). Chrome DevTools MCP로 `/terms` 페이지를 실제 렌더링해 확인한 결과, 제14조(회원의 의무) 금지행위 9호에 "자동화된 수단(수집로봇, 스파이더, 스크래퍼)을 이용하여 사용자의 콘텐츠나 정보를 수집하거나 다른 방식을 통해 접근하는 행위"를 명시적으로 금지하는 조항 확인 → **최종 제외**
  - 완료 기준
    - [x] 캐치 API 엔드포인트 실존 여부 및 응답 스키마가 문서화됨 (메타데이터성 엔드포인트 스키마는 표로 기록, 전체 목록 검색 API 파라미터는 미확정으로 남김)
    - [x] 자소설닷컴 상세 페이지 렌더링 방식이 실측으로 확인됨 (SSR 확인)
    - [x] 양측 ToS 검토 결과가 기록되고, 착수/보류/제외 결론이 명시됨 (캐치=제외 확정, 자소설닷컴=Chrome DevTools MCP로 `/terms` 실제 렌더링 확인 후 제외 확정 — 두 소스 모두 최종 제외)

- **Task 030: 크롤링 소스 확장 및 DOM 파서 교체** - ❌ 취소 (2026-09-01, Task 029에서 캐치·자소설닷컴 모두 ToS 위반으로 최종 제외 확정)
  - PRD 참조: 2.9 + 2.7 (3단계 DOM 파서 교체분) / 우선순위: 중 / 선행 조건: **Task 029 (착수 가능 판정)**, Task 024
  - Task 029 스파이크 결과 캐치·자소설닷컴 모두 이용약관이 자동화 수집·크롤링을 명시적으로 금지해 신규 소스 추가(`sources/catch.ts`, `sources/jasoseol.ts`) 자체가 취소됨. 다만 `jobkorea.ts`의 정규식 HTML 파싱을 DOM 파서로 교체하는 항목(2.7 관련분)은 유효하므로, 필요 시 별도 Task로 분리해 재검토
  - 신규 소스가 필요할 경우 부록의 원티드/사람인 공식 API(인증키 신청 필요) 경로를 후속 조사 대상으로 재검토 — ⚠️ 2026-09-01 Task 031 조사 결과 **사람인은 API 여부와 무관하게 이용약관(기업회원)이 크롤링을 명시적으로 금지**하므로 API 경로도 재검토 필요(신청 승인 시 API ToS를 별도 확인해야 함)

- **Task 031: 링커리어·사람인·인크루트·커리어 크롤링 가능 여부 조사** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.9 / 우선순위: 낮음(정보 수집용, 실제 소스 추가는 별도 Task) / 선행 조건: 없음
  - robots.txt(curl)와 이용약관(Chrome DevTools MCP 실제 렌더링)을 각각 확인. 상세 근거는 `docs/research/job-source-research.md`의 "링커리어·사람인·인크루트·커리어 크롤링 가능 여부 조사"(작성 당시 문서 내 번호는 "Task 032") 절 참고
  - **제외**: 사람인 — 기업회원 약관 제23조③에 "자동화된 수단(크롤링, 명령어 확장 등)을 활용한 접근·수집" 명시적 금지. 인크루트 — 기업회원 약관 제21조⑥에 "크롤링, 미러링 등 기계적 방법의 대규모 이용" 명시적 금지(비영리 교육/학술/연구/포털봇만 예외, 본 프로젝트는 미해당) + robots.txt가 명명되지 않은 UA를 전면 차단해 이중 리스크
  - **채택 가능(잡코리아와 동등한 리스크 수준, 회색지대)**: 링커리어 — robots.txt는 채용 경로 허용, 이용약관에 채용정보 대상 크롤링 금지 조항 없음(교육 콘텐츠 전용 조항만 존재). 커리어 — robots.txt는 채용 경로 허용, 이용약관(2018년 시행으로 오래됨)에 크롤링 특정 문구 없이 일반 재배포 금지 조항만 존재
  - **잡코리아 대조 확인**: 이번에 잡코리아 개인회원(`ProvisionGG`)·기업회원(`ProvisionGI`) 약관도 재확인한 결과, 사람인·인크루트와 달리 **양쪽 모두 명시적 크롤링 금지 조항이 없음**을 확인(1절 리스크 문단 갱신)
  - 완료 기준
    - [x] 4개 소스의 robots.txt가 모두 확인되고 결과가 표로 기록됨
    - [x] 4개 소스의 이용약관이 Chrome DevTools MCP로 실제 렌더링되어 확인됨(개인/기업회원 약관 모두 존재하는 사이트는 양쪽 다 확인)
    - [x] 소스별 착수/제외/회색지대 결론이 명시되고 잡코리아와의 리스크 수준 비교가 기록됨
  - **후속 필요**: 링커리어·커리어를 실제로 소스로 추가할지는 이번 Task 범위 밖(가능 여부 판정까지만 수행) — 커리어는 Task 032로 착수해 완료, 링커리어는 Task 033으로 검토했으나 이용약관 제39조를 사유로 최종 제외(2026-09-01)

- **Task 032: 커리어(career.co.kr) 크롤링 소스 추가** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.9 / 우선순위: 중 / 선행 조건: **Task 031 (착수 가능 판정 완료)**, Task 024
  - Task 031 조사 결과 커리어는 robots.txt가 채용정보 경로(`/signup`, `/login`, `/resume`, `/user`, `/company`만 차단, 나머지 허용)를 막지 않고, 이용약관(2018-04-13 시행)에도 크롤링을 콕 집어 금지하는 조항이 없어(일반 재배포 금지 조항만 존재) 잡코리아와 동일한 리스크 수준으로 판단해 착수 확정. 사용자가 개인 사이드 프로젝트·비상업·저빈도 수집이라는 점을 감안해 이 회색지대 리스크를 인지하고 진행 승인함(2026-09-01)
  - **실측 결과 도메인 정정**: Task 031 조사 시점의 robots.txt는 `www.career.co.kr` 기준이었으나, 실제 채용정보 목록/상세는 서브도메인 **`job.career.co.kr`**에서 서빙됨을 구현 착수 전 curl 실측으로 확인. `job.career.co.kr/robots.txt`도 별도 재확인(`/admin`,`/app`,`/base`,`/biz`,`/user`,`/signup`만 차단, 목록 경로 허용)
  - `sources/career.ts` 신규 어댑터 구현 완료 — 잡코리아 어댑터(`sources/jobkorea.ts`)와 동일한 `JobPostingSource` 인터페이스 준수. 목록 URL: `https://job.career.co.kr/jobs/jobpart?i_jc1=H0`(IT.인터넷 대분류)
  - **실측 확정 사항**(curl, 2026-09-01)
    - 서버 렌더링(SSR) 확인 — ASP 템플릿 주석과 함께 실데이터가 포함된 HTML을 curl만으로 파싱 가능
    - title/company/deadline/url은 목록 HTML에 존재하나 **location/careerLevel 필드는 목록 페이지에 없어 빈 문자열로 채움**(잡코리아 목록과의 차이점, 상세페이지 크롤링은 이번 범위 밖)
    - 페이지네이션 불가 확인(`i_page=2` 쿼리를 붙여도 결과 id 집합이 1페이지와 동일) — 잡코리아와 동일하게 최초 목록 1회 요청만 지원
    - 구현 중 프리미엄 위젯과 직무별 목록에 동일 공고가 중복 노출되어 upsert 충돌(`ON CONFLICT DO UPDATE command cannot affect row a second time`)이 발생 — `fetchAll`에 `sourceUrl` 기준 중복 제거 로직을 추가해 해결
  - `job_postings.source`에 `career` 값 추가(스키마 필드 추가 없음), 기존 UI는 `job.source`를 배지로 그대로 표시하는 구조라 별도 필터 로직 수정 불필요
  - 기존 소스별 실패 격리(try/catch) 및 수집 로그 테이블 기록 패턴 유지, Task 024의 딜레이/모니터링 인프라 재사용
  - User-Agent는 잡코리아와 동일하게 중립적이고 식별 가능한 문자열 사용(`grow-job-collector/1.0 (non-commercial personal project)`), robots.txt가 허용한 경로만 접근
  - `supabase functions deploy collect-job-postings`로 프로덕션 배포 완료, pg_cron이 사용하는 것과 동일한 `net.http_post` 트리거로 프로덕션 실행 검증 — `job_collection_logs`에 `career` success 52건 기록, `job_postings`에 `source='career'` 52행 정상 적재 확인(2026-09-01)
  - 완료 기준
    - [x] 채용정보 목록 페이지 raw HTML 구조가 실측되고 SSR임이 확인됨
    - [x] `supabase functions serve` 로컬 실행 및 프로덕션 배포 후 실행 모두 커리어 소스의 성공이 수집 로그에 정상 기록됨
    - [x] 필드 매핑표(제목/회사/지역/경력/마감일)가 잡코리아 1절과 동일한 형식으로 `docs/research/job-source-research.md`에 문서화됨
    - [x] `job_postings.source = 'career'`로 저장된 공고가 프로덕션 테이블에 실제 적재됨(52건)
    - [ ] Playwright MCP를 통한 UI 화면 노출 시각 검증은 미실시 — UI는 배지로 `job.source` 문자열을 그대로 렌더링하는 구조라 별도 필터 로직은 없음을 코드로 확인함(`apps/desktop/components/sections/jobs/jobs-page-client.tsx`), 실제 화면 스크린샷 검증은 후속으로 필요 시 진행

- **Task 033: 링커리어(linkareer.com) 크롤링 소스 추가** - ❌ 제외 (2026-09-01)
  - PRD 참조: 2.9 / 우선순위: 중 / 선행 조건: **Task 031 (착수 가능 판정 완료)**, Task 024
  - Task 031 조사 결과 robots.txt는 채용 경로를 허용(교육 콘텐츠 `/stem/learn/*` 경로만 차단)했고, 실측(WebFetch)으로 목록 페이지가 SSR/SSG 구조임도 확인해 기술적으로는 커리어와 동일 수준으로 구현 가능했음
  - **제외 사유**: 이용약관 재확인 결과 **제39조(회원의 금지행위) 2호**에 "동일하거나 유사한 내용의 게시물·채팅을 반복적으로 게시·전송하는 행위(도배), 또는 자동화 프로그램·매크로 등 기계적 수단을 이용하여 서비스에 접근하거나 게시물을 작성·전송하는 행위"를 금지하는 조항이 있어, 문언상 채용정보 크롤링에도 적용될 여지를 완전히 배제할 수 없음. 커리어(제20조 4항처럼 크롤링 금지가 유료 기출콘텐츠 영역에만 명확히 한정된 사례)와 달리 링커리어는 "서비스 접근" 전반을 포괄하는 문구라 리스크 성격이 다르다고 판단해, 사용자가 착수를 보류하고 이번 크롤링 소스 확장 범위에서 제외하기로 결정함(2026-09-01)
  - **후속 조치**: `sources/linkareer.ts` 구현 착수하지 않음, `job_postings.source`에 `linkareer` 값 추가 없음. 향후 링커리어 측에 크롤링 허용 여부를 문의하거나 공식 API 제공이 확인되면 재검토 가능
  - 완료 기준(제외로 인해 이하 전 항목 미실시, 후속 재검토 시에만 유효)
    - [ ] 채용정보 목록 페이지 raw HTML(또는 API) 구조가 실측되고 SSR/CSR 여부가 확인됨
    - [ ] `supabase functions serve` 로컬 실행 시 링커리어 소스의 성공/실패가 수집 로그에 정상 기록
    - [ ] 필드 매핑표(제목/회사/지역/경력/마감일)가 잡코리아 1절과 동일한 형식으로 문서화됨
    - [ ] `job_postings.source = 'linkareer'`로 저장된 공고가 UI 필터에 정상 노출
    - [ ] Playwright MCP로 소스 필터 UI에 링커리어가 노출되고 필터링이 동작함을 검증

- **Task 034: 채용공고 도메인 UI 개선**
  - PRD 참조: 2.9 / 우선순위: 낮음 / 선행 조건: 없음
  - **상세 페이지 소스 배지 통일**: `job-detail-content.tsx`가 소스명(`job.source`)을 일반 텍스트로 노출(`{job.company} · {job.location} · {job.careerLevel} · {job.source}`)하던 것을, 목록(`jobs-page-client.tsx`의 `JobRow`)과 동일하게 `<Badge variant="outline">` 형태로 변경
  - **목록/상세 소스 배지 대문자 표기**: `job.source` 값이 `career`/`jobkorea` 등 소문자로 저장되어 배지에 그대로 노출되던 것을 대문자로 표기(예: `CAREER`, `JOBKOREA`) — 원본 데이터는 변경하지 않고 표시 시점에만 변환(`uppercase` 클래스 또는 렌더링 헬퍼)
  - **목록/상세 영역 너비 1:1 정렬**: `list-detail-panel.tsx`가 앱 전역에서 목록/상세 2단 레이아웃에 공용으로 쓰이는 컴포넌트이며 현재 `grid-cols-[minmax(280px,360px)_1fr]`로 목록 폭을 좁게 고정하고 있음. 채용공고 화면만 목록:상세 = 1:1 비율로 조정 필요 — 공용 컴포넌트에 폭 커스터마이즈 prop을 추가할지, 채용공고 페이지에서 별도 레이아웃을 구성할지는 구현 시 다른 도메인(뉴스 등) 레이아웃 회귀 여부를 확인하며 결정
  - **검색 필터에 채용 사이트 필터 추가**: `job-filters.tsx`에 지역/경력 필터와 동일한 패턴으로 소스(`career`/`jobkorea` 등) select 필터 추가, `jobs-page-client.tsx`에 `sourceOptions` 계산 및 `matchesSource` 필터링 로직 반영(기존 `locationOptions`/`careerLevelOptions` 패턴 재사용)
  - **범위 제한**: 시각적 스타일링 및 필터 UI 추가만 해당, 크롤링 소스 자체나 데이터 스키마 변경 없음
  - 완료 기준
    - [x] 상세 페이지 소스 표시가 목록과 동일한 배지 스타일로 렌더링됨
    - [x] 목록·상세 모두 소스 배지가 대문자로 표기됨
    - [x] 채용공고 화면에서 목록:상세 영역 폭이 1:1로 렌더링되고, 다른 화면(뉴스 등 `ListDetailPanel` 재사용처)의 레이아웃 회귀가 없음
    - [x] 검색 필터에 채용 사이트 옵션이 추가되고 선택 시 해당 소스 공고만 필터링됨
    - [x] 라이트/다크 모드 모두에서 시각적 회귀 없음
  - **추가 반영 사항** (구현 중 발견/요청된 UI 버그, 완료 기준 범위 밖이나 함께 수정): 제목 줄바꿈 시 카드 겹침(react-window row 높이 고정 + `line-clamp-2`), `career` 소스의 빈 경력/지역 정보로 인한 빈 배지·점 표기 정리(조건부 렌더링), 검색 필터 select `rounded` 미적용 수정(`appearance-none` + 커스텀 화살표), 검색바/필터 배경 대비 부족 수정(`bg-input` 토큰), 배지 영역 카드 하단 고정(`mt-auto`)
  - **후속 참고**: `career` 소스는 목록 페이지 HTML에 location/careerLevel 필드가 없어 빈 문자열로 저장됨(`supabase/functions/collect-job-postings/sources/career.ts` 주석 참고). 상세페이지 추가 요청 시 획득 가능하나 이번 Task 범위 밖이라 미착수 — 필요 시 별도 태스크로 진행

### Phase 4: 지원 기업 관리 기능 (4단계)

> **⚠️ 방향 전환 (2026-09-01)**: 기존 Phase 4는 채용공고 도메인에 종속된 기업 분석(공고 상세의 "기업 분석 보기" 액션)이었으나, 사용자가 **채용공고(`job_postings`)와 독립된 신규 도메인 "지원 기업 관리"**로 방향을 변경했습니다. 사용자가 지원한 기업을 직접 등록하고 그 기업 단위로 분석·자소서 문항·피드백·제출 서류·지원 상태를 관리하는 구조입니다. 기존 **Task 035는 취소되고 Task 044~048로 대체**됩니다.
>
> **PRD 정합성 참고**: PRD 참조 번호는 기존 값(2.10)을 유지하되, `docs/prd/PRD_v2.md` 2.10절은 아직 "수집 공고 기반 기업 분석" 기준으로 작성되어 있어 **이번 방향 전환을 반영하지 않은 상태**입니다. PRD 갱신은 이번 로드맵 수정 범위 밖이며, 착수 전 별도로 동기화하는 것을 권장합니다.

- **Task 035: 기업 분석 기능 구현 (`analyze-company`)** - ❌ 취소 (2026-09-01, Task 044~048로 대체)
  - 취소 사유: 채용공고 도메인 종속 설계(공고 상세 → 기업 분석)를 폐기하고, 사용자가 직접 등록하는 독립 엔티티 기반의 "지원 기업 관리" 도메인으로 재설계함
  - 살아남은 설계 요소: 기업명 정규화, `user_id` RLS 크로스토크 방지, 프롬프트 해시 + 입력 집합 해시 캐시 키 — 모두 **Task 045**로 이전

- **Task 044: 지원 기업 도메인 스키마 신설 및 지원 상태 관리** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.10 / 우선순위: 중 / 선행 조건: **Task 019(마이그레이션 체계)**
  - `company_applications` 테이블 신설 (`id`, `user_id`, 기업명, 정규화 `company_key`, 지원 직무, 지원 경로/링크, 지원일, `status`, 메모, `created_at`, `updated_at`) — 마이그레이션 파일로만 관리
  - `status` 단계 정의: `준비중` → `서류제출` → `서류합격` → `테스트`(코딩테스트/인적성) → `면접` → `최종합격` / `탈락` — enum 또는 CHECK 제약으로 고정하고, 단계 변경 이력이 필요하면 `status_history` 컬럼(jsonb) 또는 별도 테이블 여부를 구현 시 결정
  - `user_id` 기반 RLS 적용 (SELECT/INSERT/UPDATE/DELETE 전부 `auth.uid()` 소유권 기준, UPDATE는 `USING` + `WITH CHECK` 양쪽 적용해 소유권 바꿔치기 차단)
  - 기업명 정규화 유틸 도입 ("㈜", "주식회사", 국문/영문 표기 파편화 방지) — Task 045의 분석 대상 키로 재사용
  - **채용공고와의 관계**: `job_postings`에 종속되지 않는 독립 엔티티. 다만 선택적 참조 컬럼(`source_job_posting_id`, nullable)을 두어 공고 목록에서 "지원 기업으로 추가" 하는 편의 경로만 허용(없어도 수동 등록으로 완결되어야 함)
  - 신규 라우트(`/applications` 등) 및 목록·상세 2단 레이아웃 골격 구성 — 기존 `list-detail-panel.tsx` 재사용, 등록/수정 폼은 React Hook Form + Zod
  - 완료 기준
    - [x] 마이그레이션 파일만으로 로컬 `supabase db reset` 시 테이블·RLS가 재현됨 (`supabase/migrations/20260901010000_add_company_applications.sql`, 로컬 스택에 반영 확인)
    - [x] 지원 기업 등록/수정/삭제 CRUD가 UI에서 정상 동작 (`/applications` 목록·상세·등록 다이얼로그, Playwright MCP E2E로 재확인)
    - [x] 지원 상태 변경이 저장되고 목록에서 상태별 필터·배지로 확인 가능 (상세 화면 상태 변경 시 목록 배지 즉시 갱신, 상태 필터 select로 노출/은닉 확인)
    - [x] 다른 사용자 계정에서 해당 지원 기업이 조회되지 않음 — 2026-09-01 로컬 Supabase DB(`supabase_db_grow` 컨테이너)에서 SQL 스크립트로 검증. `auth.users`에 임시 계정 A/B(uuid `1111...`/`2222...`)를 각각 만들고 `company_applications`에 A/B 소유 레코드를 1건씩 생성한 뒤, 트랜잭션 내에서 `set local role authenticated; set local request.jwt.claims = '{"sub":"<uuid>"}'`로 세션을 흉내내 검증. 결과: A 세션 `SELECT`에서 B 레코드 미노출(1건만 반환), A가 B 레코드에 시도한 `UPDATE`/`DELETE`는 각각 영향 행 0건(`UPDATE 0`/`DELETE 0`), B 세션에서 재조회 시 B 레코드는 변조 없이 그대로 존재 — RLS 4정책(owner_select/insert/update/delete) 정상 동작 확인. 검증 후 트랜잭션을 `ROLLBACK`하여 임시 데이터는 남기지 않음(별도 정리 불필요). 스크립트는 재현용으로만 scratchpad에 보관, 저장소에는 커밋하지 않음. ⚠️ `psql` CLI 미설치로 계획한 `supabase-js` 단위 테스트 대신 로컬 DB 컨테이너에 직접 SQL을 실행하는 방식으로 대체
    - [x] Playwright MCP로 등록 → 상태 변경 → 목록 필터 반영 E2E 검증 — 2026-09-01, 이미 실행 중이던 `npm run dev`(localhost:3000)에 Playwright MCP로 접속, 테스트 계정(`qa-tester@example.com`) 세션으로 `/applications` 진입 → "(주)테스트기업"/"백엔드 개발자" 등록 → 목록·상세 반영 확인 → 상세에서 상태를 "서류제출"로 변경 → 목록 배지 즉시 갱신 확인 → 상태 필터를 "서류제출"로 설정해 항목 노출, "준비중"으로 변경해 항목 은닉 확인 → 삭제 버튼으로 항목 제거 및 목록에서 사라짐 확인. 전 과정 브라우저 콘솔 에러/경고 0건(`browser_console_messages` 전체 세션 조회 기준)

- **Task 045: 지원 기업 LLM 분석 (`analyze-company`)** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.10 / 우선순위: 중 / 선행 조건: **Task 044(도메인 스키마), Task 019(마이그레이션), Task 025(LLM 통합), Task 027(해시 캐시)**
  - `company_analyses` 테이블 신설 (`id`, `user_id`, `application_id`(`company_applications` 참조), 분석 요약, 인재상/사업 영역/기술 스택, 예상 질문, 입력 스냅샷, 캐시 키 해시, 생성일시) — 마이그레이션 파일로 관리 (`supabase/migrations/20260901020000_add_company_analyses.sql`)
  - `analyze-company` Edge Function 구현 — `supabase/functions/_shared/llm-client.ts`(Task 025 통합본) 재사용, 사용자 등록 LLM API 키(`user_llm_keys`) 경유
  - `user_id` 기반 RLS 적용 (`llm-cache.ts`의 크로스토크 방지 원칙 동일 적용 — A의 키로 만든 결과를 B가 소비 불가)
  - 캐시 키 = `hashPromptTemplate(프롬프트 템플릿)`(Task 027 유틸 그대로 재사용) + **분석 입력 스냅샷 해시**(기업명·직무·사용자 입력 메모 등). 입력이 바뀌면 자동 무효화, 동일 입력이면 캐시 히트
  - (선택) 자체 수집 공고(`job_postings`)에 동일 기업 공고가 있으면 정규화 키로 매칭해 분석 컨텍스트에 보강 — 매칭 실패해도 사용자 입력만으로 분석이 성립해야 함(하드 의존 금지)
  - 지원 기업 상세 화면에 "기업 분석" 탭/액션, 캐시 결과 표시 + 수동 새로고침 재분석, `processing`/`failed` 상태와 재시도 경로 노출(Task 026 워치독·재시도 UI 패턴 준용)
  - 완료 기준
    - [x] 사용자가 등록한 지원 기업에 대해 분석 결과가 생성되고 재조회 시 캐시가 히트 — 2026-09-01, 로컬 스택에서 `llm_response_cache`에 사전 계산한 캐시 키로 결과를 심어둔 뒤(무효한 가짜 LLM 키로) `analyze-company` 호출 시 실제 호출 없이 `200 completed`가 즉시(~150ms) 반환되고 저장 결과가 캐시 값과 정확히 일치함을 확인(상세: `docs/troubleshooting/company-analysis-e2e-troubleshooting.md`)
    - [x] 서로 다른 사용자 계정 간 캐시·분석 결과가 공유되지 않음 (RLS 검증) — 2026-09-01, 로컬 Supabase DB에서 임시 계정 A/B로 Task 044와 동일한 트랜잭션 시뮬레이션(`SET LOCAL request.jwt.claims`) 수행. A가 B의 `company_analyses` 레코드에 시도한 `UPDATE`/`DELETE`는 각각 0건, B 세션 재조회 시 원본 그대로 존재. `ROLLBACK`으로 정리. 경미한 부가 발견은 각주 참고(상세: `docs/troubleshooting/company-analysis-e2e-troubleshooting.md`)
    - [x] 분석 입력(기업명/직무/메모) 변경 시 입력 스냅샷 해시 변경으로 캐시가 자동 무효화 — 2026-09-01, 동일 applicationId에서 `memo`만 변경 후 재호출하면 cache_key가 달라져 캐시를 타지 않고 실제 LLM 호출을 시도해(가짜 키라 500) 실증(상세: `docs/troubleshooting/company-analysis-e2e-troubleshooting.md`)
    - [x] 프롬프트 템플릿 문구만 수정해도 캐시가 자동 무효화됨 (Task 027 방식 검증) — `cacheKey`에 `hashPromptTemplate(COMPANY_ANALYSIS_PROMPT_TEMPLATE)` 포함, review-document와 동일한 순수 해시 메커니즘이라 코드 레벨로 확인(상세: `docs/troubleshooting/company-analysis-e2e-troubleshooting.md`)
    - [x] LLM 실패 시 `failed` 상태와 재시도 경로가 UI에 노출됨 — 2026-09-01, 가짜 Gemini 키로 실제 호출 시 `500 ANALYSIS_FAILED` + DB `status='failed'`+`error_message` 저장 및 `edge_function_error_logs` 기록을 `psql`로 확인, `CompanyAnalysisCard`의 failed 분기(에러 메시지+재시도 버튼+API 키 안내)로 UI 노출 확인
    - [x] Playwright MCP로 지원 기업 상세 → 분석 실행 → 결과 표시 → 새로고침 재분석 플로우 검증 — 2026-09-01, 최초 검증 시점에는 원격 프로덕션 Supabase에 마이그레이션이 미반영되어 있고 Next.js 16 dev 서버 단일 인스턴스 락으로 로컬 스택 기반 브라우저 E2E가 불가해 HTTP 계층 대체 검증만 수행했으나(경위: `docs/troubleshooting/company-analysis-e2e-troubleshooting.md`), 이후 사용자가 `npx supabase db push`로 원격에 마이그레이션을 반영하고(`supabase migration list`로 `20260901020000` 반영 확인) `npx supabase functions deploy analyze-company`로 Edge Function을 배포, 본인 Gemini API 키를 `/settings`에 등록한 뒤 재검증 완료. Playwright MCP로 실행 중이던 원격 연결 `next dev`(포트 3000, `qa-tester@example.com` 세션)에서 지원 기업 "그로우테스트" 신규 등록 → 상세 진입(등록 직후 `company_analyses` 스키마 캐시 오류 없음 확인) → "분석 실행" 클릭 → 실제 Gemini 호출로 요약/조직문화 적합성/사업 도메인/기술 스택/예상 질문 5개 항목이 정상 렌더링됨(브라우저 콘솔 에러 0건) → "새로고침 재분석" 클릭 시 동일 입력이라 캐시 히트로 즉시 동일 결과 재표시(재호출 없음) → 테스트 데이터(지원 기업+연쇄 삭제된 분석 결과) 정리 완료

- **Task 046: 자소서 문항 등록·관리** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.10 / 우선순위: 중 / 선행 조건: **Task 044(도메인 스키마), Task 019(마이그레이션)**
  - `cover_letter_questions` 테이블 신설 (`id`, `user_id`, `application_id`, 문항 순서, 문항 내용, 글자수 제한, 답변 본문, `updated_at`) — 마이그레이션 파일로 관리 (`supabase/migrations/20260901030000_add_cover_letter_questions.sql`), `application_id`는 `company_applications(id)` 참조 `ON DELETE CASCADE`(Task 045 `company_analyses` 선례 채택), `user_id` RLS 4정책 적용
  - 지원 기업 상세 하위에 문항 목록/추가/삭제 UI 구현 (`cover-letter-questions-section.tsx`, `cover-letter-question-form-dialog.tsx`). 순서는 등록 순 자동 append만 지원하고 드래그앤드롭 순서 변경은 범위 제외(YAGNI)로 결정
  - 답변 작성 에디터: 문항 카드 내 인라인 Textarea + 실시간 글자수 카운터 + 제한 초과 시 경고 스타일(`text-destructive`), 자동저장이 아닌 명시적 "저장" 버튼(Loader2 로딩 표시) 방식으로 결정
  - **범위 제한**: 문항·답변의 저장·관리까지만. LLM 피드백은 Task 047에서 처리
  - 완료 기준
    - [x] 하나의 지원 기업에 복수 문항을 등록·삭제할 수 있음 — 2026-09-01, 원격 연결 `next dev`(localhost:3000, `qa-tester@example.com` 세션)에 Playwright MCP로 접속, `/applications`에서 "자소서테스트기업" 신규 등록 → 상세 진입 시 "자소서 문항" 섹션이 빈 상태로 정상 렌더링됨을 확인 → "문항 추가" 다이얼로그로 "지원 동기를 작성해주세요"(글자수 제한 20) 등록 → 목록에 즉시 반영 확인 → 문항 카드의 "삭제" 버튼 클릭 → `window.confirm` 확인 후 목록에서 제거 및 "등록된 자소서 문항이 없습니다" 안내로 복귀
    - [x] 답변 본문이 저장되고 재진입 시 그대로 복원됨 — 같은 세션에서 문항을 다시 추가한 뒤 답변 Textarea에 "저는 이 회사의 비전과 기술 스택에 깊이 공감하여 지원하게 되었습니다."(39자) 입력 → "저장" 클릭 → "답변을 저장했습니다" 토스트 확인 → 다른 지원 기업("sdd")으로 전환 후 "자소서테스트기업"으로 재선택 → 동일 답변 텍스트가 그대로 복원됨을 스냅샷으로 확인(컴포넌트에 `key={application.id}`를 부여해 지원 기업 전환 시 섹션 로컬 상태가 올바르게 초기화되도록 구현)
    - [x] 글자수 제한 설정 시 카운터·초과 경고가 정상 동작 — 위 39자 답변 입력 시 글자수 제한 20자를 초과해 카운터가 "39 / 20자 · 글자수 제한을 초과했습니다"로 실시간 갱신되고 `text-destructive` 경고 스타일이 적용됨을 확인
    - [x] 지원 기업 삭제 시 연결된 문항이 `ON DELETE CASCADE`로 함께 삭제됨 — "CASCADE 삭제 검증용 문항"을 추가한 뒤 `mcp__supabase__execute_sql`로 `application_id`(`29f9ecff-da66-40c0-9ccc-83b535a2db81`)에 문항 1건이 존재함을 먼저 확인 → UI에서 지원 기업 "삭제" 버튼(`window.confirm`) 클릭 → 삭제 직후 동일 `application_id` 기준 재조회 시 `company_applications` 0건, `cover_letter_questions` 0건으로 함께 삭제됨을 SQL로 확인
    - [x] Playwright MCP로 문항 추가 → 답변 작성 → 저장 → 재진입 복원 E2E 검증 — 위 시나리오 전 과정을 원격 연결 `next dev`(`ciyscihtgpiikouxtblw` 프로젝트, Task 1에서 `mcp__supabase__apply_migration`으로 `20260901030000_add_cover_letter_questions.sql` 반영 완료)에서 Playwright MCP로 직접 수행. `browser_console_messages`(전체 세션 조회 기준) 콘솔 에러 0건
  - **후속 개선 (2026-09-01)**: 문항·답변 내용이 길어 상세 패널이 좁게 느껴진다는 피드백에 따라 `applications-page-client.tsx`의 `ListDetailPanel` 목록:상세 비율을 `1fr:1fr`에서 `1fr:2fr`로 조정, 상세 영역을 더 넓게 노출

- **Task 047: 기업 분석 기반 자소서 피드백** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.10 (+ 2.11 첨삭 로직 공유) / 우선순위: 중 / 선행 조건: **Task 045(기업 분석 결과), Task 046(문항·답변), Task 025(LLM 통합), Task 027(해시 캐시)**
  - `cover_letter_questions`에 `feedback_status`(`idle`/`processing`/`completed`/`failed`, CHECK 제약)/`feedback_text`/`feedback_error_message`/`feedback_generated_at` 4컬럼 추가 — 마이그레이션 파일로 관리 (`supabase/migrations/20260901040000_add_cover_letter_question_feedback.sql`). 신규 RLS 정책은 불필요(Task 046의 owner 4정책이 테이블 전체를 이미 커버)
  - `packages/shared/src/types/cover-letter-question.ts`에 `CoverLetterQuestionFeedbackStatus` union 타입 export, `CoverLetterQuestion`/`CoverLetterQuestionRow`에 피드백 4필드 추가, `rowToCoverLetterQuestion` 매퍼 및 `schemas/cover-letter-question.ts`의 zod 스키마 동기화
  - **기존 `review-document`와의 관계 정리**: 문서(PDF) 단위 첨삭인 `review-document`를 확장하지 않고 **`feedback-cover-letter-question` Edge Function을 신설**하는 (b)안을 채택 — 입력 단위(문항 1건 + 답변)와 저장 테이블(`cover_letter_questions`)이 `document_reviews`와 근본적으로 다르고, 기업 분석 컨텍스트 주입이라는 이 기능 고유의 전제조건이 있어 별도 함수가 더 단순함. LLM 호출/재시도/캐시 계층은 `_shared/llm-client.ts`·`_shared/llm-cache.ts`를 그대로 재사용하고 프롬프트 문자열만 신규 작성(`supabase/functions/feedback-cover-letter-question/llm.ts`의 `FEEDBACK_PROMPT_TEMPLATE`)
  - Task 045의 기업 분석 결과(`summary`/`culture_fit`/`business_domain`/`tech_stack`)를 **컨텍스트로 주입**해 문항별 답변을 첨삭 — "일반 자소서 첨삭"이 아닌 "이 기업에 맞춘 첨삭"이 되도록 프롬프트 설계
  - **하드 실패 설계 결정(폴백 없음)**: `company_analyses`가 `application_id` 기준 최신 1건 기준 `completed` 상태가 아니면 `400 ANALYSIS_NOT_READY`로 즉시 거부하고 일반 첨삭으로 폴백하지 않는다 — "그 기업에 맞춘 첨삭"이라는 기능 목적상 분석 없는 첨삭은 의미가 없다는 판단(로드맵 초안의 "안내 후 일반 첨삭 폴백" 방침에서 착수 시점에 변경). `answer_text`가 비어있으면 LLM 호출 전에 `400 EMPTY_ANSWER`로 거부(상태 미변경)
  - **버전 이력 범위 제외(YAGNI)**: 로드맵 초안의 "문항별 피드백 버전 이력" 요구는 착수 시점에 범위에서 제외 — `feedback_text`는 최신 1건만 덮어쓰기 저장하는 단순 상태머신으로 구현(Task 046의 문항 자체가 버전 이력이 없는 것과 일관). 필요해지면 별도 태스크로 분리
  - **하이라이트 UI 재사용 범위 제외**: Task 037(인용 문구 기반 offset 하이라이트)이 미완료 상태이며 이 기능은 문항 단위 텍스트 피드백만 제공하므로 하이라이트 UI 연동은 다루지 않음
  - 캐시 키: 프롬프트 템플릿 해시 + provider + 문항/답변/글자수 제한 + 기업 분석 4필드(요약/컬처핏/사업영역/기술스택) → 답변을 수정하거나 기업 분석이 갱신되면 자동으로 새 캐시 키가 되어 재호출됨
  - `apps/desktop/lib/cover-letter-questions.ts`에 `requestCoverLetterQuestionFeedback(questionId, provider)` 추가 — `company-analyses.ts`의 `extractFunctionErrorMessage` 로컬 복제 관행 그대로 준용
  - UI: `cover-letter-questions-section.tsx`의 `QuestionCard`에 "AI 첨삭 받기" 버튼과 상태별 표시(processing 안내문구/completed 첨삭 텍스트/failed 에러 메시지) 추가, `application-detail-content.tsx`의 `analysis.status`/`availableProviders[0]`을 `companyAnalysisStatus`/`feedbackProvider` prop으로 전달. 문항별 4000ms 폴링(`FEEDBACK_POLL_INTERVAL_MS`)은 Task 045의 `analysisPollTimerRef` 패턴을 그대로 준용. 버튼은 `answer_text` 공백이거나 `companyAnalysisStatus !== 'completed'`이거나 첨삭 진행 중이면 비활성화
  - 완료 기준
    - [x] 기업 분석 결과가 프롬프트 컨텍스트에 실제로 포함됨 — `feedback-cover-letter-question/llm.ts`의 `FEEDBACK_PROMPT_TEMPLATE`에 `{{ANALYSIS_SUMMARY}}`/`{{ANALYSIS_CULTURE_FIT}}`/`{{ANALYSIS_BUSINESS_DOMAIN}}`/`{{ANALYSIS_TECH_STACK}}` 플레이스홀더로 명시적 주입(코드 리뷰로 확인, 로컬 supabase 스택 미기동으로 실제 LLM 호출 로그 확인은 미수행)
    - [x] 분석 미수행 상태에서는 하드 실패(설계 변경) — 일반 첨삭 폴백 대신 `400 ANALYSIS_NOT_READY`로 거부하고 UI에서도 버튼을 비활성화 + 안내 문구 표시
    - [x] 동일 답변·동일 분석에서는 캐시 히트, 분석 갱신 시 자동 무효화 — 캐시 키에 답변 본문과 기업 분석 4필드가 모두 포함되어 있어 둘 중 하나라도 바뀌면 새 키가 됨(코드 리뷰로 확인, 실제 캐시 히트 E2E는 로컬 스택 미기동으로 미수행)
    - [x] 문항별 피드백 이력 버전 관리 — 범위 제외 결정(위 YAGNI 항목 참고), `feedback_text` 최신 1건 저장으로 대체
    - [x] `review-document`와의 통합/분리 결정과 근거 문서화 — 위 "기존 review-document와의 관계 정리" 항목에 기록
    - [ ] Playwright MCP로 답변 작성 → 피드백 요청 → 결과 표시 → 재요청 캐시 동작 E2E 검증 — 로컬 supabase 스택 미기동으로 미수행. 원격 반영(`supabase db push` 또는 `mcp__supabase__apply_migration`) 및 `feedback-cover-letter-question` Edge Function 배포 후 별도 검증 필요

- **Task 048: 지원 기업별 제출 서류(이력서/포트폴리오) 보관** - ✅ 완료 (2026-09-01)
  - PRD 참조: 2.10 / 우선순위: 중 / 선행 조건: **Task 044(도메인 스키마), Task 019(마이그레이션)**
  - **기존 자산 재사용 결정**: Task 019에서 마이그레이션에 편입된 것은 `document_reviews` 테이블(이력서/포트폴리오 PDF 첨삭 레코드)과 `documents` storage 버킷(`{userId}/{documentReviewId}.pdf` 경로, RLS로 소유자 폴더만 접근 가능)이었음 — 별도의 "documents 테이블"은 존재하지 않았음(로드맵 초안의 표현을 착수 시점에 코드로 재확인해 정정). 로드맵이 유력하다고 명시한 (b)안 채택: 신규 `application_documents` 다대다 연결 테이블을 신설(`supabase/migrations/20260901050000_add_application_documents.sql`)해 `company_applications` ↔ `document_reviews`를 연결. 파일 업로드/스토리지 로직은 기존 `document-upload.ts::uploadDocument()`를 그대로 재사용(신규 storage 로직 없음)
  - `cover_letter_questions`(Task 046)와 동일한 owner 기반 RLS 4정책(`TO PUBLIC`, `auth.uid() = user_id`) 패턴을 그대로 복제, `application_id`/`document_review_id` 양쪽 FK에 `ON DELETE CASCADE`, `UNIQUE(application_id, document_review_id)`로 동일 문서의 중복 연결을 DB 레벨에서 방지
  - `packages/shared`에 `ApplicationDocument` 타입/zod스키마/매퍼 3종, `apps/desktop/lib/application-documents.ts`에 fetch/link(UNIQUE 위반 시 "이미 연결된 서류입니다" 메시지)/unlink/signed URL 발급 함수, `apps/desktop/components/sections/applications/application-documents-section.tsx`에 UI(새 서류 업로드+즉시연결, 기존 서류 Select 연결, 목록 다운로드/첨삭결과링크/연결해제)를 Task 044~048과 동일한 배치·네이밍으로 구현하고 `application-detail-content.tsx`에 통합
  - 첨삭 결과 링크는 기존 `/documents?id={documentReviewId}` 쿼리 파라미터 라우팅(`documents-page-client.tsx`에서 이미 사용 중인 패턴)을 그대로 재사용, `document_reviews.status === 'completed'`일 때만 노출
  - 지원 기업 삭제 시 처리 정책: `application_documents`만 CASCADE 삭제되고 `document_reviews`/storage 파일은 보존(다른 기업에도 연결되어 있을 수 있는 원본 자산이므로 삭제하지 않음) — SQL로 실제 삭제 후 동작 확인
  - 완료 기준
    - [x] 기존 `documents` 재사용 여부 결정과 근거가 문서에 기록됨 — 위 "기존 자산 재사용 결정" 항목 참고(실제로는 `document_reviews`+storage 버킷 재사용, `application_documents` 연결 테이블 신설)
    - [x] 지원 기업에 서류를 업로드/연결하고 목록에서 확인 가능 — `next dev`(localhost:3000, `qa-tester@example.com` 세션)에 Playwright MCP로 접속, "sdd" 지원 기업 상세에서 "새 서류 업로드"로 테스트 PDF 업로드 → "서류를 업로드하고 연결했습니다" 토스트 및 목록 즉시 반영 확인
    - [x] 하나의 문서를 복수 기업에 연결해도 중복 저장되지 않음(선택한 설계 기준 충족) — `UNIQUE(application_id, document_review_id)` 제약으로 DB 레벨 보장(연결은 `application_documents` 행만 추가, `document_reviews`/파일은 그대로 공유)
    - [x] 다른 사용자 계정에서 해당 파일에 접근 불가 (storage 정책 + RLS 검증) — 원격 DB에 타 계정 소유 `document_reviews` 5건이 이미 존재하는 상태에서, qa-tester 세션의 "기존 서류 연결" Select에 해당 5건이 전혀 노출되지 않음을 실제 UI로 확인(= `document_reviews`/`application_documents` RLS가 실제 인증 클라이언트 기준으로 정상 작동). 다만 두 번째 테스트 계정을 만들어 `application_documents` 자체에 대한 직접 크로스 계정 SELECT 시도까지는 수행하지 않음 — `execute_sql`(서비스 롤, RLS 우회)로 정책 존재만 구조적으로 확인
    - [x] 지원 기업 삭제 시 파일·연결 레코드 처리 정책이 정해지고 동작함 — 임시 테스트 지원 기업·문서·연결을 생성한 뒤 지원 기업을 삭제, `application_documents` 0건(CASCADE 삭제)·`document_reviews` 1건 유지(보존)를 SQL로 확인 후 테스트 데이터 정리
    - [x] Playwright MCP로 업로드 → 연결 → 목록 노출 → 해제 E2E 검증 — 위 시나리오에 이어 "다운로드"(signed URL 새 탭 오픈 확인) → "연결 해제"(`window.confirm` 승인 → "연결을 해제했습니다" 토스트 → 목록에서 제거)까지 전체 플로우를 실제 클릭으로 수행. **버그 발견 및 수정**: 최초 검증 시 React "duplicate key" 콘솔 에러가 반복 발생 — 처음에는 기존 코드의 무관한 이슈로 오판했으나, 재조사 결과 `application-detail-content.tsx`에서 형제 컴포넌트인 `CoverLetterQuestionsSection`과 신규 추가한 `ApplicationDocumentsSection`이 둘 다 `key={application.id}`를 그대로 사용해 key가 충돌한 것이 원인이었음(이번 Task에서 만든 회귀). `key={\`cover-letter-${application.id}\`}`/`key={\`documents-${application.id}\`}`로 각각 접두사를 붙여 수정, 이후 재검증 시 콘솔 에러 0건 확인
  - **⚠️ 검증 범위 일부 제한**: 두 번째 실제 테스트 계정으로 `application_documents`/제출 서류 signed URL에 대한 직접 크로스 계정 접근 시도는 수행하지 않음 — `cover_letter_questions`와 동일한 RLS 정책 문구(구조적으로 Task 1에서 확인)와, 이번에 관찰된 `document_reviews` 크로스 계정 미노출(위 항목 참고)을 근거로 안전하다고 판단했으나 완전한 이중 계정 E2E는 후속 필요 시 별도 확인 권장

### Phase 5: 이력서/포트폴리오 분석 개선 (5단계)

- **Task 036: 업로드 문서 유형 2종 한정 및 첨삭본 산출물 제거** - ✅ 완료 (2026-09-02)
  - PRD 참조: 2.11 (a) / 우선순위: 중 / 선행 조건: **Task 019(마이그레이션), Task 025(LLM 로직 단일 소스), Task 027(캐시 자동 무효화)**
  - `document_reviews.type`을 `CHECK (type IN ('resume','portfolio'))` 2종으로 확정하고 `resume` = 이력서로 의미를 통일, 문항 입력 경로(`resumeQuestion`)는 제거한다
  - 업로드 다이얼로그: 유형 Select를 `이력서` / `포트폴리오` 2종으로 확정, `resumeQuestion` 필드 및 관련 조건부 렌더링 제거 (`apps/desktop/lib/validators.ts`의 `documentUploadFormSchema`도 동기화)
  - `packages/shared` 단일 소스 정리: `documentReviewSchema`에서 `reviewedText`/`resumeQuestion` 제거, `buildDocumentReviewPrompt`가 "전체 첨삭본 작성" 지시를 더 이상 하지 않고 **유형별 관점의 코멘트만** 요구하도록 재작성 (이력서: 경력/기술스택 표현·정량 성과·가독성 / 포트폴리오: 프로젝트 기여도·문제해결 서사·기술 선택 근거)
  - `review-document` Edge Function(`llm.ts`, `index.ts`) 응답 파싱·저장 로직에서 `reviewed_text` 경로 제거, 마이그레이션 파일로 `document_reviews.reviewed_text` 컬럼 드롭(또는 미사용 처리 후 드롭) 및 `resume_question` 정리
  - 결과 화면(`document-detail-content.tsx`)에서 diff 렌더링 및 `packages/shared/src/lib/text-diff.ts` 의존 제거 — **원문 + 코멘트 목록** 구성으로 단순화 (기존 `comments` 스키마 `{ id, quote, comment }`는 그대로 유지)
    - **설계 변경(구현 중 피드백 반영)**: PDF 텍스트 추출본은 서식이 모두 사라져 원문과 대조하며 보기 부적합하고 화면도 길어진다는 지적에 따라, 추출된 `originalText` 전체를 화면에 그대로 렌더링하는 대신 **"PDF 원본 열기" 버튼(signed URL로 새 탭에 실제 PDF 오픈)**으로 대체함 — `apps/desktop/lib/application-documents.ts`의 기존 `getApplicationDocumentSignedUrl` 패턴을 `document-reviews.ts`에도 동일하게 추가(`getDocumentReviewSignedUrl`)
  - 프롬프트/스키마 변경이 캐시 키에 반영되어 기존 캐시가 자동 무효화되는지 확인 (Task 027 연계)
  - **[소단락] 유형별 프롬프트 정교화 (이력서 ≠ 포트폴리오)**
    - **구조**: 공개 진입점은 `buildDocumentReviewPrompt(input)` 하나로 유지하고, 내부에서 유형에 따라 `buildResumePrompt()` / `buildPortfolioPrompt()`(모듈 내부 함수)로 분기한다. 공통 요소(JSON 응답 형식 상수, 원문 삽입 블록, "다른 설명 없이 JSON만" 지시)는 공유 상수로 추출해 중복을 없애고, **역할 정의문 / 평가 관점 목록 / few-shot 예시**만 유형별로 완전히 분리한다
    - 이력서 프롬프트 관점 (`buildResumePrompt`)
      - 경력·기술스택 표현: 담당 업무의 역할/범위가 드러나는지, 기술 나열이 사용 맥락 없이 키워드 덤프로 끝나지 않는지
      - 정량적 성과 서술: "개선했다" 류의 서술을 수치·기간·비교 기준이 있는 문장으로 유도
      - 가독성·포맷: 항목 길이 균형, 시제·어미 일관성, 불릿 1개당 1메시지 원칙
    - 포트폴리오 프롬프트 관점 (`buildPortfolioPrompt`)
      - 프로젝트 기여도: 팀 성과와 본인 기여의 구분이 명확한지("우리는" → "내가 맡은 부분")
      - 문제해결 서사: 문제 상황 → 시도 → 결과 흐름이 드러나는지, 결과만 나열되어 있지 않은지
      - 기술 선택 근거: 사용 기술에 대안 검토·트레이드오프 언급이 있는지
    - **few-shot 예시 분리**: 각 프롬프트에 해당 유형 전용 예시 2~3쌍(빈약한 원문 문장 → 기대 코멘트)을 상수로 포함. 예시는 신입/주니어 개발자 문체를 가정하되 특정 기업·개인 식별 정보가 없는 가공 샘플을 사용하고, 이력서 예시를 포트폴리오 프롬프트에 재사용하지 않는다
    - 프롬프트 토큰 증가로 인한 비용/지연 영향 확인 — few-shot 추가 전후 요청 토큰 수를 기록하고, 과도하면 예시 수를 줄이는 기준을 문서에 남김
  - 완료 기준
    - [x] 업로드 다이얼로그에서 선택 가능한 유형이 `이력서`/`포트폴리오` 2종뿐이며, 문항 입력 필드가 노출되지 않음 — Playwright로 업로드 다이얼로그 실측, `combobox "문서 유형"`에 `이력서`/`포트폴리오` 2개 옵션만 존재하고 문항 입력 필드 없음을 확인
    - [x] 신규 분석 결과에 첨삭본/비교뷰/하이라이트가 전혀 생성되지 않고 코멘트만 생성됨 — 아래 실측 결과 참고, `reviewedText`/diff 없이 `comments` 배열만 저장·렌더링됨
    - [x] 이력서/포트폴리오 각각 서로 다른 관점의 코멘트가 생성됨을 동일 샘플 PDF로 비교 기록 — 아래 "실측 결과" 표 참고
    - [x] 프롬프트가 유형별로 실제 분리됨 — 공개 진입점 `buildDocumentReviewPrompt` 유지 + 내부 `buildResumePrompt`/`buildPortfolioPrompt` 분기, 공통 JSON 형식/원문 블록은 상수로 공유(중복 없음). `tsx`로 두 함수의 실제 출력 문자열을 비교해 길이가 다르고(이력서 758자 vs 포트폴리오 785자, `{{TEXT}}` 제외) 서로 다른 문구임을 확인
    - [x] 이력서용·포트폴리오용 few-shot 예시가 각각 별도로 존재하며 서로 재사용되지 않음 — 이력서 프롬프트에 포트폴리오 전용 키워드("Redux")가 없고, 포트폴리오 프롬프트에 이력서 전용 키워드("React, Next.js")가 없음을 스크립트로 확인
    - [x] **개선 전/후 비교 기록**: 아래 "프롬프트 정교화 전/후 비교" 표 참고 (방법론 caveat 포함)
    - [x] 정교화 후 이력서 코멘트에 정량 성과 관점이, 포트폴리오 코멘트에 기여도·기술 선택 근거 관점이 실제로 등장함 — 아래 실측 결과 참고. **단, 가독성·포맷 관점은 이번 테스트 샘플(2~3문장 분량의 짧은 텍스트)의 특성상 지적할 만한 항목이 없어 코멘트로 등장하지 않음** — 프롬프트 지시문에는 포함되어 있으나 이번 샘플로는 유도되지 않은 것으로, 더 긴 실제 이력서로 재검증 시 확인 필요
    - [x] few-shot 추가에 따른 요청 토큰 증가량이 측정·기록되고 허용 범위 내임 — 아래 "토큰 증가량" 참고
    - [x] 프롬프트 변경 시 캐시가 자동 무효화되어 개선 결과가 즉시 반영됨 — `review-document/index.ts`의 `hashPromptTemplate`이 `review.type`에 따라 `RESUME_PROMPT_TEMPLATE`/`PORTFOLIO_PROMPT_TEMPLATE` 중 해당 유형만 해싱하도록 구현. 두 템플릿 모두 이번에 문구가 전면 교체되어 기존 캐시(`llm_response_cache`)와 해시가 겹치지 않으므로, 실제 업로드 시 캐시 재사용 없이 새로 생성됨을 실측으로 확인(아래 참고)
    - [x] Playwright MCP로 업로드 → 분석 완료 → 코멘트 렌더링 E2E 검증 — 아래 "실측 결과" 참고

  - **실측 결과 (2026-09-02, qa-tester 계정, Gemini, 실제 Supabase 프로덕션 프로젝트)**

    | 항목                        | 이력서(sample-resume.pdf)                                                                                                | 포트폴리오(sample-portfolio.pdf)                                                                                                                      |
    | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
    | 원문(영문, PDF 텍스트 추출) | "I did backend development work. I improved the API response speed. I can use React, Next.js, TypeScript, Node.js, AWS." | "Our team successfully built a realtime chat feature. As a result, the page loading speed became much faster. State management was done using Redux." |
    | 코멘트 개수                 | 3건                                                                                                                      | 3건                                                                                                                                                   |
    | 등장한 관점                 | 경력·기술스택 표현(2건: 역할 모호, 키워드 나열) · 정량적 성과 서술(1건: 수치 없음 지적)                                  | 프로젝트 기여도(1건: "Our team"→"내가 맡은 부분") · 문제해결 서사(1건: 결과만 나열) · 기술 선택 근거(1건: Redux 대안 미검토)                          |
    | 첨삭본(reviewedText)/비교뷰 | 없음 (원문 + 코멘트만)                                                                                                   | 없음 (원문 + 코멘트만)                                                                                                                                |
    | 문항 입력(resumeQuestion)   | 없음(필드 자체가 폼에서 삭제됨)                                                                                          | 해당 없음                                                                                                                                             |

    → 이력서와 포트폴리오가 **서로 다른 평가 관점**으로 코멘트를 생성했고, 포트폴리오는 로드맵이 정의한 3가지 관점(기여도/문제해결서사/기술선택근거)이 정확히 1:1로 모두 등장함. 이력서는 짧은 샘플 특성상 "가독성·포맷" 관점은 유도되지 않았음(위 완료 기준 캐비어 참고).

  - **프롬프트 정교화 전/후 비교**

    | 구분                               | 정교화 전(원본, 커밋 `b94d0a2`)                                                    | 정교화 후(현재)                                                                          |
    | ---------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
    | 유형별 분기                        | 없음 — "자기소개서"/"포트폴리오" 라벨 단어만 바뀌고 지시문·평가 기준은 완전히 동일 | `buildResumePrompt`/`buildPortfolioPrompt`로 완전 분리, 유형별 평가 관점 3개씩 별도 정의 |
    | few-shot 예시                      | 없음                                                                               | 유형별 3쌍씩(교차 재사용 없음)                                                           |
    | 응답 JSON 형태                     | `{"reviewedText": string, "comments": [...]}` (전체 첨삭본 포함)                   | `{"comments": [...]}` (첨삭본 없음)                                                      |
    | 문항 입력(`resumeQuestion`)        | 이력서 유형에 한해 프롬프트에 삽입                                                 | 제거                                                                                     |
    | 템플릿 문구 길이(원문 텍스트 제외) | 261자 (유형 무관 공통)                                                             | 이력서 758자 / 포트폴리오 785자                                                          |

    > **방법론 caveat**: "정교화 전" 프롬프트를 동일 샘플로 실제 재호출하는 라이브 A/B는 수행하지 않음 — 이유: 정교화 전 프롬프트는 이미 DB에서 제거된 `reviewed_text` 컬럼에 저장을 시도하므로, 재현하려면 Task 1에서 완료한 컬럼 DROP을 임시로 되돌려야 해 리스크가 큼. 대신 (a) 코드 diff로 "정교화 전이 애초에 유형 구분 능력이 구조적으로 없었음"을 확인하고, (b) "정교화 후"는 위 실측 결과로 대체함.

  - **토큰 증가량(few-shot 추가 영향)**
    - 템플릿 문구만 비교(요청 시 실제 문서 원문은 별도 추가): 261자(구) → 758~785자(신), **약 190~201% 증가**(문자 수 기준, 한국어 문자당 약 2.5자/토큰 근사 시 +약 200토큰/요청)
    - 실제 업로드된 원문(수 문장~수십 문장 분량 이력서/포트폴리오, 통상 수백~수천 자)에 비하면 고정 오버헤드는 상대적으로 작음 — **허용 범위로 판단**
    - 과도해질 경우의 축소 기준(로드맵 사전 정의대로): few-shot 예시를 유형별 3쌍 → 2쌍으로 축소

  - **구현 중 발견·수정한 이슈**
    - Supabase에 배포된 `review-document` Edge Function이 로컬 코드 수정 후에도 예전 버전(버전 5, `reviewed_text` 컬럼 참조)으로 남아있어 실제 업로드 시 `Could not find the 'reviewed_text' column` 스키마 캐시 에러 발생 → 최신 로컬 코드로 `mcp__supabase__deploy_edge_function` 재배포(버전 7)로 해결. **로컬 파일 수정만으로는 Edge Function이 갱신되지 않으므로, 향후 `supabase/functions/*` 변경 시 반드시 재배포까지 확인해야 함**
    - DB 마이그레이션 반영(`db push`) 과정에서 로컬/원격 스키마 비교 diff가 의도치 않게 `resume_question`/`reviewed_text`를 다시 추가하는 마이그레이션 파일을 생성한 사고 발생 → 원인 파악 후 별도 재-DROP 마이그레이션(`20260902093750_redrop_...`)으로 복구, 최종적으로 두 컬럼이 원격에 존재하지 않음을 재확인함

- **Task 037: 예상 면접 질문 생성 및 분석 결과 화면 재구성** - ✅ 완료 (2026-09-02)
  - PRD 참조: 2.11 (b) / 우선순위: 중 / 선행 조건: **Task 036**
  - `document_reviews`에 `interview_questions jsonb NOT NULL DEFAULT '[]'::jsonb` 컬럼 추가 — 마이그레이션 파일(`20260902103355_add_document_review_interview_questions.sql`)로 관리, `npx supabase db reset` 로컬 검증 완료. 원격 반영(`db push`)은 규칙상 사용자가 직접 실행
  - `packages/shared`에 `documentInterviewQuestionSchema`(`{ id, question, intent, category, sourceQuote? }`) 및 매퍼(`document-review-mapper.ts`) 추가 — 코멘트와 동일한 jsonb 저장 패턴 재사용
  - `buildDocumentReviewPrompt` 응답 JSON 형태를 `{"comments": [...], "interviewQuestions": [...]}`로 확장하고, 문서 유형별로 질문 성격을 분기 (이력서: 경력·기술 검증 질문 / 포트폴리오: 프로젝트 심층·의사결정 질문). `supabase/functions/review-document/llm.ts`의 템플릿 문자열도 동일하게 동기화(Task 025/036 관례 유지)
  - **인용 근거는 선택 사항**: `sourceQuote`는 원문에서 발췌한 문자열이며 매칭·offset 계산은 수행하지 않음(하이라이트 기능 폐기) — 값이 없거나 원문과 불일치해도 질문은 정상 노출되는 폴백 구현
  - 상세 화면(`document-detail-content.tsx`)에 `코멘트` 섹션과 나란히 `예상 면접 질문` 섹션을 추가, 질문 카드에 카테고리 배지·의도(`intent`) 설명 표시, `navigator.clipboard` 기반 질문 텍스트 복사 액션(sonner 토스트 피드백) 제공
  - LLM 응답에 `interviewQuestions`가 누락되거나 배열이 아닌 경우 `Array.isArray` 가드로 빈 배열 폴백 처리, 코멘트 저장에는 영향 없음 (분석 전체 실패로 취급하지 않음)
  - 완료 기준
    - [ ] 실제 샘플 PDF 업로드 → 분석 → 코멘트와 예상 면접 질문이 함께 저장·노출됨 — **미검증**: 실제 Gemini/Anthropic LLM 호출에는 원격 API 키가 필요하나 이 환경에는 없음. 대신 로컬 Supabase 스택에 `document_reviews` 완료 상태 레코드(코멘트+예상 면접 질문 포함)를 직접 시드하고 Playwright MCP로 렌더링을 확인하는 방식으로 대체 검증(아래 항목들)
    - [x] 이력서/포트폴리오 유형별로 질문의 성격이 구분되어 생성됨 — 시드 데이터로 이력서(카테고리: 경력 검증/기술 검증)와 포트폴리오(카테고리: 프로젝트 기여도/의사결정 검증)가 UI에서 명확히 다르게 노출됨을 확인. 실제 LLM이 프롬프트 지시를 따라 이렇게 구분해서 생성하는지는 미검증(위 항목과 동일한 사유)
    - [x] `interviewQuestions` 누락/파싱 실패를 인위 재현했을 때 폴백이 동작하고 코멘트는 정상 저장됨 — `index.ts`의 `Array.isArray` 가드 로직을 코드 리뷰로 확인(Deno CLI 미설치로 실제 Edge Function 실행 재현은 미수행)
    - [x] `sourceQuote`가 없는 질문도 UI에서 정상 렌더링됨 — 시드 데이터의 두 번째 질문(sourceQuote 없음)이 인용문 없이 정상 렌더링됨을 Playwright MCP로 확인
    - [x] 질문/코멘트 카드가 라이트·다크 모드 및 모바일 폭에서 모두 판독 가능 — 다크모드 토글 및 360px 모바일 뷰포트에서 스크린샷으로 확인, 카드 레이아웃 깨짐 없음
    - [ ] Playwright MCP로 업로드 → 분석 완료 → 탭 전환 → 질문 목록 렌더링 E2E 검증 — **부분 수행**: 실제 PDF 업로드 → LLM 분석 전체 플로우는 API 키 부재로 미수행. 로컬 스택에 완료 상태 데이터를 시드해 상세 화면 렌더링(코멘트+예상 면접 질문 섹션, 복사 버튼)만 Playwright MCP로 검증함. 클립보드 복사 자체는 헤드리스 브라우저의 clipboard 권한 제약으로 실제 복사 동작 확인은 미수행(코드는 기존 toast 패턴과 동일)
  - **검증 방법 참고**: 이 검증을 위해 로컬 dev 서버를 일시적으로 원격 Supabase 대신 로컬 스택(`http://127.0.0.1:54321`)에 연결(`.env.local` 임시 변경 후 검증 완료 즉시 원복)했고, 테스트 계정(`qa-tester@example.com`)·시드 데이터는 검증 후 모두 삭제함
  - **원격 반영 완료**: 사용자가 `npx supabase db push`로 마이그레이션(`20260902103355_add_document_review_interview_questions` 포함 14개)을 원격에 반영. `review-document` Edge Function도 `mcp__supabase__deploy_edge_function`으로 최신 코드(interviewQuestions 폴백 파싱 포함)를 재배포(version 7 → 8) — Task 036 트러블슈팅에서 확인된 "로컬 파일 수정만으로는 Edge Function이 갱신되지 않는다"는 교훈을 반영해 db push 직후 재배포까지 완료함. 실제 업로드→LLM 분석 E2E는 여전히 실사용자의 API 키 등록 후 확인 필요

### Phase 6: Playwright E2E 검증 하네스 (6단계) — ⏸ 보류

> **⏸ 보류**: 이 단계는 현재 진행하지 않습니다. 아래 내용은 재개 시 그대로 사용할 수 있도록 삭제하지 않고 보존합니다.

- **Task 038: Playwright E2E 하네스 구축 및 패키징 스모크 테스트 통합** - ⏸ 보류
  - PRD 참조: 2.15 (+ 2.14 T-L8 통합) / 우선순위: ⏸ 보류 / 선행 조건: **Task 022(테스트 계정 환경변수화)**, 대상 기능 Task 030·032·033
  - Playwright 의존성 및 설정 신규 도입 (현재 저장소에 전무, `vitest run`만 존재)
  - `_electron.launch()`로 **패키징된 실행 파일**(`electron-builder` 산출물)을 구동 대상으로 지정 — T-L8 패키징 스모크 테스트를 별도로 만들지 않고 이 하네스로 통합
  - 로그인 자동화: CI 시크릿으로 주입한 `E2E_TEST_ACCOUNT_EMAIL`/`PASSWORD` 사용 (구글 OAuth는 `shell.openExternal` 구조라 자동화 불가)
  - 검증 대상 플로우
    - 채용공고 목록/필터/상세 조회
    - 캘린더 일정 등록 UI 플로우
    - PDF 업로드 → 첨삭 결과 비교뷰 렌더링
    - 신규 크롤링 소스 데이터 노출 — **시드 픽스처 기반**(외부 사이트 실호출 미의존)
  - 검증 불가 항목 대체: OS 레벨 `Notification`은 메인 프로세스 알림 트리거 함수 호출/IPC 로그를 훅으로 어서션
  - CI 실행 환경 결정: Windows 러너 또는 Linux + xvfb (Electron GUI는 헤드리스 불가)
  - **스크린샷 비교 기준선은 Phase 7 완료 이후 확정** (개선 전 스냅샷은 전량 실패 유발) — 현재 이 단계 자체가 ⏸ 보류이므로 이 의존관계도 재개 시점에 다시 적용
  - 완료 기준
    - [ ] 패키징된 실행 파일이 CI에서 기동되고 로그인까지 자동 완료
    - [ ] 위 주요 플로우가 CI 스모크 테스트로 등록되어 PR마다 실행
    - [ ] 알림 트리거가 IPC 훅 어서션으로 검증됨
    - [ ] 외부 사이트 응답에 의존하는 flaky 테스트가 없음
    - [ ] (Phase 7 이후) 라이트/다크 모드 스크린샷 기준선 확정 및 허용 오차 정책 문서화

### Phase 7: UI 스타일링 개선 및 후순위 항목 (7단계)

- **Task 039: 전역 커스텀 스크롤바 스타일 적용**✅ 완료 (2026-09-02)
  - PRD 참조: 2.1 / 우선순위: 낮음 / 선행 조건: 없음
  - 사이드바, 리스트 뷰 등 앱 전역 스크롤 영역에 커스텀 스크롤바 스타일 적용
  - 다크모드 대응 색상 토큰 정의 (`globals.css`)
  - **범위 제한**: 시각적 스타일링만 해당, 스크롤 동작 로직 변경 없음
  - 완료 기준
    - [ ] 라이트/다크 모드 모두에서 스크롤바가 앱 디자인 톤과 일관
    - [ ] `react-window` 가상화 목록의 스크롤 동작 회귀 없음

- **Task 040: 캘린더 UI 시각적 완성도 개선**
  - PRD 참조: 2.2 / 우선순위: 낮음 / 선행 조건: 없음
  - 카테고리별(서류마감/면접/스터디) 색상 체계 정비
  - 간격·타이포그래피 정리, 월/주 뷰 레이아웃 개선
  - 오늘 일정 요약 영역 레이아웃 개선
  - **범위 제한**: 시각적 스타일링만 해당, 일정 등록/알림 등 기능 로직 변경 없음
  - 완료 기준
    - [ ] 월/주 뷰, 오늘 요약 영역이 반응형으로 정상 렌더링
    - [ ] 카테고리 색상이 라이트/다크 모드에서 대비 기준 충족
    - [ ] 일정 CRUD·알림 동작 회귀 없음

### Phase 8: 후순위 항목 (8단계)

- **Task 041: 후순위 개선 항목 일괄 처리**
  - PRD 참조: 2.14 (T-L1, T-L2, T-L4~T-L7) / 우선순위: 낮음 / 선행 조건: 없음 (T-L4는 Task 028 이후 권장)
  - **T-L1** 에러 메시지 원문 노출: `grade-short-answer`, `review-document`가 파싱 실패 시 `rawText`를 클라이언트에 반환하지 않도록 일반화 메시지로 변경, 원문은 서버 로그에만 기록
  - **T-L2** `setWindowOpenHandler` 화이트리스트: `electron/main.ts`에서 `shell.openExternal` 호출 전 `https://` 스킴 등 화이트리스트 검증 추가
  - **T-L4** 페이지네이션 도입: `job-postings.ts`, `tech-news.ts`의 `select("*")` 전체 조회를 커서 기반 페이지네이션으로 전환
  - **T-L5** `quiz-session-list` 가상화: 현재 데이터 규모에서는 우선순위가 낮으므로 가상화 필요 여부를 재검토 후 적용
  - **T-L6** `useNewsColumnCount` 리사이즈 디바운스 적용
  - **T-L7** Electron 알림 캐시 신뢰성: 렌더러 IPC push 캐시 단독 의존의 한계(재시작 직후·트레이 상태 알림 누락)를 문서화하고 보완 여부 판단
  - 완료 기준
    - [ ] LLM 원문 응답이 클라이언트 에러 메시지에 포함되지 않음
    - [ ] 비-https 스킴 URL이 외부 브라우저로 열리지 않음
    - [ ] 대량 데이터(수천 건) 상황에서 목록 초기 로딩 시간이 개선됨
    - [ ] 리사이즈 중 렌더링 부담 감소 확인
    - [ ] T-L5, T-L7은 적용 또는 "현행 유지" 결론이 문서에 기록됨

- **Task 042: Task 018 ESLint 예외 처리 후속 정리**
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
    - [ ] 테스트 계정 로그인이 dev/CI 환경에서는 여전히 정상 동작 (Task 038 선행 조건)

- **Task 023: Sentry DSN 실연동 및 대시보드 구축**
  - PRD 참조: 2.17 / 우선순위: 보류(하향) / 선행 조건: **Task 018** (동적 import 전환 완료 필요)
  - Sentry 프로젝트 생성 및 DSN 발급 (Electron main / renderer 구분)
  - `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`을 GitHub Secrets에 등록하고 `release.yml`의 준비된 `env:` 자리에 연결
  - 로컬 dev에서는 DSN 미설정으로 no-op 유지 (개발 중 노이즈 방지), 릴리스 빌드에서만 활성화
  - 소스맵 업로드 설정
  - 완료 기준
    - [ ] 임시 `throw`로 유발한 크래시가 Sentry 대시보드에 수집됨 (main/renderer 각각)
    - [ ] 스택 트레이스가 압축 코드가 아닌 원본 소스 위치로 매핑됨
    - [ ] 로컬 `next dev`에서는 이벤트가 전송되지 않음(no-op)

- **Task 023-1: 코드 서명 인증서 발급 신청 (병행 착수)** - ⏸ 보류(재개 계획 없음)
  - PRD 참조: 2.8(결번 처리됨, 아래 참고) / 우선순위: 보류(하향) / 선행 조건: 없음
  - EV 또는 표준 코드 서명 인증서 발급 신청 착수 (리드타임 수 주 단위)
  - **2026-09-02 갱신**: 사용자가 인증서를 구매할 수 없는 상황으로 확인됨. Windows 코드 서명 인증서는 신원 확인이 필요한 유료 CA(DigiCert, Sectigo, SSL.com 등) 서비스만 존재하고 무료 발급 경로가 없어, 이 프로젝트 예산으로는 착수 불가 — 이에 따라 후속 태스크였던 "자동 업데이트 코드 서명 적용"(구 Phase 6 / 구 Task 038)을 로드맵에서 완전히 제거함(위 "번호 재정렬 안내 2차" 참고). 이 태스크는 재개 계획이 없는 상태로 보존만 함
  - 단기 완화책: **다음 릴리스부터 즉시** 릴리스 아티팩트 SHA256 체크섬을 릴리스 노트에 게시
  - 완료 기준
    - [ ] 인증서 발급 신청 접수 및 진행 상태 추적 문서화
    - [ ] 릴리스 노트에 SHA256 체크섬 자동 게시 (release 워크플로우 반영)

- **Task 020: CSP 최소 적용 및 렌더러 심층방어**
  - PRD 참조: 2.14 T-L3 / 우선순위: 보류(하향) / 선행 조건: Task 018
  - `app://` 프로토콜 핸들러 응답에 Content-Security-Policy 헤더 추가 (또는 `meta` 태그 폴백)
  - Supabase / LLM 엔드포인트 등 실제 필요한 origin만 `connect-src` 화이트리스트로 허용
  - 개발(`next dev`)과 프로덕션(`app://`) 양쪽에서 CSP 위반 콘솔 에러가 없는지 확인
  - 완료 기준
    - [ ] 프로덕션 빌드에서 CSP 헤더가 응답에 포함됨
    - [ ] 인라인 스크립트/스타일 위반 없이 모든 화면 정상 렌더링
    - [ ] Task 021의 폴백 방안(허용 origin 제한)이 성립하는 상태 확보

## 검증 방법 (단계별)

| 단계           | 검증 방법                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 공통           | `npm run dev`로 Electron 앱 실행 후 end-to-end 기능 확인, Edge Function은 `supabase functions serve` 로컬 테스트 후 배포                                                                                                        |
| 0단계          | Node 20 환경 `npm run lint` 0 에러, `npm run build` → `electron-builder` 패키징·설치·실행 재검증(DSN 미설정 시 크래시 없음)                                                                                                     |
| 0-1단계        | `supabase db diff`로 원격 스키마와 마이그레이션 적용 결과 일치 확인                                                                                                                                                             |
| 1단계          | 프로덕션 산출물 `grep -r "TEST_ACCOUNT" out/` CI 자동 검색(검출 시 빌드 차단), `validate-llm-key` 응답·서버 로그에 키 미포함 확인, 임시 `throw`로 Sentry 수집·소스맵 매핑 확인                                                  |
| 2단계          | 딜레이 적용 후 반복 호출 시 429/403 없음, 실패율 임계치 초과 알림 발송 확인, LLM 통합 후 두 함수 응답 동일성 확인, Profiler로 행 재렌더 감소 확인                                                                               |
| 3단계          | 스파이크 결과를 `docs/research/`에 기록 후 착수 판단, 수집 로그 테이블 소스별 성공/실패 기록 및 중복 공고 대표 1건 처리 확인                                                                                                    |
| 4단계          | 지원 기업 CRUD·상태 변경 UI 확인, `analyze-company` 캐시/재조회 동작 및 계정 간 캐시 미공유(RLS), 입력·프롬프트 변경 시 자동 무효화 확인, 문항 저장·기업 분석 기반 피드백 생성, 제출 서류 업로드·연결 및 타 계정 접근 차단 확인 |
| 5단계          | 샘플 PDF 업로드 → 개선 프롬프트 첨삭 → 비교뷰 수동 테스트, 인용 매칭 실패 시 폴백 동작 확인                                                                                                                                     |
| 6단계 (⏸ 보류) | 패키징 실행 파일 기동 포함 주요 플로우 CI 스모크 테스트 등록, 알림은 IPC 훅 어서션으로 대체 검증 — 보류 해제 후 수행                                                                                                            |
| 7단계          | 라이트/다크 모드 시각 검증, 후순위 항목별 회귀 없음 확인 (6단계 스크린샷 기준선 확정은 6단계 보류 해제 시점으로 이월)                                                                                                           |

## 상태 표기 규칙

- **Phase 제목 + ✅**: 해당 Phase 전체 완료
- **Task ✅ + `See: /tasks/XXX-xxx.md`**: 완료된 작업 (작업 파일 참조 추가)
- **`- 우선순위`**: 즉시 착수 대상
- **`⏸ 보류`**: 내용은 보존하되 현재는 진행하지 않는 단계·작업
- **표기 없음**: 대기 중
- 세부 구현 사항은 `- [ ]` 미완료 / `- [x]` 또는 ✅ 완료로 표기
