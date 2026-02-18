# Japan Life Dashboard - Technical Specification

## 1) Project Overview

Japan Life Dashboard는 일본 생활 준비/정착을 위한 개인용 웹 애플리케이션이다.  
현재 버전은 다음 영역을 통합 제공한다.

- 대시보드 요약 (체크리스트, 예산, 콘서트, 환율, 날씨, 공휴일, 쓰레기, 택배, 최신 발매)
- 아티스트 검색/즐겨찾기 및 아티스트 상세 정보
- 일본 TOP100 차트
- 콘서트 일정/마일스톤 관리 + 공지 텍스트/URL import
- 체크리스트 관리
- 급여/환율 계산 + 구독비 관리
- 가계부(예산 템플릿 + Google Sheets 연동 실적)
- 메모(노트/템플릿/퀴즈/링크)
- 생활 가이드, 노래방 검색, 쓰레기 수거, 택배 추적
- 오프라인 안내(PWA fallback)

## 2) Technology Stack

- Framework: Next.js 16 (App Router)
- UI: React 19, Tailwind CSS 4
- Language: TypeScript 5
- Data Fetching: SWR 2
- Validation: Zod 4
- Charts: Recharts
- Calendar: react-calendar
- Storage: File-based JSON (`data/user/*.json`)
- Deployment: Docker (multi-stage build)

## 3) Runtime Architecture

### 3.1 Frontend

- 모든 페이지는 App Router 기반 (`app/*/page.tsx`)으로 구성
- 공통 레이아웃:
  - `app/layout.tsx`
  - 상단 네비게이션(`components/Navbar.tsx`)
  - 토스트 시스템(`components/Toast.tsx`)
  - 서비스워커 등록(`components/ServiceWorkerRegistration.tsx`)

### 3.2 Backend (Route Handlers)

- 서버 API는 `app/api/**/route.ts`에 구현
- 클라이언트는 SWR 훅(`lib/hooks/use-api.ts`)으로 API 호출
- 입력 검증은 Zod 스키마(`lib/validations.ts`) 사용

### 3.3 Persistence

- 사용자 데이터는 JSON 파일 저장 (`lib/store.ts`)
- 저장 방식:
  - 읽기: fallback 기본값 반환
  - 쓰기: 백업 생성 후 원자적 저장(tmp -> rename/copy fallback)
- 버전/마이그레이션:
  - `budget: v3`
  - `notes: v2`
  - `user-concerts: v2`
  - `checklist, favorites, links, garbage, packages: v1`

## 4) Route Specification (Pages)

### 4.1 Main Pages

- `/` : Dashboard
- `/artists` : 아티스트 검색 + 즐겨찾기 관리
- `/top100` : Apple Music 일본 TOP100
- `/artists/[slug]` : 아티스트 상세 (정적 데이터 + iTunes 보강)

### 4.2 Domain Pages

- `/concerts` : 콘서트 목록/편집
- `/concerts/[id]` : 콘서트 상세
- `/concerts/import` : 공지 URL/텍스트 import
- `/checklist` : 체크리스트 관리
- `/calculator` : 급여/환율 계산
- `/expenses` : 예산/지출 대시보드
- `/notes` : 노트/템플릿/퀴즈/링크
- `/guide` : 생활 가이드
- `/karaoke` : 노래방 검색
- `/garbage` : 쓰레기 수거 요일 설정
- `/packages` : 택배 추적
- `/offline` : 오프라인 fallback 안내

## 5) Feature Specification

### 5.1 Dashboard (`app/DashboardClient.tsx`)

- 집계 카드:
  - 체크리스트 진행률
  - 월 예산 잔액 (Sheets 연동)
  - 콘서트 요약
  - 실시간 환율
- 생활 위젯:
  - 도치기현 날씨(Open-Meteo)
  - 공휴일
  - 쓰레기 오늘/내일
  - 택배 진행 현황
- 이벤트:
  - D-day 카운트다운
  - 콘서트 마일스톤 임박 항목
  - 즐겨찾기 아티스트 최신 발매 목록

### 5.2 Artists (`/artists`)

- 검색어 debounce 후 `/api/search` 호출
- 검색 결과에서 즐겨찾기 토글
- 즐겨찾기 카드 목록 제공
- `/top100`으로 상호 이동 링크 제공

### 5.3 TOP100 (`/top100`)

