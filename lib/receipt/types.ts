export interface GeneralReceiptItem {
  rawText: string;
  name: string;
  lineIndex: number;
  amount?: number;
}

export interface GeneralReceiptTransaction {
  merchantName: string;
  purchasedItems: GeneralReceiptItem[];
  date: string;
  time?: string;
  totalAmount: number;
  detectedPaymentMethod?: string;
  confidence: number;
  warnings: string[];
}
