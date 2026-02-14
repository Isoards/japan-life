import type { SalaryBreakdown, BudgetCategory } from "./types";
import {
  EMPLOYMENT_DEDUCTION_BRACKETS,
  INCOME_TAX_BRACKETS,
  BASIC_DEDUCTION,
  RESIDENT_TAX_RATE,
  HEALTH_INSURANCE_RATE,
  PENSION_RATE,
  EMPLOYMENT_INSURANCE_RATE,
  BONUS_SOCIAL_RATE,
  BONUS_TAX_BRACKETS,
  BONUS_PAYMENTS_PER_YEAR,
  DEFAULT_BUDGET_CATEGORIES,
} from "./constants";

/**
 * 일본 급여 계산 (2025~2026년 기준 근사치)
 * - 소득세: 누진세율 (5%~45%)
 * - 주민세: 약 10% (시군구민세 6% + 도도부현민세 4%)
 * - 건강보험: 약 5% (도치기현 기준 근사)
 * - 후생연금: 9.15%
 * - 고용보험: 0.6%
 */
export function calculateSalary(monthlyBase: number, bonusMonths: number): SalaryBreakdown {
  const grossAnnual = monthlyBase * (12 + bonusMonths);
  const grossMonthly = monthlyBase;

  const employmentDeduction = calcEmploymentDeduction(grossAnnual);
  const taxableIncome = Math.max(0, grossAnnual - employmentDeduction - BASIC_DEDUCTION);
  const annualIncomeTax = calcProgressiveTax(taxableIncome);
  const incomeTax = Math.round(annualIncomeTax / 12);

  const annualResidentTax = Math.round(taxableIncome * RESIDENT_TAX_RATE);
  const residentTax = Math.round(annualResidentTax / 12);

  const healthInsurance = Math.round(grossMonthly * HEALTH_INSURANCE_RATE);
  const pension = Math.round(grossMonthly * PENSION_RATE);
  const employmentInsurance = Math.round(grossMonthly * EMPLOYMENT_INSURANCE_RATE);

  const totalDeductions =
    incomeTax + residentTax + healthInsurance + pension + employmentInsurance;
  const netMonthly = grossMonthly - totalDeductions;

  const bonusPayments = bonusMonths > 0 ? BONUS_PAYMENTS_PER_YEAR : 0;
  const bonusGrossPerPayment = bonusPayments > 0
    ? Math.round((monthlyBase * bonusMonths) / bonusPayments)
    : 0;

  let bonusTaxRate = 0;
  for (const [limit, rate] of BONUS_TAX_BRACKETS) {
    if (taxableIncome <= limit) {
      bonusTaxRate = rate;
      break;
    }
  }

  const bonusNetPerPayment = bonusPayments > 0
    ? Math.round(bonusGrossPerPayment * (1 - BONUS_SOCIAL_RATE - bonusTaxRate))
    : 0;

  const netAnnual = netMonthly * 12 + bonusNetPerPayment * bonusPayments;

  return {
    monthlyBase,
    bonusMonths,
    grossAnnual,
    grossMonthly,
    incomeTax,
    residentTax,
    healthInsurance,
    pension,
    employmentInsurance,
    totalDeductions,
    netMonthly,
    bonusGrossPerPayment,
    bonusNetPerPayment,
    netAnnual,
  };
}

/** 급여소득공제 계산 */
function calcEmploymentDeduction(income: number): number {
  for (const [limit, rate, offset] of EMPLOYMENT_DEDUCTION_BRACKETS) {
    if (income <= limit) {
      return rate === 0 ? offset : income * rate + offset;
    }
  }
  return 0;
}

/** 누진소득세 계산 */
function calcProgressiveTax(taxable: number): number {
  for (const [limit, rate, deduction] of INCOME_TAX_BRACKETS) {
    if (taxable <= limit) {
      return Math.round(taxable * rate - deduction);
    }
  }
  return 0;
}

/** 기본 예산 카테고리 */
export function getDefaultBudget(): BudgetCategory[] {
  return DEFAULT_BUDGET_CATEGORIES.map((category) => ({ ...category }));
}

/** 환율 변환 (rate = 100엔당 원화, 예: 920) */
export function convertCurrency(
  amount: number,
  ratePer100Yen: number,
  direction: "krw-to-jpy" | "jpy-to-krw"
): number {
  if (direction === "krw-to-jpy") {
    return Math.round(amount * 100 / ratePer100Yen);
  }
  return Math.round(amount * ratePer100Yen / 100);
}