- Apple Music JP most-played 100 곡 표시
- 상단 TOP3 하이라이트 + 나머지 리스트
- 곡명/아티스트명 클라이언트 검색 필터

### 5.4 Artist Detail (`/artists/[slug]`)

- 정적 아티스트(`data/artists.json`) 우선 조회
- slug가 iTunes artistId면 iTunes 정보로 대체 조회
- 트랙, 이미지, 관련 뉴스, 티켓 검색 링크, 즐겨찾기 기능 제공

### 5.5 Concerts

- CRUD: 일정/메모/상태/티켓/출처/마일스톤/공연시각
- import:
  - X(Twitter) oEmbed 우선
  - 실패 시 raw HTML 텍스트 추출
  - `lib/concertParser.ts`로 초안 자동 파싱

### 5.6 Expenses

- 예산 템플릿 저장(`budget.json`)
- Google Sheets 내역 기반 월별 집계(`/api/sheets`)
- 최근 N개월 추세(`/api/sheets/trend`)
- 싱킹펀드(목표저축) 관리

### 5.7 Calculator

- 일본 급여 실수령 근사 계산
- 환율 변환 및 환율 갱신
- 구독비 목록 로컬스토리지 관리

### 5.8 Notes

- 메모 CRUD
- 카테고리 필터/검색
- 템플릿 탭
- 퀴즈(SRS 기반)
- 링크 CRUD

### 5.9 Garbage / Packages / Karaoke / Guide

- Garbage: 요일별 수거 스케줄 편집
- Packages: 운송장 상태/메모 관리
- Karaoke: TJ/금영 통합 검색
- Guide: 생활 가이드 섹션 렌더링

## 6) API Specification

### 6.1 User Data APIs (JSON Store)

- `GET, POST /api/budget`
- `GET, POST, PATCH, DELETE /api/checklist`
- `GET, POST, PATCH, DELETE /api/notes`
- `GET, POST, PATCH, DELETE /api/links`
- `GET, POST, DELETE /api/favorites`
- `GET, POST, PATCH, DELETE /api/user-concerts`
- `POST /api/user-concerts/import`
- `GET, POST /api/garbage`
- `GET, POST, PATCH, DELETE /api/packages`

### 6.2 External Aggregation APIs

- `GET /api/search`
  - Query: `q` (artist name, min length 1; client에서 2 이상 사용)
  - Source: iTunes Search
- `GET /api/releases`
  - Query: `ids`, `limit`
  - Source: iTunes track lookup
- `GET /api/top-artists`
  - Source: Apple Music RSS (JP Top 100)
- `GET /api/news`
  - Query: `artist`, `limit`
  - Source: Google News RSS + 번역(googleapis translate endpoint)
- `GET /api/karaoke`
  - Query: `q`, `type(song|singer)`
  - Source: manana.kr (TJ/금영)
- `GET /api/weather`
  - Source: Open-Meteo (Tochigi 좌표 고정)
- `GET /api/exchange-rates`
  - Source: Wise 실시간 우선, open.er-api.com 폴백
- `GET /api/sheets`
  - Query: `month=YYYY-MM`
  - Source: Google Sheets
- `GET /api/sheets/trend`
  - Query: `months` (1~24 clamp)
  - Source: Google Sheets

### 6.3 API Request/Response Examples

- `POST /api/notes`
  - Request:

```json
{
  "category": "business",
  "japanese": "要件定義",
  "reading": "ようけんていぎ",
  "korean": "요구사항 정의",
  "memo": "회의 준비"
}
```

- Success Response (`200`): `Note[]` 전체 목록 반환
- Error Response (`400`):

```json
{ "error": "category: Invalid enum value..." }
```

- `PATCH /api/notes`
  - Request:

```json
{
  "id": "note-1730000000000-ab123",
  "category": "sw",
  "japanese": "回帰試験",
  "korean": "회귀 테스트"
}
```

- Error (`404`):

```json
{ "error": "항목을 찾을 수 없습니다" }
```

- `POST /api/checklist`
  - Request:

```json
{
  "category": "post-arrival",
  "title": "주민등록",
  "priority": "high"
}
```

- Response: 생성된 항목이 포함된 `ChecklistItem[]`

- `PATCH /api/checklist`
  - Request:

```json
{
  "id": "custom-1730000000000-ab123",
  "checked": true
}
```

- Response: 수정 후 `ChecklistItem[]`

- `POST /api/favorites`
  - Request:

