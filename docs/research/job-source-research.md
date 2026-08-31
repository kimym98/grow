# 채용 정보 수집 소스 조사 (Task 010)

이 문서는 Supabase Edge Function(`collect-job-postings`)이 사용할 채용 정보 수집 소스를 조사하고, 이용약관/승인 절차상 자동 수집·가공·재게시가 허용되는지 확인한 결과다. 실제 코드 구현은 이 문서를 입력으로 다음 작업("collect-job-postings Edge Function 구현")에서 진행한다.

> **변경 이력**:
> 1. 최초 조사: 워크넷(공공데이터포털) 단일 소스를 1차 확정 소스로 제안
> 2. 1차 변경: 사용자 요청으로 원티드/잡코리아/사람인 3개 플랫폼 + 플랫폼 배지 UI로 확대
> 3. 2차 변경: 사용자 요청으로 **고용24(Work24) 채용정보 API를 우선 개발 대상으로 확정하고, 나머지(원티드/잡코리아/사람인)는 이번 Task 범위에서 제외**. 플랫폼이 1개로 단순화됨에 따라 `job_postings.source` 컬럼 및 플랫폼 배지 UI 요구사항은 **철회**(YAGNI).
> 4. 3차 변경: 사용자가 고용24 API 신청을 완료하고 인증키를 발급받았으며, 실제 "채용정보목록조회 API" 공식 스펙(요청 URL/파라미터/응답 필드)을 제공함. 1절을 조사 추정치가 아닌 확정 스펙으로 갱신함.
> 5. **4차 변경(현재, 2026-08-26 실측 확인)**: 로컬 Docker 기반 `supabase functions serve`로 발급받은 인증키를 사용해 실제 API를 호출한 결과, 아래와 같은 에러가 반환됨을 확인했다.
>    ```xml
>    <?xml version='1.0' encoding='UTF-8'?>
>    <GO24>
>      <error>개인회원은 사용할 수 없는 OPEN-API입니다.</error>
>    </GO24>
>    ```
>    즉 **개인회원 계정으로 발급받은 인증키로는 고용24 자체 경로의 이 API를 사용할 수 없다**(1절에서 사전에 우려했던 "사업자등록번호 필수" 리스크가 실제로 확인된 것). 사용자가 다음 중 하나를 확인 후 회신하기로 함: (a) 공공데이터포털(data.go.kr) 경로로 재신청, (b) 사업자등록번호로 work24 재신청, (c) 부록의 원티드/사람인/잡코리아 등 다른 소스로 복귀.
> 6. **5차 변경(현재, 2026-08-26)**: 사용자가 (c)를 선택함에 따라 **고용24 API 경로는 최종 blocked로 확정**하고, **잡코리아(JobKorea) 채용 목록 HTML 크롤링**으로 전환하기로 결정했다. 근거는 다음과 같다.
>    - `robots/jobkorea.txt`(사용자 제공 실제 robots.txt)를 확인한 결과, AI/LLM 크롤러(ClaudeBot, anthropic-ai 등 명시)를 포함해 `/recruit/joblist`(목록), `/Recruit/GI_Read`(상세), `/company`, `/review`, `/salary` 경로는 명시적으로 `Allow`되어 있다. 일반 크롤러(`User-agent: *`) 규칙도 동일 경로를 Allow한다. 즉 이 경로에 한해서는 AI 크롤러임을 숨기지 않아도 정책상 허용된다.
>    - `https://www.jobkorea.co.kr/recruit/joblist`를 실제로 fetch한 결과(2026-08-26 확인), 채용 공고 목록이 **서버 렌더링된 HTML**에 `<tr>` 행 구조로 직접 포함되어 있음을 확인했다(자바스크립트 동적 로딩에 의존하지 않음). 상세 링크는 `/Recruit/GI_Read/[공고ID]?rPageCode=SL&...`, 기업 링크는 `/Recruit/Co_Read/C/[기업ID]` 형태이며, 지역/경력/마감일은 텍스트 노드로 표시된다(예: "서울 강남구", "신입·경력", "D-29" / "~09/26(토)" / "상시채용").
>    - 같은 세션에서 자소설닷컴/캐치(catch.co.kr)도 함께 검토했으나, 자소설닷컴은 목록 페이지의 정적 HTML에 실제 공고 데이터가 보이지 않아 클라이언트사이드 렌더링(내부 API 호출)으로 추정되고, 캐치는 목록 페이지 요청이 403으로 차단되어 봇 감지 여부나 정확한 URL을 확인하지 못했다. 두 소스 모두 브라우저 개발자도구(Network 탭)로 실측하지 않고는 구현이 불가능하므로, **이번 Task 010 범위에서는 제외**하고 "부록: 보류된 소스"로 이동한다(추측 금지 원칙에 따름).
>    - 사용자가 `job_postings.source`(수집 플랫폼 구분) 컬럼 추가를 승인함에 따라, 이번에 재도입한다(향후 자소설/캐치 등 소스 확장 시 재사용 목적).

