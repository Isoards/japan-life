import { GoogleCloudVisionReceiptOcrProvider } from "./google-cloud-vision";
import type { ReceiptOcrProvider } from "./provider";

export function getReceiptOcrProvider(): ReceiptOcrProvider {
  const provider = (process.env.RECEIPT_OCR_PROVIDER ?? "google-cloud-vision").toLowerCase();
  if (provider === "google-cloud-vision") return new GoogleCloudVisionReceiptOcrProvider();
  throw new Error(`Unsupported receipt OCR provider: ${provider}`);
}

export { ReceiptOcrError } from "./provider";
export type { ReceiptOcrProvider } from "./provider";
