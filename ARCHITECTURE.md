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
- **Cooking**: Pantry, 결정론적 요리 추천, 일본어 장보기 이름, 단일 재료 Unlock 분석.

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
- `/expenses/receipt`: 일본 영수증에서 Google Sheets 지출 행 생성·검토
- `/notes`: notes, templates, quiz, links
- `/karaoke`: TJ/Kumyoung karaoke search
- `/garbage`: garbage schedule
- `/packages`: package tracking
- `/offline`: PWA offline page
- `/cooking`: 요리 추천 요약
- `/cooking/pantry`: 보유 식재료 관리
- `/cooking/discover`: 국가·재료 상태별 요리 탐색
- `/cooking/dishes/[id]`: 재료 상태·대체재·외부 레시피 상세
- `/cooking/shopping`: 단일 재료 구매 시 새롭게 가능한 요리 순위
- `/cooking/receipt`: 일본 영수증 촬영, OCR 결과 검토 및 Pantry 일괄 추가

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
- `GET, POST, DELETE /api/cooking/pantry`
- `GET, POST, DELETE /api/cooking/cooked`

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
- `GET /api/cooking/overview`: Pantry 기준 추천과 Unlock 계산 결과
- `POST /api/cooking/receipt/ocr`: multipart 영수증 이미지를 서버 OCR로 처리
- `POST /api/cooking/receipt/parse`: 일반 문자열 행을 결정적 품목 파서로 분석
- `POST /api/cooking/receipt/confirm`: 검토된 Ingredient ID를 Pantry에 중복 없이 병합
- `POST /api/expenses/receipt/ocr`: 공용 OCR 공급자로 가계부 영수증 처리
- `POST /api/expenses/receipt/parse`: 상점·날짜·품목별 가격·합계를 분류가이드 기반 다중 카테고리 초안으로 변환
- `POST /api/expenses/receipt/confirm`: 카테고리 합계와 중복을 확인한 뒤 내역 행들을 추가

## 6. Domain Notes

### 6.1 Expenses and Sheets

Source sheet range is `내역!A:I`.

```text
A=ID, B=날짜, C=구분, D=카테고리, E=내용, F=금액, G=결제수단, H=메모, I=정기
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

Receipt expense import keeps general receipt parsing separate from Cooking ingredient matching. `lib/receipt/ocr` owns the shared OCR provider, `lib/receipt/parser` extracts merchant/date/items/item prices/total, and `lib/expenses/receipt` formats an editable expense draft. Parse and confirm read `설정!A2:D47`, while parse also reads `분류가이드!A11:D21`; only categories whose type is `지출` and payment methods present in column D are accepted. Deterministic product rules group one receipt into categories such as `장보기`, `술/유흥`, and `생활용품`. The review UI also supports adding a category omitted by OCR or deleting an incorrect group. Confirm rejects the draft unless every row has a positive amount and the group amounts exactly equal the receipt total, then appends one A:I row per category using the configured service account or Apps Script writer. I열 `정기` is `FALSE`. Existing summary code continues to aggregate B:F.

Expense descriptions use the established Korean-first Sheet style (`토리센 (김밥)`). `lib/expenses/receipt/koreanize.ts` applies a compact deterministic merchant/product dictionary first, then optionally sends only unresolved merchant/item strings to Google Cloud Translation Basic. The review UI retains the original Japanese OCR strings and all Korean fields remain editable before confirmation.

Budget planning displays the `설정` sheet's current five major groups rather than one input per detailed expense category. `BudgetCategory.sheetCategories` keeps the exact detailed-category mapping used to aggregate actual spending. The default diagnostic plan is `식비 35,000`, `고정·계약비 45,000`, `교통·차량 50,000`, `생활·소비 10,000`, and `사교·여가 25,000` yen, for a total monthly spending ceiling of 165,000 yen against a 228,000 yen baseline take-home income.

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
- `data/cooking-ingredients.json`: 한국어 우선 식재료 142개와 일본 현지명
- `data/cooking-dishes.json`: 자취 요리 117개와 중요도별 식재료 관계
- `data/cooking-relations.json`: 동등·대체·유사 식재료 관계
- `data/cooking-recipe-sources.json`: 외부 레시피 검색 출처

### 7.2 Runtime User Data

- `data/user/budget.json`
- `data/user/checklist.json`
- `data/user/favorites.json`
- `data/user/garbage.json`
- `data/user/links.json`
- `data/user/notes.json`
- `data/user/user-concerts.json`
- `data/user/packages.json` when created
- `data/user/cooking-pantry.json` when the pantry is changed
- `data/user/cooking-cooked.json`: 날짜, 참고 URL, 메모를 포함한 반복 조리 이력

`data/user` is runtime storage and should not be used as static seed data.

### 7.3 Cooking recommendation model

`lib/cooking`은 정적 데이터/파일 저장과 추천 규칙을 분리한다. `recommendation.ts`는 REQUIRED를 가장 크게 가중하고 IMPORTANT, OPTIONAL 순으로 적합도를 계산한다. UI의 `바로 가능`은 REQUIRED와 IMPORTANT가 모두 충족된 경우만 의미하며 OPTIONAL은 판정을 막지 않는다. GOOD 대체재는 해당 재료를 충족한 것으로 처리하며 그 외 대체재는 부분 점수로 반영한다. `unlock.ts`는 Pantry에 없는 재료를 하나씩 가상 추가해 새롭게 `canCookNow`가 되는 요리를 계산한다. 두 모듈은 평범한 배열을 입력받는 순수 함수이므로 저장소를 바꾸어도 다시 사용할 수 있다.

### 7.4 Receipt OCR and pantry import

영수증 기능은 책임을 네 단계로 분리한다.

```text
mobile image → /receipt/ocr → ReceiptOcrProvider (Google Cloud Vision)
             → raw string lines → /receipt/parse
             → metadata/non-food rules + alias/substring/fuzzy matcher
             → review UI → /receipt/confirm → cooking-pantry store
             → /api/cooking/overview SWR revalidation
