# DB 스키마 마이그레이션 가이드

이 문서는 Supabase(Postgres) 스키마를 변경할 때 따라야 할 절차를 정의합니다. Task 019(DB 스키마 마이그레이션 파일화) 이후로는 **모든 스키마 변경이 `supabase/migrations/*.sql` 파일 기반으로만** 이뤄져야 합니다.

## 🚀 핵심 원칙 (엄격 준수)

- **`mcp__supabase__apply_migration` / `mcp__supabase__execute_sql`로 원격에 DDL(테이블/컬럼/정책/함수 생성·변경·삭제)을 직접 실행하지 않는다.** 이 두 도구는 조회(`SELECT`) 용도로만 사용한다.
- 스키마를 바꾸고 싶으면 반드시 `supabase migration new <name>`으로 로컬 SQL 파일을 먼저 만들고, 그 파일을 통해서만 변경한다.
- `docs/database-schema.md`는 설계 배경을 설명하는 참고 문서일 뿐 **정본이 아니다.** 실제 스키마의 정본은 `supabase/migrations/` 디렉토리다.

```typescript
// ✅ 올바른 방법: 마이그레이션 파일로 스키마 변경
supabase migration new add_bookmark_column
// → supabase/migrations/<timestamp>_add_bookmark_column.sql 에 SQL 작성
// → 로컬 검증 → PR → CI 통과 → db push

// ❌ 금지: MCP로 원격에 직접 DDL 실행
mcp__supabase__apply_migration(...)  // 원격에만 남고 로컬 파일엔 기록되지 않음
mcp__supabase__execute_sql("ALTER TABLE ...")  // 조회 전용으로만 사용할 것
```

이 원칙을 어기면 원격과 로컬 파일이 다시 벌어지고, `docs/troubleshooting/supabase-migration-baseline-troubleshooting.md`에 기록된 것과 같은 복구 작업을 반복해야 한다.

---

## 신규 마이그레이션 생성 → 원격 반영 전체 흐름

### 1. 마이그레이션 파일 생성

```powershell
npx supabase migration new <변경_내용을_설명하는_snake_case_이름>
# 예: npx supabase migration new add_company_analyses_table
```

`supabase/migrations/<timestamp>_<name>.sql` 파일이 생성된다. 이 파일에 실제 DDL(SQL)을 작성한다.

작성 시 참고 사항:

- 테이블은 `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`를 공통으로 둔다(`docs/database-schema.md`의 기존 관례 참고).
- 사용자 소유 데이터는 `user_id uuid references auth.users(id)` + RLS `auth.uid() = user_id` 패턴을 기본으로 사용한다.
- 새 테이블에는 반드시 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`와 `CREATE POLICY`를 함께 작성한다. RLS 없는 테이블을 새로 만들지 않는다.
- DB 컬럼명은 snake_case, `packages/shared`의 도메인 타입/Zod 스키마는 camelCase — 변환 계층(`toDomain`/`toRow`)이 필요한지 함께 검토한다.

### 2. 로컬에서 적용/검증

```powershell
# Docker Desktop이 켜져 있어야 함
npx supabase start        # 로컬 스택이 이미 떠 있다면 생략 가능
npx supabase db reset     # supabase/migrations의 모든 파일을 처음부터 순서대로 재적용
```

`db reset`이 에러 없이 끝나야 한다. 에러가 나면 SQL 문법이나 의존 관계(테이블 생성 순서 등)를 점검한다.

> **Windows 주의**: Supabase CLI의 Docker 기반 하위 명령(`start`, `db reset`, `db pull`, `db dump`, `db diff`)은 **Git Bash가 아니라 PowerShell에서 실행**해야 한다. Git Bash(MSYS)에서 실행하면 Docker named pipe 경로가 깨져 `LegacyImagePrepullError`가 난다. 자세한 내용은 `docs/troubleshooting/supabase-migration-baseline-troubleshooting.md` 참고.

### 3. PR 생성 및 CI 통과

- 마이그레이션 파일을 포함해 커밋하고 PR을 생성한다.
- 리뷰어는 PR diff에서 SQL 파일을 직접 읽고 검토한다 — 원격 대시보드가 아니라 **이 파일이 변경 이력의 유일한 기록**이므로 신중히 리뷰한다.
- `.github/workflows/ci.yml`은 현재 lint/build/test만 수행하며 Supabase CLI 스텝은 없다(마이그레이션 파일은 SQL이라 Next.js 빌드에 영향을 주지 않는다). CI 통과 = 애플리케이션 코드에 문제가 없다는 뜻이며, 스키마 검증은 2단계(`db reset`)에서 이미 완료된 것으로 간주한다.

### 4. 원격 반영

```powershell
npx supabase link --project-ref ciyscihtgpiikouxtblw   # 최초 1회만 필요
npx supabase db push
```

`db push`는 로컬에만 있고 원격에는 없는 마이그레이션 파일을 순서대로 원격에 적용한다.

> ⚠️ **`db push`는 원격 DB에 직접 쓰는 작업이다.** Claude Code에게 이 작업을 시키면 자동 모드 안전장치가 항상 차단하므로, **사람이 터미널에서 직접 실행**해야 한다. Claude Code는 마이그레이션 파일 작성과 로컬 검증까지만 수행하고, 원격 반영은 사용자에게 안내한다.

### 5. 반영 확인

```powershell
npx supabase migration list   # local과 remote 버전이 모두 일치하는지 확인
npx supabase db diff --linked # 결과가 비어 있으면 원격 = 마이그레이션 적용 결과
```

---

## 문제가 생겼을 때

- `db pull`/`db push`/`migration list`가 "충돌"이나 인증 오류를 내는 경우 → `docs/troubleshooting/supabase-migration-baseline-troubleshooting.md`에서 유사 사례를 먼저 확인한다.
- 원격 스키마와 로컬 파일이 어긋난 것 같으면(예: 누군가 대시보드에서 직접 변경) → `npx supabase db diff --linked`로 차이를 확인하고, 차이가 있다면 그 내용을 새 마이그레이션 파일로 만들어 정본에 반영한다. **절대 원격에서 직접 고치고 넘어가지 않는다.**

## 관련 문서

- [데이터베이스 스키마 설계](../database-schema.md) — 테이블 설계 배경 설명(참고용, 정본 아님)
- [Supabase 마이그레이션 파일화 트러블슈팅](../troubleshooting/supabase-migration-baseline-troubleshooting.md) — Task 019 진행 중 겪은 문제와 해결 기록