## 결론 요약

- **최종 차단 확정**: 고용24(Work24) 자체 경로 채용정보 오픈API — 개인회원 인증키로 사용 불가(2026-08-26 확인 후 재신청하지 않고 크롤링 방식으로 전환 확정)
- **채택된 소스**: 잡코리아(JobKorea) 채용 목록 HTML 크롤링 — `/recruit/joblist`, robots.txt Allow 확인, 서버 렌더링 HTML 확인 완료(2026-08-26)
- **보류(이번 Task 범위 제외)**: 자소설닷컴, 캐치 — 실제 목록 로딩 방식(정적 HTML vs 내부 API) 실측 필요, 부록 참고
- **재사용 가능한 자산**: `supabase/functions/collect-job-postings/`의 어댑터 인터페이스(`JobPostingSource`, `NormalizedJobPosting`)와 `index.ts`의 순회/upsert/`job_collection_logs` 기록 구조는 소스 구현 방식(API/크롤링)과 무관하게 그대로 재사용한다. XML 파싱 유틸(`extractTag` 등)은 work24 전용이라 폐기하고, 잡코리아 HTML 구조에 맞춘 별도 파싱 유틸을 신규 작성한다.

---

## 1. 잡코리아(JobKorea) 채용 목록 크롤링 (채택 소스)

### 기본 정보

- 제공처: 잡코리아(jobkorea.co.kr)
- 방식: 공식 API가 아닌 **robots.txt가 허용한 공개 페이지의 HTML 크롤링**
- 근거 문서: `robots/jobkorea.txt`(사용자 제공)

### robots.txt 정책 준수

```
User-agent: GPTBot / ChatGPT-User / ... / ClaudeBot / anthropic-ai / ... (AI 크롤러 그룹)
Disallow: /
Allow: /$
Allow: /recruit/joblist
Allow: /Recruit/GI_Read
Allow: /company
Allow: /review
Allow: /salary
...

User-agent: *
...
Allow: /recruit/joblist
Allow: /Recruit/GI_Read
Allow: /
```

- AI 크롤러 그룹과 일반 크롤러(`*`) 규칙 모두 `/recruit/joblist`(목록), `/Recruit/GI_Read`(상세)를 명시적으로 Allow한다.
- **User-Agent 정책**: 위 Allow 경로만 호출하므로 AI 크롤러임을 숨길 필요가 없다. 중립적이고 식별 가능한 UA를 사용한다(예: `grow-job-collector/1.0`, 비상업 개인 프로젝트임을 밝히는 형태). 실제 요청 시 차단(403 등)이 발생하면 UA 문자열을 재조정한다.
- 요청 대상 경로는 `/recruit/joblist`, `/Recruit/GI_Read` 두 가지로 한정하고, 그 외 경로(`/Search`, `/RecrtMng/` 등 Disallow)는 호출하지 않는다.

### 요청 URL

```
https://www.jobkorea.co.kr/recruit/joblist?duty=1000230,1000242,1000417
```

### 직무 필터(duty) — 2026-08-26 사용자 요청으로 추가

