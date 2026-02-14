import type { ShowTime, TicketMilestone, TicketMilestoneType } from "./userConcerts";
import { MILESTONE_LABELS } from "./userConcerts";

export interface ParsedConcertDraft {
  title: string;
  artist: string;
  venue: string;
  city: string;
  ticketPrice?: number;
  showTimes: ShowTime[];
  milestones: TicketMilestone[];
  rawText: string;
  warnings: string[];
}

const MILESTONE_KEYWORDS: [RegExp, TicketMilestoneType][] = [
  [/(?:FC).*(?:受付|エントリー|申込|抽選)/i, "FC_LOTTERY_OPEN"],
  [/(?:FC).*(?:締切|終了|応募終了)/i, "FC_LOTTERY_CLOSE"],
  [/(?:FC).*(?:結果|当落|当選)/i, "FC_RESULT"],
  [/(?:オフィシャル|先行).*(?:受付|抽選|申込)/i, "OFFICIAL_LOTTERY_OPEN"],
  [/(?:オフィシャル|先行).*(?:締切|終了)/i, "OFFICIAL_LOTTERY_CLOSE"],
  [/(?:オフィシャル|先行).*(?:結果|当落|当選)/i, "OFFICIAL_RESULT"],
  [/(?:一般発売|一般販売|販売開始)/i, "GENERAL_SALE_OPEN"],
  [/(?:入金|支払|決済).*(?:期限|締切)/i, "PAYMENT_DEADLINE"],
  [/(?:発券|チケット).*(?:開始|受取|発行)/i, "TICKET_ISSUE_OPEN"],
  [/(?:開場)/i, "SHOW_DOOR_OPEN"],
  [/(?:開演)/i, "SHOW_START"],
];

const VENUE_PATTERNS = /(?:.*(?:ホール|アリーナ|ドーム|会館|劇場|スタジアム|HALL|ARENA|DOME|STADIUM))/i;

const CITIES = [
  "東京",
  "大阪",
  "名古屋",
  "札幌",
  "福岡",
  "仙台",
  "横浜",
  "神戸",
  "京都",
  "広島",
  "新潟",
  "千葉",
  "埼玉",
  "静岡",
  "金沢",
  "熊本",
  "那覇",
];

const FULL_DATE_RE = /(\d{4})[년./\-]\s*(\d{1,2})[월./\-]\s*(\d{1,2})\s*일?(?:\s*[（(]([월화수목금토일])?[)）])?/g;
const TIME_RE = /(\d{1,2}):(\d{2})/;
const PRICE_RE = /(?:¥|￥|円)\s*([\d,]+)|(\d{1,3}(?:,\d{3})+)\s*(?:円|엔)/;

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function extractNearestDate(text: string, hintYear: number): { date: string; time?: string } | null {
  const fullMatch = /(\d{4})[년./\-]\s*(\d{1,2})[월./\-]\s*(\d{1,2})/.exec(text);
  if (fullMatch) {
    const date = `${fullMatch[1]}-${pad(+fullMatch[2])}-${pad(+fullMatch[3])}`;
    const timeMatch = TIME_RE.exec(text);
    return { date, time: timeMatch ? `${pad(+timeMatch[1])}:${timeMatch[2]}` : undefined };
  }

  const shortMatch = /(?<!\d[\/\-])(\d{1,2})[\/.\-월]\s*(\d{1,2})/.exec(text);
  if (shortMatch) {
    const date = `${hintYear}-${pad(+shortMatch[1])}-${pad(+shortMatch[2])}`;
    const timeMatch = TIME_RE.exec(text);
    return { date, time: timeMatch ? `${pad(+timeMatch[1])}:${timeMatch[2]}` : undefined };
  }

  return null;
}

