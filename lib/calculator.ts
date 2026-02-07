import type { SalaryBreakdown, BudgetCategory } from "./types";

/**
 * 일본 급여 계산 (2025~2026년 기준 근사치)
 * - 소득세: 누진세율 (5%~45%)
 * - 주민세: 약 10% (시구정촌민세 6% + 도도부현민세 4%)
 * - 건강보험: 약 5% (토치기현 기준 근사)
 * - 후생연금: 9.15%
 * - 고용보험: 0.6%
 */
export function calculateSalary(monthlyBase: number, bonusMonths: number): SalaryBreakdown {
  const grossAnnual = monthlyBase * (12 + bonusMonths);
  const grossMonthly = monthlyBase;

  // 소득세 (누진세율 - 연간 기준, 기초공제 48만엔 + 급여소득공제 적용)
  const employmentDeduction = calcEmploymentDeduction(grossAnnual);
  const taxableIncome = Math.max(0, grossAnnual - employmentDeduction - 480000);
  const annualIncomeTax = calcProgressiveTax(taxableIncome);
  const incomeTax = Math.round(annualIncomeTax / 12);

  // 주민세 (약 10% of 과세소득)
  const annualResidentTax = Math.round(taxableIncome * 0.1);
  const residentTax = Math.round(annualResidentTax / 12);

  // 건강보험 (약 5% of 월급)
  const healthInsurance = Math.round(grossMonthly * 0.05);

  // 후생연금 (9.15% of 월급)
  const pension = Math.round(grossMonthly * 0.0915);

  // 고용보험 (0.6% of 월급)
  const employmentInsurance = Math.round(grossMonthly * 0.006);

  const totalDeductions =
    incomeTax + residentTax + healthInsurance + pension + employmentInsurance;
  const netMonthly = grossMonthly - totalDeductions;

  // 보너스 계산 (연 2회 지급 가정)
  // 보너스에서는 사회보험료 + 소득세 원천징수 (주민세 없음)
  const bonusPayments = bonusMonths > 0 ? 2 : 0;
  const bonusGrossPerPayment = bonusPayments > 0
    ? Math.round((monthlyBase * bonusMonths) / bonusPayments)
    : 0;
  const bonusSocialRate = 0.05 + 0.0915 + 0.006; // 건강보험 + 연금 + 고용보험
  const bonusTaxRate = taxableIncome <= 1950000 ? 0.05
    : taxableIncome <= 3300000 ? 0.1
    : taxableIncome <= 6950000 ? 0.2 : 0.23;
  const bonusNetPerPayment = bonusPayments > 0
    ? Math.round(bonusGrossPerPayment * (1 - bonusSocialRate - bonusTaxRate))
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
  if (income <= 1625000) return 550000;
  if (income <= 1800000) return income * 0.4 - 100000;
  if (income <= 3600000) return income * 0.3 + 80000;
  if (income <= 6600000) return income * 0.2 + 440000;
  if (income <= 8500000) return income * 0.1 + 1100000;
  return 1950000;
}

/** 누진소득세 계산 */
function calcProgressiveTax(taxable: number): number {
  const brackets: [number, number, number][] = [
    [1950000, 0.05, 0],
    [3300000, 0.1, 97500],
    [6950000, 0.2, 427500],
    [9000000, 0.23, 636000],
    [18000000, 0.33, 1536000],
    [40000000, 0.4, 2796000],
    [Infinity, 0.45, 4796000],
  ];
  for (const [limit, rate, deduction] of brackets) {
    if (taxable <= limit) {
      return Math.round(taxable * rate - deduction);
    }
  }
  return 0;
}

/** 토치기현 기준 기본 생활비 */
export function getDefaultBudget(): BudgetCategory[] {
  return [
    { id: "rent", label: "집세 (가賃)", amount: 45000, icon: "🏠" },
    { id: "food", label: "식비 (食費)", amount: 30000, icon: "🍱" },
    { id: "utilities", label: "공과금 (光熱費)", amount: 10000, icon: "💡" },
    { id: "phone", label: "통신비 (通信費)", amount: 5000, icon: "📱" },
    { id: "transport", label: "교통비 (交通費)", amount: 10000, icon: "🚗" },
    { id: "insurance", label: "보험/연금 (天引)", amount: 0, icon: "🏥" },
    { id: "daily", label: "일용품 (日用品)", amount: 5000, icon: "🧴" },
    { id: "entertainment", label: "여가/취미 (娯楽)", amount: 15000, icon: "🎮" },
    { id: "savings", label: "저축/송금 (貯金)", amount: 30000, icon: "💰" },
  ];
}

/** 환율 수동 변환 */
export function convertCurrency(
  amount: number,
  rate: number,
  direction: "krw-to-jpy" | "jpy-to-krw"
): number {
  if (direction === "krw-to-jpy") {
    return Math.round(amount / rate);
  }
  return Math.round(amount * rate);
}
