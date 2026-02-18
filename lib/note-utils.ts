import type { Note } from "./types";

/** memo 필드에서 해시태그를 추출 (예: #품질, #부품) */
export function extractTags(memo?: string): string[] {
  if (!memo) return [];
  const matches = memo.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? [...new Set(matches.map((t) => t.slice(1)))] : [];
}

/** 전체 노트에서 고유 태그 목록 추출 (빈도순 정렬) */
export function getUniqueTags(notes: Note[]): string[] {
  const freq: Record<string, number> = {};
  for (const note of notes) {
    for (const tag of extractTags(note.memo)) {
      freq[tag] = (freq[tag] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

/** 특정 태그를 포함하는 노트 필터링 */
export function filterByTag(notes: Note[], tag: string): Note[] {
  return notes.filter((n) => extractTags(n.memo).includes(tag));
}
