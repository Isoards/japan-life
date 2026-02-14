import type { TicketMilestone, TicketMilestoneType, ShowTime } from "./userConcerts";
import { MILESTONE_LABELS } from "./userConcerts";

// ── Parsed draft returned by the parser ──

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

// ── Milestone keyword → type mapping ──

const MILESTONE_KEYWORDS: [RegExp, TicketMilestoneType][] = [
  [/FC先行.*(?:開始|受付|スタート)/i, "FC_LOTTERY_OPEN"],
  [/(?:ファンクラブ|FC).*(?:締切|終了|まで)/i, "FC_LOTTERY_CLOSE"],
  [/(?:FC|ファンクラブ).*(?:先行|抽選)/i, "FC_LOTTERY_OPEN"],
  [/当落(?:発表|結果)/i, "FC_RESULT"],
  [/抽選結果/i, "FC_RESULT"],
  [/オフィシャル.*(?:先行|受付).*(?:開始|スタート)/i, "OFFICIAL_LOTTERY_OPEN"],
  [/オフィシャル.*(?:締切|終了|まで)/i, "OFFICIAL_LOTTERY_CLOSE"],
  [/(?:オフィシャル|公式).*(?:結果|発表)/i, "OFFICIAL_RESULT"],
  [/(?:プレリク|プレオーダー)/i, "OFFICIAL_LOTTERY_OPEN"],
  [/一般(?:発売|販売)/i, "GENERAL_SALE_OPEN"],
  [/先着/i, "GENERAL_SALE_OPEN"],
  [/(?:入金|支払|決済).*(?:期間|期限|締切|まで)/i, "PAYMENT_DEADLINE"],
  [/(?:発券|受取|電子チケット|表示).*(?:開始)/i, "TICKET_ISSUE_OPEN"],
  [/開場/i, "SHOW_DOOR_OPEN"],
  [/開演/i, "SHOW_START"],
];

// ── Venue suffix patterns ──

const VENUE_PATTERNS = /(?:.*(?:ホール|ドーム|アリーナ|HALL|ARENA|DOME|劇場|会館|武道館|体育館|スタジアム|センター|シアター|ライブハウス))/i;

// ── Major Japanese cities ──

const CITIES = [
  "東京", "大阪", "名古屋", "福岡", "札幌", "横浜", "仙台", "広島",
  "神戸", "京都", "さいたま", "千葉", "新潟", "静岡", "浜松", "岡山",
  "熊本", "鹿児島", "長崎", "金沢", "高松", "松山", "那覇", "宇都宮",
  "盛岡", "秋田", "青森", "旭川", "函館",
];

// ── Date extraction patterns ──

// Full date: 2026年3月5日(木) or 2026/3/5(木)
const FULL_DATE_RE = /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?(?:\s*[\(（]([日月火水木金土])[\)）])?/g;

// Short date without year: 3/5(木) or 3月5日
const SHORT_DATE_RE = /(?<!\d[\/\-])(\d{1,2})[\/月](\d{1,2})日?(?:\s*[\(（]([日月火水木金土])[\)）])?/g;

// Time: HH:MM
const TIME_RE = /(\d{1,2}):(\d{2})/;

// Price: ¥1,234 or 1,234円
const PRICE_RE = /(?:¥|￥)[\s]*([\d,]+)|(\d{1,3}(?:,\d{3})+)[\s]*円/;

// ── Helpers ──

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function extractNearestDate(
  text: string,
  hintYear: number,
): { date: string; time?: string } | null {
  // Try full date first
  const fullMatch = /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/.exec(text);
  if (fullMatch) {
    const date = `${fullMatch[1]}-${pad(+fullMatch[2])}-${pad(+fullMatch[3])}`;
    const timeMatch = TIME_RE.exec(text);
    return { date, time: timeMatch ? `${pad(+timeMatch[1])}:${timeMatch[2]}` : undefined };
  }

  // Try short date
  const shortMatch = /(?<!\d[\/\-])(\d{1,2})[\/月](\d{1,2})/.exec(text);
  if (shortMatch) {
    const date = `${hintYear}-${pad(+shortMatch[1])}-${pad(+shortMatch[2])}`;
    const timeMatch = TIME_RE.exec(text);
    return { date, time: timeMatch ? `${pad(+timeMatch[1])}:${timeMatch[2]}` : undefined };
  }

  return null;
}

