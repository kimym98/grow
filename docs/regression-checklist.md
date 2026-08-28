# 핵심 기능 통합 테스트 회귀 체크리스트 (Task 014-1)

Task 010~014에서 개별 구현된 기능(로그인, 공고/일정, 뉴스, 문서 첨삭, CS 퀴즈)을 하나의 사용자 플로우로 통합 검증한 결과와, 향후 변경 시 반복 확인해야 할 회귀 시나리오를 정리한다. Playwright MCP로 자동 검증한 항목과, Electron 앱을 직접 실행해야만 확인 가능한 항목을 구분한다.

## 1. Playwright MCP로 자동 검증 가능한 항목 (웹 렌더러 기준)

### 인증
- [ ] `/login`에서 "테스트 계정으로 로그인 (개발용)" 버튼 클릭 시 `qa-tester@example.com` 세션으로 정상 전환된다.
- [ ] 로그아웃 후 `/login` 재방문 시 세션이 남아있으면 자동으로 홈(`/`)으로 리다이렉트된다.
- [ ] 헤더의 사용자 프로필이 실제 로그인한 계정의 이메일/이름을 표시한다(고정된 목업 값이 아님).

### 채용공고 & 일정
- [ ] `/jobs` 목록이 정상 렌더링되고, 검색어로 결과가 없을 때 "조건에 맞는 공고가 없습니다" 빈 데이터 UI가 노출된다.
- [ ] 공고 상세에서 "일정에 추가" 클릭 시 토스트가 뜨고 `schedules` 테이블에 실제 행이 생성된다(카테고리 `deadline`, 마감일 기준).
- [ ] 대시보드 캘린더에서 해당 날짜에 일정이 즉시 반영되고, 삭제 시 DB에서도 제거된다.

### 뉴스
- [ ] `/news` 피드가 정상 로딩되고, 북마크 토글이 `tech_news_bookmarks`에 즉시 반영된다(추가=INSERT, 해제=DELETE).
- [ ] 새로고침/재방문 후에도 북마크 상태가 유지된다.
- [ ] 네트워크 요청이 실패하면 "뉴스를 불러오지 못했습니다" 에러 UI가 노출된다(수 초 내).

### 문서 첨삭
- [ ] LLM 키 미등록 상태에서 `/documents` 진입 시 경고 배너가 보이고, 업로드 버튼 클릭 시 파일 선택 없이 즉시 "먼저 설정에서 LLM API 키를 등록해주세요" 토스트로 차단된다.
- [ ] `documentFileSchema`(Zod)가 10MiB 초과 PDF를 네트워크 요청 전에 거부한다. Storage 버킷(`supabase/config.toml`의 `[storage.buckets.documents]`) 쪽 `file_size_limit`도 클라이언트와 동일하게 10MiB로 유지되어야 한다(둘 중 하나만 변경하지 말 것).

### CS 퀴즈
- [ ] 카테고리별 5문항 객관식 완주 시 `quiz_sessions.correct_count`가 실제 `user_answers` 정답 수와 일치한다.
- [ ] 오답노트 개수, 세션 목록의 정답률이 DB 집계와 일치한다.
- [ ] 종합 모의고사(`category=mixed`) 생성 시 `total_count=20`이며 여러 카테고리 문제가 섞여 출제된다.
- [ ] **문항 전환 시 라디오 버튼이 이전 선택 상태를 유지하지 않고 초기화되며, 새 문항에서 첫 번째 시도 클릭만으로 제출 버튼이 활성화되어야 한다.** (2026-08-28 수정: `RadioGroup`의 `value`가 `undefined`↔문자열로 전환되며 controlled/uncontrolled 경고와 함께 제출 버튼이 비활성 상태로 고착되는 버그가 있었음 — `quiz-play-view.tsx`에서 `selected === null`일 때 `value=""`를 사용하도록 수정. 브라우저 콘솔에 "RadioGroup is changing from uncontrolled to controlled" 경고가 다시 나타나면 회귀다.)
- [ ] 서술형 문제에서 LLM 키 미등록 시 Edge Function 호출 없이 클라이언트에서 "등록된 LLM API 키가 없습니다..." 토스트로 차단된다(네트워크 탭에 `grade-short-answer` 요청이 없어야 정상).
- [ ] 동일 (세션, 문항)에 대한 답안 재제출(upsert)이 RLS 오류 없이 성공한다. (2026-08-28 수정: `user_answers` 테이블에 UPDATE 정책이 없어 재제출 시 403 `42501`이 발생하던 버그를 `user_answers_owner_update` 마이그레이션으로 해결.)

