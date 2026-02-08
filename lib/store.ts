import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data", "user");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory might already exist or permission denied
  }
}

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

export async function readStore<T>(name: string, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const raw = await fs.readFile(filePath(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeStore<T>(name: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath(name), JSON.stringify(data, null, 2), "utf-8");
}
