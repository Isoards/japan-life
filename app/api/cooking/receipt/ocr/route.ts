import { NextRequest, NextResponse } from "next/server";
import { getReceiptOcrProvider, ReceiptOcrError } from "@/lib/cooking/ocr";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json({ error: "영수증 사진을 선택해 주세요." }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return NextResponse.json({ error: "JPG, PNG 또는 WebP 이미지를 사용해 주세요." }, { status: 415 });
    }
    if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "사진은 10MB 이하로 선택해 주세요." }, { status: 413 });
    }

    const lines = await getReceiptOcrProvider().extractText(Buffer.from(await image.arrayBuffer()), image.type);
    return NextResponse.json({ lines });
  } catch (error) {
    if (error instanceof ReceiptOcrError) {
      const status = error.code === "UNAVAILABLE" ? 503 : error.code === "NO_TEXT" ? 422 : error.code === "TIMEOUT" ? 504 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "영수증 이미지를 처리하지 못했습니다." }, { status: 500 });
  }
}
