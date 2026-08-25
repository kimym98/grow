# 데이터베이스 스키마 설계 (Task 008)

이 문서는 Supabase(Postgres) 테이블 스키마 설계안이다. **실제 마이그레이션 SQL 적용, RLS 정책 활성화, Auth 연동은 Task 009에서 수행**하며, 이 문서의 SQL은 어디까지나 참고용 예시일 뿐 실행하지 않는다.

Supabase 프로젝트는 이미 생성되어 있다(`grow`, ref: `ciyscihtgpiikouxtblw`, region: `ap-northeast-2`). 다만 현재 상태가 `INACTIVE`(무료 티어 자동 일시정지로 추정)이므로, Task 009에서 마이그레이션을 적용하기 전에 Supabase 대시보드 또는 MCP `restore_project`로 재활성화가 필요하다.

## 네이밍 및 타입 매핑 관례

- DB 컬럼명은 Postgres 관례에 따라 **snake_case**를 사용한다.
- `packages/shared`의 도메인 타입/Zod 스키마는 **camelCase**로 정의되어 있다(예: `sourceUrl`, `userId`, `createdAt`).
- 따라서 DB 레코드 ↔ 도메인 타입 간 변환 함수(`toDomain(row)` / `toRow(entity)` 형태)가 필요하며, 이 변환 계층 구현은 Task 009 이후 실제 데이터 연동 작업에서 다룬다. 이번 Task 008에서는 타입/스키마 설계와 컬럼 매핑 관례 문서화까지만 진행한다.
- 모든 테이블은 `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`를 공통으로 가진다. `updated_at`이 필요한 테이블은 별도 표시한다.
- 사용자 소유 데이터는 `user_id uuid references auth.users(id)` 컬럼을 가지며, RLS 정책에서 `auth.uid() = user_id` 패턴을 기본으로 사용한다.

---

## 1. job_postings (채용 공고)

공식 API/RSS로 수집한 채용 공고 원본 데이터. 사용자 개인 소유가 아닌 공용 데이터이며, `user_id`는 두지 않는다(스크랩/찜 기능이 필요해지면 별도 `job_bookmarks` 테이블로 분리).

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| title | text | NOT NULL | | 공고 제목 |
| company | text | NOT NULL | | 회사명 |
| location | text | NOT NULL | | 근무지 |
| career_level | text | NOT NULL | | 경력 조건 |
| deadline | date | NULL | | 마감일 (상시채용 등은 NULL 허용) |
| tags | text[] | NOT NULL | '{}' | 직무/기술 태그 |
| url | text | NOT NULL | | 상세 페이지 원본 링크 |
| source_url | text | NOT NULL | | 수집 소스 고유 URL (upsert 키) |
| created_at | timestamptz | NOT NULL | now() | 수집 일시 |
| updated_at | timestamptz | NOT NULL | now() | 최종 갱신 일시 |

- **인덱스**: `UNIQUE (source_url)`, `INDEX (deadline)`, `INDEX USING gin (tags)`
- **upsert 고유키**: `source_url`
- **RLS 정책 초안**: 전체 공개 읽기 허용(`SELECT` — `USING (true)`), `INSERT`/`UPDATE`는 Edge Function(service role)만 허용

```sql
-- 참고용 예시, 실행하지 않음
create table job_postings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null,
  career_level text not null,
  deadline date,
  tags text[] not null default '{}',
  url text not null,
  source_url text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on job_postings (deadline);
create index on job_postings using gin (tags);
```

---

## 2. schedules (일정)

사용자별 일정/메모. 채용 공고 마감일을 연동해 생성될 수도 있다.

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | | auth.users 참조 |
| title | text | NOT NULL | | 일정 제목 |
| memo | text | NULL | | 메모 |
| date | date | NOT NULL | | 일정 날짜 |
| time | time | NULL | | 일정 시각 |
| reminder_time | time | NULL | | 알림 시각 |
| category | text | NOT NULL | | interview / deadline / study / etc |
| is_recurring | boolean | NOT NULL | false | 반복 여부 |
| checklist | jsonb | NOT NULL | '[]' | { id, label, done }[] 구조 |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- **인덱스**: `INDEX (user_id, date)` 복합 인덱스(캘린더 조회 최적화)
- **upsert 고유키**: 없음(사용자가 직접 생성/수정하는 데이터, upsert 대상 아님)
- **제약**: `category CHECK (category IN ('interview','deadline','study','etc'))`
- **RLS 정책 초안**: `SELECT/INSERT/UPDATE/DELETE` 모두 `USING (auth.uid() = user_id)` / `WITH CHECK (auth.uid() = user_id)`

