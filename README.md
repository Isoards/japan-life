# Japan Life Dashboard

일본 생활 준비/정착을 위한 개인 대시보드입니다.  
음악/콘서트 추적, 체크리스트, 가계부, 메모, 생활 도구를 한 곳에서 관리합니다.

상세 기술 문서: `ARCHITECTURE.md`

## 주요 기능

- 대시보드 요약 (`/`)
  - 체크리스트/예산/콘서트/환율/날씨/공휴일/쓰레기/택배
  - 즐겨찾기 아티스트 최신 발매
- 아티스트 (`/artists`)
  - 아티스트 검색 + 즐겨찾기 관리
- TOP100 (`/top100`)
  - Apple Music 일본 TOP100 차트
- 아티스트 상세 (`/artists/[slug]`)
  - 트랙/뉴스/티켓 링크/즐겨찾기
- 콘서트 (`/concerts`, `/concerts/[id]`, `/concerts/import`)
  - 일정 CRUD, 마일스톤 관리, 공지 URL/텍스트 import
- 체크리스트 (`/checklist`)
- 계산기 (`/calculator`)
  - 급여 실수령 근사 + 환율 + 구독비
- 가계부 (`/expenses`)
  - 예산 템플릿 + Google Sheets 연동 집계
- 메모 (`/notes`)
  - 노트/템플릿/퀴즈/링크
- 생활 도구
  - 가이드(`/guide`), 노래방(`/karaoke`), 쓰레기(`/garbage`), 택배(`/packages`)

## 기술 스택

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- SWR 2
- Zod 4
- Docker

## 로컬 개발

### 1) 설치

```bash
npm ci
```

### 2) 환경 변수 설정

`.env.local` 파일에 필요한 값을 설정합니다.

```bash
GOOGLE_SHEETS_API_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
```

### 3) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## npm 스크립트

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## 데이터 구조

### 정적 데이터 (`data/*.json`)

- `data/artists.json`
- `data/concerts.json`
- `data/guide-content.json`
- `data/checklist-defaults.json`

### 사용자 데이터 (`data/user/*.json`)

- `budget.json`
- `checklist.json`
- `favorites.json`
- `garbage.json`
- `links.json`
- `notes.json`
- `user-concerts.json`
- `packages.json` (필요 시 생성)

`data/user`는 런타임 저장소이며 API CRUD 결과가 이 파일들에 반영됩니다.

## Docker 실행

### docker-compose (기본)

```bash
docker compose up -d
```

기본 파일: `docker-compose.yml`

- 이미지: `isoards/japan-life:latest`
- 플랫폼: `linux/amd64`
- 포트: `3000:3000`
- 볼륨: `japan-life-data:/app/data/user`

### NAS 예시

`docker-compose.nas.yml` 참고

- 포트: `3090:3000`
- 호스트 경로 볼륨 마운트 사용

## GitHub Actions 자동 푸시

워크플로우: `.github/workflows/docker-publish.yml`

- 트리거: `main` 브랜치 push, 수동 실행
- 플랫폼: `linux/amd64`
- 태그:
  - `latest`
  - `MMDD` (KST 기준)

필수 GitHub Secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## 트러블슈팅

### NAS pull 시 `no matching manifest for linux/amd64`

원인: 레지스트리에 `amd64` 이미지가 없고 `arm64`만 올라간 경우.

해결:

```bash
docker buildx build --platform linux/amd64 -t isoards/japan-life:TAG --push .
```

또는 멀티아키:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t isoards/japan-life:TAG --push .
```

검증:

```bash
docker buildx imagetools inspect isoards/japan-life:TAG
```

## 참고

- 상세 아키텍처/API/데이터 명세: `ARCHITECTURE.md`
