const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export class ReceiptImageError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ReceiptImageError";
  }
}

export async function readReceiptImage(formData: FormData): Promise<{ buffer: Buffer; mimeType: string }> {
  const image = formData.get("image");
  if (!(image instanceof File)) throw new ReceiptImageError("영수증 사진을 선택해 주세요.", 400);
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) throw new ReceiptImageError("JPG, PNG 또는 WebP 이미지를 사용해 주세요.", 415);
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) throw new ReceiptImageError("사진은 10MB 이하로 선택해 주세요.", 413);
  return { buffer: Buffer.from(await image.arrayBuffer()), mimeType: image.type };
}
