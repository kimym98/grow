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
> 7. **6차 변경(현재, 2026-09-01, Task 029 실측)**: 캐치·자소설닷컴에 대해 브라우저 UA 기반 curl 요청과 Next.js/Nuxt.js 번들 분석으로 재조사했다(Chrome DevTools MCP 확장이 이번 세션에서 연결되지 않아 실제 브라우저 Network 캡처 대신 curl + JS 번들 정적 분석으로 대체). 상세 내용은 "부록: 보류된 소스" 절 및 "Task 029: 신규 크롤링 소스 사전 스파이크" 절 참고.
>    - **캐치**: 이전 조사(403)와 달리 일반 브라우저 User-Agent로는 루트/카테고리/상세 페이지가 모두 200 OK로 정상 응답했다(이전 403은 UA 미지정 등 봇 감지 추정). `/api/v1.0/recruit/*` 하위에 다수의 실제 엔드포인트가 존재하고 인증 없이 JSON을 반환함을 확인했으나, **이용약관(`/Member/AccessTerms`)에 크롤링/스크래핑/AI 학습 목적 수집을 명시적으로 금지하는 조항이 있어 최종 제외로 판단**한다.
>    - **자소설닷컴**: `sitemap.xml` → `sitemap/employment_companies.xml`에서 공고 상세 URL 패턴(`/recruit/{id}`)을 확인했고, 실제 상세 페이지 1건을 curl로 fetch한 결과 Next.js `getServerSideProps`(`__NEXT_DATA__.gssp === true`) 기반으로 **서버사이드 렌더링되어 실제 공고 데이터가 포함됨**을 확인했다(이전 조사의 "목록 페이지가 CSR로 추정됨"과는 별개로, 상세 페이지 개별 접근은 SSR임). 이용약관(`/terms`) 페이지는 콘텐츠 자체가 클라이언트에서 비동기로 채워지는 구조라 curl로는 조항 텍스트를 확인하지 못해 **ToS는 미확인으로 남긴다**.
> 8. **7차 변경(현재, 2026-09-01, Chrome DevTools MCP 실측)**: Chrome DevTools MCP 확장이 연결되어 자소설닷컴 `/terms` 페이지를 실제 브라우저로 렌더링해 약관 본문을 확인했다. **제14조(회원의 의무) 금지행위 9호에 "자소설닷컴의 허가없이 자동화된 수단(예, 수집로봇, 스파이더, 스크래퍼)을 이용하여 사용자의 콘텐츠나 정보를 수집하거나 다른 방식을 통해 접근하는 행위"를 명시적으로 금지하는 조항이 존재함을 확인**했다(약관 시행일 2026-06-23). 이에 따라 6차 변경에서 "보류(ToS 확인 후 재판단)"였던 자소설닷컴은 **캐치와 동일하게 ToS 위반으로 최종 제외**로 판정을 확정한다. 상세 내용은 "부록: 보류된 소스"의 자소설닷컴 항목 및 "Task 029" 절 참고.

## 결론 요약

- **최종 차단 확정**: 고용24(Work24) 자체 경로 채용정보 오픈API — 개인회원 인증키로 사용 불가(2026-08-26 확인 후 재신청하지 않고 크롤링 방식으로 전환 확정)
- **채택된 소스**: 잡코리아(JobKorea) 채용 목록 HTML 크롤링 — `/recruit/joblist`, robots.txt Allow 확인, 서버 렌더링 HTML 확인 완료(2026-08-26)
- **채택된 소스(Task 033, 2026-09-01)**: 커리어(career.co.kr) 채용 목록 HTML 크롤링 — 실제 서빙 도메인은 `job.career.co.kr`(www와 다름), `/jobs/jobpart?i_jc1=H0`, robots.txt Allow 확인, 서버 렌더링 HTML 확인 완료. location/career_level 필드는 목록 HTML에 없어 빈 문자열로 저장
- **제외 확정(Task 029, 2026-09-01)**: 캐치(catch.co.kr) — `/api/v1.0/recruit/*` API·SSR 목록/상세 페이지 모두 기술적으로 접근 가능함을 실측했으나, 이용약관이 크롤링/스크래핑/AI 학습 목적 수집을 명시적으로 금지해 착수 대상에서 제외한다.
- **제외 확정(Task 029, 2026-09-01, Chrome DevTools MCP 실측)**: 자소설닷컴(jasoseol.com) — 상세 페이지(`/recruit/{id}`) 서버사이드 렌더링은 기술적으로 가능함을 확인했으나, 이용약관 제14조 금지행위 9호가 "자동화된 수단(수집로봇, 스파이더, 스크래퍼)을 이용한 정보 수집·접근"을 명시적으로 금지해 착수 대상에서 제외한다.
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