- 목록 페이지의 직무 선택 체크박스(`data-value-json`에 담긴 직무 트리)에서 실제 코드를 추출했다. 그룹 체크박스는 `<input name="duty" value="10030">` 형태이고, 하위 세부 직무는 같은 JSON 안에 `subCode`로 내려온다.
- `?duty=코드1,코드2` 형태의 콤마 구분 다중 값 쿼리를 실제로 GET 요청해본 결과, 페이지네이션(`Page`)과 달리 **duty 필터는 세션 없이도 결과가 실제로 바뀜을 확인했다**(단일 코드 결과와 다중 코드 결과의 총건수·행 ID가 다름).
- 채택한 코드: 프론트엔드개발자=`1000230`, AI/ML엔지니어=`1000242`, AI/ML연구원=`1000417`(groupCode 10031 "AI·개발·데이터" 하위). `sources/jobkorea.ts`의 `DUTY_CODES` 상수로 관리하며, 다른 직무로 바꾸려면 이 상수만 수정하면 된다.

- **페이지네이션 실측 결과(2026-08-26, Edge Function 구현 단계에서 curl로 raw HTML 확인)**: 목록 페이지 하단에 `/recruit/_GI_List?Page=N` 링크가 존재하지만, `/recruit/joblist?Page=2`처럼 쿼리 파라미터만 붙여 GET 요청해도 1페이지와 완전히 동일한 내용이 반환됨을 확인했다(세션/쿠키 기반 상태이거나 AJAX 전용 엔드포인트로 추정). `/recruit/_GI_List?Page=2`를 직접 GET하면 404가 반환된다. 즉 **단순 GET 요청만으로는 안정적인 페이지네이션 방법을 찾지 못했다.**
- 이에 따라 이번 구현(`sources/jobkorea.ts`)은 **최초 목록 페이지 1회 요청(1페이지, 약 40~60건)만 수집**하도록 범위를 좁혔다. 전체 페이지네이션(세션 유지, AJAX 엔드포인트 리버스엔지니어링 등)은 후속 과제로 남긴다.
- raw HTML 실측 결과 총건수는 `id="hdnGICnt" value="205,873"` 형태로 노출되나, 페이지네이션 자체가 불가능해 이번 구현에서는 활용하지 않는다.

### 응답 HTML → NormalizedJobPosting 필드 매핑

| HTML 상 위치(실측 결과, 2026-08-26 WebFetch 기준) | job_postings 컬럼 매핑 | 비고 |
|---|---|---|
| `<tr>`(공고 1건 = 1행) | (파싱 단위) | 행 단위로 순회하며 각 필드 추출 |
| 공고 제목 `<a href="/Recruit/GI_Read/[ID]?...">` | title | 링크 텍스트 |
| 회사명 `<a href="/Recruit/Co_Read/C/[ID]">` | company | 링크 텍스트 |
| 지역 텍스트 노드(예: "서울 강남구") | location | |
| 경력 텍스트 노드(예: "신입·경력", "경력1년↑") | career_level | |
| 마감일 텍스트 노드(예: "D-29", "~09/26(토)", "상시채용") | deadline | ISO 날짜(YYYY-MM-DD) 또는 null로 정규화 필요. "D-N"/날짜 패턴은 파싱, "상시채용" 등은 null 처리(정확한 파싱 규칙은 구현 단계에서 raw HTML 재확인 후 확정) |
| 상세 링크 `/Recruit/GI_Read/[ID]?...` | url, source_url | `https://www.jobkorea.co.kr` + 상대경로로 절대경로화. source_url은 upsert 고유키(UNIQUE 제약) |
| (고정값) | source | `"jobkorea"` 고정 |
| (미확인) | tags | 잡코리아 목록 페이지에 직무/업종 태그가 노출되는지 구현 단계에서 확인 후 매핑, 없으면 빈 배열 |

### 구현 완료 및 남은 항목 (2026-08-26)

- [x] raw HTML 구조 실측 및 정규식 파싱 검증 완료 — `<tr class="devloopArea">` 행 단위, 제목/회사 링크는 `class="link normalLog"`, 마감일은 `<span class="date dotum">` 내부(단순 텍스트 또는 `<span class="tahoma">MM/DD</span>(요일)` 중첩 형태)
- [x] 마감일 패턴: `상시채용`(→null), `~MM/DD (요일)`(→ISO 날짜, 이미 지난 날짜면 내년으로 보정), `D-N`(→오늘+N일) 3종 처리. 60개 표본 중 실제로는 `상시채용`/`~MM/DD` 2종만 관측됨
- [x] 페이지네이션 불가 확인(위 항목 참고) — 1페이지만 수집하도록 범위 축소
- [ ] 태그(직무/업종) 매핑 요소는 목록 페이지에서 찾지 못해 이번 구현은 고용형태(정규직/계약직 등)만 `tags`에 담음 — 필요 시 후속 개선
- [ ] 헤드헌팅/광고성 행(약 60건 중 20건, `data-gno` 속성 없이 `data-info`만 존재)은 파싱 실패로 자동 스킵되는데, 의도된 필터링인지 사용자 확인 필요(헤드헌팅 공고도 수집 대상에 포함하고 싶다면 별도 파서 추가 필요)

