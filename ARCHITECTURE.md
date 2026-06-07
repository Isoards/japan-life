# Japan Life Dashboard Architecture

## 1. Overview

Japan Life Dashboard는 일본 생활/정착을 관리하는 개인용 Next.js 앱이다. 현재 앱은 음악·콘서트, 체크리스트, 급여/환율 계산, Google Sheets 기반 가계부, 메모/퀴즈, 생활 도구를 한 화면 흐름으로 묶는다.

### Current Domains

- **Dashboard**: 체크리스트, 예산 잔액, 콘서트, 환율, 날씨, 공휴일, 쓰레기, 택배, 최신 발매 요약.
- **Music**: 아티스트 검색, 즐겨찾기, iTunes 기반 상세/최신곡, Apple Music JP Top100.
- **Concerts**: 일정 CRUD, 티켓 마일스톤, 공지 URL/텍스트 import.
- **Checklist**: 출국/정착/생활/업무/재정 체크리스트.
- **Calculator**: 실제 급여명세 기반 월급 분석, 보너스 포함 연 실수령 예상, 환율/구독비 계산.
- **Expenses**: 예산 플래너, Google Sheets 월별 집계, 전월 급여 기반 예상 수입, 지출 차트, 정기 지출 탐지.
- **Notes**: 일본어/업무/EV/SW 메모, 템플릿, SRS 퀴즈, 링크 관리.
- **Life Tools**: 노래방 검색, 쓰레기 수거 일정, 택배 관리, PWA offline fallback.

## 2. Technology

- **Framework**: Next.js 16 App Router
- **Runtime UI**: React 19
- **Language**: TypeScript 5 strict mode
- **Styling**: Tailwind CSS 4
- **Data Fetching**: SWR 2
- **Validation**: Zod 4
- **Charts**: Recharts
- **Storage**: file-based JSON store under `data/user`
- **Deployment**: Docker multi-stage standalone build

## 3. Application Structure

```text
app/
  api/                  Route handlers
  */page.tsx            App Router pages
components/             Shared UI components
data/                   Static seed data bundled with the app
data/user/              Runtime JSON store, ignored for new files
lib/
  constants/            Domain constants
  hooks/use-api.ts      SWR hooks and mutation helper
  store.ts              Versioned JSON persistence
  sheets.ts             Google Sheets parsing/aggregation helpers
  calculator.ts         Salary, payslip, budget helpers
  validations.ts        Zod schemas
docs/                   Review notes and planning docs
```

## 4. Runtime Architecture

### 4.1 Frontend

- Pages are implemented in `app/**/page.tsx`.
- Shared shell is `app/layout.tsx`.
- Navigation is `components/Navbar.tsx`.
- Toast notifications are provided by `components/Toast.tsx`.
- Client data access uses SWR hooks from `lib/hooks/use-api.ts`.

### 4.2 Backend

- API route handlers live in `app/api/**/route.ts`.
- JSON CRUD APIs use `lib/store.ts`.
- External service APIs proxy third-party services and normalize responses.
- Request validation for mutable APIs is handled by `lib/validations.ts`.

### 4.3 Persistence

`lib/store.ts` stores user state as JSON files and applies versioned migrations.

- `budget: v5`
- `notes: v2`
- `user-concerts: v2`
- `checklist, favorites, links, garbage, packages: v1`

Writes are backed up and saved atomically with a tmp-file + rename/copy fallback.

## 5. Routes

### 5.1 Pages

- `/`: dashboard
- `/artists`: artist search and favorites
- `/artists/[slug]`: artist detail
- `/top100`: Apple Music JP Top100
- `/concerts`: concert list/editor
- `/concerts/[id]`: concert detail
- `/concerts/import`: concert announcement import
- `/checklist`: checklist
- `/calculator`: salary and exchange calculator
- `/expenses`: budget, Sheets summary, charts, recurring expenses
- `/notes`: notes, templates, quiz, links
- `/karaoke`: TJ/Kumyoung karaoke search
- `/garbage`: garbage schedule
- `/packages`: package tracking
- `/offline`: PWA offline page

### 5.2 JSON Store APIs

