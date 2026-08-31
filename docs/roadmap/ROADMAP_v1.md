# Grow 데스크탑 앱 개발 로드맵

IT 취업 준비생의 공고 탐색·서류 첨삭·면접 준비·일정 관리를 하나의 데스크탑 앱으로 통합합니다.

## 개요

Grow는 IT 직군 취업 준비생을 위한 노션형 올인원 데스크탑 워크스페이스로 다음 기능을 제공합니다:

- **채용 공고 수집/탐색**: 공식 API·RSS 기반 자동 수집, 직무/지역/경력 필터와 검색, 상세 보기
- **캘린더 일정관리**: 월/주 뷰 대시보드, 메모·체크리스트, 공고 마감일 연동, Electron 네이티브 알림
- **IT 뉴스 피드**: RSS 기반 뉴스 카드 피드와 북마크
- **PDF 문서 첨삭**: 자소서/포트폴리오 업로드 → 텍스트 추출 → LLM 첨삭, diff/코멘트 렌더링, 버전 관리
- **CS 면접 퀴즈**: 카테고리별 문제 뱅크, 랜덤 출제, 오답노트, 선택적 LLM 꼬리질문
- **모바일 확장 준비**: `packages/shared` 기반 공통 로직 분리

### 기술 스택

| 영역         | 선택                                                        |
| ------------ | ----------------------------------------------------------- |
| 데스크탑     | Electron + Next.js (React 19, TypeScript)                   |
| 서버/DB/Auth | Supabase (Postgres, Auth, Storage, Edge Functions, pg_cron) |
| 크롤링       | Supabase Edge Functions(Deno) + pg_cron                     |
| AI/LLM       | Provider 추상화 레이어 (초기 OpenAI)                        |
| PDF 파싱     | pdf-parse / unpdf                                           |
| 상태/폼      | Zustand, React Hook Form + Zod                              |
| UI           | shadcn/ui + Tailwind CSS                                    |
| 구조         | 모노레포 (`apps/desktop`, `apps/mobile`, `packages/shared`) |

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `docs/ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- `/tasks` 디렉토리에 새 작업 파일 생성
- 명명 형식: `XXX-description.md` (예: `001-monorepo-setup.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)**
- 직전 완료 작업(예: 현재가 `012`라면 `011`, `010`)을 예시로 참조. 초기 상태 샘플은 `000-sample.md` 참조
- 예시 작업들은 완료 상태(체크된 박스 + 변경 사항 요약)를 반영하므로, 새 작업 문서는 빈 박스와 변경 사항 요약 없음 상태로 작성

3. **작업 구현**

- 작업 파일의 명세서를 따라 기능 구현
- **검증 기본 루틴**: `npm run dev`로 Electron 앱을 실행해 end-to-end 기능 확인
- **Edge Function**: `supabase functions serve`로 로컬 테스트 후 배포, `pg_cron` 스케줄 등록 확인
- **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 렌더러(Next.js) 화면 E2E 테스트 수행 필수**
  - 렌더러는 `next dev` 서버(localhost)로도 접근 가능하므로 Playwright MCP는 웹 렌더러 대상으로 실행
  - 대부분의 화면이 `AuthGuard`로 보호되므로, `/login` 화면의 "테스트 계정으로 로그인 (개발용)" 버튼(개발 빌드에서만 노출, `apps/desktop/lib/auth-test.ts`)으로 로그인한 뒤 보호된 라우트를 테스트한다. Google OAuth 딥링크 플로우는 Playwright로 자동화할 수 없으므로 이 버튼이 유일한 자동화 경로다.
  - Electron 메인 프로세스 전용 기능(네이티브 알림, 파일 시스템)은 Electron 앱 수동 검증으로 보완
- **PDF 첨삭**: 실제 샘플 PDF로 업로드 → 추출 → LLM 응답까지 수동 테스트
- 각 단계 후 작업 파일 내 진행 상황 업데이트, 테스트 통과 확인 후 다음 단계로 진행
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업을 ✅로 표시하고 `See: /tasks/XXX-xxx.md` 참조 추가

