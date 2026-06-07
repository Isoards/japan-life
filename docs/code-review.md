# Code Review Notes

## Snapshot

이 리뷰는 현재 코드 기준이다. 최근 변경으로 `/guide`는 제거됐고, 가계부에는 정기 지출 탐지와 전월 급여 기반 예상 수입이 추가됐다. 계산기는 실제 급여명세서 기반 분석을 중심으로 재구성됐다.

## Current Architecture Assessment

- **구조**: Next App Router + Route Handler + SWR + file JSON store 구조가 작고 개인용 앱에 잘 맞는다.
- **도메인 분리**: `lib/sheets.ts`, `lib/calculator.ts`, `lib/store.ts`, `lib/validations.ts`로 핵심 도메인 로직이 분리되어 있다.
- **데이터 흐름**: 클라이언트는 `lib/hooks/use-api.ts`를 통해 API를 호출하고, API는 외부 서비스 또는 JSON store를 정규화해서 반환한다.
- **런타임 저장소**: `data/user`는 사용자 상태 저장소다. 정적 seed 데이터와 구분되어야 한다.
- **문서 상태**: `ARCHITECTURE.md`는 현재 라우트/API/데이터 구조 기준으로 갱신됐다.

## Current Features

- **Dashboard**: 날씨, 환율, 예산 잔액, 체크리스트, 택배, 공휴일, 콘서트 마일스톤, 최신 발매 요약.
- **Expenses**: 예산 플래너, 전월 Sheets 급여 기반 예상 수입, 월별 지출 집계, 차트, 목표저축, 정기 지출 탐지.
- **Calculator**: 실제 급여명세서 지급/공제 분석, 실수령률/공제율, 보너스 포함 연 실수령 예상, 환율/구독비 계산.
- **Concerts**: 일정 CRUD, 공연시각, 티켓 마일스톤, 공지 URL/텍스트 import.
- **Music**: 아티스트 검색/즐겨찾기, 아티스트 상세, 최신 발매, JP Top100.
- **Life Tools**: 체크리스트, 쓰레기 수거 일정, 택배, 노래방 검색.
- **Notes**: 일본어/업무/EV/SW 노트, 템플릿, SRS 퀴즈, 링크.

## Recent Cleanup

- `/guide` 페이지와 `data/guide-content.json` 제거.
- Notion export, `.claude`, `.DS_Store`, stale generated files 정리.
- Docker static JSON copy 목록에서 제거된 guide 데이터 삭제.
- `ARCHITECTURE.md`, `README.md`, `docs/code-review.md`의 guide 참조 정리.

## Recent Refactors

- **Sheets parsing**: `lib/sheets.ts`가 날짜/카테고리/내용/금액을 파싱하고 income/saving/expense를 분류한다.
- **Sheets APIs**: `/api/sheets`, `/api/sheets/trend`, `/api/sheets/recurring`이 같은 파서 기반으로 동작한다.
- **Recurring expenses**: 카테고리+내용 단위로 반복성과 금액 변동률을 계산한다.
- **Salary calculator**: 실제 급여명세서 preset과 `calculatePayslip`이 추가되어 추정 공제 UI를 대체했다.
- **Budget income**: 예산 플래너의 수입은 선택 월의 전월 Sheets 수입을 `(예상)`으로 자동 표시한다.

## Strengths

- **개인용 앱에 맞는 단순성**: DB 없이 JSON store로 충분한 생산성을 확보하고 있다.
- **SWR 기반 UX**: 페이지별 데이터 loading/fallback 패턴이 간단하다.
- **도메인 유틸 재사용**: Sheets 집계 중복이 줄어 유지보수성이 좋아졌다.
- **문서-코드 정합성 개선**: 제거된 guide와 새 recurring API가 문서에 반영됐다.
- **실사용 데이터 반영**: 예산/급여 계산이 실제 Sheets와 급여명세서 중심으로 이동했다.

## Risks

- **Google Sheets coupling**: sheet id, range, column layout이 코드에 고정되어 있다.
- **Runtime data tracking**: `data/user`는 ignore 대상이지만 기존 tracked 파일이 남아 있을 수 있다.
- **CRUD duplication**: 여러 API route에 `safeSave`, ID 생성, read/write 패턴이 반복된다.
- **Recurring detection precision**: 같은 설명 문자열에 의존하므로 표기 흔들림이 있으면 놓칠 수 있다.
- **Salary annual projection**: 월급은 실제 명세서, 보너스는 추정치라 “예상” 의미를 계속 명확히 유지해야 한다.
- **Lint sensitivity**: React 19 lint가 render/effect purity에 엄격하므로 ref/render state 패턴을 조심해야 한다.

## Recommendations

### High Priority

- **Sheets config 환경변수화**: `SHEETS_ID`, `SHEETS_HISTORY_RANGE`를 env로 이동해 시트 교체 비용 줄이기.
- **Recurring alias dictionary**: `내용` 표기 흔들림을 묶는 별칭 테이블 추가. 예: `YT`, `YouTube`, `유튜브`.
- **Budget income source UX**: `(예상)` 상태에서 “이 값 저장” 버튼을 추가해 자동값과 저장값의 차이를 명확히 하기.
- **Tracked runtime data 점검**: `git ls-files data/user`로 사용자 데이터가 tracked 상태인지 확인하고 필요 시 제거.

### Medium Priority

- **Store API helper**: CRUD route의 반복되는 `safeSave`, 400/404 응답, ID 생성 패턴 공통화.
- **Backup management**: `data/user/backups` 복원/삭제 UI 또는 cleanup command 추가.
- **Recurring warning**: 정기 지출 후보가 이번 달에 아직 입력되지 않았을 때 “미입력 가능성” 표시.
- **Calculator persistence**: 실제 급여명세서 항목을 localStorage 또는 JSON store에 저장해 월별 비교 가능하게 하기.

### Low Priority

- **Dashboard recurring widget**: 정기 지출 월 예상 합계를 대시보드에 작게 노출.
- **Docs split**: `ARCHITECTURE.md`가 더 커지면 API spec과 operations를 별도 문서로 분리.
- **E2E smoke test**: `/expenses`, `/calculator`, `/concerts` 정도만 Playwright smoke test 추가.

## Suggested Next Feature Order

1. 정기 지출 미입력 경고
2. Sheets 설정 환경변수화
3. 급여명세서 월별 저장/비교
4. 주민세/사회보험 캘린더
5. 생활 장소 북마크

## Validation Checklist

주요 변경 후 아래를 돌린다.

```bash
npm run lint
npx tsc --noEmit
npm run build
```

현재 환경에서는 Turbopack build가 샌드박스의 port binding 제한에 걸릴 수 있으므로, 필요 시 승인 실행으로 검증한다.
