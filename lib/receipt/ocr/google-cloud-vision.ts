import { ReceiptOcrError, type ReceiptOcrProvider } from "./provider";

type VisionResponse = {
  responses?: Array<{
    fullTextAnnotation?: { text?: string };
    textAnnotations?: Array<{ description?: string }>;
    error?: { message?: string };
  }>;
};

export class GoogleCloudVisionReceiptOcrProvider implements ReceiptOcrProvider {
  constructor(private readonly apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY) {}

  async extractText(image: Buffer): Promise<string[]> {
    if (!this.apiKey) throw new ReceiptOcrError("OCR 서비스가 설정되지 않았습니다.", "UNAVAILABLE");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(this.apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [{
          image: { content: image.toString("base64") },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: { languageHints: ["ja"] },
        }] }),
        signal: controller.signal,
      });
      if (!response.ok) throw new ReceiptOcrError("OCR 서비스 요청에 실패했습니다.", "PROVIDER_ERROR");
      const data = await response.json() as VisionResponse;
      const result = data.responses?.[0];
      if (result?.error) throw new ReceiptOcrError("OCR 서비스가 이미지를 처리하지 못했습니다.", "PROVIDER_ERROR");
      const text = result?.fullTextAnnotation?.text ?? result?.textAnnotations?.[0]?.description ?? "";
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) throw new ReceiptOcrError("영수증에서 글자를 찾지 못했습니다.", "NO_TEXT");
      return lines;
    } catch (error) {
      if (error instanceof ReceiptOcrError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new ReceiptOcrError("OCR 처리 시간이 초과되었습니다.", "TIMEOUT");
      throw new ReceiptOcrError("OCR 처리 중 오류가 발생했습니다.", "PROVIDER_ERROR");
    } finally {
      clearTimeout(timeout);
    }
  }
}
