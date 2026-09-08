/**
 * 同义词 / 拼音首字母轻量映射，配合 fuse 提升检索召回。
 * Meilisearch 等全量搜索引擎列为后续能力（见 README）。
 */

/** 同义簇：任一成员命中则扩展查询到整簇 */
export const SYNONYM_CLUSTERS: string[][] = [
  ["阿司匹林", "乙酰水杨酸", "aspirin", "asa", "acetylsalicylic acid", "2-acetoxybenzoic acid"],
  ["布洛芬", "异丁苯丙酸", "ibuprofen"],
  ["对乙酰氨基酚", "扑热息痛", "paracetamol", "acetaminophen", "apap", "对羟基乙酰苯胺"],
  ["奥美拉唑", "omeprazole", "omeprazolum"],
  ["阿莫西林", "羟氨苄青霉素", "amoxicillin", "amoxycillin"],
  ["甲硝唑", "灭滴灵", "metronidazole"],
  ["二甲双胍", "甲福明", "metformin"],
  ["阿托伐他汀", "atorvastatin"],
  ["氨氯地平", "amlodipine"],
  ["氯沙坦", "losartan"],
  ["雷尼替丁", "呋喃硝胺", "ranitidine", "zantac"],
  ["卡马西平", "酰胺咪嗪", "carbamazepine"],
  ["苯妥英", "大仑丁", "phenytoin", "diphenylhydantoin"],
  ["地塞米松", "氟美松", "dexamethasone"],
  ["氢化可的松", "皮质醇", "hydrocortisone", "cortisol"],
  ["维生素c", "维生素C", "抗坏血酸", "ascorbic acid", "vitamin c"],
  ["咖啡因", "咖啡碱", "caffeine"],
  ["茶碱", "theophylline"],
  ["左氧氟沙星", "左旋氧氟沙星", "levofloxacin"],
  ["头孢氨苄", "头孢力新", "cefalexin", "cephalexin"],
  ["青霉素g", "青霉素G", "苄青霉素", "benzylpenicillin", "penicillin g", "青霉素"],
  ["双氯芬酸", "双氯灭痛", "diclofenac"],
  ["辛伐他汀", "simvastatin"],
  ["环丙沙星", "环丙氟哌酸", "ciprofloxacin"],
  ["华法林", "丙酮苄羟香豆素", "warfarin"],
  ["呋塞米", "速尿", "furosemide", "frusemide"],
  ["卡托普利", "captopril"],
  ["肝素", "heparin"],
  ["氯化钠", "nacl", "sodium chloride", "食盐"],
  ["乳糖", "lactose", "milk sugar"],
  ["水杨酸", "salicylic acid", "2-hydroxybenzoic acid"],
  ["ndma", "n-亚硝基二甲胺", "n-nitrosodimethylamine", "亚硝胺"],
  ["ndea", "n-亚硝基二乙胺", "n-nitrosodiethylamine"],
  ["对羟基苯甲酸", "4-hydroxybenzoic acid", "4-hba"],
  ["4-氨基苯酚", "对氨基酚", "4-aminophenol"],
  ["甲醇", "methanol"],
  ["二氯甲烷", "dichloromethane", "methylene chloride"],
];

/** 常见中文名 → 拼音首字母（手写轻量表；其余用 pinyin-pro 运行时生成） */
export const PINYIN_INITIALS: Record<string, string> = {
  阿司匹林: "aspl",
  乙酰水杨酸: "yxsys",
  布洛芬: "blf",
  异丁苯丙酸: "ydbbs",
  对乙酰氨基酚: "dyxamap",
  扑热息痛: "prxt",
  奥美拉唑: "amlz",
  阿莫西林: "amxl",
  甲硝唑: "jxz",
  二甲双胍: "ejsg",
  阿托伐他汀: "atftt",
  氨氯地平: "aldp",
  氯沙坦: "lst",
  雷尼替丁: "lntd",
  卡马西平: "kmxp",
  苯妥英: "bty",
  地塞米松: "dsms",
  氢化可的松: "qhkds",
  维生素C: "wssc",
  抗坏血酸: "khxs",
  咖啡因: "kfy",
  茶碱: "cj",
  左氧氟沙星: "zyfsx",
  头孢氨苄: "tbab",
  青霉素G: "qmsg",
  双氯芬酸: "slfs",
  辛伐他汀: "xftt",
  环丙沙星: "hbsx",
  华法林: "hfl",
  呋塞米: "fsm",
  卡托普利: "ktpl",
  肝素: "gs",
  氯化钠: "lhn",
  乳糖: "rt",
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
