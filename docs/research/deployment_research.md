# Task 016 사전 조사: Electron 데스크탑 앱 배포 플로우와 원리

이 문서는 Task 016(성능 최적화, 배포 및 모니터링)을 시작하기 전, Electron 기반 데스크탑 앱을 처음 배포하는 사용자를 위해 배포 플로우의 원리를 설명한다. `docs/task015-research.md`와 동일한 "결론 요약 → 항목별 상세" 포맷을 따른다.

## 결론 요약

- **Electron은 "웹앱을 감싼 것"이 아니라 두 개의 독립 프로세스(main/renderer)로 구성된 하나의 앱**이다. `apps/desktop/electron/main.ts`가 OS 창을 띄우는 Node.js 프로세스(main)이고, 그 창 안에서 실제 Next.js 페이지가 렌더링되는 부분(renderer)은 별도 프로세스다. 이 둘은 `preload.ts`를 통해서만 안전하게 통신한다.
- **electron-builder는 `next build`로 만들어진 정적 결과물 + `dist/electron`(컴파일된 main/preload 코드)을 하나의 설치 파일(Windows는 `.exe` NSIS 인스톨러)로 묶는 도구**다. 이 프로젝트는 이미 `apps/desktop/package.json`의 `build` 필드에 이 설정이 되어 있다(`files: ["dist/electron/**/*", "out/**/*"]`, `win.target: nsis`).
- **코드 서명은 "이 실행파일을 만든 게 정말 그 개발자가 맞다"는 것을 OS에 증명하는 절차**이며, Windows는 인증서 구매가 필요하고(연 수십~수백 달러) macOS는 Apple Developer 계정(연 $99)이 필수다. 이 프로젝트는 아직 인증서가 없으므로 `verifyUpdateCodeSignature: false`로 서명 검증을 우회하고 있다(`docs/task015-research.md`에 기존 근거 있음) — 이는 "임시 방편"이며 배포 규모가 커지면 서명 도입이 필요하다.
- **CI/CD 배포는 "GitHub에 태그를 push하면 GitHub Actions가 자동으로 빌드하고 GitHub Releases에 설치 파일을 올리는" 흐름**이다. `electron-builder --publish always` 한 줄이 이 게시(publish)까지 수행한다.
- **자동 업데이트(electron-updater)는 앱이 실행 중일 때 GitHub Releases의 최신 버전 메타데이터(`latest.yml`)를 주기적으로 확인해, 새 버전이 있으면 백그라운드로 다운로드한 뒤 사용자가 앱을 재시작할 때 설치하는 방식**이다. 별도 서버가 필요 없다.

---

## 1. Electron 빌드/패키징 원리

### 1.1 main process와 renderer process

Electron 앱은 하나의 프로세스가 아니라 최소 두 종류의 프로세스로 이루어진다.

- **Main process** (`apps/desktop/electron/main.ts`): Node.js 환경에서 실행되며, OS 윈도우 생성(`BrowserWindow`), 트레이 아이콘, 파일 시스템 접근, `node-schedule` 기반 알림 스케줄링, `autoUpdater` 등 "OS와 직접 상호작용하는" 모든 것을 담당한다. 앱당 딱 하나만 존재한다.
- **Renderer process**: `BrowserWindow`가 실제로 로드하는 웹 페이지(이 프로젝트에서는 `next build`로 생성된 Next.js 페이지)가 여기서 돌아간다. 브라우저 탭처럼 격리되어 있어 기본적으로 Node.js API에 직접 접근할 수 없다(보안).
- **Preload script** (`apps/desktop/electron/preload.ts`): main과 renderer 사이의 유일한 통로. `contextBridge`로 renderer에 안전하게 노출할 함수만 선택적으로 붙여준다. 왜 이런 구조인지는 "renderer가 임의의 웹 콘텐츠를 로드할 수도 있는데, 거기에 파일 시스템 전체를 열어주면 위험"하기 때문이다.

즉 배포 시 만들어지는 실행파일 안에는 (1) Next.js가 빌드한 정적 웹앱, (2) 그것을 창에 띄우는 Node.js 코드, (3) 둘을 안전하게 잇는 preload 코드, 이 세 가지가 함께 패키징된다.

