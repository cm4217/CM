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
  // 中文商品名 ↔ INN / 英文商品名
  ["达菲", "奥司他韦", "oseltamivir", "tamiflu"],
  ["立普妥", "阿托伐他汀", "atorvastatin", "lipitor"],
  ["格华止", "二甲双胍", "甲福明", "metformin", "glucophage"],
  ["络活喜", "氨氯地平", "amlodipine", "norvasc"],
  ["波立维", "氯吡格雷", "clopidogrel", "plavix"],
  ["洛赛克", "奥美拉唑", "omeprazole", "losec", "prilosec"],
  ["耐信", "埃索美拉唑", "esomeprazole", "nexium"],
  ["可定", "瑞舒伐他汀", "rosuvastatin", "crestor"],
  ["舒降之", "辛伐他汀", "simvastatin", "zocor"],
  ["科素亚", "氯沙坦", "losartan", "cozaar"],
  ["代文", "缬沙坦", "valsartan", "diovan"],
  ["倍他乐克", "美托洛尔", "metoprolol", "betaloc"],
  ["康忻", "比索洛尔", "bisoprolol", "concor"],
  ["拜瑞妥", "利伐沙班", "rivaroxaban", "xarelto"],
  ["泰毕全", "达比加群", "dabigatran", "pradaxa"],
  ["艾乐妥", "阿哌沙班", "apixaban", "eliquis"],
  ["万艾可", "西地那非", "sildenafil", "viagra"],
  ["希爱力", "他达拉非", "tadalafil", "cialis"],
  ["顺尔宁", "孟鲁司特", "montelukast", "singulair"],
  ["万托林", "沙丁胺醇", "salbutamol", "albuterol", "ventolin"],
  ["希舒美", "阿奇霉素", "azithromycin", "zithromax"],
  ["可乐必妥", "左氧氟沙星", "levofloxacin", "cravit", "tavanic"],
  ["大扶康", "氟康唑", "fluconazole", "diflucan"],
  ["格列卫", "伊马替尼", "imatinib", "glivec", "gleevec"],
  ["赫赛汀", "曲妥珠单抗", "trastuzumab", "herceptin"],
  ["美罗华", "利妥昔单抗", "rituximab", "mabthera", "rituxan"],
  ["安维汀", "贝伐珠单抗", "bevacizumab", "avastin"],
  ["修美乐", "阿达木单抗", "adalimumab", "humira"],
  ["优甲乐", "左甲状腺素", "levothyroxine", "euthyrox", "synthroid"],
  ["捷诺维", "西他列汀", "sitagliptin", "januvia"],
  ["欧唐静", "恩格列净", "empagliflozin", "jardiance"],
  ["安达唐", "达格列净", "dapagliflozin", "forxiga", "farxiga"],
  ["诺和泰", "索马鲁肽", "司美格鲁肽", "semaglutide", "ozempic"],
  ["来得时", "甘精胰岛素", "insulin glargine", "lantus"],
  ["博路定", "恩替卡韦", "entecavir", "baraclude"],
  ["贺普丁", "拉米夫定", "lamivudine", "epivir"],
  ["韦瑞德", "替诺福韦", "tenofovir", "viread"],
  ["开瑞坦", "氯雷他定", "loratadine", "claritin", "clarityne"],
  ["芬必得", "布洛芬", "ibuprofen", "fenbid", "nurofen"],
  ["泰诺", "对乙酰氨基酚", "扑热息痛", "paracetamol", "acetaminophen", "tylenol"],
  ["扶他林", "双氯芬酸", "diclofenac", "voltaren"],
  ["西乐葆", "塞来昔布", "celecoxib", "celebrex"],
  ["乐瑞卡", "普瑞巴林", "pregabalin", "lyrica"],
  ["安理申", "多奈哌齐", "donepezil", "aricept"],
  ["思瑞康", "喹硫平", "quetiapine", "seroquel"],
  ["再普乐", "奥氮平", "olanzapine", "zyprexa"],
  ["左洛复", "舍曲林", "sertraline", "zoloft"],
  ["百忧解", "百优解", "氟西汀", "fluoxetine", "prozac"],
  ["吗丁啉", "多潘立酮", "domperidone", "motilium"],
  ["沐舒坦", "氨溴索", "ambroxol", "mucosolvan"],
  ["克赛", "依诺肝素", "enoxaparin", "clexane"],
  ["福善美", "阿仑膦酸", "alendronate", "fosamax"],
  ["帕罗韦德", "奈玛特韦", "nirmatrelvir", "paxlovid"],
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
  达菲: "df",
  立普妥: "lpt",
  格华止: "ghz",
  络活喜: "lhx",
  波立维: "blw",
  洛赛克: "lsk",
  耐信: "nx",
  优甲乐: "yjl",
  万艾可: "wak",
  希爱力: "xal",
  顺尔宁: "sen",
  可乐必妥: "klbt",
  希舒美: "xsm",
  格列卫: "glw",
  赫赛汀: "hst",
  修美乐: "xml",
  捷诺维: "jnw",
  欧唐静: "otj",
  诺和泰: "nht",
  博路定: "bld",
  拜瑞妥: "brt",
  泰毕全: "tbq",
  芬必得: "fbd",
  泰诺: "tn",
  扶他林: "ftl",
  乐瑞卡: "lrk",
  安理申: "als",
  思瑞康: "srk",
  开瑞坦: "krt",
  沐舒坦: "mst",
  吗丁啉: "mdl",
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
