import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { DEFAULT_BUDGET_CATEGORIES } from "./constants/budget";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data", "user");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_BACKUPS = 7;

// ── 스키마 버전 & 마이그레이션 ──

type Migration = (data: unknown) => unknown;

/** 스토어별 현재 버전 & 마이그레이션 맵 */
const STORE_VERSIONS: Record<string, number> = {
  budget: 9,
  checklist: 1,
  notes: 2,
  favorites: 1,
  links: 1,
  "user-concerts": 2,
  garbage: 1,
  packages: 1,
  "cooking-pantry": 2,
  "cooking-cooked": 2,
  "cooking-meal-plan": 1,
};

/**
 * 마이그레이션 함수: migrations[storeName][fromVersion] → 다음 버전 데이터
 * 예: budget v1 → v2: sheetCategories 필드 보장
 */
const MIGRATIONS: Record<string, Record<number, Migration>> = {
  "cooking-pantry": {
    1: (data: unknown) => {
      if (!isPlainObject(data) || !Array.isArray(data.items)) return data;
      return {
        ...data,
        items: data.items.map((item) => {
          const record = item as Record<string, unknown>;
          // 기존 냉동 선택만 보존하고, 나머지는 재료별 자동 기본값으로 전환한다.
          return record.storageLocation === "FREEZER"
            ? record
            : { ...record, storageLocation: undefined };
        }),
      };
    },
  },
  "cooking-cooked": {
    1: (data: unknown) => {
      if (!isPlainObject(data) || !Array.isArray(data.items)) return data;
      return {
        ...data,
        items: data.items.map((item, index) => {
          const record = item as Record<string, unknown>;
          return {
            ...record,
            id: record.id ?? `legacy-${String(record.dishId ?? "dish")}-${String(record.cookedAt ?? index)}`,
          };
        }),
      };
    },
  },
  notes: {
    1: (data: unknown) => {
      if (!Array.isArray(data)) return data;

      // Honda 고유 용어 (회사문화/이름/툴) → business로 병합
      const HONDA_SPECIFIC_JP = [
        "本田技研工業", "三つの喜び", "ワイガヤ", "社内ツール",
        "デンソーテン", "エーアンドデイ",
      ];

      // SW/시험/안전/보안 관련 키워드 → sw
      const SW_JP = [
        "組み込み", "リアルタイム", "タスク", "割り込み", "制御周期",
        "サンプリング周期", "デバッグ", "静的解析", "単体試験", "結合試験",
        "システム試験", "回帰試験", "リリース", "コンパイル", "ビルド",
        "バージョン管理", "差分", "不具合", "原因解析", "対策",
        "機能安全", "ISO 26262", "ASIL", "HARA", "FMEA", "FTA",
        "冗長化", "フェイルセーフ", "ウォッチドッグ",
        "サイバーセキュリティ", "ISO/SAE 21434", "脆弱性", "脅威", "TARA",
        "暗号化", "認証", "OTA",
        "UDS", "OBD", "CAN FD", "LIN", "車載イーサネット",
        "EMC", "ノイズ", "計測", "校正",
      ];

      return data.map((note: Record<string, unknown>) => {
        const cat = note.category as string;
        const jp = (note.japanese as string) || "";

        if (cat === "honda") {
          if (HONDA_SPECIFIC_JP.some((kw) => jp.includes(kw))) {
            return { ...note, category: "business" };
          }
          return { ...note, category: "ev" };
        }

        if (cat === "other") {
          if (SW_JP.some((kw) => jp.includes(kw))) {
            return { ...note, category: "sw" };
          }
          return { ...note, category: "vehicle" };
        }

        return note;
      });
    },
  },
  "user-concerts": {
    1: (data: unknown) => {
      if (!Array.isArray(data)) return data;
      if (data.length > 0 && (data[0] as Record<string, unknown>).showTimes !== undefined) {
        return data; // already migrated
      }
      const now = new Date().toISOString();
      return data.map((c: Record<string, unknown>) => ({
        ...c,
        artist: c.artist ?? "",
        status: c.status ?? "planned",
        showTimes: [],
        milestones: [],
        sources: [],
        createdAt: c.createdAt ?? now,
        updatedAt: c.updatedAt ?? now,
        version: 2,
      }));
    },
  },
  budget: {
    1: (data: unknown) => {
      const d = data as Record<string, unknown>;
      const categories = d.categories as Record<string, unknown>[];
      if (Array.isArray(categories)) {
        d.categories = categories.map((cat) => ({
          ...cat,
          sheetCategories: cat.sheetCategories ?? [],
        }));
      }
      return d;
    },
    2: (data: unknown) => {
      const d = data as Record<string, unknown>;
      d.sinkingFunds = Array.isArray(d.sinkingFunds) ? d.sinkingFunds : [];
      return d;
    },
    3: (data: unknown) => {
      const d = data as Record<string, unknown>;
      const categories = d.categories as Record<string, unknown>[];
      if (Array.isArray(categories)) {
        d.categories = categories.map((cat) => {
          const preset = DEFAULT_BUDGET_CATEGORIES.find((p) => p.id === cat.id);
          if (!preset) return cat;
          return {
            ...cat,
            sheetCategories: preset.sheetCategories,
          };
        });
      }
      return d;
    },
    4: (data: unknown) => {
      const d = data as Record<string, unknown>;
      const categories = d.categories as Record<string, unknown>[];
      if (Array.isArray(categories)) {
        d.categories = categories
          .filter((cat) => cat.id !== "remit")
          .map((cat) => {
            const preset = DEFAULT_BUDGET_CATEGORIES.find((p) => p.id === cat.id);
            if (!preset) return cat;
            return {
              ...cat,
              sheetCategories: preset.sheetCategories,
            };
          });
      }
      return d;
    },
    5: (data: unknown) => {
      const d = data as Record<string, unknown>;
      const categories = Array.isArray(d.categories)
        ? d.categories as Record<string, unknown>[]
        : [];
      const existingById = new Map(categories.map((category) => [String(category.id), category]));

      // 기존에 입력한 예산 금액은 유지하면서, 가계부의 최신 카테고리명으로 매핑을 갱신한다.
      const migrated = DEFAULT_BUDGET_CATEGORIES.map((preset) => {
        const existing = existingById.get(preset.id);
        return existing
          ? { ...existing, label: preset.label, icon: preset.icon, sheetCategories: preset.sheetCategories }
          : { ...preset };
      });

      // 더 이상 지출로 집계하지 않는 NISA는 제외하고, 사용자가 별도로 만든 카테고리는 보존한다.
      const custom = categories.filter((category) => {
        const id = String(category.id);
        return id !== "nisa" && !DEFAULT_BUDGET_CATEGORIES.some((preset) => preset.id === id);
      });
      d.categories = [...migrated, ...custom];
      return d;
    },
    6: (data: unknown) => {
      const d = data as Record<string, unknown>;
      const categories = Array.isArray(d.categories)
        ? d.categories as Record<string, unknown>[]
        : [];
      const existingById = new Map(categories.map((category) => [String(category.id), category]));
      const sourceIdsByTarget: Record<string, string[]> = {
        food: ["food"],
        living: ["fixed", "living", "transport", "other"],
        culture: ["leisure", "shopping", "edu", "social"],
      };

      const migrated = DEFAULT_BUDGET_CATEGORIES.map((preset) => {
        let sources = (sourceIdsByTarget[preset.id] ?? [preset.id])
          .map((id) => existingById.get(id))
          .filter((category): category is Record<string, unknown> => category !== undefined);
        if (sources.length === 0) {
          const existingTarget = existingById.get(preset.id);
          sources = existingTarget ? [existingTarget] : [];
        }
        const amount = sources.length > 0
          ? sources.reduce((sum, category) => sum + (Number(category.amount) || 0), 0)
          : preset.amount;

        return { ...preset, amount };
      });

      const migratedSourceIds = new Set(Object.values(sourceIdsByTarget).flat());
      const custom = categories.filter((category) => {
        const id = String(category.id);
        return id !== "nisa"
          && !migratedSourceIds.has(id)
          && !DEFAULT_BUDGET_CATEGORIES.some((preset) => preset.id === id);
      });
      d.categories = [...migrated, ...custom];
      return d;
    },
    7: (data: unknown) => {
      const d = data as Record<string, unknown>;
      // 대분류 예산을 세부 카테고리에 임의 배분하지 않고, 사용자가 항목별로 설정하게 한다.
      d.categories = DEFAULT_BUDGET_CATEGORIES.map((preset) => ({ ...preset }));
      return d;
    },
    8: (data: unknown) => {
      const d = data as Record<string, unknown>;
      // 설정 시트의 현재 5개 대분류와 예산 진단 권장 상한으로 재구성한다.
      d.income = 228_000;
      d.categories = DEFAULT_BUDGET_CATEGORIES.map((preset) => ({
        ...preset,
        sheetCategories: [...preset.sheetCategories],
      }));
      return d;
    },
  },
};

