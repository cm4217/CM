import { LS_NOTES } from "./storageKeys";

export type NoteEntry = {
  targetKind: "substance" | "impurity";
  targetId: string;
  methodCode?: string;
  body: string;
  updatedAt: string;
};

export type NotesStore = Record<string, NoteEntry>;

function keyOf(kind: string, id: string) {
  return `${kind}:${id}`;
}

export function loadNotes(): NotesStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_NOTES);
    if (!raw) return {};
    return JSON.parse(raw) as NotesStore;
  } catch {
    return {};
  }
}

export function saveNotes(store: NotesStore) {
  localStorage.setItem(LS_NOTES, JSON.stringify(store));
}

export function getNote(
  kind: "substance" | "impurity",
  id: string
): NoteEntry | undefined {
  return loadNotes()[keyOf(kind, id)];
}

export function upsertNote(
  kind: "substance" | "impurity",
  id: string,
  patch: { methodCode?: string; body: string }
): NoteEntry {
  const store = loadNotes();
  const entry: NoteEntry = {
    targetKind: kind,
    targetId: id,
    methodCode: patch.methodCode || "",
    body: patch.body,
    updatedAt: new Date().toISOString(),
  };
  store[keyOf(kind, id)] = entry;
  saveNotes(store);
  return entry;
}

export function deleteNote(kind: "substance" | "impurity", id: string) {
  const store = loadNotes();
  delete store[keyOf(kind, id)];
  saveNotes(store);
}

export function exportNotesJson(): string {
  return JSON.stringify(loadNotes(), null, 2);
}

export function importNotesJson(json: string): NotesStore {
  const parsed = JSON.parse(json) as NotesStore;
  if (!parsed || typeof parsed !== "object") throw new Error("无效 JSON");
  saveNotes(parsed);
  return parsed;
}
