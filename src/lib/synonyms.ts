/**
 * 同义词 / 拼音首字母轻量映射，配合 fuse 提升检索召回。
 * Meilisearch 等全量搜索引擎列为后续能力（见 README）。
 */

/** 同义簇：任一成员命中则扩展查询到整簇 */
export const SYNONYM_CLUSTERS: string[][] = [
  ["阿司匹林", "乙酰水杨酸", "aspirin", "asa", "acetylsalicylic acid", "2-acetoxybenzoic acid"],
  ["布洛芬", "异丁苯丙酸", "ibuprofen"],
  ["水杨酸", "salicylic acid", "2-hydroxybenzoic acid"],
  ["ndma", "n-亚硝基二甲胺", "n-nitrosodimethylamine", "亚硝胺"],
  ["对羟基苯甲酸", "4-hydroxybenzoic acid", "4-hba"],
];

/** 常见中文名 → 拼音首字母（手写轻量表；其余用 pinyin-pro 运行时生成） */
export const PINYIN_INITIALS: Record<string, string> = {
  阿司匹林: "aspl",
  乙酰水杨酸: "yxsys",
  布洛芬: "blf",
  异丁苯丙酸: "ydbbs",
  水杨酸: "sys",
  对羟基苯甲酸: "dqyjbs",
};

export function expandQueryWithSynonyms(q: string): string[] {
  const raw = q.trim().toLowerCase();
  if (!raw) return [];
  const extras = new Set<string>([q.trim(), raw]);
  for (const cluster of SYNONYM_CLUSTERS) {
    const hit = cluster.some(
      (t) =>
        raw === t.toLowerCase() ||
        raw.includes(t.toLowerCase()) ||
        t.toLowerCase().includes(raw)
    );
    if (hit) {
      for (const t of cluster) extras.add(t);
    }
  }
  return Array.from(extras);
}

export function matchPinyinInitials(text: string | undefined, q: string): boolean {
  if (!text || !q) return false;
  const qq = q.trim().toLowerCase().replace(/\s+/g, "");
  if (!qq || !/^[a-z]+$/.test(qq)) return false;
  const mapped = PINYIN_INITIALS[text];
  if (mapped && mapped.includes(qq)) return true;
  return false;
}