- 공식 API가 아닌 크롤링이므로, robots.txt가 명시적으로 Allow한 경로만 접근하고 과도한 요청 빈도를 피하는 것으로 정책 준수를 도모한다.
- **이용약관 실측 완료(2026-09-01, Chrome DevTools MCP)**: 개인회원 약관(`/service/ProvisionGG`) 제19조④·기업회원 약관(`/service/ProvisionGI`) 제19조④에 모두 "회원은 서비스를 이용하여 얻은 정보를 회사의 사전동의 없이 복사, 복제, 번역, 출판, 방송 기타의 방법으로 사용하거나 이를 타인에게 제공할 수 없다"는 **일반적 재배포 금지 조항**이 있으나, 캐치·자소설닷컴·사람인·인크루트처럼 "자동화된 수단/크롤링/봇/스크래퍼/매크로"를 명시적으로 금지하는 문구는 **양쪽 약관 어디에도 없음**을 확인했다(아래 "Task 032: 링커리어·사람인·인크루트·커리어 크롤링 가능 여부 조사" 절 참고 — 사람인·인크루트는 정확히 이 지점에서 기업회원 약관에 명시적 크롤링 금지 조항을 두고 있어 잡코리아와 대조된다).
- 이 일반 조항이 "회원"(로그인 사용자)을 대상으로 하는지, 비회원 자동 접근에도 적용되는지는 약관 문언만으로는 명확하지 않다(제1조가 "회사와 회원간의 이용 조건"이라고 명시하는 점에서 비회원 크롤링에 직접 적용되는지 불확실). 비상업적 개인 프로젝트, 최소 빈도(1일 1~2회) 수집, robots.txt Allow 준수라는 점을 종합적 리스크 완화 근거로 삼아 **잡코리아는 계속 채택 소스로 유지**하되, 완전한 무위험은 아니므로 사용자가 인지하고 있어야 한다.

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

### 자소설닷컴(Jasoseol) — Task 029 실측 결과(2026-09-01), 상세 렌더링은 가능하나 ToS로 최종 제외