## 개발 단계

### Phase 1: 애플리케이션 골격 구축

- ✅ **Task 001: 모노레포 및 Electron + Next.js 보일러플레이트 구성** - 우선순위
  - `apps/desktop`, `apps/mobile`(placeholder), `packages/shared` 모노레포 워크스페이스 생성
  - Electron 메인/프리로드 프로세스와 Next.js(App Router, React 19, TS) 렌더러 연결
  - `npm run dev`(Electron + Next dev 동시 실행), `npm run build`, `npm run lint` 스크립트 정의
  - Tailwind CSS + shadcn/ui 초기화, 경로 별칭(`@/*`, `@shared/*`) 설정
  - contextIsolation/IPC 브리지 기본 골격 및 보안 설정(nodeIntegration off)
  - 검증: `npm run dev`로 Electron 창이 렌더러 화면을 정상 로드

- ✅ **Task 002: 전체 라우트 구조 및 앱 셸 레이아웃 골격 구현**
  - App Router 라우트 생성: `/`(대시보드), `/jobs`, `/jobs/[id]`, `/calendar`, `/news`, `/documents`, `/documents/[id]`, `/quiz`, `/quiz/[sessionId]`, `/settings`
  - 모든 페이지의 빈 껍데기 파일 + `loading.tsx`/`error.tsx`/`not-found.tsx` 배치
  - 사이드바 + 멀티 패널(리스트/상세) 노션형 레이아웃 컴포넌트 골격 구현
  - 글로벌 네비게이션, 다크모드 ThemeProvider, Toaster 배치
  - 검증: 모든 라우트가 Electron 앱 내에서 이동 가능

### Phase 2: UI/UX 완성 (더미 데이터 활용)

- ✅ **Task 003: 로그인 화면 UI 구현 (앱 진입점 변경)** - 우선순위
  - 앱 실행 시 최초 진입 화면을 로그인 화면으로 변경(`/login` 라우트 신설 또는 `/` 진입 시 미인증 상태면 로그인 화면 표시)
  - 구글 로그인 버튼만 배치(다른 소셜/이메일 로그인 UI 제외), shadcn/ui 기반 스타일링
  - 버튼 클릭 시 동작은 더미/비활성 상태로 구현(실제 Supabase Auth 연동은 Phase 3 Task 009에서 처리)
  - 로그인 성공 후 이동할 대시보드(`/`) 화면과의 전환 플로우를 더미 상태로 시각화
  - 반응형 레이아웃 및 다크모드 스타일 적용

- ✅ **Task 004: 공통 컴포넌트 라이브러리 및 디자인 시스템 구축**
  - shadcn/ui 기반 공통 컴포넌트 추가(Button, Card, Dialog, Sheet, Tabs, Table, Badge, Calendar, Skeleton, Toast 등)
  - 앱 공통 조합 컴포넌트: 사이드바 네비, 리스트-디테일 패널, 빈 상태/에러 상태/로딩 상태 컴포넌트
  - 디자인 토큰(색상/타이포/간격) 및 다크모드 스타일 가이드 확정
  - 더미 데이터 생성 유틸(`packages/shared/mocks`) 작성 — 공고/일정/뉴스/문서/퀴즈 픽스처
  - See: /docs/guides/styling-guide.md

- ✅ **Task 005: 채용 공고·뉴스 화면 UI 구현 (더미 데이터)**
  - 공고 목록 UI: 필터(직무/지역/경력), 검색바, 정렬, 페이지네이션/무한스크롤
  - 공고 상세 패널 UI: 마감일 배지, 원본 링크, 태그, "일정에 추가" 버튼(비활성 상태)
  - 뉴스 카드형 피드 UI 및 북마크 토글 UI
  - 반응형 레이아웃(창 크기 축소 시 패널 접힘) 및 키보드 접근성 적용