interface Versioned {
  __version?: number;
  [key: string]: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function applyMigrations(name: string, data: unknown): unknown {
  const target = STORE_VERSIONS[name] ?? 1;
  const versioned = data as Versioned;
  let current = versioned.__version ?? 1;
  let result = data;

  const storeMigrations = MIGRATIONS[name];
  while (current < target && storeMigrations?.[current]) {
    result = storeMigrations[current](result);
    current++;
  }

  (result as Versioned).__version = target;
  return result;
}

// ── 디렉토리 보장 ──

async function ensureDir(dir: string = DATA_DIR) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // already exists or permission denied
  }
}

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

// ── 자동 백업 (최근 MAX_BACKUPS개 보관) ──

async function createBackup(name: string): Promise<void> {
  const src = filePath(name);
  try {
    await fs.access(src);
  } catch {
    return; // 원본 파일이 없으면 백업 불필요
  }

  await ensureDir(BACKUP_DIR);
  const ts = Date.now();
  const dest = path.join(BACKUP_DIR, `${name}-${ts}.json`);

  try {
    await fs.copyFile(src, dest);
  } catch {
    return; // 백업 실패는 무시
  }

  // 오래된 백업 정리
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const prefix = `${name}-`;
    const backups = files
      .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
      .sort()
      .reverse();

    for (const old of backups.slice(MAX_BACKUPS)) {
      await fs.unlink(path.join(BACKUP_DIR, old)).catch(() => {});
    }
  } catch {
    // 정리 실패는 무시
  }
}

// ── 핵심 read / write ──

export async function readStore<T>(name: string, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const raw = await fs.readFile(filePath(name), "utf-8");
    let parsed = JSON.parse(raw);

    // 스키마 마이그레이션 적용
    if (STORE_VERSIONS[name]) {
      parsed = applyMigrations(name, parsed);
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function writeStore<T>(name: string, data: T): Promise<void> {
  await ensureDir();

  // 쓰기 전 자동 백업
  await createBackup(name);

  // 스키마 버전 태깅
  let tagged = data;
  if (STORE_VERSIONS[name] && isPlainObject(data)) {
    tagged = { ...data, __version: STORE_VERSIONS[name] } as T;
  }

  // 원자적 저장: tmp 파일에 쓴 뒤 rename
  const dest = filePath(name);
  const tmp = path.join(os.tmpdir(), `japan-life-${name}-${Date.now()}.tmp`);

  await fs.writeFile(tmp, JSON.stringify(tagged, null, 2), "utf-8");
  try {
    await fs.rename(tmp, dest);
  } catch {
    // rename 실패 시 (크로스 디바이스 등) copyFile + unlink 폴백
    await fs.copyFile(tmp, dest);
    await fs.unlink(tmp).catch(() => {});
  }
}
