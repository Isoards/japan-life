import { NextRequest, NextResponse } from "next/server";
import { getReceiptOcrProvider, ReceiptOcrError } from "@/lib/receipt/ocr";
import { readReceiptImage, ReceiptImageError } from "@/lib/receipt/ocr/image-upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const image = await readReceiptImage(await request.formData());
    const lines = await getReceiptOcrProvider().extractText(image.buffer, image.mimeType);
    return NextResponse.json({ lines });
  } catch (error) {
    if (error instanceof ReceiptImageError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ReceiptOcrError) {
      const status = error.code === "UNAVAILABLE" ? 503 : error.code === "NO_TEXT" ? 422 : error.code === "TIMEOUT" ? 504 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "영수증 이미지를 처리하지 못했습니다." }, { status: 500 });
  }
}