- ✅ **Task 006: 캘린더 대시보드 및 일정/메모 UI 구현 (더미 데이터)**
  - 월/주 뷰 캘린더 컴포넌트, 오늘 일정 요약 위젯
  - 일정 생성/수정 폼 UI(React Hook Form + Zod): 제목, 메모, 날짜/시간, 알림 시각, 반복 여부, 카테고리
  - 메모/체크리스트 입력 UI
  - 알림 설정 UI(당일 요약 시각, 지정 시각 알림 토글)
  - See: /tasks/006-calendar-schedule-ui.md

- ✅ **Task 007: 문서 첨삭·CS 퀴즈 화면 UI 구현 (더미 데이터)**
  - 문서 업로드 드롭존, 문서 유형 선택(자소서 문항별/포트폴리오), 처리 상태 표시 UI
  - 첨삭 결과 diff/코멘트 렌더링 컴포넌트 및 버전 히스토리 UI
  - 퀴즈 카테고리 선택, 문제 풀이 화면, 결과 요약, 오답노트 목록 UI
  - 전체 사용자 플로우를 더미 데이터로 클릭 검증(Electron 앱 실행)
  - See: /tasks/007-documents-quiz-ui.md

### Phase 3: 핵심 기능 구현

- ✅ **Task 008: 공통 타입·스키마 정의 및 데이터베이스 스키마 설계** - 우선순위
  - `packages/shared/types`에 도메인 타입 정의: `JobPosting`, `Schedule`, `TechNews`, `DocumentReview`, `CsQuestion`, `QuizSession`, `UserAnswer`
  - Zod 스키마(`packages/shared/schemas`) 및 API 응답/에러 타입 정의
  - Supabase 테이블 스키마 설계 문서화(컬럼, 인덱스, upsert 고유키, RLS 정책 초안) — 실제 마이그레이션 실행은 Task 009
  - LLM Provider 인터페이스(`LlmProvider`) 및 알림 트리거 판단 로직 인터페이스를 shared에 선언(구현 제외)
  - Supabase 프로젝트 생성 및 환경 변수(.env) 구조 정의, 클라이언트 초기화 골격
  - See: /docs/database-schema.md

- ✅ **Task 009: Supabase 스키마 마이그레이션 및 인증/권한 구현(구글 로그인)** - 우선순위
  - 설계된 테이블 마이그레이션 적용(`job_postings`, `schedules`, `tech_news`, `document_reviews`, `cs_questions`, `quiz_sessions`, `user_answers`)
  - RLS 정책 적용(사용자 소유 데이터 접근 제한), 인덱스 및 upsert 고유키 제약 설정
  - Supabase Auth 구글 OAuth 연동, Electron 딥링크 기반 로그인 콜백 처리
  - Task 003에서 만든 로그인 화면의 구글 버튼에 실제 OAuth 플로우 연결
  - 세션 저장/복원, 보호 라우트 가드, 로그아웃 처리
  - Playwright MCP로 로그인/로그아웃/보호 라우트 접근 차단 E2E 테스트
  - See: /tasks/009-supabase-migration-auth.md (Google Cloud Console 리디렉션 URI 추가 완료, 실제 로그인 완료 플로우 재검증 예정)

