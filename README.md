# Japan Life Dashboard

일본 생활 준비/정착을 위한 개인 대시보드입니다.  
음악/콘서트 추적, 체크리스트, 가계부, 메모, 생활 도구를 한 곳에서 관리합니다.

상세 기술 문서: `ARCHITECTURE.md`

## 주요 기능

- 대시보드 요약 (`/`)
  - 체크리스트/예산/콘서트/환율/날씨/공휴일/쓰레기/택배
  - D-day 아래에서 요리 추천과 가계부/Pantry 영수증 등록으로 바로 이동
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
  - Google Sheets의 5개 대분류로 정리한 월 165,000엔 예산 플래너 + 연동 집계 + 정기 지출 탐지
  - 일본 영수증 OCR 검토 후 분류가이드 기준으로 카테고리별 Google Sheets 지출 추가
- 메모 (`/notes`)
  - 노트/템플릿/퀴즈/링크
- 생활 도구
  - 노래방(`/karaoke`), 쓰레기(`/garbage`), 택배(`/packages`)
- 요리 (`/cooking`)
  - 체크만 하면 보관 위치를 자동 분류하는 Pantry와 신선식품 권장 사용일 카운트다운
  - 임박 재료와 대체재를 반영한 보유 재료 기반 요리 추천
  - 점심·저녁 주간 식단과 식단 기반 부족 재료 장보기 목록
  - 한식·일식·중식·양식 탐색과 일본 장보기 명칭
  - 재료 하나로 새롭게 가능한 요리를 계산하는 Unlock 장보기 추천
  - 날짜·참고 영상/레시피·메모가 포함된 반복 조리 기록 및 모아보기
  - 일본 마트 중심 식재료 142개와 자취 요리 117개 제공
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
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_WRITE_PROVIDER=apps-script
GOOGLE_SHEETS_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
GOOGLE_SHEETS_APPS_SCRIPT_SECRET=your_script_property_secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
RECEIPT_OCR_PROVIDER=google-cloud-vision
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_key
GOOGLE_CLOUD_TRANSLATION_API_KEY=your_translation_key_optional
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
- `cooking-meal-plan.json` (주간 식단 저장 시 생성)

`data/user`는 런타임 저장소이며 API CRUD 결과가 이 파일들에 반영됩니다.

## 영수증 OCR 설정

`/cooking/receipt`와 `/expenses/receipt`는 공용 Google Cloud Vision `DOCUMENT_TEXT_DETECTION` 공급자를 서버에서 호출합니다. Google Cloud 프로젝트에서 Vision API를 활성화하고 `GOOGLE_CLOUD_VISION_API_KEY`를 설정하세요. `RECEIPT_OCR_PROVIDER`의 현재 지원값은 `google-cloud-vision`이며 생략해도 이 값이 기본입니다. 키는 브라우저로 전달되지 않습니다.

Cooking 처리 흐름은 `사진 업로드 → OCR → 결정적 품목 분류/Ingredient alias 매칭 → 사용자 검토 → Pantry 확정`입니다. `receiptAliasesJa`에 영수증 축약 표기를 추가하면 모델이나 DB 변경 없이 매칭 사전을 확장할 수 있습니다. 사진과 전체 OCR 결과는 저장하거나 서버 로그에 남기지 않으며, 합계·세금·결제·포인트 행은 분석에서 제외합니다.

Cooking Pantry 가져오기는 수량·가격, 바코드, 이미지 보관, 새 Ingredient 자동 생성을 지원하지 않습니다. 신선식품의 권장 사용일은 제품 표기 대신 등록일과 보수적인 기본 냉장 보관일로 계산하므로 포장에 적힌 날짜가 우선입니다. Expenses 가져오기는 품목 행 끝의 가격과 영수증 합계를 추출하지만 할인·세금·별도 가격 행을 완벽하게 복원하지는 않습니다. 흐리거나 구겨진 사진, 손글씨, 마트 고유의 지나친 축약 표기는 두 화면 모두 사용자 검토가 필요할 수 있습니다.

### 영수증 가계부 쓰기 설정

Expenses 영수증 등록에는 읽기용 API Key와 Sheets 쓰기 방식 하나가 필요합니다. 서비스 계정 방식을 사용한다면 서비스 계정 이메일을 대상 스프레드시트의 편집자로 공유하고 `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`를 설정하세요. `GOOGLE_SHEETS_ID`는 생략하면 코드의 개인용 기본 시트 ID를 사용합니다.

서비스 계정 JSON 키를 사용할 수 없는 환경에서는 `GOOGLE_SHEETS_WRITE_PROVIDER=apps-script`로 설정할 수 있습니다. `GOOGLE_SHEETS_APPS_SCRIPT_URL`에는 배포된 Web App의 `/exec` URL을, `GOOGLE_SHEETS_APPS_SCRIPT_SECRET`에는 Apps Script 프로젝트 속성의 `API_SECRET`과 동일한 값을 넣습니다. Apps Script 방식이 설정되면 서비스 계정 이메일과 private key는 필요하지 않습니다.

`내역` 시트 헤더는 현재 파일의 다음 A:I 순서를 그대로 사용합니다.

```text
ID | 날짜 | 구분 | 카테고리 | 내용 | 금액 | 결제수단 | 메모 | 정기
```

`/expenses/receipt`는 `설정!A2:D47`의 실제 `지출` 카테고리·결제수단과 `분류가이드!A11:D21`을 매번 읽습니다. 품목과 품목별 가격을 추출한 뒤 가이드에 맞춰 작성한 결정적 키워드 규칙으로 `장보기`, `술/유흥`, `생활용품` 등에 묶습니다. 가이드 행은 검토 화면에도 표시되며, 각 묶음의 카테고리·내용·금액을 수정할 수 있습니다. OCR이 놓친 항목은 `카테고리 직접 추가`로 새 내역을 만들거나 잘못 인식한 묶음을 삭제할 수 있습니다. 분류별 금액 합계가 영수증 총액과 정확히 같아야 확정할 수 있고, 확정 시 카테고리마다 별도 내역 행을 추가합니다. 현재 설정에 존재하는 값만 저장하며 기본 결제수단은 `페이페이`입니다. 같은 날짜·가게의 여러 행을 합친 금액이 같으면 중복 가능성을 경고하고, I열 `정기`는 `FALSE`로 기록합니다.

품목별 가격을 일부 읽지 못한 경우 남은 금액을 해당 품목들에 임시 배분하고 검토 경고를 표시합니다. OCR 결과만으로 할인·세금·복합 할인 배분을 완벽히 복원할 수 없으므로, 등록 전에 카테고리별 금액을 영수증과 비교해야 합니다.

가계부 내용은 기존 내역 스타일에 맞춰 `토리센 (김밥, 닭꼬치)`처럼 간단한 한국어로 정리합니다. 자주 쓰는 마트·식품·생활용품은 정적 사전을 먼저 사용하고, 사전에 없는 일본어는 Google Cloud Translation Basic API로 번역합니다. `GOOGLE_CLOUD_TRANSLATION_API_KEY`를 생략하면 Vision 키를 함께 사용하며, 해당 Google Cloud 프로젝트에서 Cloud Translation API도 활성화되어 있어야 합니다. 번역이 불확실할 때 수정할 수 있도록 검토 화면에 일본어 OCR 원문을 함께 표시합니다.

API 키와 Apps Script 공유 비밀은 서버 환경 변수에만 두고 저장소에 커밋하지 않습니다. Google Cloud 키에는 가능한 API 제한을 적용하고, 로그·화면 공유·메신저 등에 노출된 키는 폐기 후 재발급하세요.

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
