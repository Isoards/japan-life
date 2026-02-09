/**
 * 일본 급여 세금/사회보험 상수 (2025~2026년 기준)
 * 출처: 국세청(国税庁) / 후생노동성(厚生労働省)
 */

/** 급여소득공제 구간 — [상한, 공제율, 가감액] */
export const EMPLOYMENT_DEDUCTION_BRACKETS: readonly [number, number, number][] = [
  [1_625_000, 0, 550_000],     // ~162.5만: 정액 55만
  [1_800_000, 0.4, -100_000],  // ~180만: 수입×40% − 10만
  [3_600_000, 0.3, 80_000],    // ~360만: 수입×30% + 8만
  [6_600_000, 0.2, 440_000],   // ~660만: 수입×20% + 44만
  [8_500_000, 0.1, 1_100_000], // ~850만: 수입×10% + 110만
  [Infinity, 0, 1_950_000],    // 850만 초과: 정액 195만
];

/** 누진소득세 구간 — [상한, 세율, 공제액] (국세청 소득세법) */
export const INCOME_TAX_BRACKETS: readonly [number, number, number][] = [
  [1_950_000, 0.05, 0],
  [3_300_000, 0.10, 97_500],
  [6_950_000, 0.20, 427_500],
  [9_000_000, 0.23, 636_000],
  [18_000_000, 0.33, 1_536_000],
  [40_000_000, 0.40, 2_796_000],
  [Infinity, 0.45, 4_796_000],
];

/** 기초공제 (基礎控除) — 연 48만엔 */
export const BASIC_DEDUCTION = 480_000;

/** 주민세율 (住民税, 시구정촌민세 6% + 도도부현민세 4%) */
export const RESIDENT_TAX_RATE = 0.10;

/** 사회보험료율 (후생노동성 기준) */
export const HEALTH_INSURANCE_RATE = 0.05;   // 건강보험 (토치기현 기준 근사)
export const PENSION_RATE = 0.0915;          // 후생연금
export const EMPLOYMENT_INSURANCE_RATE = 0.006; // 고용보험

/** 보너스 사회보험료 합산율 */
export const BONUS_SOCIAL_RATE =
  HEALTH_INSURANCE_RATE + PENSION_RATE + EMPLOYMENT_INSURANCE_RATE;

/** 보너스 소득세 구간 — [과세소득 상한, 세율] */
export const BONUS_TAX_BRACKETS: readonly [number, number][] = [
  [1_950_000, 0.05],
  [3_300_000, 0.10],
  [6_950_000, 0.20],
  [Infinity, 0.23],
];

/** 보너스 연 지급 횟수 */
export const BONUS_PAYMENTS_PER_YEAR = 2;