- ✅ **Task 010: 채용 공고 수집 Edge Function 및 목록 연동**
  - ✅ Supabase Edge Function 구현: 고용24(work24) 공식 API는 개인회원 사용 불가로 최종 blocked 확정, 잡코리아(JobKorea) robots.txt가 허용한 `/recruit/joblist` HTML 크롤링으로 전환 → 정규화 → `source_url` 고유키 upsert
  - ✅ 소스 어댑터 구조(`JobPostingSource`/`NormalizedJobPosting`) 및 robots.txt 확인 결과 문서화, `job_postings.source` 컬럼 추가(플랫폼 구분)
  - ✅ 직무 필터(`duty` 쿼리) 적용: 프론트엔드개발자·AI/ML엔지니어·AI/ML연구원 직무로 한정 수집
  - ✅ `pg_cron` 1일 2회(KST 09:00/18:00) 스케줄 등록(Supabase Vault로 서비스 키 보안 관리), 실행 로그(`job_collection_logs`) 기록
  - ✅ 렌더러 데이터 레이어 연결: 더미 데이터를 실제 Supabase 조회(필터/검색/상세)로 교체
  - ✅ 검증: `supabase functions serve` 로컬 테스트 후 배포, pg_cron 수동 트리거로 실제 수집 확인. 당시에는 앱의 Google OAuth AuthGuard로 인해 완전한 클릭 E2E가 제한되어 서버 렌더링 검증으로 대체했으나, Task 011에서 추가된 테스트 계정 로그인 버튼으로 이후 Task부터는 클릭 E2E가 가능해짐
  - 자소설닷컴/캐치(Catch)는 실제 목록 로딩 방식(정적 HTML vs 내부 API) 미확인으로 이번 범위에서 제외, 후속 Task로 이월
  - See: /docs/job-source-research.md

- ✅ **Task 011: 일정관리 CRUD 및 Electron 네이티브 알림 구현**
  - ✅ `schedules` CRUD 연동, 캘린더를 mock에서 Supabase 실데이터로 완전히 교체(생성/조회/수정/삭제)
  - ✅ 공고 마감일 → "일정에 추가" 액션 연동(`category: deadline`), 상시채용 공고는 버튼 비활성
  - ✅ 알림 트리거 판단 로직을 `packages/shared`에 플랫폼 독립적으로 구현(순수 함수), 당일 요약 알림 시각 등 설정은 `localStorage`에 저장(별도 DB 테이블 없음, 이번 스코프의 의도된 결정)
  - ✅ Electron 메인 프로세스에서 `Notification` API 발송, `node-schedule` 로컬 스케줄러(1분 폴링)로 지정 시각 알림 + 당일 요약 알림. 메인 프로세스는 Supabase 인증 정보가 없어 렌더러가 IPC로 최신 일정/설정을 push하는 구조. `packages/shared`를 Electron 메인 런타임에서 직접 require할 수 없어 트리거 로직을 `electron/notification-trigger.ts`에 복제(수정 시 양쪽 동기화 필요)
  - ✅ `/login`에 개발 전용 테스트 계정 로그인 버튼 추가 — Google OAuth 딥링크로는 불가능했던 인증 필요 화면의 Playwright MCP 클릭 E2E가 이후 Task부터 가능해짐(프로덕션 빌드에는 미포함)
  - ✅ 검증: Playwright MCP로 테스트 계정 로그인 → 일정 생성/삭제 → 공고 상세 "일정에 추가" E2E 테스트, Supabase SQL로 실제 반영 확인. 실제 OS 알림 발송은 Electron `BrowserWindow`를 Playwright로 제어할 수 없어 자동화 불가 — 사용자의 Electron 앱 수동 검증 필요
  - See: /tasks/011-schedule-crud-notifications.md