- **sitemap 구조**: `https://jasoseol.com/sitemap.xml`은 sitemap index이며, 그중 `https://jasoseol.com/sitemap/employment_companies.xml`(약 2.3MB)에 채용 공고 URL이 담겨 있다. 각 공고는 `<loc>https://jasoseol.com/recruit/{id}</loc>`(상세, priority 0.9, changefreq hourly)와 `<loc>https://jasoseol.com/career/{id}</loc>`(관련 페이지, priority 0.5) 두 URL 쌍으로 구성된다.
- **상세 페이지 렌더링 방식(실측 완료)**: `https://jasoseol.com/recruit/105962`를 curl로 GET한 결과, `<title>`/`og:title`/`og:description`에 실제 회사명·공고 제목·모집 직무가 그대로 채워져 있었고, HTML 내 `<script id="__NEXT_DATA__">`를 파싱한 결과 `props.pageProps.initialEmploymentCompany`에 실제 공고 데이터(회사명 "케이씨텍", 직무 "CLN공정" 등)가 포함되어 있으며 `gssp: true`(Next.js `getServerSideProps`)로 확인됐다. 즉 **개별 상세 페이지는 SSR이며 단순 `fetch()`만으로 데이터 확보 가능**하다 — 2026-08-26 조사의 "목록 페이지(`/recruit`)가 CSR로 추정된다"는 결론과는 별개로, sitemap에서 얻은 상세 URL을 순회하는 방식(목록 페이지를 거치지 않음)이면 이번 실측 결과가 그대로 적용된다.
- **이용약관 확인(Chrome DevTools MCP로 완료, 2026-09-01)**: `https://jasoseol.com/terms` 페이지를 실제 브라우저(Chrome DevTools MCP `navigate_page` + `take_snapshot`)로 렌더링해 약관 전문을 확인했다(curl 조사 때는 약관 본문이 클라이언트 사이드에서 비동기로 채워지는 구조라 확인 불가했던 부분). **제3장(계약 당사자의 의무) 제14조(회원의 의무) 5항 "회원의 금지행위" 9호**에 다음 조항이 명시되어 있다: *"자소설닷컴의 허가없이 자동화된 수단(예, 수집로봇, 스파이더, 스크래퍼)을 이용하여 사용자의 콘텐츠나 정보를 수집하거나 다른 방식을 통해 접근하는 행위"* — 크롤링/스크래핑을 명시적으로 금지행위로 규정한다(약관 시행일 2026-06-23, 부칙 확인).
- **robots.txt**: 이전 조사와 동일(`Disallow: /crt/*, /core, /rocket_correction, /coach-sellers, /webview/, /demo/`, 그 외 `Allow: /`), `/recruit/{id}` 경로는 Disallow 대상이 아니다. 즉 robots.txt만으로는 허용된 것처럼 보이나 ToS가 이를 금지한다.
- **결론**: 상세 페이지 SSR로 기술적 착수는 가능하지만, 이용약관이 자동화 수단을 이용한 수집·접근을 명시적으로 금지하고 있어 캐치와 동일한 "robots 허용 ≠ ToS 허용" 원칙에 따라 **최종 제외**로 판단한다.

### 캐치(Catch, catch.co.kr) — Task 029 실측 결과(2026-09-01), 기술적 가능하나 ToS로 제외

- **이전 403의 원인**: 2026-08-26 조사에서는 curl 기본 UA로 403이 반환됐으나, 이번에 일반 브라우저 UA(`Mozilla/5.0 ... Chrome/120.0.0.0`)로 재요청한 결과 루트(`/`), 카테고리 목록(`/NCS/RecruitCategory`), 상세(`/NCS/RecruitInfoDetails/{id}`) 페이지 모두 **200 OK**로 정상 응답했다. User-Agent 기반 봇 차단이었던 것으로 추정된다.
- **목록/상세 페이지는 SSR**: `/NCS/RecruitCategory`를 curl로 GET한 결과 서버 렌더링된 HTML 안에 `RecruitInfoDetails/{id}` 링크가 23건 포함되어 있었다. 상세 페이지(`/NCS/RecruitInfoDetails/567914`)도 `window.__NUXT__` 인라인 상태에 `RecruitID`, `CompID`, `CompName`, `RecruitTitle`, `SalaryCode`, `CareerMoreThan/LessThan`, `EduLevelCode` 등 필드가 직접 포함된 Nuxt.js SSR 페이지임을 확인했다(잡코리아와 동일한 방식의 HTML 크롤링이 가능).
- **`/api/v1.0/recruit/*` API 엔드포인트 실존 확인**: 루트 페이지가 로드하는 `_nuxt/*.js` 번들 중 하나(`312d1ee.js`)에 `baseURL||n.baseUrl||"https://www.catch.co.kr/api/v1.0/"`와 다수의 `recruit/...` 경로 문자열이 정적으로 포함되어 있었다. 실제 GET 요청으로 검증한 결과는 다음과 같다(응답 스키마):

  | 엔드포인트 | 상태 | 응답 내용 |
  |---|---|---|
  | `recruit/information/jobListV2` | 200 OK, JSON | 직무 대분류/소분류 코드-이름 매핑(`JobList`, `JobListSub` 배열, `Code`/`Name` 필드) — 채용 공고 자체가 아닌 필터 메타데이터 |
  | `recruit/information/workListV3/all` | 200 OK, JSON | 직무 카테고리 트리(`workList`, `subWorkList`, `text`/`value` 필드) — 필터 메타데이터 |
  | `recruit/information/themeListV2` | 200 OK, JSON | 테마별 공고 묶음 메타데이터 |
  | `recruit/information/promiseList` | 200 OK, JSON | 소규모 메타데이터 |
  | `recruit/information/getDefaultThemeRecruitList` | 200 OK, JSON | 쿼리 파라미터 없이는 빈 배열(`{"theme":[],"product":{},"themeRecruit":[]}`) — 실제 공고 목록을 얻으려면 파라미터 조합이 추가로 필요(이번 세션에서 미확정) |
  | `recruit/offer/detail`, `recruit/offer/main` | 401 Unauthorized | 로그인 세션 필요 |
  | `recruit/log`, `recruit/log/writeRecruitListImpressionLog`, `recruit/information/recomSearchLog`, `recruit/myCategory/insertMyCategoryLog` | (호출 안 함) | 작업 지시상 "log 제외" 대상. `robots.txt`에도 `Disallow: /api/v1.0/recruit/log`, `Disallow: /api/v1.0/recruit/detail/log`가 명시되어 있어 정책상으로도 접근 금지 대상임을 확인 |

  → 실제 채용 공고 페이지네이션 검색 API(목록 전체 조회) 엔드포인트는 이번 조사에서 정확히 특정하지 못했다(파라미터 조합 필요, 미확인). 다만 위 SSR 페이지 크롤링 경로가 이미 확보되어 있어 API 특정 여부와 무관하게 기술적 착수는 가능하다.