```sql
-- 참고용 예시, 실행하지 않음
create table schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  memo text,
  date date not null,
  time time,
  reminder_time time,
  category text not null check (category in ('interview','deadline','study','etc')),
  is_recurring boolean not null default false,
  checklist jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on schedules (user_id, date);
```

---

## 3. tech_news (IT 뉴스)

RSS 기반으로 수집한 뉴스 원본. `job_postings`와 마찬가지로 공용 데이터이며, 북마크는 사용자별 데이터이므로 별도 `tech_news_bookmarks(user_id, news_id)` 조인 테이블로 분리한다(1:N 정규화, `isBookmarked`는 조회 시 조인해서 채움).

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| title | text | NOT NULL | | 뉴스 제목 |
| summary | text | NOT NULL | | 요약 |
| source | text | NOT NULL | | 출처 매체명 |
| published_at | date | NOT NULL | | 발행일 |
| url | text | NOT NULL | | 원본 링크 (upsert 키) |
| created_at | timestamptz | NOT NULL | now() | 수집 일시 |
| updated_at | timestamptz | NOT NULL | now() | |

**tech_news_bookmarks** (북마크 조인 테이블)

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| user_id | uuid | NOT NULL | | auth.users 참조 |
| news_id | uuid | NOT NULL | | tech_news 참조 |
| created_at | timestamptz | NOT NULL | now() | 북마크 일시 |

- **인덱스**: `tech_news`에 `UNIQUE (url)`; `tech_news_bookmarks`에 `PRIMARY KEY (user_id, news_id)`
- **upsert 고유키**: `tech_news.url`
- **RLS 정책 초안**: `tech_news`는 전체 공개 읽기, 쓰기는 Edge Function만; `tech_news_bookmarks`는 `auth.uid() = user_id` 패턴

```sql
-- 참고용 예시, 실행하지 않음
create table tech_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  source text not null,
  published_at date not null,
  url text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table tech_news_bookmarks (
  user_id uuid not null references auth.users(id),
  news_id uuid not null references tech_news(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, news_id)
);
```

> `packages/shared`의 `TechNews` 도메인 스키마는 `isBookmarked`/`userId` 필드를 포함하는데, 이는 `tech_news`와 `tech_news_bookmarks`를 조인한 조회 결과 형태를 나타낸다. DB 테이블 자체는 위와 같이 정규화한다.

---

## 4. document_reviews (문서 첨삭)

자소서/포트폴리오 업로드 및 LLM 첨삭 결과. MVP 단계에서는 단순성을 우선해 `versions`, `comments`를 JSONB 컬럼으로 저장하고, 추후 조회/집계 요구가 늘어나면 별도 테이블로 정규화한다.

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | | auth.users 참조 |
| title | text | NOT NULL | | 문서 제목 |
| type | text | NOT NULL | | resume / portfolio |
| status | text | NOT NULL | 'pending' | pending / processing / completed / failed |
| version | integer | NOT NULL | 1 | 현재 버전 번호 |
| resume_question | text | NULL | | 자소서 문항 (type=resume일 때) |
| original_text | text | NOT NULL | | 원문 (PDF 추출 텍스트) |
| reviewed_text | text | NULL | | LLM 첨삭 결과 원문 |
| versions | jsonb | NOT NULL | '[]' | { version, createdAt, summary }[] |
| comments | jsonb | NOT NULL | '[]' | { id, quote, comment }[] |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- **인덱스**: `INDEX (user_id, updated_at desc)` (최근 문서 목록 조회용)
- **upsert 고유키**: 없음(사용자가 직접 생성, 업로드마다 새 레코드)
- **제약**: `type CHECK (type IN ('resume','portfolio'))`, `status CHECK (status IN ('pending','processing','completed','failed'))`
- **RLS 정책 초안**: `auth.uid() = user_id` 패턴 (전체 CRUD)

```sql
-- 참고용 예시, 실행하지 않음
create table document_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  type text not null check (type in ('resume','portfolio')),
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  version integer not null default 1,
  resume_question text,
  original_text text not null,
  reviewed_text text,
  versions jsonb not null default '[]',
  comments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on document_reviews (user_id, updated_at desc);
```