- ✅ **Task 012: IT 뉴스 수집 Edge Function 및 피드 연동**
  - ✅ 소스 조사: 네이버 뉴스 검색 API는 키워드 검색 기반+얕은 요약이라 배제, GeekNews(news.hada.io) Atom RSS와 전자신문(etnews) RSS(AI `04046.xml`, 보안 `04045.xml`)를 채택. 최초 웹 검색으로 얻은 전자신문 섹션 코드(`Section041/045.xml`)가 실제로는 WAF 차단되는 구식 경로임을 curl 실측으로 발견해 정정
  - ✅ 공고 수집(Task 010)과 동일 패턴 재사용한 `collect-tech-news` Edge Function 구현(`types.ts`/`sources/*.ts`/`index.ts`, 정규식 기반 파싱) + `pg_cron` 1일 2회(KST 09:00/18:00) 스케줄 등록(Task 010과 동일 Vault 서비스 키 재사용)
  - ✅ `tech_news.url` 고유키 upsert 중복 방지, 요약/출처/발행일 정규화. 전자신문 AI/보안 두 섹션에 동일 기사가 겹쳐 같은 upsert 배치 내 url 중복으로 실패하는 문제를 발견해 소스 어댑터에서 url 기준 dedupe 처리로 해결
  - ✅ `news_collection_logs` 테이블 신규 마이그레이션(`job_collection_logs`와 동일 구조), `tech_news`/`tech_news_bookmarks`는 Task 009에서 이미 마이그레이션되어 있었음을 확인 후 재사용
  - ✅ 뉴스 피드·북마크를 실데이터로 교체: `packages/shared`에 `rowToTechNews` 매퍼 추가, `apps/desktop/lib/tech-news.ts`(조회/북마크 생성·삭제) 구현, 더 이상 쓰이지 않는 뉴스 mock 삭제
  - ✅ 검증: `supabase functions serve` 로컬 테스트(파싱 로직은 raw 피드로 Node 독립 검증 후 실제 upsert까지 확인) → 배포 → pg_cron 등록. Playwright MCP로 로그아웃 → 테스트 계정 로그인 → 뉴스 피드 로딩(139건) → 북마크 토글 E2E 테스트, Supabase SQL로 북마크 생성/삭제 및 새로고침 후 상태 유지 실제 반영 확인
  - See: /docs/news-source-research.md

- ✅ **Task 013: PDF 첨삭 파이프라인 및 LLM Provider 구현**
  - ✅ Edge Function 사용자 JWT 인증 방식 및 PDF 추출 라이브러리(unpdf, pdf-parse는 Node 전용이라 부적합) Deno 호환성 조사
  - ✅ `user_llm_keys` 테이블 및 Supabase Vault 연동(평문 키는 SELECT로 노출되지 않도록 뷰/SECURITY DEFINER 함수로 secret_id만 반환)
  - ✅ Supabase Storage `documents` 비공개 버킷(10MiB, PDF 전용) 설정 및 클라이언트 확장자/용량 Zod 검증
  - ✅ `LlmProvider` 구현체(Gemini/Anthropic) 및 팩토리 함수, 문서 유형(자소서/포트폴리오)별 프롬프트 템플릿
  - ✅ `review-document` Edge Function: 사용자 JWT 인증 + PDF 추출 + 키 복호화 + LLM 호출 + 결과 저장(status pending→processing→completed/failed)
  - ✅ LLM API 키 등록/관리 설정 화면(마스킹 조회), PDF 업로드~첨삭 결과 화면 실데이터 연결 및 키 미등록 차단 UX
  - ✅ 검증: 실제 샘플 PDF로 키 등록→업로드→추출→LLM 응답→결과 표시 수동 테스트, Playwright MCP로 정상 플로우/에러 플로우(키 미등록) E2E 테스트 통과
  - See: /docs/pdf-review-research.md

