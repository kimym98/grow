# Electron 데스크탑 앱 배포 가이드

이 문서는 `apps/desktop`(AI 취업 비서 Electron 앱)을 실제로 빌드하고 배포하는 **실행 절차**를 정리한다. 왜 이런 구조인지(코드 서명, ASAR, electron-updater 원리 등)는 `docs/deployment_research.md`를 참고하고, 이 문서는 "지금 무엇을 실행해야 하는가"에 집중한다.

## 결론 요약

- 로컬에서 설치 파일만 뽑아보고 싶다면 `apps/desktop`에서 `npm run build` → `npx electron-builder --win` 두 줄이면 된다.
- 실제 사용자에게 배포(릴리스)하려면 **버전을 올리고 `v`로 시작하는 git 태그를 push**하면, `.github/workflows/release.yml`이 알아서 빌드하고 GitHub Releases에 올린다. 사람이 직접 빌드/업로드할 필요가 없다.
- 이미 앱을 설치한 사용자는 `electron-updater`가 새 릴리스를 자동 감지해 백그라운드로 다운로드하고, 앱 재시작 시 적용한다 — 별도 업데이트 서버가 필요 없다.
- 아직 코드 서명 인증서가 없어서 Windows SmartScreen 경고가 뜨는 것은 정상이며(`verifyUpdateCodeSignature: false`로 서명 없이도 자동 업데이트는 동작하게 해둔 상태), macOS는 서명 없이는 배포/자동 업데이트 자체가 불가능하므로 현재 이 프로젝트는 Windows만 지원한다.

---

## 1. 로컬에서 설치 파일(.exe) 만들기

배포 없이 "제대로 패키징되는지"만 확인하고 싶을 때 사용한다.

```bash
cd apps/desktop
npm run build              # next build(정적 export, out/) + electron 컴파일(dist/electron)
npx electron-builder --win # NSIS 인스톨러 생성
```

결과물은 `apps/desktop/dist/`에 생긴다.

| 파일 | 용도 |
| --- | --- |
| `AI 취업 비서 Setup 0.1.0.exe` | 사용자에게 배포할 실제 설치 파일 |
| `AI 취업 비서 Setup 0.1.0.exe.blockmap` | electron-updater가 증분 업데이트(변경분만 다운로드) 계산에 쓰는 파일 |
| `latest.yml` | electron-updater가 "새 버전이 있는지" 판단할 때 읽는 버전 메타데이터 |
| `win-unpacked/` | 압축 전 원본 폴더. 배포용이 아니라 디버깅용(설치 없이 `AI 취업 비서.exe`를 바로 실행해볼 수 있음) |

### 로컬 패키징이 실패한다면 (Windows 전용 이슈)

`winCodeSign` 압축 해제 단계에서 `Cannot create symbolic link`(권한 오류)가 나면, Windows **개발자 모드**가 꺼져 있거나 켠 뒤 재로그인을 안 한 상태다.

1. 설정 → 개인 정보 및 보안 → 개발자용(또는 "For developers") → 개발자 모드 켜기
2. **로그아웃 후 다시 로그인**(재부팅도 가능) — 레지스트리 값만 켜고 재로그인을 안 하면 현재 세션 권한에 반영되지 않아 여전히 실패한다
3. `apps/desktop/dist` 폴더를 지우고 `npm run build:electron` → `npx electron-builder --win` 재시도

`CSC_IDENTITY_AUTO_DISCOVERY=false` 환경변수는 이 문제의 해결책이 **아니다**(Windows 타겟 빌드에서도 electron-builder가 내부적으로 `winCodeSign` 패키지를 항상 받으려 시도하기 때문에, 코드서명을 꺼도 압축 해제 자체는 계속 시도된다). 개발자 모드 활성화가 유일한 해결책이다.

---

## 2. 실제 릴리스(배포)하는 방법

### 사전 준비 (최초 1회만)

GitHub 저장소 **Settings → Secrets and variables → Actions**에 다음 값이 등록되어 있어야 `release.yml`의 빌드 단계가 Supabase에 정상 연결된다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SENTRY_DSN` (선택 — 없으면 Sentry는 자동으로 no-op 처리되어 빌드/실행에 영향 없음)

`GH_TOKEN`(GitHub Releases 게시 권한)은 워크플로 실행 시 GitHub Actions가 자동으로 제공하는 `secrets.GITHUB_TOKEN`을 그대로 쓰므로 별도 설정이 필요 없다.

### 릴리스 절차 (배포할 때마다)

```bash
# 1) 버전 올리기
#    apps/desktop/package.json의 "version" 필드를 수정 (예: 0.1.0 -> 0.1.1)
#    커밋 후 main에 push

# 2) v로 시작하는 태그를 붙여서 push
git tag v0.1.1
git push origin v0.1.1
```

태그가 push되면 GitHub Actions(`release.yml`)가 자동으로:

1. Windows 러너에서 `npm run build -w apps/desktop` 실행 (Next.js 정적 export + electron 컴파일)
2. `npx electron-builder --publish always` 실행 → 인스톨러(.exe)와 `latest.yml`을 **GitHub Releases**에 새 릴리스로 업로드
3. 이미 설치되어 있는 사용자의 앱이 다음 실행 시(또는 실행 중이라면 주기적으로) `electron-updater`로 새 릴리스를 감지 → 백그라운드 다운로드 → 앱 재시작 시 자동 적용

**참고**: electron-builder v27부터는 `--publish always`를 명시적으로 넣지 않으면 로컬 빌드만 하고 GitHub에는 아무것도 올리지 않는다. `release.yml`에는 이미 반영되어 있으니 워크플로 파일을 건드리지 않는 한 신경 쓸 필요 없다.

### 릴리스 확인

- GitHub 저장소의 **Releases** 탭에서 새 버전과 첨부된 `.exe`/`latest.yml`을 확인한다.
- Actions 탭의 `Release` 워크플로 실행 로그에서 빌드/게시 성공 여부를 확인한다.

---

## 3. 코드 서명 관련 현재 상태와 향후 조치

- Windows: 서명 인증서가 없어 `verifyUpdateCodeSignature: false`로 서명 검증을 꺼둔 상태. 사용자가 설치 파일을 실행하면 SmartScreen 경고("Windows에서 PC를 보호했습니다")가 뜨는데, "추가 정보 → 실행"으로 넘길 수 있다. 정식 서명 인증서를 구매하면 `CSC_LINK`/`CSC_KEY_PASSWORD`를 GitHub Secrets에 추가하는 것만으로 electron-builder가 자동으로 서명을 적용한다(코드 변경 불필요).
- macOS: 서명/공증(Apple Developer Program, 연 $99)이 없으면 자동 업데이트 자체가 불가능하므로, 이 프로젝트는 현재 macOS 빌드 타겟을 지원하지 않는다. macOS 배포가 필요해지면 별도 작업(Apple Developer 가입, `mac` 타겟 설정, 공증 파이프라인 추가)이 선행되어야 한다.

## 참고 자료

- `docs/deployment_research.md` — 배포 원리(프로세스 구조, ASAR, 코드 서명, CI/CD 흐름, electron-updater 동작)에 대한 배경 설명
- `.github/workflows/release.yml` — 실제 릴리스 워크플로 정의
- `apps/desktop/package.json`의 `build` 필드 — electron-builder 설정(appId, files, win.target, publish 등)