### 이용허락범위 / 리스크

- 공식 API가 아닌 크롤링이므로, robots.txt가 명시적으로 Allow한 경로만 접근하고 과도한 요청 빈도를 피하는 것으로 정책 준수를 도모한다. 다만 잡코리아 이용약관에 크롤링 자체를 금지하는 조항이 있을 가능성은 이번 조사에서 확인하지 않았다(robots.txt만 확인함) — 비상업적 개인 프로젝트, 최소 빈도(1일 1~2회) 수집이라는 점을 리스크 완화 근거로 삼되, 필요 시 후속으로 이용약관 확인을 권장한다.

---

## 부록: 차단된 소스

### 고용24(Work24) 채용정보 오픈API — 채용정보목록조회 (확정 스펙, 최종 blocked)

### 기본 정보

- 제공처: 한국고용정보원 (고용24, work24.go.kr)
- 인증키 신청/발급 완료(사용자가 직접 처리함, 2026-08-26 기준). 이하 스펙은 사용자가 제공한 공식 API 문서 내용이다.
- 데이터 포맷: XML (`returnType=XML` 고정)

### 요청 URL

```
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do
```

### 요청 예시

```
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do?authKey=[인증키]&callTp=L&returnType=XML&startPage=1&display=10
```

### 요청 파라미터 (확정)

| 항목 | 필수 | 설명 |
|---|---|---|
| authKey | Y | 인증키 |
| callTp | Y | `L`(목록) 고정 — 상세 조회는 `D` |
| returnType | Y | `XML` 고정 |
| startPage | Y | 시작 페이지(기본 1, 최대 1000) |
| display | Y | 출력건수(기본 10, 최대 100) — pg_cron 1일 1~2회 배치 수집이므로 페이지네이션으로 전체 수집 필요 |
| region / occupation / salTp / education / career / minCareerM / maxCareerM 등 | N | 선택 필터. Task 010에서는 필터 없이 전체 목록을 페이지네이션으로 순회하며 수집(검색 UI 필터는 렌더러 쪽에서 클라이언트 처리) |

- 다중검색 파라미터는 `[값1|값2]` 형식이나, 필터 없이 전량 수집하는 이번 구현에서는 사용하지 않는다.
- `display` 최대 100, `startPage` 최대 1000 → 한 번의 Edge Function 실행에서 최대 100,000건까지 페이지네이션 가능(실제로는 훨씬 적은 건수로 예상되나, 안전장치로 `total` 필드를 보고 페이지 순회 종료 조건을 둔다).

### 응답 필드 → job_postings 컬럼 매핑 (확정)

| API 응답 필드(XML 태그) | 타입 | job_postings 컬럼 매핑 | 비고 |
|---|---|---|---|
| company | String | company | |
| title | String | title | |
| region | String | location | |
| career | String | career_level | 값 형식(코드 vs 텍스트)은 실제 응답을 받아 최종 확인 필요 |
| closeDt | String | deadline | **형식 확인 필요** — 일반적으로 `YYYYMMDD` 또는 상시채용 시 공란/특수값 예상. Edge Function 구현 시 실제 응답으로 파싱 로직 확정, 상시채용은 deadline=null로 정규화 |
| wantedInfoUrl | String | url, source_url (upsert 키) | 워크넷 채용정보 URL — source_url UNIQUE 제약의 upsert 키로 사용 |
| wantedAuthNo | String | (미매핑, 참고용) | 구인인증번호 — 향후 중복 판별 보조키로 활용 가능하나 이번 Task는 source_url만 upsert 키로 사용 |
| indTpNm / jobsCd | String / Number | tags | 업종명(indTpNm)을 태그 배열에 포함. jobsCd(직종코드)는 숫자 코드라 사람이 읽을 수 있는 라벨이 없어 이번 Task에서는 태그에 포함하지 않음(코드→라벨 매핑표가 필요하면 후속 작업) |
| sal / salTpNm / minSal / maxSal | String | (미매핑) | 이번 Task의 job_postings 스키마에 급여 컬럼이 없어 저장하지 않음(필요 시 스키마 확장은 범위 밖) |
| regDt | String | (미매핑, 참고용) | 등록일자 — created_at은 DB insert 시각을 그대로 사용하므로 별도 매핑 안 함 |