### 1.2 electron-builder가 하는 일

`apps/desktop/package.json`의 스크립트를 보면:

```
"build": "next build && npm run build:electron",
"build:electron": "tsc -p electron/tsconfig.json --outDir dist/electron"
```

즉 배포용 빌드는 두 단계다.

1. `next build` → Next.js가 `out/`(정적 export) 또는 `.next/`에 렌더러용 결과물을 생성.
2. `tsc`로 `electron/*.ts`를 `dist/electron/*.js`로 컴파일 → main/preload 코드 준비.

이 두 결과물을 `package.json`의 `build.files` 설정(`["dist/electron/**/*", "out/**/*"]`)에 따라 electron-builder가 하나의 아카이브(ASAR)로 묶고, 여기에 Electron 바이너리 자체(실행 엔진)를 더해 OS별 설치 파일을 만든다.

- **ASAR**: 수만 개의 소스 파일을 압축 없이 하나의 tar 유사 아카이브 파일(`app.asar`)로 묶는 포맷. 파일 시스템 접근 오버헤드를 줄이고, 소스 코드를 폴더 형태로 노출하지 않는 효과가 있다(단, 암호화가 아니므로 "보안"이 아니라 "정리" 목적에 가깝다).
- **`win.target: nsis`**: Windows용으로 NSIS(Nullsoft Scriptable Install System) 기반 `.exe` 인스톨러를 생성한다는 설정. 사용자가 더블클릭하면 프로그램 파일 폴더에 설치되고 시작 메뉴 바로가기가 생기는, 흔히 보는 Windows 설치 마법사다.

---

## 2. 코드 서명(Code Signing) 원리와 비용

### 2.1 왜 필요한가

서명되지 않은 실행파일을 배포하면 Windows는 SmartScreen 경고("알 수 없는 게시자")를, macOS는 Gatekeeper 차단("확인되지 않은 개발자")을 띄운다. 코드 서명은 이 경고를 없애고, 더 중요하게는 **electron-updater의 자동 업데이트가 "다운로드한 새 버전이 원래 개발자가 만든 게 맞는지" 검증하는 데 사용**된다.

### 2.2 플랫폼별 차이 (이미 `docs/task015-research.md`에서 조사된 내용 재확인)

- **Windows (Authenticode)**: 서명용 인증서(EV 또는 OV 코드 서명 인증서, 연 단위 갱신, 대략 연 100~400달러 수준의 제3자 CA 발급 비용)를 구매해 `.exe`에 서명한다. **서명이 없어도 설치 자체는 가능**하지만, `electron-builder`의 `WindowsConfiguration.verifyUpdateCodeSignature`(기본 `true`)가 켜져 있으면 electron-updater가 다운로드한 업데이트 파일의 서명 주체를 검증하려다 실패해 업데이트가 거부된다. 이 프로젝트는 아직 인증서가 없으므로 `verifyUpdateCodeSignature: false`로 이 검증을 꺼서 서명 없이도 업데이트가 동작하게 해둔 상태다.
- **macOS (Developer ID + 공증/Notarization)**: Apple Developer Program 가입(연 $99)이 필수이며, 서명 후 Apple 서버에 앱을 제출해 "공증(notarization)"을 받아야 한다. **macOS는 서명이 없으면 자동 업데이트 자체가 동작하지 않는다**(공식 문서에 명시). 이 프로젝트는 현재 macOS 타깃/서명 설정이 없으므로, macOS 배포가 필요해지는 시점에 별도 작업이 필요하다.

### 2.3 지금 이 프로젝트의 선택

`build.win.verifyUpdateCodeSignature: false`로 서명 검증을 우회하는 것은 "무료로 빠르게 배포를 시작하기 위한 임시 조치"다. 트레이드오프는 다음과 같다.

- 장점: 인증서 구매 없이 즉시 배포/자동 업데이트 가능.
- 단점: Windows SmartScreen 경고가 계속 뜨고(사용자가 "추가 정보 → 실행"을 눌러야 함), macOS는 애초에 자동 업데이트가 불가능하다.