- ✅ **Task 014: CS 면접 퀴즈 문제 뱅크 및 풀이 로직 구현**
  - ✅ `cs_questions`에 `question_type`(multiple-choice/short-answer) 컬럼 추가, 카테고리에 `ai-llm`/`frontend` 추가(기존 4개 포함 총 6개), `quiz_sessions`/`user_answers`는 모의고사(`mixed`) 및 서술형(`answer_text`/`ai_score`/`ai_feedback`) 지원으로 확장(하위호환 유지)
  - ✅ `grade-short-answer` Edge Function 신설: `review-document`와 동일한 사용자 JWT 인증 + `user_llm_keys` 개인 키 복호화 패턴으로 서술형 답안을 AI가 0~100점+피드백으로 채점
  - ✅ `get_random_quiz_questions(p_count, p_category)` RPC로 카테고리별/전체(모의고사) 무작위 출제 구현
  - ✅ 퀴즈 UI 전체를 더미 fixture에서 실제 Supabase 데이터로 완전 전환(문제 조회, 세션 생성/기록, 결과 요약, 오답노트, 세션 목록) — `packages/shared/src/mocks/quiz.ts` 등 미사용 더미 코드 제거
  - ✅ 카테고리당 20문항(객관식 14+서술형 6) × 6개 카테고리 = 총 120문항 시딩(WebSearch로 최신 면접 질문 주제 조사 후 AI가 직접 작성)
  - ✅ 검증: Playwright MCP로 객관식 완주(정답/오답 반영, DB 집계 일치)·오답노트·세션 목록·모의고사 무작위 출제(전체 풀 대상)·서술형 렌더링 및 API 키 미등록 에러 처리 E2E 확인. 단, 실제 LLM API 키가 이 환경에 없어 서술형 AI 채점의 성공 케이스(및 이를 포함하는 모의고사 20문 전체 완주)는 end-to-end로 검증하지 못함 — 결과 화면의 서술형 피드백 렌더링 자체는 채점 결과를 직접 삽입해 별도 검증함
  - See: /docs/database-schema.md

- ✅ **Task 014-1: 핵심 기능 통합 테스트**
  - ✅ Playwright MCP로 로그인(테스트 계정) → 공고 탐색 → 일정 추가 → 뉴스 → 문서 첨삭 → 퀴즈로 이어지는 전체 사용자 플로우를 통합 테스트하고, 각 단계를 Supabase SQL로 실제 DB 반영과 교차검증(일정 생성/삭제, 뉴스 북마크 추가/해제, 퀴즈 세션/답안 집계 일치)
  - ✅ RLS 권한 경계 검증: `schedules`/`document_reviews`/`quiz_sessions`/`user_answers`/`user_llm_keys` 전체 정책을 `pg_policies`로 전수 조회해 `auth.uid() = user_id` 기반임을 확인. 이 과정에서 `user_answers`에 UPDATE 정책이 없어 답안 재제출(upsert) 시 실제 403 RLS 오류가 발생하는 갭을 발견 및 재현 후 `user_answers_owner_update` 마이그레이션으로 수정
  - ✅ 에러 핸들링·엣지 케이스 검증: `window.fetch` 오버라이드로 네트워크 오류 시뮬레이션(뉴스 피드 에러 UI 정상 노출 확인), Edge Function 방어 응답(인증 없음 401, 빈 body/잘못된 provider 400) 확인, 10MiB 초과 PDF의 `documentFileSchema`(Zod) 차단 로직 검증, LLM 키 미등록 시 문서 첨삭·서술형 채점 모두 Edge Function 호출 전 클라이언트에서 차단됨을 확인
  - ✅ 버그 수정 2건: (1) 헤더 `UserProfile`이 실제 로그인 사용자 대신 하드코딩된 목업(`김민영`)을 표시하던 문제를 `useAuth()` 세션 기반으로 수정 (2) 퀴즈 `RadioGroup`이 문항마다 controlled/uncontrolled를 오가며 제출 버튼이 비활성 상태로 고착되던 버그를 `value` 기본값을 빈 문자열로 통일해 수정
  - ✅ Electron 앱 실행 기준 회귀 시나리오 체크리스트 작성. 실제 OS 알림 발송과 LLM 호출 성공 케이스(로컬 테스트 계정에 실키 미등록)는 이전 Task들과 동일한 사유로 자동 검증 범위 밖임을 명시
  - See: /docs/regression-checklist.md

### Phase 4: 고급 기능 및 최적화