### 페이지네이션/전체 수집 전략

- `total`(총건수)을 최초 응답에서 확인 후, `startPage`를 1부터 증가시키며 `display=100`으로 순회, `total`을 채울 때까지 반복(또는 빈 응답 시 종료)
- 1회 Edge Function 실행에서 다건 페이지 호출이 발생하므로, 각 페이지 호출 실패 시 해당 페이지만 재시도하지 않고 전체 실행을 실패로 기록(단순화, 다음 pg_cron 주기에 재시도)

### deadline(closeDt) 처리 — Edge Function 구현 시 확인 필요

- `docs/database-schema.md`의 `job_postings.deadline`은 DB 컬럼 자체는 NULL 허용이지만, `packages/shared`의 `jobPostingSchema.deadline`은 현재 `z.string()`(non-nullable)로 정의되어 있다(Task "job-posting 스키마 정리" 시점부터 존재하던 기존 불일치, 이번 조사에서 재확인). closeDt가 공란(상시채용)으로 오는 경우를 어떻게 처리할지는 Edge Function 구현 작업에서 실제 응답을 받아본 뒤 결정 필요:
  - (a) 상시채용 공고는 deadline에 임의로 먼 미래 날짜를 채워 non-nullable 스키마를 유지하거나
  - (b) 이 기회에 `jobPostingSchema.deadline`을 `z.string().nullable()`로 수정해 DB 정의와 일치시킨다(권장 — DB 사실과 도메인 타입을 일치시키는 것이 원칙에 부합).

### 이용허락범위 / 라이선스

- 신청·인증키 발급이 완료되었으므로, 승인 시 제공된 공식 이용약관 화면/문서가 있다면 이번 Task 진행 중 최종 확인한다(별도로 공유되지 않았다면 공공데이터포털에 조사된 "KOGL 제4유형" 표기가 참고 기준). 비상업적 개인 앱이므로 상업적 이용금지 조항과는 무관하며, 공식 Open API 호출이라 robots.txt 대상도 아니다.

### 환경변수 (Edge Function Supabase secrets)

- `WORK24_AUTH_KEY` — 발급받은 인증키(리포지토리에 값 커밋 금지, `supabase secrets set`으로 등록)

---

## 2. 어댑터 공통 인터페이스 설계

소스가 API에서 크롤링으로 바뀌어도, 향후 다른 플랫폼을 다시 추가하더라도 재사용 가능하도록 어댑터 인터페이스는 계속 확장 가능한 형태로 유지한다(과설계는 지양하되, 배열 기반 순회 구조 자체는 유지 비용이 거의 없음).

```ts
// supabase/functions/collect-job-postings/types.ts (예정)
interface NormalizedJobPosting {
  title: string
  company: string
  location: string
  careerLevel: string
  deadline: string | null // ISO date string (YYYY-MM-DD), 상시채용 등은 null
  tags: string[]
  url: string
  sourceUrl: string // upsert 고유키, job_postings.source_url UNIQUE 제약과 매핑
  source: string // 수집 플랫폼 구분(예: "jobkorea"), job_postings.source 컬럼과 매핑
}

// 소스 어댑터는 모두 이 시그니처를 따른다.
interface JobPostingSource {
  name: string
  fetchAll: () => Promise<NormalizedJobPosting[]>
}
```