Task 016에서는 이 트레이드오프를 바꾸지 않고(비밀값/인증서를 이 환경에서 발급할 수 없으므로) 문서화만 하며, 실제 인증서 구매·등록은 사용자의 몫으로 남긴다.

---

## 3. CI/CD 배포 파이프라인 흐름

배포를 "사람이 로컬에서 빌드해서 수동 업로드"가 아니라 자동화하면 다음과 같은 흐름이 된다(GitHub Actions 기준).

1. **트리거**: 개발자가 버전 태그(예: `v1.2.0`)를 push하면 워크플로가 시작된다.
2. **체크아웃 & 의존성 설치**: `actions/checkout` → `actions/setup-node` → `npm ci`(package-lock.json 기준 정확한 버전 설치).
3. **품질 게이트**: `npm run lint`, `npm run build`(Next.js + tsc), (도입 예정) `npm test`. 여기서 실패하면 배포 단계로 넘어가지 않는다 — "깨진 빌드가 사용자에게 배포되는 것"을 막는 안전장치.
4. **패키징 & 게시**: `npx electron-builder --publish always` 한 명령이 (a) Next.js/electron 빌드 산출물을 인스톨러로 패키징하고, (b) GitHub Releases에 새 릴리스를 만들어 인스톨러 파일과 `latest.yml`(버전 메타데이터)을 업로드한다. 인증이 필요하므로 `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` 환경변수를 넘긴다.
   - electron-builder v27부터는 "암시적 게시"가 기본 비활성화되어 있어 `--publish always`를 명시하지 않으면 로컬 빌드만 하고 GitHub에는 아무것도 올리지 않는다. (`docs/task015-research.md`에서 이미 확인된 사실)
5. **사용자 단말에 반영**: 이미 앱을 설치해 쓰고 있는 사용자는 아래 4장에서 설명하는 electron-updater가 이 릴리스를 자동으로 감지한다.

이 프로젝트는 아직 `.github/workflows/`가 없으므로, Task 016의 후속 서브태스크에서 `ci.yml`(lint/build/test)과 `release.yml`(패키징/게시)을 새로 만든다.

---

## 4. 자동 업데이트(electron-updater) 동작 원리

`apps/desktop/electron/main.ts`에는 이미 `autoUpdater`가 연결되어 있다(`checkForUpdatesAndNotify`, `update-available`/`update-downloaded`/`error` 이벤트 핸들러).

동작 순서는 다음과 같다.

1. 앱이 실행되면 main process가 GitHub Releases의 `latest.yml`(직전 배포 단계에서 자동 업로드된 파일)을 조회해 현재 설치된 버전과 비교한다.
2. 더 높은 버전이 있으면 `update-available` 이벤트가 발생하고, 백그라운드에서 새 인스톨러 파일을 다운로드한다(사용자 조작 불필요, 앱 사용을 막지 않음).
3. 다운로드가 끝나면 `update-downloaded` 이벤트가 발생한다. 이 시점부터 실제 설치는 **앱이 재시작될 때** 적용된다 — 즉시 강제 종료하지 않는 것이 일반적인 UX 관례다(이 프로젝트도 이벤트만 받고 재시작 여부는 사용자 흐름에 맡기는 구조).
4. 앞서 2장에서 설명했듯, Windows는 `verifyUpdateCodeSignature: false`이므로 서명 검증 없이 이 과정이 진행되고, macOS는 서명이 없으면 이 흐름 자체가 시작되지 않는다.

별도의 업데이트 서버를 직접 운영할 필요가 없다는 것이 이 방식(GitHub Releases를 배포 채널로 사용)의 핵심 이점이다 — GitHub이 파일 호스팅과 버전 메타데이터 제공을 모두 대신해준다.

---

## 참고 자료

- electron-builder 공식 문서(Publishing, ASAR, Windows/NSIS 설정)
- electron-updater 공식 문서(Auto Update, 코드 서명 요구사항)
- `docs/task015-research.md` (Task 015에서 조사된 electron-updater 서명 제약의 최초 근거)
