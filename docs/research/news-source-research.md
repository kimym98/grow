# IT 뉴스 수집 소스 조사 (Task 012)

이 문서는 Supabase Edge Function(`collect-tech-news`)이 사용할 IT 뉴스 수집 소스를 조사한 결과다. `docs/job-source-research.md`(Task 010)와 동일한 형식을 따른다. 실제 코드 구현은 이 문서를 입력으로 다음 작업(`collect-tech-news` Edge Function 구현)에서 진행한다.

## 결론 요약

- **채택된 소스**: GeekNews(`news.hada.io`) Atom RSS, 전자신문(etnews) RSS(AI `04046.xml`, 보안 `04045.xml`) — 둘 다 실제 curl로 200 응답 및 필드 구조 실측 확인 완료(2026-08-27)
- **배제된 소스**: 네이버 뉴스 검색 오픈API — 키워드 검색 기반이라 "최신순 전체 피드" 용도에 부적합, 요약 품질 낮음, 이용약관 미확인(부록 참고)
- **보류(이번 Task 범위 제외)**: ZDNet Korea, ITWorld Korea — 실제 RSS 경로 미확정(부록 참고)
- **재사용 가능한 자산**: `supabase/functions/collect-job-postings/`의 어댑터 구조(`types.ts` 인터페이스, `index.ts`의 순회/upsert/수집 로그 기록, `jobkorea.ts`의 `stripTags` 정규식 파싱 스타일)를 `collect-tech-news`에서 그대로 재사용한다. RSS는 XML 태그가 규칙적이라(`<item>`/`<entry>` 블록 단위) 크롤링보다 정규식 파싱 위험이 낮으므로, 별도 XML 파서 라이브러리 없이 정규식 파싱으로 충분하다고 판단한다.

---

## 1. GeekNews(`news.hada.io`) Atom RSS (채택 소스)

### 기본 정보

- 제공처: GeekNews(개발/기술/스타트업 뉴스 큐레이션 서비스)
- 방식: 공개 Atom RSS 피드(공식 구독 기능, 크롤링 아님)
- 요청 URL: `https://news.hada.io/rss/news`

### robots.txt 정책 준수 (2026-08-27 curl 실측)

```
Content-Signal: ai-train=no, search=yes, ai-input=yes

User-agent: GPTBot / ClaudeBot / anthropic-ai / Google-Extended / ... (모델 학습·대량 수집 크롤러 그룹)
Disallow: /

User-agent: OAI-SearchBot / ChatGPT-User / Claude-SearchBot / Claude-User / PerplexityBot / GoogleOther
Allow: /

User-agent: *
Allow: /
Disallow: /api/, /auth/, /comments/*, /login, /settings/, /rss/favorites/, /signup, /write 등
```

- **중요**: `ClaudeBot`/`anthropic-ai`를 명시한 첫 번째 그룹은 `Disallow: /`로 전면 차단되어 있다(모델 학습·대량 수집 목적 크롤러 취급). 반면 `User-agent: *`(일반 크롤러) 그룹은 `/rss/`를 포함해 대부분 허용한다. `Content-Signal` 헤더도 `ai-train=no`(학습 금지)이지만 `ai-input=yes`(AI 입력으로 사용 가능)를 명시한다.
- 잡코리아 크롤링(Task 010)과 동일한 원칙에 따라, **AI 크롤러로 식별되지 않는 중립적 User-Agent**(`grow-news-collector/1.0`, 비상업 개인 프로젝트임을 밝히는 형태)를 사용해 `User-agent: *` 규칙을 적용받는다. `/rss/news`는 Disallow 목록에 없으므로 이 UA로 접근 시 정책상 허용된다.

### 응답 구조 (2026-08-27 curl 실측, Atom 포맷)

```xml
<feed xmlns='http://www.w3.org/2005/Atom'>
  ...
  <entry>
    <title><![CDATA[미 국무부, 이민 비자 신청 처리 중단]]></title>
    <link rel='alternate' type='text/html' href='https://news.hada.io/topic?id=32936' />
    <id>https://news.hada.io/topic?id=32936</id>
    <published>2026-08-27T14:31:38+09:00</published>
    <author><name>neo</name></author>
    <content type='html' xml:lang='ko'><![CDATA[<ul><li>...</li></ul>]]></content>
  </entry>
  ...
</feed>
```

### 필드 매핑 → tech_news 컬럼

