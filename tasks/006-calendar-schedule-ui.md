# Task 006: 캘린더 대시보드 및 일정/메모 UI 구현 (더미 데이터)

- [x] 의존성 및 shadcn 컴포넌트 설치 (react-hook-form, @hookform/resolvers, checkbox, switch, select, popover, form)
- [x] 일정 더미 데이터 및 검증 스키마 확장
- [x] 캘린더 뷰 및 오늘 일정 요약 위젯 구현
- [x] 일정 생성/수정 폼 다이얼로그 구현
- [x] 메모/체크리스트 패널 구현
- [x] 알림 설정 UI 구현
- [x] 캘린더 대시보드 컨테이너 조립 및 페이지 연결
- [x] Electron 수동 검증 및 작업 문서/로드맵 갱신

## 개요

`/calendar` 라우트에 캘린더 대시보드(월/주 뷰, 오늘 일정 요약), 일정 생성/수정 폼(React Hook Form + Zod), 메모/체크리스트 UI, 알림 설정 UI를 더미 데이터로 구현했다. 실제 백엔드 연동(Supabase CRUD)과 Electron 네이티브 알림 발송은 Phase 3의 Task 011에서 처리하며, 이번 작업은 순수 UI/UX와 더미 데이터 바인딩만 다룬다.

## 관련 파일

- `apps/desktop/app/calendar/page.tsx` - `CalendarDashboard` 렌더링
- `apps/desktop/components/sections/calendar/calendar-dashboard.tsx` - 컨테이너, `ListDetailPanel` 조합
- `apps/desktop/components/sections/calendar/calendar-view.tsx` - 월/주 뷰 전환 (Tabs + shadcn Calendar + date-fns 주간 그리드)
- `apps/desktop/components/sections/calendar/today-summary-widget.tsx` - 오늘 일정 요약 Card
- `apps/desktop/components/sections/calendar/schedule-form-dialog.tsx` - 일정 생성/수정 Dialog (RHF + zodResolver)
- `apps/desktop/components/sections/calendar/checklist-panel.tsx` - 메모/체크리스트 추가·토글·삭제
- `apps/desktop/components/sections/calendar/notification-settings.tsx` - 당일 요약/지정 시각 알림 토글 UI(더미)
- `apps/desktop/components/sections/calendar/schedule-category.ts` - 카테고리 enum → 한글 라벨 매핑
- `apps/desktop/components/ui/{checkbox,switch,select,popover,form}.tsx` - 신규 설치된 shadcn 컴포넌트
- `apps/desktop/lib/validators.ts` - `scheduleFormSchema`, `ScheduleFormValues`
- `packages/shared/src/mocks/schedules.ts` - `ScheduleFixture`에 `reminderTime`, `checklist` 필드 확장

## 수락 기준

- [x] 월 뷰/주 뷰가 Tabs로 전환되며, 일정이 있는 날짜가 시각적으로 구분된다
- [x] 오늘 일정 요약 위젯이 당일 일정만 정확히 필터링해 보여준다
- [x] 일정 추가/수정 다이얼로그가 RHF + Zod로 필수 필드를 검증하고, 정상 제출 시 목록에 즉시 반영된다
- [x] 알림 시각 토글에 따라 알림 시각 입력 필드가 조건부로 노출된다
- [x] 체크리스트 항목을 추가/완료 토글/삭제할 수 있다
- [x] 알림 설정(당일 요약/지정 시각) 토글이 UI 상태로 반영된다(실제 발송 없음)
- [x] 반응형 레이아웃에서 모바일 폭일 때 리스트/상세 패널이 전환되며 "목록으로" 버튼으로 복귀 가능하다
- [x] 키보드 Tab 이동으로 주요 컨트롤에 접근 가능하다

## 구현 단계

1. `react-hook-form`, `@hookform/resolvers` 설치 및 shadcn `checkbox`/`switch`/`select`/`popover`/`form` 컴포넌트 추가(단, `form` 컴포넌트는 CLI가 파일을 생성하지 않아 프로젝트 컨벤션에 맞춰 수동 작성)
2. `ScheduleFixture`에 `reminderTime`/`checklist` 필드 확장, `scheduleFormSchema` 정의
3. `CalendarView`(월/주 전환) + `TodaySummaryWidget` 구현
4. `ScheduleFormDialog` 구현 — 최초 `useEffect` 기반 초기화가 React 규칙 위반(`set-state-in-effect`)을 일으켜, `key` 기반 리마운트 패턴으로 재설계
5. `ChecklistPanel`, `NotificationSettings` 구현
6. `CalendarDashboard`로 하위 컴포넌트 조립 및 `app/calendar/page.tsx` 연결
7. Playwright MCP로 `/calendar`(localhost:3000, `next dev` 렌더러) E2E 확인: 월/주 전환, 일정 있는 날짜 상세 진입, 체크리스트 추가/토글/삭제, 알림 토글, 일정 추가(빈 값 검증 에러 → 정상 제출), 수정 다이얼로그 defaultValues 반영, 반응형(480px 폭에서 패널 전환), 키보드 Tab 포커스 이동

## 변경 사항 요약

- shadcn/ui 기반 캘린더 대시보드 UI 일체를 더미 데이터로 신규 구현
- `react-hook-form` + `@hookform/resolvers`를 프로젝트에 처음 도입(향후 다른 폼에도 재사용 가능)
- `packages/shared`의 일정 더미 데이터에 알림 시각/체크리스트 필드 확장
- Electron 네이티브 알림 및 실제 CRUD 연동은 Task 011에서 이어서 진행 예정
