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
  - 예산 템플릿 + Google Sheets 연동 집계 + 정기 지출 탐지
- 메모 (`/notes`)
  - 노트/템플릿/퀴즈/링크
- 생활 도구
  - 노래방(`/karaoke`), 쓰레기(`/garbage`), 택배(`/packages`)
- 요리 (`/cooking`)
  - Pantry 식재료 등록, 보유 재료 기반 요리 추천
  - 한식·일식·중식·양식 탐색과 일본 장보기 명칭
  - 재료 하나로 새롭게 가능한 요리를 계산하는 Unlock 장보기 추천
  - 날짜·참고 영상/레시피·메모가 포함된 반복 조리 기록 및 모아보기
  - 양념·소스 빠른 탐색, 일본 마트 중심 식재료 142개와 자취 요리 117개 제공
  - 일본 슈퍼 영수증 OCR, 한국어 식재료 확인·수정 후 Pantry 일괄 추가

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
RECEIPT_OCR_PROVIDER=google-cloud-vision
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_key
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
- `data/checklist-defaults.json`
- `data/cooking-ingredients.json`
- `data/cooking-dishes.json`
- `data/cooking-relations.json`
- `data/cooking-recipe-sources.json`

### 사용자 데이터 (`data/user/*.json`)

- `budget.json`
- `checklist.json`
- `favorites.json`
- `garbage.json`
- `links.json`
- `notes.json`
- `user-concerts.json`
- `packages.json` (필요 시 생성)
- `cooking-pantry.json` (Pantry 변경 시 생성)
- `cooking-cooked.json` (조리 이력 저장 시 생성)

`data/user`는 런타임 저장소이며 API CRUD 결과가 이 파일들에 반영됩니다.

## 영수증 OCR 설정

`/cooking/receipt`는 Google Cloud Vision의 `DOCUMENT_TEXT_DETECTION`을 서버에서 호출합니다. Google Cloud 프로젝트에서 Vision API를 활성화하고 `GOOGLE_CLOUD_VISION_API_KEY`를 설정하세요. `RECEIPT_OCR_PROVIDER`의 현재 지원값은 `google-cloud-vision`이며 생략해도 이 값이 기본입니다. 키는 브라우저로 전달되지 않습니다.

처리 흐름은 `사진 업로드 → OCR → 결정적 품목 분류/Ingredient alias 매칭 → 사용자 검토 → Pantry 확정`입니다. `receiptAliasesJa`에 영수증 축약 표기를 추가하면 모델이나 DB 변경 없이 매칭 사전을 확장할 수 있습니다. 사진과 전체 OCR 결과는 저장하거나 서버 로그에 남기지 않으며, 합계·세금·결제·포인트 행은 분석에서 제외합니다.

현재 영수증 기능은 수량·가격·유통기한 추정, 바코드, 이미지 보관, 새 Ingredient 자동 생성을 지원하지 않습니다. 흐리거나 구겨진 사진, 손글씨, 마트 고유의 지나친 축약 표기는 검토 화면에서 직접 기존 Ingredient를 선택해야 할 수 있습니다.

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
