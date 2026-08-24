export interface ExpenseReceiptDraft {
  date: string;
  type: "지출";
  merchantName: string;
  purchasedItems: string[];
  originalMerchantName: string;
  originalPurchasedItems: string[];
  totalAmount: number;
  entries: ExpenseReceiptEntryDraft[];
  paymentMethod: string;
  memo: string;
  confidence: number;
  warnings: string[];
}

export interface ExpenseReceiptEntryDraft {
  id: string;
  category: string;
  itemNames: string[];
  originalItemNames: string[];
  description: string;
  amount: number;
}

export interface ExpenseReceiptConfirmResult {
  rowIds: string[];
  rows: Array<Array<string | number | boolean>>;
}

export interface ExpenseClassificationGuide {
  criterion: string;
  category: string;
  example: string;
  note: string;
}

export interface ExpenseSheetOptions {
  categories: string[];
  paymentMethods: string[];
  defaultCategory: string;
  defaultPaymentMethod: string;
  classificationGuide: ExpenseClassificationGuide[];
}

export interface ExpenseReceiptParseResponse {
  draft: ExpenseReceiptDraft;
  options: ExpenseSheetOptions;
}
