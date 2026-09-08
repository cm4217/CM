/**
 * Runtime expandable identity index: drafts + user CSV import.
 * Server-only (node:fs). Client code must import isValidCas from casValidate.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
export { isValidCas } from "./casValidate";

export type { IndexLayer, DraftSubstance, UserImportRecord } from "./indexTypes";
import type { DraftSubstance, UserImportRecord } from "./indexTypes";

const CACHE_DIR = join(process.cwd(), "data", "cache");
const DRAFT_PATH = join(CACHE_DIR, "draft-substances.json");
const USER_PATH = join(CACHE_DIR, "user-import.json");

function ensureCacheDir() {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function readJsonArray<T>(path: string): T[] {
  try {
    if (!existsSync(path)) return [];
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(path: string, rows: T[]) {
  ensureCacheDir();
  writeFileSync(path, JSON.stringify(rows, null, 2) + "\n", "utf8");
}

export function loadDrafts(): DraftSubstance[] {
  return readJsonArray<DraftSubstance>(DRAFT_PATH);
}

export function saveDrafts(rows: DraftSubstance[]) {
  writeJsonArray(DRAFT_PATH, rows);
}

export function loadUserImports(): UserImportRecord[] {
  return readJsonArray<UserImportRecord>(USER_PATH);
}

export function saveUserImports(rows: UserImportRecord[]) {
  writeJsonArray(USER_PATH, rows);
}

export function slugFromIdentity(parts: {
  name?: string;
  nameEn?: string;
  nameZh?: string;
  cas?: string;
  unii?: string;
  prefix: string;
}): string {
  const base = (
    parts.unii ||
    parts.cas ||
    parts.nameEn ||
    parts.nameZh ||
    parts.name ||
    "item"
  )
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${parts.prefix}-${base || Date.now()}`;
}