export function parseConcertAnnouncement(text: string): ParsedConcertDraft {
  const warnings: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const hintYear = new Date().getFullYear();

  let title = "";
  const titleKeywords = /(?:LIVE|TOUR|公演|ワンマン|フェス|CONCERT)/i;
  for (const line of lines) {
    if (titleKeywords.test(line)) {
      title = line;
      break;
    }
  }
  if (!title && lines.length > 0) {
    title = lines[0];
  }

  const artist = "";

  let venue = "";
  for (const line of lines) {
    const venueMatch = line.match(VENUE_PATTERNS);
    if (venueMatch) {
      venue = venueMatch[0].trim();
      break;
    }
  }

  let city = "";
  for (const c of CITIES) {
    if (text.includes(c)) {
      city = c;
      break;
    }
  }

  let ticketPrice: number | undefined;
  const priceMatch = text.match(PRICE_RE);
  if (priceMatch) {
    const raw = (priceMatch[1] || priceMatch[2]).replace(/,/g, "");
    const val = parseInt(raw, 10);
    if (!Number.isNaN(val) && val > 0) ticketPrice = val;
  }

  const showTimes: ShowTime[] = [];
  const allFullDates: { date: string; time?: string; line: string }[] = [];

  for (const line of lines) {
    const re = new RegExp(FULL_DATE_RE.source, "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      const dateStr = `${match[1]}-${pad(+match[2])}-${pad(+match[3])}`;
      const timeMatch = TIME_RE.exec(line.slice(match.index));
      allFullDates.push({
        date: dateStr,
        time: timeMatch ? `${pad(+timeMatch[1])}:${timeMatch[2]}` : undefined,
        line,
      });
    }
  }

  for (const fd of allFullDates) {
    if (/(?:開演|開場|公演|LIVE)/i.test(fd.line) || allFullDates.length <= 3) {
      showTimes.push({ date: fd.date, time: fd.time });
    }
  }

  const milestones: TicketMilestone[] = [];
  const usedTypes = new Set<string>();

  for (const line of lines) {
    for (const [pattern, type] of MILESTONE_KEYWORDS) {
      if (!pattern.test(line) || usedTypes.has(type)) continue;

      const dateInfo = extractNearestDate(line, hintYear);
      if (dateInfo) {
        milestones.push({
          id: genId("ms"),
          type,
          label: MILESTONE_LABELS[type],
          date: dateInfo.date,
          time: dateInfo.time,
          status: "planned",
        });
        usedTypes.add(type);
        continue;
      }

      const lineIdx = lines.indexOf(line);
      if (lineIdx >= 0 && lineIdx < lines.length - 1) {
        const nextDateInfo = extractNearestDate(lines[lineIdx + 1], hintYear);
        if (nextDateInfo) {
          milestones.push({
            id: genId("ms"),
            type,
            label: MILESTONE_LABELS[type],
            date: nextDateInfo.date,
            time: nextDateInfo.time,
            status: "planned",
          });
          usedTypes.add(type);
          continue;
        }
      }

      warnings.push(`"${type}" 키워드는 감지했지만 날짜를 추출하지 못했습니다.`);
    }
  }

  const rangeRe = /(\d{1,2})[\/.\-월]\s*(\d{1,2})\s*[~〜\-]\s*(\d{1,2})[\/.\-월]\s*(\d{1,2})/g;
  let rangeMatch: RegExpExecArray | null;
  while ((rangeMatch = rangeRe.exec(text)) !== null) {
    const startDate = `${hintYear}-${pad(+rangeMatch[1])}-${pad(+rangeMatch[2])}`;
    const endDate = `${hintYear}-${pad(+rangeMatch[3])}-${pad(+rangeMatch[4])}`;

    const contextLine = lines.find((l) => l.includes(rangeMatch?.[0] ?? "")) ?? "";

    let openType: TicketMilestoneType | null = null;
    let closeType: TicketMilestoneType | null = null;

    if (/(?:FC)/i.test(contextLine)) {
      openType = "FC_LOTTERY_OPEN";
      closeType = "FC_LOTTERY_CLOSE";
    } else if (/(?:オフィシャル|先行)/i.test(contextLine)) {
      openType = "OFFICIAL_LOTTERY_OPEN";
      closeType = "OFFICIAL_LOTTERY_CLOSE";
    }

    if (openType && !usedTypes.has(openType)) {
      milestones.push({
        id: genId("ms"),
        type: openType,
        label: MILESTONE_LABELS[openType],
        date: startDate,
        status: "planned",
      });
      usedTypes.add(openType);
    }

    if (closeType && !usedTypes.has(closeType)) {
      milestones.push({
        id: genId("ms"),
        type: closeType,
        label: MILESTONE_LABELS[closeType],
        date: endDate,
        status: "planned",
      });
      usedTypes.add(closeType);
    }
  }

  milestones.sort((a, b) => a.date.localeCompare(b.date));

  if (!title) warnings.push("제목을 추출하지 못했습니다.");
  if (!venue) warnings.push("장소를 추출하지 못했습니다.");
  if (showTimes.length === 0) warnings.push("공연 일시를 추출하지 못했습니다.");
  if (milestones.length === 0) warnings.push("티켓 마일스톤을 추출하지 못했습니다.");

  return {
    title,
    artist,
    venue,
    city,
    ticketPrice,
    showTimes,
    milestones,
    rawText: text,
    warnings,
  };
}
