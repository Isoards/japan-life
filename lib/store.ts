import { promises as fs } from "fs";
import path from "path";
import os from "os";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data", "user");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_BACKUPS = 7;

// ── 스키마 버전 & 마이그레이션 ──

type Migration = (data: unknown) => unknown;

/** 스토어별 현재 버전 & 마이그레이션 맵 */
const STORE_VERSIONS: Record<string, number> = {
  budget: 3,
  checklist: 1,
  notes: 1,
  favorites: 1,
  links: 1,
  "user-concerts": 2,
  logs: 1,
  garbage: 1,
  packages: 1,
};

/**
 * 마이그레이션 함수: migrations[storeName][fromVersion] → 다음 버전 데이터
 * 예: budget v1 → v2: sheetCategories 필드 보장
 */
const MIGRATIONS: Record<string, Record<number, Migration>> = {
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