> mocks의 `diffSegments`(원문 대비 추가/삭제 표시)는 UI 렌더링 시점에 `original_text`와 `reviewed_text`를 비교해 클라이언트에서 계산하는 파생 데이터로 설계했다. 따라서 DB에는 diff 결과를 별도로 저장하지 않는다.

---

## 5. cs_questions (CS 면접 퀴즈 문제 뱅크)

카테고리별 문제 뱅크. 자체 큐레이션 데이터이며 전체 사용자에게 공개된다.

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| category | text | NOT NULL | | network / database / os / data-structure |
| question | text | NOT NULL | | 문제 |
| answer | text | NOT NULL | | 모범 답안 |
| choices | text[] | NOT NULL | | 4지선다 보기 |
| correct_index | integer | NOT NULL | | 정답 인덱스 |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

- **인덱스**: `INDEX (category)`
- **upsert 고유키**: 없음(시딩 스크립트로 직접 관리, Task 014에서 시딩)
- **제약**: `category CHECK (category IN ('network','database','os','data-structure'))`
- **RLS 정책 초안**: 전체 공개 읽기(`SELECT` — `USING (true)`), 쓰기는 관리자/시딩 스크립트만

```sql
-- 참고용 예시, 실행하지 않음
create table cs_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('network','database','os','data-structure')),
  question text not null,
  answer text not null,
  choices text[] not null,
  correct_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on cs_questions (category);
```

---

## 6. quiz_sessions (퀴즈 풀이 세션)

사용자가 시작한 퀴즈 풀이 세션 단위 기록.

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | | auth.users 참조 |
| category | text | NOT NULL | | 풀이한 카테고리 |
| total_count | integer | NOT NULL | | 총 문제 수 |
| correct_count | integer | NOT NULL | | 정답 수 |
| created_at | timestamptz | NOT NULL | now() | 세션 시작(완료) 일시 |

- **인덱스**: `INDEX (user_id, created_at desc)`
- **upsert 고유키**: 없음
- **RLS 정책 초안**: `auth.uid() = user_id` 패턴

```sql
-- 참고용 예시, 실행하지 않음
create table quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  category text not null,
  total_count integer not null,
  correct_count integer not null,
  created_at timestamptz not null default now()
);
create index on quiz_sessions (user_id, created_at desc);
```

---

## 7. user_answers (오답노트용 개별 답안)

퀴즈 세션 내 각 문제에 대한 사용자의 선택/정오답 기록. 오답노트 조회는 `is_correct = false`로 필터링한다.

| 컬럼 | 타입 | Nullable | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| quiz_session_id | uuid | NOT NULL | | quiz_sessions 참조 |
| question_id | uuid | NOT NULL | | cs_questions 참조 |
| selected | integer | NOT NULL | | 사용자가 선택한 보기 인덱스 |
| is_correct | boolean | NOT NULL | | 정답 여부 |
| created_at | timestamptz | NOT NULL | now() | |

- **인덱스**: `INDEX (quiz_session_id)`, `INDEX (question_id, is_correct)` (오답노트 조회용)
- **upsert 고유키**: 없음
- **RLS 정책 초안**: 직접 `user_id`가 없으므로 `quiz_sessions`와 조인해 소유권을 검증하는 정책 필요 (`EXISTS (SELECT 1 FROM quiz_sessions s WHERE s.id = quiz_session_id AND s.user_id = auth.uid())`)

```sql
-- 참고용 예시, 실행하지 않음
create table user_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_session_id uuid not null references quiz_sessions(id) on delete cascade,
  question_id uuid not null references cs_questions(id),
  selected integer not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
create index on user_answers (quiz_session_id);
create index on user_answers (question_id, is_correct);
```

---

## RLS 정책 요약

| 테이블 | 공개 읽기 | 쓰기 권한 |
|---|---|---|
| job_postings | O (전체 공개) | Edge Function(service role)만 |
| schedules | X | 소유자(`auth.uid() = user_id`)만 |
| tech_news | O (전체 공개) | Edge Function(service role)만 |
| tech_news_bookmarks | X | 소유자만 |
| document_reviews | X | 소유자만 |
| cs_questions | O (전체 공개) | 관리자/시딩 스크립트만 |
| quiz_sessions | X | 소유자만 |
| user_answers | X | 소유 세션(quiz_sessions 조인)의 소유자만 |

실제 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 및 `CREATE POLICY` 구문 적용은 Task 009에서 수행한다.