- 이번 Task에서는 `sources/jobkorea.ts` 1개 크롤링 어댑터만 구현한다. 내부에서 `/recruit/joblist` 목록 페이지를 순회 fetch하며 HTML을 파싱해 `NormalizedJobPosting[]`으로 변환한다(위 1절의 매핑 참고). 기존 `sources/work24.ts`(API 전용)는 삭제한다.
- `job_postings` 테이블에는 플랫폼 구분 컬럼(`source`)을 **재도입한다**(사용자 승인). 이전 조사(2차 변경)에서는 단일 API 소스라 YAGNI로 철회했으나, 크롤링 방식은 소스별 HTML 구조가 달라 향후 자소설/캐치 등을 추가할 가능성이 높고 사용자가 배지 UI 재도입을 원하므로 이번에 컬럼을 추가한다.
- Edge Function 엔트리(`index.ts`)는 `JobPostingSource[]` 배열(현재는 원소 1개: 잡코리아)을 순회하며 실행, 결과를 `job_collection_logs`에 기록한다(다음 작업에서 구현). upsert 시 `source` 컬럼도 함께 저장한다.

---

## 부록: 보류된 소스 조사 내용 (참고용, 이번 Task 미구현)

향후 다시 다중 플랫폼으로 확장할 경우를 대비해 조사 결과를 요약해 남긴다.

### 자소설닷컴(Jasoseol) — 실측 필요로 보류

- `robots/jasoseol.txt`(사용자 제공) 기준으로는 `Disallow: /crt/*, /core, /rocket_correction, /coach-sellers, /webview/, /demo/` 외 `Allow: /`이므로 `/recruit` 경로 자체는 정책상 막혀있지 않다.
- 그러나 `https://jasoseol.com/recruit`를 실제 fetch한 결과(2026-08-26), 정적 HTML에는 필터 UI(기업명/채용형태/기업분류/직무, 달력 컴포넌트)만 보이고 실제 채용 공고 목록 데이터가 포함되어 있지 않았다. 클라이언트사이드 렌더링(React/Vue 등)으로 별도 API를 호출해 목록을 채우는 구조로 추정된다.
- 이 세션에서는 Chrome 브라우저 자동화 확장이 연결되지 않아 실제 네트워크 요청(내부 API 엔드포인트)을 확인하지 못했다. **사용자가 브라우저 개발자도구(Network 탭)로 목록 API 엔드포인트와 응답 JSON 구조를 확인해 공유해야** 어댑터 구현이 가능하다.
- 내부 API를 직접 호출하는 경우, 해당 API 경로가 robots.txt의 Disallow 목록(`/crt/*`, `/core`, `/webview/`, `/demo/` 등)에 해당하는지 별도로 재확인 필요.

### 캐치(Catch, catch.co.kr) — 실측 필요로 보류

- `robots/catch.txt`(사용자 제공) 기준으로는 `Allow: /` 이며, `/Search`, `/Company`, `/App` 등 다수 경로만 Disallow. 채용 목록/상세 전용 경로가 명시적으로 막혀있지는 않다.
- 그러나 `https://www.catch.co.kr/NCS/RecruitJobs`를 fetch한 결과(2026-08-26) **403 Forbidden**이 반환되어, 봇 감지에 의한 차단인지 URL 자체가 잘못된 것인지 구분하지 못했다.
- `/Search`가 Disallow이므로 검색 기반 목록 접근은 피해야 하며, 정확한 정적 목록 페이지 경로를 사용자가 브라우저로 직접 확인해 공유해야 한다.

### 원티드(Wanted)
- https://openapi.wanted.jobs/ — client 등록 후 인증키 신청, 약 3영업일 소요. Jobs API로 포지션 목록 조회.

### 사람인(Saramin)
- `https://oapi.saramin.co.kr/job-search`, `access-key` 파라미터, 앱 등록 승인 필요, 1일 500회 호출 제한.

### 잡코리아 공식 API (참고, 미채택)
- https://www.jobkorea.co.kr/service/api — **공공기관/학교 대상 우선 제공, 개인/일반 기업은 내부 검토 후 불가할 수 있음**(승인 불확실성 높음). 이번에는 공식 API 대신 robots.txt가 허용한 HTML 크롤링 방식을 채택했다(1절 참고).

---

## 다음 작업으로 이월되는 선행 조건