- ✅ **Task 015: 사용자 경험 향상 및 부가 기능**
  - ✅ 사전 조사(electron-updater 서명 제약, Supabase Realtime 구독 패턴, cmdk 호환성)로 오프라인 캐시 범위를 "최근 조회 표시용 캐시"로 축소, 자동 실행 기본값 OFF 결정
  - ✅ CLAUDE.md 표준인 Zustand를 프로젝트 최초로 도입(`lib/stores/recent-favorites-store.ts`, localStorage persist)해 최근 항목/즐겨찾기 구현. shadcn Command(cmdk) 기반 Cmd/Ctrl+K 전역 커맨드팔레트로 공고/뉴스/문서/퀴즈를 통합 검색. `CommandDialog` 내부에 `<Command>`로 감싸지 않아 cmdk 컨텍스트가 undefined가 되는 런타임 에러를 Playwright 콘솔에서 발견해 수정
  - ✅ `job_postings`/`tech_news` Realtime(postgres_changes INSERT) 구독으로 신규 수집 시 OS 알림(3초 디바운스로 묶어 발송). 구현 중 두 테이블이 `supabase_realtime` publication에 애초에 등록되어 있지 않았음을 발견해 마이그레이션으로 추가했고, 사전 조사에서 안내한 `private: true` 채널이 이 프로젝트에서는 `TIMED_OUT`을 유발함을 실측으로 발견해 공개 채널 구독으로 전환(RLS가 무조건 허용이라 안전)
  - ✅ electron-updater 도입(GitHub Releases 배포, Windows `verifyUpdateCodeSignature: false`) — devDependencies가 아닌 dependencies로 정정 배치(패키징된 앱 런타임에 필요). macOS는 서명 없이 자동 업데이트 자체가 불가능함을 문서화
  - ✅ `app.setLoginItemSettings` 기반 OS 로그인 시 자동 실행 토글, Tray(런타임 raw 버퍼로 생성한 아이콘) 기반 "창을 닫아도 백그라운드 유지" 옵션(기본 OFF로 기존 창 닫기 동작 보존) 구현. 앱이 완전히 종료된 상태에서는 IPC 캐시 구조상 알림이 보장되지 않음을 문서화
  - ✅ 검증: Playwright MCP로 전역 검색/최근항목/즐겨찾기 localStorage 유지, Realtime 채널 SUBSCRIBED 및 Supabase SQL 직접 INSERT 수신을 확인. Electron `BrowserWindow`는 Playwright로 제어 불가(Task 011과 동일 제약)해 OS 알림 팝업 자체, 로그인 항목/트레이 토글의 실제 클릭 E2E는 자동화하지 못했으나, `app.setLoginItemSettings`/`Tray` 생성 API가 이 환경에서 정상 동작(Windows 시작 항목 실제 등록/해제 확인)함을 Electron 헤드리스 스크립트로 별도 실측
  - See: /docs/task015-research.md, /docs/regression-checklist.md

- **Task 016: 성능 최적화, 배포 및 모니터링**
  - 렌더러 번들 최적화(코드 스플리팅, 서버 컴포넌트 활용), 목록 가상화
  - Edge Function 실행 비용/시간 최적화 및 LLM 호출 캐싱 전략
  - 단위/E2E 테스트 코드 정비, CI 파이프라인(lint/build/test) 및 Electron 패키징·배포(코드 서명 포함)
  - 로깅/에러 추적(Sentry 등), Edge Function 실행 모니터링 및 알림

