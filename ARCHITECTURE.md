# Japan Life Dashboard - Architecture

## 개요
Japan Life Dashboard는 일본 생활 준비를 위한 개인 대시보드입니다.
음악/콘서트 추적, 체크리스트, 예산/지출 관리, 노트/로그 기능을 제공합니다.

## 기술 스택
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- SWR 2
- Zod 4
- Docker (multi-stage)
- File-based JSON store (`data/user/*.json`)

## 외부 API
- iTunes Search API: 아티스트/트랙 검색
- Deezer API: 아티스트 이미지 보강
- Apple Music RSS: 일본 차트
- Wise API + open.er-api.com: 환율
- Google Sheets API: 지출 집계
- Google News RSS + Translate: 뉴스/번역
- Twitter oEmbed API: 콘서트 텍스트 import
- manana.kr API: 노래방 검색

## 프로젝트 구조
- `app/*`: 페이지 및 API 라우트
- `app/api/*`: 백엔드 엔드포인트
- `components/*`: 공용 UI 컴포넌트
- `lib/*`: 계산/파싱/검증/스토어
- `data/*`: 정적 데이터
- `data/user/*`: 사용자 데이터

## 핵심 기능
1. 대시보드
- 체크리스트/예산/콘서트/환율 요약

2. 콘서트 트래킹
- 일정 CRUD
- 마일스톤(선행, 당첨, 일반발매 등) 관리
- 텍스트/URL import 파싱

3. 체크리스트
- 카테고리/우선순위 기반 진행 관리

4. 재정 도구
- 급여/환율 계산기
- Google Sheets 연동 지출 추적

5. 노트/링크/주간로그
- 일본어 노트, 빠른 링크, 회고 관리

## 예산 플래너 (2026-02 동기화)
- 기존 시기 탭(`4~7월 / 8~12월 / 2년차`) 제거
- 단일 월간 예산 템플릿 저장 방식으로 단순화
- 카테고리별 예산 사용률 경고 추가
  - 80% 이상: 경고 상태 + info toast
  - 100% 이상: 초과 상태 + error toast
- 목표저축(싱킹펀드) 추가
  - 필드: 이름, 목표금액, 현재적립액, 목표월(선택)
  - 진행률 바 및 인라인 수정/삭제

## API 라우트
- `GET/POST /api/budget`
- `GET/POST/PATCH/DELETE /api/checklist`
- `GET/POST/PATCH/DELETE /api/notes`
- `GET/POST/DELETE /api/favorites`
- `GET/POST/DELETE /api/links`
- `GET/POST/PATCH/DELETE /api/logs`
- `GET /api/sheets`
- `GET /api/exchange-rate`
- `GET /api/exchange-rates`
- `GET /api/search`
- `GET /api/releases`
- `GET /api/top-artists`
- `GET /api/news`
- `GET /api/karaoke`
- `GET/POST/PATCH/DELETE /api/user-concerts`
- `POST /api/user-concerts/import`

## 데이터 모델
### 사용자 저장소
- `data/user/budget.json`
- `data/user/checklist.json`
- `data/user/notes.json`
- `data/user/favorites.json`
- `data/user/links.json`
- `data/user/logs.json`
- `data/user/user-concerts.json`

### budget 스키마
- `income: number`
- `categories: BudgetCategory[]`
- `sinkingFunds: SinkingFund[]`

## 스토어 및 마이그레이션
- `lib/store.ts`에서 버전 관리
- `budget` 스키마 버전: `v3`
  - `v1 -> v2`: `sheetCategories` 보정
  - `v2 -> v3`: `sinkingFunds` 기본값 추가
- 원자적 쓰기(`tmp -> rename`) + 자동 백업

## 배포
### Docker
- Image: `isoards/japan-life:latest`
- Port: `3000`
- Volume: `/app/data/user`

### 환경 변수
- `DATA_DIR` (default: `data/user`)
- `GOOGLE_SHEETS_API_KEY`
- `NODE_ENV`
- `PORT`

## 메모
- 이 문서는 깨진 인코딩 내용을 UTF-8 기준으로 재정리한 버전입니다.
