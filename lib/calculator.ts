import type {
  SalaryBreakdown,
  BudgetCategory,
  PayslipBreakdown,
  PayslipDeductionItem,
  PayslipEarningItem,
} from "./types";
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

export const DEFAULT_PAYSLIP_EARNINGS: PayslipEarningItem[] = [
  { id: "base", label: "본봉", labelJa: "本加給", amount: 260_000, taxable: true },
  { id: "skill", label: "능력개발수당", labelJa: "能力開発手当", amount: 10_000, taxable: true },
  { id: "commute", label: "통근수당", labelJa: "通勤手当", amount: 8_110, taxable: false },
  { id: "remote", label: "리모트워크수당", labelJa: "リモートワーク手当", amount: 1_500, taxable: true },
  { id: "meal", label: "식사보조수당", labelJa: "食事補助手当", amount: 10_520, taxable: true },
  { id: "overtime", label: "잔업수당", labelJa: "残業手当", amount: 1_628, taxable: true },
];

export const DEFAULT_PAYSLIP_DEDUCTIONS: PayslipDeductionItem[] = [
  { id: "employment", label: "고용보험료", labelJa: "雇用保険料", amount: 1_459, category: "social" },
  { id: "health", label: "건강보험료", labelJa: "健康保険料", amount: 10_920, category: "social" },
  { id: "childcare", label: "아동·육아지원금", labelJa: "子ども子育て支援金", amount: 345, category: "social" },
  { id: "pension", label: "후생연금보험료", labelJa: "厚生年金保険料", amount: 27_450, category: "social" },
  { id: "income-tax", label: "소득세", labelJa: "所得税", amount: 5_890, category: "tax" },
  { id: "mutual-aid", label: "상조회", labelJa: "互助会", amount: 5_360, category: "company" },
  { id: "life-plan", label: "라이프플랜 적립", labelJa: "ライフプラン積立", amount: 12_000, category: "company" },
];

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

export function calculatePayslip(
  earnings: PayslipEarningItem[],
  deductions: PayslipDeductionItem[],
): PayslipBreakdown {
  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const taxableEarnings = earnings
    .filter((item) => item.taxable)
    .reduce((sum, item) => sum + item.amount, 0);
  const nonTaxableEarnings = totalEarnings - taxableEarnings;
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
  const statutoryDeductions = deductions
    .filter((item) => item.category !== "company")
    .reduce((sum, item) => sum + item.amount, 0);
  const companyDeductions = totalDeductions - statutoryDeductions;
  const socialInsuranceTotal = deductions
    .filter((item) => item.category === "social")
    .reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = deductions
    .filter((item) => item.category === "tax")
    .reduce((sum, item) => sum + item.amount, 0);
  const netPay = totalEarnings - totalDeductions;

  return {
    earnings,
    deductions,
    totalEarnings,
    taxableEarnings,
    nonTaxableEarnings,
    totalDeductions,
    statutoryDeductions,
    companyDeductions,
    socialInsuranceTotal,
    taxTotal,
    netPay,
    takeHomeRate: totalEarnings > 0 ? netPay / totalEarnings : 0,
    deductionRate: totalEarnings > 0 ? totalDeductions / totalEarnings : 0,
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
