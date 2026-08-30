# Code Review Notes

## Snapshot

이 리뷰는 2026-08-24 현재 코드 기준이다. 최근 작업 범위는 Cooking 전체 도메인, 공용 영수증 OCR, 가계부 영수증의 다중 카테고리 등록, Apps Script Sheets 쓰기, 일본어 품목 한국어화, 5개 대분류 예산 플래너, 대시보드 요리/영수증 진입점이다.

## Current Architecture Assessment

- **구조**: Next.js App Router + Route Handler + SWR + 파일 JSON store 구조가 개인용 단일 사용자 앱에 적합하다.
- **도메인 분리**: 공용 OCR/일반 영수증 파서는 `lib/receipt`, Pantry 매칭은 `lib/cooking/receipt`, 가계부 초안과 Sheets 쓰기는 `lib/expenses`로 분리됐다.
- **데이터 흐름**: 브라우저는 API만 호출하며 Vision, Translation, Sheets 쓰기 자격 증명은 서버 환경 변수에서만 사용한다.
- **검토 우선 UX**: Cooking과 Expenses 모두 OCR 결과를 즉시 반영하지 않고 검토·수정·확정 단계를 거친다.
- **런타임 저장소**: Pantry와 조리 이력 등 개인 상태는 `data/user`에 저장하고, 원본 영수증 이미지는 저장하지 않는다.

## Current Features

- **Dashboard**: D-day 아래 요리 추천 요약과 가계부/Pantry 영수증 바로가기, 날씨, 환율, 예산, 체크리스트, 택배, 공휴일, 콘서트, 최신 발매.
- **Cooking**: 142개 Ingredient, 117개 Dish, Pantry, 대체재 기반 추천, Unlock 장보기, 반복 조리 기록, 일본 영수증 Ingredient 매칭과 일괄 Pantry 병합.
- **Expenses**: Sheets 월별 집계, 5개 대분류 예산, 전월 수입 추정, 차트, 목표저축, 정기 지출 탐지, 영수증 다중 카테고리 등록.
- **Expense receipt**: 상점·날짜·품목·품목 가격·합계 추출, 한국어 요약, 결정적 카테고리 분류, 수동 행 추가/삭제, 총액 일치 검증, 서비스 계정 또는 Apps Script 쓰기.
- **Calculator**: 실제 급여명세 지급/공제 분석, 보너스 포함 연 실수령 예상, 환율/구독비 계산.
- **Other domains**: 콘서트, 음악, 체크리스트, 메모/퀴즈, 쓰레기, 택배, 노래방.

## Strengths

- **책임 경계가 명확함**: OCR 공급자, 문자열 파서, Ingredient matcher, Expense formatter, Pantry/Sheets persistence가 서로 교체 가능한 단위로 나뉜다.
- **결정적 기본 동작**: Cooking alias 매칭과 Expenses 카테고리 분류가 LLM 없이 작동한다.
- **데이터 무결성 방어**: Pantry 중복 병합, Sheets 허용 카테고리/결제수단 재검증, 양수 금액, 분류 합계와 영수증 총액 일치 검증이 서버에도 있다.
- **개인정보 최소화**: 업로드 이미지는 메모리에서만 처리하고 전체 OCR 텍스트와 결제 관련 행을 영구 저장하지 않는다.
- **현재 Sheets 형태 존중**: A:I 열 순서와 `설정`의 실제 선택지를 사용하고, 임의의 카테고리나 결제수단을 생성하지 않는다.
- **모바일 흐름**: 후면 카메라 촬영 입력, 좁은 화면용 검토 UI, 하단 확정 액션이 제공된다.

## Findings and Risks

### High Priority

1. **Apps Script 다중 행 쓰기는 원자적이지 않음**
   서비스 계정 방식은 여러 행을 한 append 요청으로 보내지만 Apps Script 방식은 카테고리마다 순차 POST한다. 중간 요청이 실패하면 앞 행만 시트에 남을 수 있다. Apps Script 계약을 `rows[]` 일괄 요청으로 확장하고 Script 내부 lock에서 한 번에 기록하는 것이 안전하다.

2. **자동화된 테스트 러너가 없음**
   `package.json`에는 lint/build만 있고 parser, matcher, Pantry merge, 금액 배분, Sheets row formatting을 회귀 검증하는 테스트가 없다. 영수증 형식은 변형이 많으므로 최소한 순수 함수 fixture 테스트가 필요하다.

