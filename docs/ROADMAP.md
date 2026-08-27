# AI 취업 비서 데스크탑 앱 개발 로드맵

IT 취업 준비생의 공고 탐색·서류 첨삭·면접 준비·일정 관리를 하나의 데스크탑 앱으로 통합합니다.

## 개요

AI 취업 비서는 IT 직군 취업 준비생을 위한 노션형 올인원 데스크탑 워크스페이스로 다음 기능을 제공합니다:

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
  - See: /docs/design-system.md

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

- **Task 013: PDF 첨삭 파이프라인 및 LLM Provider 구현**
  - Supabase Storage 업로드(용량/확장자 검증) 및 서명 URL 처리
  - pdf-parse/unpdf 텍스트 추출 → 문서 유형별 프롬프트 템플릿 적용
  - `LlmProvider` 인터페이스 구현체(OpenAI) 및 교체 가능 구조, 재시도/타임아웃/비용 가드
  - 첨삭 결과 저장 및 버전 관리, diff/코멘트 렌더링 실데이터 연결
  - 검증: 실제 샘플 PDF로 업로드→추출→LLM 응답 수동 테스트, Playwright MCP로 업로드~결과 표시 E2E 테스트

- **Task 014: CS 면접 퀴즈 문제 뱅크 및 풀이 로직 구현**
  - 카테고리별(네트워크/DB/OS/자료구조) 초기 문제 뱅크 시딩
  - 랜덤 출제 로직, `quiz_sessions`/`user_answers` 기록, 채점 및 결과 요약
  - 오답노트 조회/복습 플로우 구현
  - 선택적 LLM 꼬리질문/해설 생성(Provider 재사용, 기능 플래그로 on/off)
  - Playwright MCP로 세션 시작→풀이→채점→오답노트 E2E 테스트

- **Task 014-1: 핵심 기능 통합 테스트**
  - Playwright MCP로 전체 사용자 플로우 통합 테스트(로그인 → 공고 탐색 → 일정 추가 → 뉴스 → 문서 첨삭 → 퀴즈)
  - API 연동·비즈니스 로직 검증, RLS 권한 경계 테스트
  - 에러 핸들링 및 엣지 케이스(네트워크 오류, Edge Function 실패, LLM 타임아웃, 대용량 PDF, 빈 데이터)
  - Electron 앱 실행 기준 회귀 시나리오 체크리스트 정리

### Phase 4: 고급 기능 및 최적화

- **Task 015: 사용자 경험 향상 및 부가 기능**
  - 전역 검색(커맨드 팔레트), 키보드 단축키, 최근 항목/즐겨찾기
  - Supabase Realtime 기반 데이터 동기화 및 수집 완료 알림
  - 오프라인 캐시/낙관적 업데이트, 앱 자동 업데이트(electron-updater)
  - OS 로그인 시 백그라운드 자동 실행 옵션(앱 종료 상태 알림 보장 검토)

- **Task 016: 성능 최적화, 배포 및 모니터링**
  - 렌더러 번들 최적화(코드 스플리팅, 서버 컴포넌트 활용), 목록 가상화
  - Edge Function 실행 비용/시간 최적화 및 LLM 호출 캐싱 전략
  - 단위/E2E 테스트 코드 정비, CI 파이프라인(lint/build/test) 및 Electron 패키징·배포(코드 서명 포함)
  - 로깅/에러 추적(Sentry 등), Edge Function 실행 모니터링 및 알림

- **Task 017: 모바일 확장 준비 (후순위)**
  - 공통 로직(Supabase 클라이언트, 타입, Zod 스키마, 알림 트리거 판단) `packages/shared` 이관 완결
  - `apps/mobile` React Native/Expo 초기 셋업 및 인증/공고 조회 최소 플로우 구현
  - 알림 발송 계층만 플랫폼별 분리(Electron Notification vs. 모바일 Push) 검증