- **이용약관(`/Member/AccessTerms`) — 크롤링 금지 명시 확인**: 페이지를 curl로 GET해 본문 텍스트를 검사한 결과, 다음 조항을 확인했다: *"'회사'의 데이터, 컨텐츠, 정보 등을 자동화된 프로그램(예: 스크립트, 봇, 크롤러 등)을 이용하여 수집, 저장, 복제, 배포하거나 인공지능 학습, 데이터 분석 등의 목적으로 활용하는 행위"*, *"'회사'의 명시적 동의 없이 데이터 마이닝 또는 웹 크롤링을 통해 정보를 수집하거나 이를 제3자에게 제공하는 행위"*를 금지행위로 명시하고 있다(둘 다 회원 서비스 이용 관련 금지행위 조항).
- **결론**: robots.txt는 크롤링을 막지 않고 SSR 페이지·비인증 API도 실제로 동작하지만, **이용약관이 자동화 수집·AI 학습 목적 활용을 명시적으로 금지**하고 있어 "robots 허용 ≠ ToS 허용" 원칙에 따라 **최종 제외**로 판단한다.

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
- [x] 자소설닷컴/캐치 실측 완료(Task 029, 2026-09-01) — 상세 내용은 위 "부록: 보류된 소스"와 아래 "Task 029" 절 참고. 캐치·자소설닷컴 모두 이용약관의 크롤링/스크래핑 금지 조항 확인으로 **최종 제외**.
- [x] 자소설닷컴 `/terms` 페이지의 실제 렌더링된 약관 본문을 Chrome DevTools MCP로 확인 완료(2026-09-01) — 제14조 금지행위 9호에 자동화 수단(수집로봇/스파이더/스크래퍼) 이용 수집·접근 금지 조항 확인, **최종 제외 확정**

---

## Task 029: 신규 크롤링 소스 사전 스파이크 (착수 조건 판정, 2026-09-01)