- ✅ **Task 017: Electron 프로덕션 빌드 정적 export 정합성 확보**
  - ✅ `apps/desktop/next.config.ts`에 `output: "export"` 추가. `next/image` 미사용을 확인해 `images.unoptimized` 등 추가 옵션은 불필요했음
  - ✅ `/jobs/[id]`, `/documents/[id]`, `/quiz/[sessionId]`의 Supabase 데이터 조회를 client 컴포넌트로 이동. `documents`/`quiz`는 이미 얇은 wrapper라 시그니처만 정리했고, `jobs`는 신규 `job-detail-page-client.tsx`(useEffect 조회, 기존 `LoadingState`/`EmptyState`/`JobDetailContent` 재사용)를 만들어 위임함. page.tsx 자체는 async 서버 컴포넌트(`await params`)로 유지 — 실측 결과 `"use client"`와 `generateStaticParams()`를 한 페이지에 함께 export할 수 없어(Next 16 App Router 제약), 데이터 조회만 client로 옮기고 페이지 진입점은 서버 컴포넌트로 남겨야 함을 발견
  - ✅ `output: "export"`는 `generateStaticParams()`가 빈 배열을 반환하면 "missing" 설정으로 간주해 빌드를 거부함을 실측 확인. 이 앱이 `file://out/index.html`만 1회 로드하고 이후 전부 client-side 라우팅만 쓰는 순수 SPA(새로고침/딥링크 직접 진입 미지원)임을 코드 전수 조사로 확인했으므로, 세 라우트 모두 무해한 `placeholder` 값을 반환하도록 처리해 해결
  - ✅ `npm run build` 실제 실행으로 `out/index.html`, `out/jobs/placeholder`, `out/documents/placeholder`, `out/quiz/placeholder` 등 산출물이 정상 생성됨을 확인
  - ✅ `electron-builder` 로컬 Windows 패키징 성공. 최초 시도 시 `CSC_IDENTITY_AUTO_DISCOVERY=false`로 코드서명을 꺼도 electron-builder가 Windows 타겟 빌드에서도 내부적으로 `winCodeSign` 바이너리 패키지를 항상 내려받아 압축 해제를 시도했고, Windows 개발자 모드 레지스트리 값(`AllowDevelopmentWithoutDevLicense`)은 켜져 있었으나 재로그인 전이라 현재 세션 토큰에 반영되지 않아 macOS용 `.dylib` 심볼릭 링크 생성이 `EPERM`으로 실패 → 무한 재다운로드·재시도에 빠지는 것을 실측 확인. 사용자가 개발자 모드를 다시 켜고(재로그인 반영) 재시도하자 winCodeSign 추출이 정상 동작함을 확인
  - ✅ 패키징 재시도 중 별도의 실제 버그 1건 추가 발견 및 수정: `apps/desktop`이 모노레포 하위 폴더라 `.git`이 없어 electron-builder가 repository를 자동 감지하지 못했고, `build.publish.provider: "github"` 설정과 결합되어 업데이트 메타데이터(`latest.yml`) 생성 단계에서 `Cannot read properties of null (reading 'provider')`로 크래시 — `apps/desktop/package.json`에 `repository`(`github.com/kimym98/grow`, `directory: apps/desktop`) 필드를 명시해 해결
  - ✅ 최종 검증: `dist/Grow Setup 0.1.0.exe`, `.blockmap`, `latest.yml`이 모두 정상 생성되고 electron-builder가 exit code 0으로 종료됨을 확인. 코드서명은 로컬 검증을 위해 껐을 뿐이며(`verifyUpdateCodeSignature: false`), 실제 배포 시에는 정식 코드 서명이 필요함
  - ✅ 설치 파일을 실제로 설치·실행해보니 main process에서 `Cannot find module '@sentry/browser-utils'`로 크래시하는 런타임 버그를 추가 발견. 원인은 `@sentry/electron` → `@sentry/browser`의 전이 의존성인 `@sentry/browser-utils`가 npm workspaces 모노레포에서 루트 `node_modules`에만 존재해, electron-builder가 `apps/desktop` 기준으로 프로덕션 의존성을 계산할 때 이를 놓치고 asar 패키지에서 빠뜨린 것 — `apps/desktop/package.json`에 `@sentry/browser-utils`(`10.70.0`)를 명시적 direct dependency로 추가하고 재빌드해, asar 내부에 해당 모듈이 정상 포함됨을 `asar list`로 실측 확인
  - See: 이 문서 상단 Task 016-5 항목, `apps/desktop/package.json`(build/repository/dependencies 설정)

---

**📅 최종 업데이트**: 2026-08-28
**📊 진행 상황**: Phase 4 완료 (17/17 Tasks 완료)