3. **Sheets 스키마와 분류 규칙의 drift 가능성**
   `내역!A:I`, `설정!A2:D47`, `분류가이드!A11:D21` 범위가 코드 상수다. 예산의 39개 세부 카테고리→5개 대분류 매핑과 영수증 상품 키워드 규칙도 코드에 유지된다. 시트에서 행을 추가하거나 대분류를 바꾸면 UI 집계와 자동 분류가 조용히 달라질 수 있다.

### Medium Priority

1. **가격/할인 파싱은 휴리스틱임**
   일반 파서는 품목과 같은 행 끝의 가격에 가장 강하다. 가격이 다음 행에 있거나 묶음 할인·쿠폰·세율별 조정이 복잡하면 남은 금액을 품목에 배분한다. 총액 검증은 오기입을 막지만 카테고리별 배분 정확도는 사용자가 확인해야 한다.

2. **중복 검사가 전체 내역을 읽음**
   영수증 확정 전 `내역!A:I` 전체를 다시 읽고 같은 날짜·가게 행의 합계를 계산한다. 데이터가 커질수록 지연과 API 사용량이 늘며, 같은 날 같은 가게를 두 번 이용한 경우 경고 정확도가 낮아질 수 있다.

3. **설정/분류가이드 읽기 캐시가 없음**
   parse와 confirm에서 설정을 다시 읽는 것은 안전하지만 요청 지연과 Sheets API 의존성을 높인다. 짧은 서버 캐시와 confirm 시 최종 재검증을 조합할 수 있다.

4. **OCR Route Handler가 중복됨**
   Cooking과 Expenses OCR route는 현재 같은 이미지 검증·공급자 호출·오류 매핑을 반복한다. 공용 route helper로 옮기면 오류 정책 변경 시 누락을 줄일 수 있다.

5. **예산 v9 마이그레이션이 값을 재설정함**
   v8→v9에서 수입과 카테고리 예산을 진단 기본값으로 의도적으로 교체한다. 이번 변경에는 맞지만 이후 마이그레이션에서는 사용자 입력 보존 여부를 명시적으로 결정해야 한다.

6. **런타임 파일 하나가 Git에 추적됨**
   `/data/user/`는 ignore 대상이지만 `data/user/checklist.json`은 이미 추적 중이다. 개인 상태의 저장소 포함이 의도인지 확인하고, 아니라면 Git 인덱스에서 제거해야 한다.

### Low Priority

- `app/expenses/page.tsx`와 `app/DashboardClient.tsx`가 여러 위젯과 상태를 한 컴포넌트에 담고 있어 기능 추가 시 분리 이점이 커지고 있다.
- 대시보드는 Cooking overview를 추가 호출하므로 홈 초기 요청 수가 하나 늘었다. 현재 규모에서는 허용 가능하지만 위젯이 늘면 서버 집계 API를 고려할 수 있다.
- Translation 실패 시 원문으로 안전하게 폴백하지만, 사용자는 한국어 변환 실패와 번역 확신도를 구분하기 어렵다.
- `GOOGLE_SHEETS_ID`는 환경 변수로 바꿀 수 있지만 개인용 기본 ID가 코드에 남아 있다.

## Security and Privacy Review

- `.env*`와 PEM은 Git ignore 대상이며 Vision, Translation, Sheets, Apps Script 비밀은 브라우저 코드에서 참조하지 않는다.
- API 오류 응답은 OCR 전체 텍스트나 공급자 원문 오류를 노출하지 않는다.
- 이미지 형식과 10MB 제한, OCR 20초 timeout이 있다.
- Google Cloud 키에는 API 제한을 적용하고, 로그·화면 공유·채팅 등에 노출된 키는 즉시 폐기·재발급해야 한다.
- Apps Script Web App은 공유 비밀 비교뿐 아니라 배포 접근 범위와 대상 Spreadsheet 고정을 함께 유지해야 한다.

## Recommended Next Work

1. Apps Script `rows[]` 원자적 일괄 쓰기
2. receipt parser/matcher/merge fixture 테스트와 `npm test` 추가
3. Sheets 설정 범위 동적 읽기 또는 스키마 검증 endpoint 추가
4. 예산 대분류 매핑을 `설정` C열에서 생성하거나 drift 경고 표시
5. 영수증 중복 조회 범위 축소와 거래시각 활용
6. 추적 중인 `data/user/checklist.json` 정책 결정
7. Expenses/Dashboard 대형 컴포넌트 분리

## Validation Checklist

주요 변경 후 아래를 실행한다.

```bash
npm run lint
npx tsc --noEmit
npm run build
```

현재 자동화된 unit/E2E 테스트 명령은 없다. Turbopack build가 샌드박스의 port binding 제한에 걸리면 승인 실행으로 같은 명령을 재검증한다.