PRD 참조: 2.9 / 선행 조건: Task 024(완료). 최초 실측(2026-09-01 1차)은 Chrome DevTools MCP 확장이 세션에 연결되지 않아 브라우저 User-Agent를 지정한 curl 요청과 Next.js(`__NEXT_DATA__`)/Nuxt.js(`__NUXT__`, JS 번들) 정적 분석으로 대체했다. 이후 Chrome DevTools MCP가 설치되어, 같은 날 자소설닷컴 `/terms` 페이지만 실제 브라우저 렌더링(`navigate_page` + `take_snapshot`)으로 재확인해 ToS 미확인 상태를 해소했다. 상세 실측 근거는 위 "부록: 보류된 소스"의 자소설닷컴/캐치 항목에 기록했고, 이 절은 최종 판정만 요약한다.

### 최종 판정

| 소스 | 엔드포인트/렌더링 방식 실측 | ToS 검토 | 결론 |
|---|---|---|---|
| 캐치(catch.co.kr) | `/api/v1.0/recruit/*`(log 제외) 다수 엔드포인트가 비인증 200 OK로 응답 확인, `/NCS/RecruitCategory`·`/NCS/RecruitInfoDetails/{id}`도 SSR로 확인 | 이용약관(`/Member/AccessTerms`)에 자동화 프로그램(스크립트/봇/크롤러) 수집·AI 학습 목적 활용·웹 크롤링을 통한 정보 수집을 명시적으로 금지하는 조항 확인(curl) | **제외** — 기술적으로는 가능하나 ToS 위반 |
| 자소설닷컴(jasoseol.com) | `sitemap/employment_companies.xml`에서 `/recruit/{id}` 패턴 확인, 상세 페이지가 Next.js `getServerSideProps` 기반 SSR임을 `__NEXT_DATA__.gssp`로 확인 | `/terms` 페이지를 Chrome DevTools MCP로 실제 렌더링해 확인 — 제14조 금지행위 9호에 자동화 수단(수집로봇/스파이더/스크래퍼) 이용 수집·접근 금지 조항 존재 | **제외** — 렌더링 요건은 충족하나 ToS 위반 |

### Task 030(크롤링 소스 확장)에 대한 영향

- 로드맵 189~190행의 전제("캐치는 JSON API 우선, 자소설닷컴은 사이트맵/HTML 경로")는 두 소스 모두 기술적으로는 실측과 일치했으나(캐치: API·SSR 확인 / 자소설닷컴: 사이트맵 → 상세 URL → SSR HTML fetch 확인), **두 소스 모두 이용약관이 자동화 수집·크롤링을 명시적으로 금지해 Task 030 범위에서 완전히 제외된다.**
- 잡코리아(1절, 채택 소스) 외 신규 크롤링 소스 확장은 이번 조사로 사실상 종료되었으며, 후속으로 신규 소스가 필요하다면 원티드/사람인 공식 API(부록 "원티드"/"사람인" 항목, 인증키 신청 필요) 경로를 재검토해야 한다. (2026-09-01 후속 조사 결과 사람인은 API가 아닌 크롤링 경로도 명시적으로 금지됨 — 아래 Task 032 참고)

---

## Task 032: 링커리어·사람인·인크루트·커리어 크롤링 가능 여부 조사 (2026-09-01)

사용자 요청으로 잡코리아 외 4개 신규 채용 사이트의 크롤링 가능 여부를 robots.txt와 이용약관 양쪽으로 실측했다. robots.txt는 curl로, 이용약관은 Chrome DevTools MCP(`navigate_page` + `evaluate_script`)로 실제 렌더링 후 본문에서 "크롤링/스크래핑/자동화된 수단/로봇/스파이더/매크로/데이터베이스" 키워드를 검색하는 방식으로 확인했다.

### robots.txt 실측 결과