### 권한/에러 처리
- [ ] `schedules`, `document_reviews`, `quiz_sessions`, `user_answers`, `user_llm_keys` 테이블 모두 `auth.uid() = user_id` 기반(또는 `quiz_sessions` 조인) RLS 정책이 SELECT/INSERT/UPDATE/DELETE 전체에 적용되어 있다.
- [ ] `review-document`, `grade-short-answer` Edge Function은 인증 없음(401), 빈 body(400), 잘못된 provider(400) 요청에 방어적으로 응답한다.

## 2. Electron 앱을 직접 실행해야 확인 가능한 항목

`npm run dev`(apps/desktop, Next.js dev 서버 + Electron 동시 실행) 또는 `npm run build && electron .`로 패키징 빌드를 구동해 아래 항목을 수동으로 확인한다. Playwright MCP는 Electron `BrowserWindow`를 제어할 수 없어 자동화가 불가능하다(Task 011에서 이미 확인된 제약과 동일).

- [ ] 앱 실행 시 창 크기가 기본값(1280×800)으로 뜨고, `contextIsolation`/`nodeIntegration` 설정으로 렌더러가 `window.electronAPI`를 통해서만 Electron 기능에 접근한다(개발자 도구 콘솔에서 `require`가 노출되지 않아야 함).
- [ ] `grow://` 딥링크로 OAuth 콜백을 수신하면 렌더러가 `onAuthCallback`을 통해 세션을 정상 교환한다(Windows/Linux는 `second-instance`, macOS는 `open-url` 경로 모두 확인).
- [ ] 두 번째 인스턴스를 실행해도 기존 창이 포커스될 뿐 새 창이 뜨지 않는다(단일 인스턴스 락).
- [ ] 일정을 등록한 뒤 지정 시각이 되면 OS 알림이 실제로 발송된다(1분 폴링 `node-schedule`). 당일 요약 알림도 설정된 시각에 발송된다.
- [ ] 동일 일정에 대해 하루 안에 알림이 중복 발송되지 않는다(`firedReminderKeys` 중복 방지).
- [ ] 앱 종료 후 재실행 시 로그인 세션이 유지된다(Supabase 세션 영속화).

## 3. 테스트 환경의 한계 (자동화 불가 사유 명시)

- 실제 OS 알림 발송은 Electron `BrowserWindow`를 Playwright로 제어할 수 없어 이번 통합 테스트에서도 자동 검증하지 못했다. 위 "Electron 앱을 직접 실행해야 확인 가능한 항목"에서 수동 확인이 필요하다.
- 로컬 테스트 계정(`qa-tester@example.com`)에는 실제 LLM API 키가 등록되어 있지 않아, 문서 첨삭 및 서술형 채점의 **성공** 케이스(LLM 호출 자체)는 end-to-end로 검증하지 못했다. 키 미등록 시의 차단 UX만 검증했다. 이는 Task 013/014와 동일한 제약이다.
- 대용량 PDF(10MiB 초과) 업로드의 실제 UI 재현은 테스트 계정에 LLM 키가 없어 업로드 다이얼로그 자체가 열리지 않아 수행하지 못했고, 동일한 Zod 검증 로직을 독립 실행해 논리적으로 검증했다.
