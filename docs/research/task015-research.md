# Task 015 사전 조사: electron-updater / Supabase Realtime / cmdk 호환성

이 문서는 Task 015(사용자 경험 향상 및 부가 기능)의 후속 실행 태스크(전역 검색, Realtime 알림, 자동 업데이트, 백그라운드 자동실행)를 시작하기 전 필요한 3가지 기술 조사와 범위 결정 사항을 정리한다. `docs/news-source-research.md`(Task 012)와 동일한 형식을 따른다.

## 결론 요약

- **electron-updater**: macOS는 코드 서명이 없으면 자동 업데이트 자체가 동작하지 않는다(공식 문서 명시). Windows는 서명 없이도 다운로드/설치는 가능하지만 `verifyUpdateCodeSignature`(기본 true)가 게시자 서명 검증을 시도하므로, 서명 없는 빌드에서는 이 옵션을 비활성화하지 않으면 설치가 실패할 수 있다. `electron-builder --publish` 는 v27부터 암시적 게시가 기본 비활성화되어 `--publish always`를 명시해야 하며, GitHub Releases를 배포 채널로 채택한다.
- **Supabase Realtime(postgres_changes)**: 공식 문서상 `postgres_changes`는 Private 채널 전용이라고 되어 있으나, **이 프로젝트(Supabase 17.6, 2026-08-28 기준)에서 실제 구현 단계(Task 015-3)에 `config: { private: true }`로 구독을 시도한 결과 매번 `TIMED_OUT` 상태가 되어 이벤트를 전혀 수신하지 못함을 실측으로 확인**했다. `private` 옵션 없이 공개 채널로 구독하면 즉시 `SUBSCRIBED` 상태가 되고 INSERT 이벤트도 정상 수신됨을 확인했다(job_postings/tech_news의 SELECT RLS 정책이 `qual=true`로 무조건 허용이라 공개 채널로도 안전). 또한 **`job_postings`/`tech_news` 테이블이 애초에 `supabase_realtime` publication에 등록되어 있지 않아**(`select * from pg_publication_tables where pubname='supabase_realtime'`가 빈 결과) postgres_changes 자체가 동작하지 않는 상태였음을 발견해, `alter publication supabase_realtime add table job_postings, tech_news;` 마이그레이션으로 추가했다. 구독은 `supabase.channel(name).on('postgres_changes', {...}, handler).subscribe()`, 해제는 `supabase.removeChannel(channel)` 패턴을 사용한다.
- **cmdk / shadcn Command**: React 19 초기(2024년 말~2025년 초)에는 `cmdk@1.0.0`이 `ElementRef` 등 deprecated API를 사용해 타입 에러가 발생했으나(shadcn-ui/ui #6601, #6200), PR #6644로 React 19 지원 버전의 cmdk 의존성으로 수정되어 병합됨. 2026-08 시점 `npx shadcn@latest add command`로 신규 설치하면 수정된 버전이 반영되므로 문제 없이 사용 가능하다고 판단. 현재 apps/desktop에는 Command 컴포넌트가 아직 설치되어 있지 않음(components/ui 디렉터리 확인 완료).
- **오프라인 캐시 범위**: "네트워크 재연결까지 쓰기를 큐잉하는 진짜 오프라인 동기화"는 이번 스코프에서 제외하고, **최근 조회한 데이터의 표시용 캐시**(Task 015-2의 최근 항목 스토어에 흡수)로 한정한다. 근거: PRD/사용자 요구사항에 오프라인 쓰기 시나리오가 명시되지 않았고, 기존 lib/*.ts들은 모두 Supabase 실시간 조회 기반이라 쓰기 큐잉 도입 시 각 도메인 CRUD 함수 전체를 재설계해야 해 범위가 과도해짐.
- **자동 실행 기본값**: 기본값은 **OFF**로 결정. 근거: OS 로그인 시 자동 실행은 사용자 동의 없이 백그라운드 프로세스를 상시 구동시키는 부수효과가 크므로, 최초 설치 시점에는 비활성 상태로 두고 설정 화면에서 사용자가 명시적으로 켜도록 한다(기존 알림 설정 중 `scheduledAlertEnabled`/`dailySummaryEnabled`가 기본 true인 것과는 다르게, 이번 기능은 OS 수준 상시 실행이라는 점에서 더 보수적으로 접근).

---

## 1. electron-updater / electron-builder 자동 업데이트

### 서명 없는 환경에서의 동작

- **macOS**: 공식 문서(`features/auto-update.md`)에 "Code signing is a mandatory requirement for auto-updating on macOS. Without proper signing, the update mechanism will not function."이라고 명시되어 있다. 즉 macOS는 서명 없이는 자동 업데이트가 원천적으로 불가능하다.
- **Windows(NSIS)**: `WindowsConfiguration.verifyUpdateCodeSignature`(기본값 `true`)가 활성화되어 있으면, 빌드 시점에 `publisherName`을 `app-update.yml`에 임베드하고 런타임에 electron-updater가 다운로드한 인스톨러의 Authenticode 서명 주체를 이 값과 비교해 불일치 시 설치를 거부한다. 서명이 없는 빌드에서는 이 옵션을 명시적으로 `false`로 꺼야 설치가 진행된다.
- 현재 프로젝트(`apps/desktop/package.json`)에는 코드 서명 관련 설정(CSC_LINK 등)이 없으므로, 이번 Task 015-4에서는 **Windows 타깃 기준으로 `verifyUpdateCodeSignature: false`를 설정**하고, macOS는 서명 없이는 자동 업데이트가 동작하지 않는다는 점을 회귀 체크리스트에 명시한다.

### electron-builder publish 설정

- v27부터 암시적 게시가 기본 비활성화되어, CI/로컬에서 게시하려면 `electron-builder --publish always`를 명시적으로 지정해야 한다.
- GitHub Actions 예시(공식 문서):
  ```yaml
  - name: Publish
    run: npx electron-builder --publish always
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```
- 배포 채널은 **GitHub Releases**를 채택한다(별도 스토리지/서버 구축 불필요, electron-builder/electron-updater 모두 1급 지원).

### 개발 모드에서의 검증

- `autoUpdater.forceDevUpdateConfig = true`를 설정하면 개발 모드(`NODE_ENV=development`)에서도 업데이트 설정을 처리하도록 강제할 수 있다. 다만 실제 배포된 GitHub Release가 없는 로컬 환경에서는 "업데이트 확인 요청이 에러 없이 실행되는지"까지만 검증 가능하고, 실제 다운로드/설치까지는 검증 범위 밖이다(Task 015-4의 verificationCriteria에도 이미 이렇게 명시됨).

---

## 2. Supabase Realtime (postgres_changes)

### 핵심 사실

- `postgres_changes`는 PostgreSQL WAL(logical replication)에서 캡처된 INSERT/UPDATE/DELETE 이벤트를 **RLS 정책으로 필터링**하여 인가된 클라이언트에만 스트리밍하며, **Private 채널에서만 사용 가능**하다(공식 문서: "This feature is exclusively available for private channels.").
- 구독 예시:
  ```javascript
  const channel = supabase
    .channel("job-postings-changes", { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "job_postings" },
      (payload) => {
        // payload.new 에 새 레코드
      }
    )
    .subscribe();
  ```
- 해제: `supabase.removeChannel(channel)` (React `useEffect` cleanup에서 반드시 호출).

### RLS와의 상호작용

- job_postings, tech_news 테이블의 기존 RLS 정책이 `SELECT`를 인증 사용자에게 허용하는 구조라면(Task 014-1 검증에서 이미 이 테이블들은 공개 조회 성격으로 확인됨) Realtime 구독도 동일 정책을 통과해야 이벤트를 수신한다. 만약 채널을 `private: true`로 열었는데도 이벤트가 오지 않으면 RLS SELECT 정책 누락이 원인일 수 있음 — 구현 단계에서 실제 INSERT 테스트로 확인 필요.

### 설계 반영 (Task 015-3 구현 후 갱신)

- `apps/desktop/lib/realtime-sync.ts`는 `job_postings`, `tech_news` 각각 별도 채널을 열고 컴포넌트 언마운트 시 `removeChannel`을 호출한다.
- **실측 결과 이 문서 최초 작성 시점의 계획과 달리 `private: true`는 사용하지 않는다** — 실제 구현 중 `TIMED_OUT`이 발생함을 확인했고(결론 요약 참고), `job_postings`/`tech_news`의 SELECT RLS가 무조건 허용이라 공개 채널로도 안전하기 때문이다.
- **`supabase_realtime` publication에 두 테이블이 등록되어 있지 않던 문제**를 발견해 `enable_realtime_job_postings_tech_news` 마이그레이션(`alter publication supabase_realtime add table job_postings, tech_news;`)으로 해결했다. 신규 테이블에 Realtime을 붙일 때는 publication 등록 여부를 먼저 확인해야 한다.

---

## 3. cmdk / shadcn Command (Next.js 16 / React 19 호환성)

### 과거 이슈

- [shadcn-ui/ui #6601](https://github.com/shadcn-ui/ui/issues/6601): Command 컴포넌트가 React 19 + Next.js 15와 호환되지 않음. `ElementRef` 등 deprecated React API 사용으로 타입 에러 발생.
- [shadcn-ui/ui #6200](https://github.com/shadcn-ui/ui/issues/6200): 문서상 "React 19 지원"이라고 되어 있었으나 실제로는 `npx shadcn@latest add command` 설치 시 `cmdk@1.0.0`이 깔리며 타입 에러가 남아있었음.
- [shadcn-ui/ui #6900](https://github.com/shadcn-ui/ui/issues/6900): 타입 불일치로 빌드 자체가 실패하는 사례 보고.

### 해결 현황

- [PR #6644](https://github.com/shadcn-ui/ui/pull/6644)로 Command 컴포넌트의 cmdk 의존성을 React 19 호환 버전으로 갱신, 위 이슈들을 함께 해결.
- 현재(2026-08) 시점 `npx shadcn@latest add command`로 신규 설치 시 수정된 버전이 반영된다. apps/desktop은 이미 React 19.2.4 + Next.js 16.2.6을 사용 중이고 다른 shadcn 컴포넌트(dialog, popover 등 Radix 기반)들이 문제 없이 동작하고 있으므로, Command 컴포넌트 추가 시에도 동일한 CLI 설치 경로를 따르면 호환성 문제가 없을 것으로 판단한다.

### 설치 시 주의사항

- 설치 후 `npm run build` 또는 `tsc` 타입체크로 `ElementRef` 관련 타입 에러가 없는지 1회 확인할 것(Task 015-2 verificationCriteria에 반영).

---

## 이월되는 결정/이슈

- [x] macOS는 서명 없이 자동 업데이트 불가 — Task 015-4는 Windows(NSIS) 기준으로 `verifyUpdateCodeSignature: false` 설정, macOS 제약은 회귀 체크리스트에 문서화
- [x] GitHub Releases를 배포 채널로 채택, `--publish always` 명시 필요
- [x] postgres_changes는 공식 문서상 private 채널 전용이나 이 프로젝트에서는 private:true가 TIMED_OUT을 유발해 공개 채널로 구독(Task 015-3에서 실측 확정) — RLS SELECT 정책(qual=true)이 이벤트 수신 허용 여부를 결정
- [x] job_postings/tech_news가 supabase_realtime publication에 미등록 상태였음을 발견, 마이그레이션으로 추가 완료
- [x] cmdk는 최신 shadcn CLI로 설치 시 React 19 호환 버전 적용됨 — 설치 후 타입체크 1회 확인
- [x] 오프라인 캐시는 "최근 조회 표시용 캐시"로 범위 축소(Task 015-2에 흡수)
- [x] 자동 실행 기본값은 OFF로 결정