```json
{
  "itunesId": 123456789,
  "name": "Ado",
  "imageUrl": "https://...",
  "genres": ["J-Pop"]
}
```

- Response: 중복 제거가 적용된 전체 즐겨찾기 배열

- `GET /api/search?q=ado`
  - Response:

```json
[
  {
    "itunesId": 123456789,
    "name": "Ado",
    "imageUrl": "https://...",
    "genres": ["J-Pop"]
  }
]
```

- `GET /api/releases?ids=123,456&limit=10`
  - Response: 최신순 `ITunesTrack[]` (live 음원 필터링 적용)

- `POST /api/user-concerts`
  - Request:

```json
{
  "title": "Ado WORLD TOUR 2026",
  "artist": "Ado",
  "date": "2026-05-20",
  "venue": "Tokyo Dome",
  "status": "planned",
  "showTimes": [],
  "milestones": [],
  "sources": []
}
```

- Response: 생성된 `UserConcert` 단건

- `PATCH /api/user-concerts`
  - Request:

```json
{
  "id": "uc-1730000000000-ab123",
  "status": "confirmed"
}
```

- Error (`404`):

```json
{ "error": "콘서트를 찾을 수 없습니다" }
```

- `POST /api/user-concerts/import`
  - Request:

```json
{ "url": "https://x.com/.../status/..." }
```

- Response:

```json
{
  "draft": {
    "title": "parsed title",
    "date": "2026-04-01"
  },
  "source": {
    "type": "tweet",
    "url": "https://x.com/.../status/..."
  }
}
```

- `GET /api/packages`
  - Response: `PackageEntry[]` (없으면 `[]`)

- `PATCH /api/packages`
  - Request:

```json
{
  "id": "pkg-1730000000000-ab123",
  "status": "delivered"
}
```

- Response: 수정 후 `PackageEntry[]` (`deliveredAt` 자동 기록)

## 7) Data Model

### 7.1 주요 타입 (`lib/types.ts`)

- `ChecklistItem`
- `BudgetData`, `BudgetCategory`, `SinkingFund`
- `Note`, `QuickLink`
- `PackageEntry`
- `WeatherData`
- `MonthlyTrend`
- `Artist`, `Concert`, `ITunesTrack`
- `KaraokeSong`

### 7.2 User Data Files (`data/user`)

- `budget.json`
- `checklist.json`
- `favorites.json`
- `garbage.json`
- `links.json`
- `notes.json`
- `user-concerts.json`
- `packages.json` (필요 시 생성)

### 7.3 Static Data Files (`data`)

- `artists.json`
- `concerts.json`
- `guide-content.json`
- `checklist-defaults.json`

## 8) Caching Strategy

- SWR 클라이언트 캐시:
  - `revalidateOnFocus: false` 기본 적용
  - 도메인별 dedupingInterval 적용 (환율/날씨 등)
- 서버 인메모리 캐시:
  - 환율 API: 10분
  - 날씨 API: 15분
  - TOP100 API: 1시간
- `fetch(..., { next: { revalidate } })`로 외부 API 재검증 간격 설정

## 9) Validation & Error Handling

- API 입력값 검증: Zod (`lib/validations.ts`)
- 실패 처리 원칙:
  - 유효성 실패: 400
  - 외부 API 실패: 5xx 또는 fallback 응답
  - 일부 API는 이전 캐시값/기본값으로 graceful fallback

## 10) Environment Variables

- `DATA_DIR`
  - 기본값: `data/user`
  - JSON 스토어 저장 경로 override
- `GOOGLE_SHEETS_API_KEY`
  - `/api/sheets`, `/api/sheets/trend` 필수

## 11) Build & Operations Notes

- 네트워크 제한 환경에서 외부 API 호출이 필요한 페이지는 SSG/프리렌더 단계에서 실패할 수 있음
  - 예: `itunes.apple.com` DNS 접근 불가 시 `/artists/[slug]` prerender 오류
- 오프라인 대응:
  - `public/sw.js`, `public/manifest.json`
  - `/offline` fallback 페이지 제공

## 12) Current Navigation Structure

- `/artists` 아티스트
- `/top100` TOP100
- `/karaoke` 노래방
- `/concerts` 콘서트
- `/checklist` 체크리스트
- `/calculator` 계산기
- `/guide` 생활 가이드
- `/expenses` 가계부
- `/notes` 메모
- `/garbage` 쓰레기
- `/packages` 택배