- [x] 고용24 API 최종 blocked 확정, 잡코리아 크롤링으로 전환 결정(2026-08-26)
- [ ] 잡코리아 `/recruit/joblist` raw HTML을 직접 fetch(curl 등)해 실제 페이지네이션 파라미터, 총건수 위치, 마감일 텍스트 전체 패턴, 태그 매핑 가능 여부 확정 — Edge Function 구현 시 진행
- [ ] `jobPostingSchema.deadline`을 nullable로 변경할지 여부 결정(잡코리아도 "상시채용" 등 마감일 없는 공고가 존재할 수 있음) — Edge Function 구현 작업에서 함께 결정
- [ ] 잡코리아 크롤링에 대한 이용약관(robots.txt 외) 확인 — 필요 시 후속 검토

---

## Task 024: 딜레이·백오프·실패율 임계치 결정 근거 (2026-08-31)

`collect-job-postings`/`collect-tech-news`에 요청 딜레이·백오프·실패율 모니터링을 추가하며 정한 상수값과 근거. 실제 구현은 `supabase/functions/_shared/fetch-with-policy.ts`(딜레이/백오프), `supabase/functions/_shared/collection-runner.ts`(소스 순차 실행/실패율 집계)에 있다.

- **소스 사이 딜레이(1.5초, `collection-runner.ts`의 `minDelayMs` 기본값)**: 로드맵 요구사항이 "1~2초"였으므로 중간값을 채택했다. 소스를 `Promise.all` 병렬 실행에서 순차 실행 + 딜레이로 바꿔, 같은 함수 호출 안에서 여러 사이트에 짧은 시간 안에 요청이 몰리지 않도록 했다(etnews.ts는 같은 사이트 내 피드 2개 요청에도 동일 원리로 `INTER_FEED_DELAY_MS` 1.5초를 별도 적용).
- **백오프(초기 500ms, 배율 2, 최대 3회 재시도, 총 예산 15초, `fetch-with-policy.ts`)**: 403/429/5xx만 재시도 대상으로 삼고 404 등 명백한 클라이언트 오류는 재시도하지 않는다. 총 예산 15초 상한은 소스 수가 늘어나도(Task 030에서 최대 5개 안팎 예상) Supabase Edge Function 실행시간 제한 안에 여유 있게 들어오도록 임의로 정한 값이며, 실측(로컬 검증 기준 소스당 200ms~1.7초)상 재시도가 발생하지 않는 한 영향이 없다.
- **실패율 임계치(30%)와 최소 표본 수(3건)**: 로드맵 예시값을 그대로 채택했다. 이번 배치 결과 하나만으로 판정하면 소스 1개 실패 시 실패율이 100%가 되어 과민 반응하므로, 로그 테이블(`job_collection_logs`/`news_collection_logs`)에서 소스별 최근 10건(`recentSampleSize`)을 재조회해 판정한다. 최근 로그가 3건 미만이면 표본 부족으로 판정을 보류해 초기 1~2회 실패로 오탐이 발생하지 않도록 했다.
- **측정 주기**: 별도 크론이나 대시보드를 새로 만들지 않고, 이미 `pg_cron`으로 하루 2회(00:00, 09:00) 호출되는 두 수집 함수 실행 시점에 "얹혀서" 판정하도록 했다(수집 로그 insert 직후 같은 소스의 최근 로그를 재조회). 알림은 기존 `_shared/error-log.ts`의 `logEdgeFunctionError`(→ `edge_function_error_logs` insert + `ALERT_WEBHOOK_URL` 설정 시 webhook)를 그대로 재사용해 별도 알림 채널을 신설하지 않았다.
- **로컬 재현 검증(2026-08-31)**: `job_collection_logs`에 `jobkorea` failure row 4건을 직접 seed한 뒤(최근 10건 중 40%) `collect-job-postings`를 재호출하자 `edge_function_error_logs`에 `"소스 jobkorea 최근 실패율 40% (임계치 30% 초과, 표본 10건)"` row가 실제로 생성됨을 확인했다.
- [ ] 자소설닷컴/캐치: 사용자가 브라우저 개발자도구로 실제 목록 로딩 방식(정적 HTML vs 내부 API, 정확한 엔드포인트) 확인 후 공유 — 확인되면 후속 Task에서 크롤링 어댑터 추가