// ── Main parser ──

export function parseConcertAnnouncement(text: string): ParsedConcertDraft {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const hintYear = new Date().getFullYear();

  // ── Title: first non-empty line or line with keywords ──
  let title = "";
  const titleKeywords = /(?:ツアー|コンサート|LIVE|TOUR|公演|ライブ|ワンマン)/i;
  for (const line of lines) {
    if (titleKeywords.test(line)) {
      title = line;
      break;
    }
  }
  if (!title && lines.length > 0) {
    title = lines[0];
  }

  // ── Artist: difficult to extract reliably, leave empty ──
  const artist = "";

  // ── Venue ──
  let venue = "";
  for (const line of lines) {
    const venueMatch = line.match(VENUE_PATTERNS);
    if (venueMatch) {
      venue = venueMatch[0].trim();
      break;
    }
  }

  // ── City ──
  let city = "";
  for (const c of CITIES) {
    if (text.includes(c)) {
      city = c;
      break;
    }
  }

  // ── Price ──
  let ticketPrice: number | undefined;
  const priceMatch = text.match(PRICE_RE);
  if (priceMatch) {
    const raw = (priceMatch[1] || priceMatch[2]).replace(/,/g, "");
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0) ticketPrice = val;
  }

  // ── ShowTimes: extract all full dates that appear in show/performance context ──
  const showTimes: ShowTime[] = [];
  const allFullDates: { date: string; time?: string; line: string }[] = [];

  for (const line of lines) {
    let match: RegExpExecArray | null;
    const re = new RegExp(FULL_DATE_RE.source, "g");
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

  // Dates near 開演/開場/公演 are show dates
  for (const fd of allFullDates) {
    if (/(?:開演|開場|公演|会場)/.test(fd.line) || allFullDates.length <= 3) {
      showTimes.push({ date: fd.date, time: fd.time });
    }
  }

  // ── Milestones ──
  const milestones: TicketMilestone[] = [];
  const usedTypes = new Set<string>();

  for (const line of lines) {
    for (const [pattern, type] of MILESTONE_KEYWORDS) {
      if (pattern.test(line) && !usedTypes.has(type)) {
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
        } else {
          // Check next line for date
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
            } else {
              warnings.push(`"${type}" 키워드를 찾았지만 날짜를 추출할 수 없습니다.`);
            }
          }
        }
      }
    }
  }

  // ── Date range handling: detect 〜/～/- ranges for lottery periods ──
  const rangeRe = /(\d{1,2})[\/月](\d{1,2})日?\s*[〜～\-]\s*(\d{1,2})[\/月](\d{1,2})日?/g;
  let rangeMatch: RegExpExecArray | null;
  while ((rangeMatch = rangeRe.exec(text)) !== null) {
    const startDate = `${hintYear}-${pad(+rangeMatch[1])}-${pad(+rangeMatch[2])}`;
    const endDate = `${hintYear}-${pad(+rangeMatch[3])}-${pad(+rangeMatch[4])}`;

    // Find the line containing this range
    const contextLine = lines.find((l) => l.includes(rangeMatch![0])) ?? "";

    // Determine what type of period this is
    let openType: TicketMilestoneType | null = null;
    let closeType: TicketMilestoneType | null = null;

    if (/(?:FC|ファンクラブ)/.test(contextLine)) {
      openType = "FC_LOTTERY_OPEN";
      closeType = "FC_LOTTERY_CLOSE";
    } else if (/(?:オフィシャル|公式)/.test(contextLine)) {
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

  // Sort milestones by date
  milestones.sort((a, b) => a.date.localeCompare(b.date));

  // ── Warnings ──
  if (!title) warnings.push("제목을 추출할 수 없습니다.");
  if (!venue) warnings.push("장소를 추출할 수 없습니다.");
  if (showTimes.length === 0) warnings.push("공연 날짜를 추출할 수 없습니다.");
  if (milestones.length === 0) warnings.push("티켓 일정(마일스톤)을 추출할 수 없습니다.");

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
