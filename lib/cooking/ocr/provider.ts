export interface ReceiptOcrProvider {
  extractText(image: Buffer, mimeType: string): Promise<string[]>;
}

export class ReceiptOcrError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAVAILABLE" | "TIMEOUT" | "NO_TEXT" | "PROVIDER_ERROR",
  ) {
    super(message);
    this.name = "ReceiptOcrError";
  }
}