| Atom 상 위치 | tech_news 컬럼 | 비고 |
|---|---|---|
| `<entry>` | (파싱 단위) | `<entry>...</entry>` 블록 단위로 순회 |
| `<title><![CDATA[...]]></title>` | title | CDATA 내부 텍스트 |
| `<link rel='alternate' ... href='...' />` | url (upsert 고유키) | 속성값 그대로 사용(이미 절대경로) |
| `<content type='html'>...</content>` | summary | CDATA 내 HTML을 stripTags로 텍스트화, 길이 제한 필요 여부는 구현 단계에서 확인 |
| `<published>...</published>` | published_at | ISO 8601(`2026-08-27T14:31:38+09:00`) → `YYYY-MM-DD`로 자르면 됨 |
| (고정값) | source | `"geeknews"` 고정 |

### 이용허락범위 / 리스크

- 공식 RSS 구독 기능이므로 배포 목적 자체가 재게시(구독자 리더기에 노출)를 전제로 한다. robots.txt의 `*` 그룹 규칙을 준수하는 중립 UA 사용, 최소 빈도(1일 1~2회) 수집으로 리스크를 최소화한다.
- `ClaudeBot` 등으로 UA를 식별했을 경우 차단 대상이 되므로, 정체를 숨기는 것이 아니라 "AI 모델 학습용 크롤러가 아닌 개인 프로젝트의 RSS 구독 클라이언트"로서 중립 UA를 쓰는 것이 정책 취지에 부합한다(Content-Signal의 `ai-input=yes`가 이 용도를 허용함을 뒷받침).

---

## 2. 전자신문(etnews) RSS (채택 소스)

### 기본 정보

- 제공처: 전자신문(etnews.com)
- 방식: 공식 RSS 서비스(`https://www.etnews.com/rss/`에 전체 목록 안내)
- 요청 URL(채택): AI `https://rss.etnews.com/04046.xml`, 보안 `https://rss.etnews.com/04045.xml`

### 섹션 코드 확정 경위 (2026-08-27)

- 처음 웹 검색으로 얻은 `Section041.xml`(정보화)/`Section045.xml`(보안) 경로는 실제로 curl하면 자체 WAF에 의해 404(비정상 경로로 탐지)로 차단됨을 확인했다. `Section901~904.xml`(오늘의뉴스 등 종합 섹션)만 여전히 유효했다.
- `https://www.etnews.com/rss/` 페이지의 실제 HTML을 curl로 파싱해 현재 유효한 섹션 코드 전체 목록을 재확인한 결과, IT/기술 섹션은 `04.xml`(SW 전체), `04043.xml`(SW), `04045.xml`(보안), `04046.xml`(AI) 형태로 개편되어 있었다. 이 중 IT 뉴스 피드 목적에 맞는 **AI(`04046.xml`)와 보안(`04045.xml`)**을 채택 코드로 확정했다(SW 섹션 `04.xml`/`04043.xml`은 범위가 넓어 이번엔 제외, 필요시 후속 확장).
- 3개 코드(`04.xml`, `04045.xml`, `04046.xml`) 모두 curl로 HTTP 200 및 정상 RSS 응답 확인 완료.

### robots.txt 정책 준수 (2026-08-27 curl 실측)

```
User-agent: *
Allow: /
#Disallow: /tools (주석 처리되어 비활성)

#User-agent: GPTBot
#Disallow: /   (주석 처리되어 비활성)
```

- `www.etnews.com/robots.txt`는 전면 `Allow: /`이며, `GPTBot` 등 AI 크롤러 차단 규칙도 모두 주석 처리되어 비활성 상태다. 정책상 제약이 사실상 없다.

### 응답 구조 (2026-08-27 curl 실측, RSS 2.0 포맷)

```xml
<rss version="2.0">
  <channel>
    ...
    <item>
      <title><![CDATA[KISA·교통안전공단, 자동차 사이버보안 공동 대응]]></title>
      <link>https://www.etnews.com/20260827000125</link>
      <description><![CDATA[한국인터넷진흥원(KISA)과 한국교통안전공단(TS)이...]]></description>
      <author><![CDATA[박진형]]></author>
      <guid>20260827000125</guid>
      <pubDate>Thu, 27 Aug 2026 15:03:05 +0900</pubDate>
    </item>
    ...
  </channel>
</rss>
```

### 필드 매핑 → tech_news 컬럼