| 소스 | User-agent: * | AI 크롤러 그룹 | 비고 |
|---|---|---|---|
| 링커리어(linkareer.com) | `Allow: /`(교육 콘텐츠 `/stem/learn/*` 경로만 차단) | 별도 그룹 없음(Bingbot에 `Crawl-delay: 1`만 지정) | 채용/공모전 경로는 열려 있음 |
| 사람인(saramin.co.kr) | 특정 경로(지원/이력서/관리자 등)만 차단, 나머지 허용 | **`GPTBot: Disallow: /`, `Bytespider: Disallow: /`** (전체 차단) | AI 크롤러에 적대적 정책 신호 |
| 인크루트(incruit.com) | **`Disallow: /`(전체 차단, catch-all이 파일 맨 끝에 위치)** | Google/Naver/Bing/**ClaudeBot·anthropic-ai·Claude-SearchBot 포함** 명명된 봇만 `Allow: /` | 명명되지 않은 일반 UA는 전면 차단 |
| 커리어(career.co.kr) | `/signup`, `/login`, `/resume`, `/user`, `/company`만 차단 | 없음(`duckduckbot`/`ia_archiver`만 전체 차단) | 채용정보 경로는 열려 있음 |

### 이용약관 실측 결과 (Chrome DevTools MCP 실제 렌더링)

| 소스 | 확인한 약관 | 명시적 크롤링/자동화 수집 금지 조항 | 결론 |
|---|---|---|---|
| 링커리어 | `https://linkareer.com/terms`(2026-08-12 시행) | **채용정보 관련 조항 없음.** 제20조(링커리어 STEM)에 "크롤링·스크래핑" 명시 금지가 있으나 대학 시험문제/강의자료 등 **교육 콘텐츠 전용**. 제39조 2호에 "자동화 프로그램·매크로 등 기계적 수단을 이용하여 서비스에 접근"을 금지하지만 게시판/채팅 도배(스팸) 방지 맥락이라 채용정보 크롤링에 직접 적용되는지 불명확. 제28조는 잡코리아와 유사한 일반 재배포 금지 조항 | ⚠️ **회색지대** — 채용정보 자체를 겨냥한 명시적 금지는 없으나 애매한 조항 존재 |
| 사람인 | 개인회원(`/zf_user/help/terms-of-service`, 2026-01-22 시행) + 기업회원(`/zf_user/help/terms-of-service/company`) | 개인회원 약관에는 없음(잡코리아와 동일한 일반 재배포 금지 조항만). **기업회원 약관 제23조③**: "회사의 데이터베이스를 대상으로... 자동화된 수단(크롤링, 명령어 확장 등)을 활용하여 접근을 시도하는 행위 및... 정보의 전부 또는 일부를 수집하는 행위 등은 엄격히 금지됩니다" | ❌ **제외** — 명시적 금지 |
| 인크루트 | 개인회원(`help.incruit.com/docs/terms.asp`, 2026-04-30 시행) + 기업회원(`help.incruit.com/docs/terms_cp.asp`) | 개인회원 약관에는 없음(일반 재배포 금지 조항만). **기업회원 약관 제21조⑥**: "데이터베이스를 소프트웨어 또는 기계적 방법(예: 크롤링, 미러링 등)을 통해 대규모로 이용하는 행위는 엄격히 금지"(비영리 교육·학술·연구, 시사보도, 포털 검색봇만 예외 — 본 프로젝트는 어느 예외에도 해당하지 않음) | ❌ **제외** — 명시적 금지 + robots.txt 이중 차단 |
| 커리어 | `https://www.career.co.kr/help/Terms_Service.asp?chkGubun=2`(2018-04-13 시행, 약관이 오래됨) | 명시적 "크롤링/봇/스크래퍼" 문구 없음. 제19조6항에 "커리어서비스 이용을 통해 획득한 정보 및 게시물을... 동의없이 복제, 배포할 수 없으며 상업적, 영리목적으로 이용할 수 없다"는 일반 조항만 존재(잡코리아 제19조④와 유사한 패턴) | ⚠️ **회색지대** — 잡코리아와 동등한 수준의 리스크 |

### 대조 관찰 — 잡코리아와의 패턴 비교

- 사람인·인크루트는 공통적으로 **개인회원 약관에는 크롤링 금지 조항이 없고, 기업회원 약관에만 명시적으로 존재**한다. 잡코리아도 이번에 개인회원(`/service/ProvisionGG`)·기업회원(`/service/ProvisionGI`) 약관을 모두 실측했으나 **양쪽 모두 명시적 크롤링 금지 조항이 없었다**(1절 "이용허락범위 / 리스크" 갱신 참고). 즉 잡코리아는 이 두 경쟁사와 달리 크롤링을 콕 집어 금지하지 않는다.
- 링커리어·커리어는 사람인·인크루트만큼 강한 조항은 없지만, 채용정보 자체를 명시적으로 허용한다고 볼 근거도 없다(포괄적 재배포 금지 조항만 존재) — 잡코리아와 유사한 수준의 "회색지대" 리스크.

### 최종 판정 및 권고

- **제외 권고**: 사람인, 인크루트 — 기업회원 약관에 자동화 수집(크롤링)을 명시적으로 금지하는 조항이 존재. 인크루트는 robots.txt도 명명되지 않은 UA를 전면 차단해 이중 리스크.
- **채택 가능(잡코리아와 동등한 리스크 수준)**: 링커리어, 커리어 — robots.txt가 채용정보 경로를 열어두고 있고, 이용약관에도 크롤링을 콕 집어 금지하는 조항이 없다(포괄적 재배포 금지 조항만 존재, 잡코리아 제19조④와 동일 패턴). 다만 "회색지대"이므로 착수 시 잡코리아와 동일하게 이 리스크를 인지한 상태로 진행해야 한다.
- 신규 소스 추가는 Task 030이 취소된 상태이므로, 링커리어·커리어를 실제로 추가할지는 별도 Task로 사용자 승인 후 진행한다(이번 조사는 가능 여부 판정까지만 수행).

---

## Task 033: 커리어(career.co.kr) 크롤링 소스 추가 (구현 완료, 2026-09-01)

### 기본 정보

- 제공처: 커리어(career.co.kr)
- 방식: 공식 API가 아닌 **robots.txt가 허용한 공개 페이지의 HTML 크롤링**(잡코리아와 동일 방식)
- 근거 문서: `robots/career.txt`(job.career.co.kr 기준 스냅샷, 2026-09-01)

### 도메인 관련 주의사항 — 실측으로 발견한 차이점

- Task 032 조사 당시 확인한 robots.txt는 `www.career.co.kr` 기준이었으나, **실제 채용정보 목록/상세는 서브도메인 `job.career.co.kr`에서 서빙됨**을 이번 구현 착수 전 실측(curl)으로 확인했다(`www.career.co.kr` 홈페이지의 채용정보 링크들이 모두 `//job.career.co.kr/recruit/view/{id}`를 가리킴).
- `job.career.co.kr/robots.txt`를 별도로 재확인한 결과 `User-agent: *`는 `/admin`, `/app`, `/base`, `/biz`, `/user`, `/signup`만 Disallow하고 목록 경로(`/jobs`)는 차단하지 않는다(Crawl-delay 명시 없음). `duckduckbot`/`ia_archiver`/`PetalBot`/`Sogou web spider`만 전체 차단.

### 요청 URL

```
https://job.career.co.kr/jobs/jobpart?i_jc1=H0
```

- `/jobs/jobpart`는 커리어의 "직무별" 채용정보 목록 페이지다(잡코리아의 `/recruit/joblist`에 대응).
- `i_jc1=H0`은 "IT.인터넷" 대분류 카테고리 코드다. 실측 결과 이 파라미터를 바꾸면 실제로 결과 집합이 달라짐을 확인했다(무필터 77개 id vs `i_jc1=H0` 필터 69개 id, 서로 다른 id 다수 포함).
- 잡코리아처럼 프론트엔드/AI만 골라내는 세부 duty 코드는 목록 페이지에서 찾지 못했다. 대분류(H0) 하나로 제한하는 것이 이번 구현의 한계다.

### SSR 여부 실측 결과

- `curl -A "Mozilla/5.0" https://job.career.co.kr/jobs/jobpart?i_jc1=H0`로 GET한 결과 200 OK, 응답 HTML 안에 실제 공고 데이터(회사명/제목/마감일)가 ASP 서버 렌더링 템플릿 주석(`<!-- foreach:S/E -->`, `<!-- box영역:S/E -->`)과 함께 그대로 포함되어 있음을 확인했다(자바스크립트 동적 로딩에 의존하지 않는 SSR). 잡코리아와 동일한 방식으로 curl(fetch)만으로 파싱 가능하다.

### 페이지네이션 실측 결과

- `?i_page=2` 쿼리를 붙여 GET해도 응답에 포함된 공고 id 집합이 1페이지와 완전히 동일함(diff 없음)을 확인했다. 잡코리아의 `Page` 파라미터와 동일한 패턴(세션/AJAX 기반 상태로 추정)이라, 이번 구현도 **최초 목록 페이지 1회 요청만 지원**하도록 범위를 좁혔다.

### 응답 HTML → NormalizedJobPosting 필드 매핑

| HTML 상 위치(실측 결과, 2026-09-01 curl 기준) | job_postings 컬럼 매핑 | 비고 |
|---|---|---|
| `<div class="recBoxArea ...">`(공고 1건 = 1블록) | (파싱 단위) | `level2`(프리미엄 위젯)·`level5`(직무별 목록) 등 클래스 뒤 숫자가 다르므로 `class="recBoxArea` 접두사로 분할 |
| 공고 상세 링크 내 `recruit/view/(\d+)` | url, source_url (upsert 키) | 이미 절대경로(`https://job.career.co.kr/recruit/view/{id}`)로 내려옴 |
| `<div class="tit">텍스트</div>` | title | |
| `<span class="lbc">텍스트</span>` | company | |
| `<span class="detDt">텍스트</span>` | deadline | "~MM/DD"(→ISO 날짜, 지난 날짜면 내년 보정) 또는 "상시채용"(→null) 2종만 실측 관측됨. 잡코리아와 달리 "D-N" 형식은 `.detDt`에는 나타나지 않음(별도 `.tr .tx` 영역에 중복 표기만 됨) |
| (미확인, 목록 HTML에 없음) | location | **목록 페이지 HTML 어디에도 지역 정보가 없음** — 빈 문자열로 채움 |
| (미확인, 목록 HTML에 없음) | career_level | **목록 페이지 HTML 어디에도 경력 정보가 없음** — 빈 문자열로 채움 |
| (고정값) | source | `"career"` 고정 |
| (미확인) | tags | 목록 페이지에 태그성 요소 없음, 빈 배열 |

- location/career_level이 빈 문자열인 이유: 상세페이지(`/recruit/view/{id}`)를 공고마다 추가 요청하면 얻을 수 있으나, 잡코리아 어댑터도 목록 1회 요청만으로 구현되어 있어 소스 간 요청 무게를 맞추기 위해 이번 Task 범위에서는 상세페이지 크롤링을 하지 않기로 결정했다. 완전한 값이 필요하면 상세페이지 수집을 별도 후속 Task로 추가할 수 있다.

### 이용허락범위 / 리스크

- Task 032에서 이미 판정된 내용을 그대로 승계한다: robots.txt가 채용정보 경로를 막지 않고, 이용약관(`https://www.career.co.kr/help/Terms_Service.asp?chkGubun=2`, 2018-04-13 시행)에도 크롤링을 콕 집어 금지하는 조항이 없다(일반 재배포 금지 조항만 존재). 잡코리아와 동등한 "회색지대" 리스크로, 비상업 개인 프로젝트·저빈도 수집이라는 전제하에 사용자가 인지하고 착수를 승인함(2026-09-01).

### 구현 결과

- `supabase/functions/collect-job-postings/sources/career.ts` 신규 구현(잡코리아 어댑터와 동일한 `JobPostingSource` 인터페이스 준수, `stripTags`/`parseDeadline`은 의도적으로 복사 — 소스 2개 시점에는 공통 유틸 추상화를 보류하고 3번째 소스 추가 시 재검토)
- `supabase/functions/collect-job-postings/index.ts`의 `sources` 배열에 `careerSource` 추가
- `robots/career.txt`에 job.career.co.kr robots.txt 스냅샷 저장