```

- `lib/receipt/ocr`: Cooking과 Expenses가 공유하는 교체 가능한 `ReceiptOcrProvider`와 Google Cloud Vision REST 구현. 서버 환경 변수만 사용한다.
- `lib/receipt/parser`: 상점·거래일·구매 품목·최종 금액을 보존하는 일반 영수증 파서.
- `lib/cooking/receipt`: OCR과 무관한 순수 문자열 정리, 메타데이터 필터, 식품 분류, Ingredient 점수 매칭, Pantry 병합.
- `Ingredient.receiptAliasesJa`: 정식 일본어 이름과 별개인 영수증 축약·PB 표기를 보관한다. 새 표기는 Ingredient를 복제하지 않고 이 배열에 추가한다.
- 0.90 이상은 높은 신뢰도로 자동 선택하고, 0.70–0.89는 선택하되 검토 대상으로 표시하며, 그 미만은 사용자가 후보 또는 전체 Ingredient 검색으로 정한다.
- 확정 API는 기존 Pantry 항목을 유지하고 새 ID만 원자적 JSON 쓰기로 추가한다. 완료 후 overview가 다시 계산되어 홈·요리 찾기·장보기 결과에 즉시 반영된다.
- 업로드는 이미지 형식과 10MB 제한을 검사하며 메모리에만 머문다. 원본 이미지, 전체 OCR 텍스트, 결제 관련 행은 저장하지 않는다.

## 8. External Configuration

- `GOOGLE_SHEETS_API_KEY`: required for `/api/sheets`, `/api/sheets/trend`, `/api/sheets/recurring`
- `GOOGLE_SHEETS_ID`: optional spreadsheet override
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`: server-only service account used for expense row append
- `GOOGLE_SHEETS_PRIVATE_KEY`: server-only private key used for expense row append
- `GOOGLE_SHEETS_WRITE_PROVIDER`: `service-account` or `apps-script`
- `GOOGLE_SHEETS_APPS_SCRIPT_URL`: optional Apps Script Web App `/exec` URL
- `GOOGLE_SHEETS_APPS_SCRIPT_SECRET`: server-only shared secret matching Apps Script `API_SECRET`
- `DATA_DIR`: optional override for runtime JSON store path
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: documented env, currently not central to active pages
- `RECEIPT_OCR_PROVIDER`: optional, defaults to `google-cloud-vision`
- `GOOGLE_CLOUD_VISION_API_KEY`: server-only key required by receipt OCR
- `GOOGLE_CLOUD_TRANSLATION_API_KEY`: optional server-only Translation Basic key; falls back to the Vision key

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