- `GET, POST /api/budget`
- `GET, POST, PATCH, DELETE /api/checklist`
- `GET, POST, PATCH, DELETE /api/notes`
- `GET, POST, PATCH, DELETE /api/links`
- `GET, POST, DELETE /api/favorites`
- `GET, POST, PATCH, DELETE /api/user-concerts`
- `POST /api/user-concerts/import`
- `GET, POST /api/garbage`
- `GET, POST, PATCH, DELETE /api/packages`

### 5.3 External/Computed APIs

- `GET /api/search`: iTunes artist search
- `GET /api/releases`: iTunes release lookup
- `GET /api/top-artists`: Apple Music RSS JP Top100
- `GET /api/news`: Google News RSS + title translation
- `GET /api/karaoke`: manana.kr TJ/Kumyoung search
- `GET /api/weather`: Open-Meteo Tochigi forecast
- `GET /api/exchange-rates`: Wise rates with open.er-api.com fallback
- `GET /api/sheets?month=YYYY-MM`: monthly Google Sheets aggregate
- `GET /api/sheets/trend?months=6`: recent monthly trend
- `GET /api/sheets/recurring?months=6`: recurring expense candidates

## 6. Domain Notes

### 6.1 Expenses and Sheets

Source sheet range is `내역!A:F`.

```text
A=ID, B=날짜, C=구분, D=카테고리, E=내용, F=금액
```

`lib/sheets.ts` parses rows into normalized entries:

- `kind: "income"` if row type is `수입` or category is in `INCOME_CATEGORIES`
- `kind: "saving"` if row type is `저축/투자` or category is in `SAVING_CATEGORIES`
- otherwise `kind: "expense"`

Expenses page behavior:

- Budget categories map app-level categories to sheet categories.
- Current month actual spending comes from `/api/sheets`.
- The income input auto-displays the previous month’s Sheets income as `월 실수령 수입 (세후) (예상)`.
- If the user edits the income input, it switches to manual mode and persists.
- Charts use `/api/sheets/trend` and current-month category data.
- Recurring expenses use `/api/sheets/recurring`.

Recurring expense detection:

- Groups expense rows by normalized `category + description`.
- Requires at least 2 distinct months in the selected period.
- Rejects groups with amount variation over 35%.
- Marks confidence as high when 3+ months repeat and variation is 15% or lower.

### 6.2 Calculator

Calculator contains two layers:

- Actual payslip preset from the user’s salary slip:
  - 지급총액 `291,758`
  - 공제합계 `63,424`
  - 차인지급액 `228,334`
- Generic salary estimator for annual/bonus estimates.

The UI prioritizes actual payslip line items and uses estimated bonus net pay only for annual projection.

### 6.3 Concert Import

`/api/user-concerts/import` accepts URL or text.

- X/Twitter URLs try oEmbed first.
- Other URLs or fallback paths fetch HTML and strip tags.
- `lib/concertParser.ts` extracts title, date, venue, ticket milestones, and sources.

## 7. Data Model

### 7.1 Static Data

- `data/artists.json`
- `data/concerts.json`
- `data/checklist-defaults.json`

### 7.2 Runtime User Data

- `data/user/budget.json`
- `data/user/checklist.json`
- `data/user/favorites.json`
- `data/user/garbage.json`
- `data/user/links.json`
- `data/user/notes.json`
- `data/user/user-concerts.json`
- `data/user/packages.json` when created

`data/user` is runtime storage and should not be used as static seed data.

## 8. External Configuration

- `GOOGLE_SHEETS_API_KEY`: required for `/api/sheets`, `/api/sheets/trend`, `/api/sheets/recurring`
- `DATA_DIR`: optional override for runtime JSON store path
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: documented env, currently not central to active pages

## 9. Build and Deployment

Docker uses a multi-stage build:

1. `deps`: `npm ci`
2. `builder`: `npm run build`
3. `runner`: copies Next standalone output, static assets, and static JSON

Runtime user data is mounted at `/app/data/user`.

## 10. Removed/Deprecated

- `/guide` page and `data/guide-content.json` were removed.
- Raw Notion export files are not part of the app.
- Local `.claude` settings and macOS `.DS_Store` files are ignored.