| RSS 상 위치 | tech_news 컬럼 | 비고 |
|---|---|---|
| `<item>` | (파싱 단위) | `<item>...</item>` 블록 단위로 순회 |
| `<title><![CDATA[...]]></title>` | title | CDATA 내부 텍스트 |
| `<link>...</link>` | url (upsert 고유키) | CDATA 없이 평문, 절대경로 |
| `<description><![CDATA[...]]></description>` | summary | CDATA 내부 텍스트(이미 순수 텍스트, HTML 태그 없음 — stripTags 불필요할 수 있으나 방어적으로 적용 권장) |
| `<pubDate>...</pubDate>` | published_at | RFC 822 형식(`Thu, 27 Aug 2026 15:03:05 +0900`) → `new Date()` 파싱 후 `YYYY-MM-DD`로 변환 |
| (고정값) | source | `"etnews"` 고정 |

### 이용허락범위 / 리스크

- 공식 RSS 서비스이며 robots.txt 제약이 사실상 없어 job-source-research.md의 잡코리아 크롤링보다 리스크가 낮다. 다만 URL 스킴이 예고 없이 변경된 이력이 있으므로(Section0xx → 두 자리/다섯 자리 숫자 코드), 구현 시 404 응답에 대한 실행 실패 처리(해당 소스만 실패로 로그 기록, 전체 실행 중단하지 않음)를 갖춰야 한다.

---

## 부록: 배제된 소스

### 네이버 뉴스 검색 오픈API

- 제공처: 네이버 개발자센터(`developers.naver.com`)
- 이번 조사에서 `developers.naver.com/docs/serviceapi/search/news/news.md` 접근이 도구 제약(WebFetch 차단)으로 실패해 이용약관(저장/재게시 허용 범위, 캐시 보관 기간 제한 등)은 **확인하지 못했다**(추측 금지 원칙에 따라 단정하지 않음).
- 다만 API 자체의 설계상 다음 기술적 한계는 명확하다:
  - **검색어(query) 파라미터가 필수인 키워드 검색 API**이며, "최신순 전체 뉴스 목록"을 가져오는 피드형 엔드포인트가 아니다. `sort=date`로 최신순 정렬은 가능하나 검색어 없이는 호출할 수 없어, RSS처럼 매체가 발행한 전체 기사를 순회 수집하는 용도에 부적합하다.
  - `description` 필드는 검색어와 일치하는 부분이 `<b>` 태그로 하이라이트된 짧은 스니펫으로, RSS의 `description`/`content`처럼 기사 도입부 전체를 담지 않아 요약 품질이 낮다.
- 결론: 키워드 기반 검색이 필요한 기능(예: 뉴스 페이지 내 검색창)에는 후보가 될 수 있으나, 이번 Task의 "전체 피드 수집" 목적에는 RSS 대비 이점이 없어 배제한다.

## 부록: 보류된 소스

### ZDNet Korea

- `https://www.zdnet.co.kr/RSS/section_it.xml`(추정 경로)로 curl 시 `www.zdnet.co.kr` → `zdnet.co.kr`로 302 리다이렉트만 확인, 리다이렉트 이후 실제 RSS 콘텐츠까지는 이번 조사에서 검증하지 못했다.
- 후속 확장 시 리다이렉트 대상 URL을 직접 curl로 재확인 필요.

### ITWorld Korea

- 추정 경로 `https://www.itworld.co.kr/rss/all.xml`은 curl 결과 404(일반 HTML 페이지 반환, RSS 아님). 실제 RSS 제공 여부/경로 자체가 미확인 상태.
- 후속 확장 시 사이트 내 RSS 안내 페이지를 직접 확인해 정확한 경로 파악 필요.

---

## 다음 작업으로 이월되는 선행 조건

- [x] GeekNews Atom RSS, 전자신문 RSS(AI/보안) 실제 curl로 200 응답 및 필드 구조 확정(2026-08-27)
- [x] 전자신문 섹션 코드가 웹 검색 결과와 실제 다름을 발견 → `https://www.etnews.com/rss/` 페이지에서 직접 재확인해 정정
- [ ] `collect-tech-news` 구현 시 두 소스의 정규식 파싱 로직에서 CDATA 처리 공통 유틸(`extractCdata` 등)을 만들지, 소스별로 인라인 처리할지는 구현 단계에서 결정
- [ ] GeekNews `summary`(content HTML)를 그대로 저장할지 길이 제한을 둘지 결정 — tech_news.summary는 NOT NULL 텍스트 컬럼이라 길이 제약 자체는 없으나 UI 카드에서의 표시 길이를 고려해 구현 단계에서 판단
- [ ] ZDNet Korea / ITWorld Korea는 사용자가 실제 RSS 경로를 확인해 공유하면 후속 Task에서 소스 어댑터 추가 검토
