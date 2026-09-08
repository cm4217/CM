import type { Substance } from "@/lib/types";
import { mkMonographs } from "./monographHelpers";

/** 示例数据 — SAMPLE/DEMO only · 扩展示例库（约 30 条常见 API/辅料）
 *  部分条目含 epTextNumber / uspDoi 示例深链字段；编号为演示占位，可能 404，需核对官方。
 */
export const substances: Substance[] = [
  {
    id: "sub-aspirin",
    nameZh: "阿司匹林",
    nameEn: "Aspirin",
    inn: "Acetylsalicylic acid",
    cas: "50-78-2",
    unii: "R16CO5Y76E",
    /** 真实 Ph. Eur. Acetylsalicylic acid text number（需订阅/登录） */
    epTextNumber: "0309",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_aspirin_01_01",
    phIntDocPath: "Jb.6.1.5", // 国际药典 acetylsalicylic acid 示例专论路径
    smiles: "CC(=O)OC1=CC=CC=C1C(=O)O",
    inchiKey: "BSYNRYMUTXBXSQ-UHFFFAOYSA-N",
    molecularFormula: "C9H8O4",
    aliases: ["乙酰水杨酸", "ASA", "2-Acetoxybenzoic acid"],
    type: "API",
    summaryZh:
      "解热镇痛抗炎药。本条目为示例索引，收录各药典专论引用与相关杂质对照，不含法定全文。",
    summaryEn:
      "Analgesic/antipyretic API. Demo index entry with monograph refs and impurity links; no statutory full text.",
    monographRefs: mkMonographs(
      "asp",
      "Aspirin",
      "阿司匹林",
      ["ChP", "USP", "EP", "JP", "BP"],
      {
        epTitle: "Acetylsalicylic acid",
        epTextNumber: "0309",
        uspDoi: "10.31003/USPNF_MDEMO_aspirin_01_01",
        idStatus: { EP: "verified", USP: "demo" },
      }
    ),
    relatedImpurityIds: ["imp-salicylic-acid", "imp-aspirin-imp-b", "imp-aspirin-ndma", "imp-methanol", "imp-lead"],
    relatedRSIds: ["rs-usp-aspirin", "rs-edqm-asa", "rs-usp-salicylic", "rs-nifdc-aspirin", "rs-bpcrs-aspirin"],
    fieldProvenance: {
      cas: "seed",
      unii: "seed",
      epTextNumber: "seed",
      uspDoi: "seed",
      nameZh: "seed",
      nameEn: "seed",
    },
    epIdStatus: "verified",
    uspDoiStatus: "demo",
    phIntIdStatus: "demo",
    demoLabel: true,
  },
  {
    id: "sub-ibuprofen",
    nameZh: "布洛芬",
    nameEn: "Ibuprofen",
    inn: "Ibuprofen",
    cas: "15687-27-1",
    unii: "WK2XYI10QM",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2017/0721",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_ibuprofen_01_01",
    smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O",
    inchiKey: "HEFNNWSXXWATRW-UHFFFAOYSA-N",
    molecularFormula: "C13H18O2",
    aliases: ["异丁苯丙酸", "(±)-2-(4-Isobutylphenyl)propionic acid"],
    type: "API",
    summaryZh:
      "非甾体抗炎药。示例条目，展示多药典专论对照、杂质命名交叉与对照品关联。",
    summaryEn:
      "NSAID demo entry illustrating multi-pharmacopoeia refs, impurity naming crosswalk, and RS links.",
    monographRefs: mkMonographs(
      "ibu",
      "Ibuprofen",
      "布洛芬",
      ["ChP", "USP", "EP", "BP", "IP", "Ph.Int."]
    ),
    relatedImpurityIds: ["imp-ibuprofen-imp-f", "imp-ibuprofen-imp-j", "imp-methanol"],
    relatedRSIds: ["rs-usp-ibuprofen", "rs-edqm-ibuprofen", "rs-bpcrs-ibuprofen"],
    demoLabel: true,
  },
  {
    id: "sub-paracetamol",
    nameZh: "对乙酰氨基酚",
    nameEn: "Paracetamol",
    inn: "Paracetamol",
    cas: "103-90-2",
    unii: "362O9ITL9D",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2017/0049",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_paracetamol_01_01",
    smiles: "CC(=O)NC1=CC=C(O)C=C1",
    inchiKey: "RZVAJINKPMORJF-UHFFFAOYSA-N",
    molecularFormula: "C8H9NO2",
    aliases: ["扑热息痛", "Acetaminophen", "APAP", "对羟基乙酰苯胺"],
    type: "API",
    summaryZh:
      "解热镇痛药。示例索引；有关物质常见 4-氨基苯酚等。不含法定全文。",
    summaryEn:
      "Analgesic/antipyretic demo index; related substances include 4-aminophenol. No full monograph text.",
    monographRefs: mkMonographs(
      "pcm",
      "Paracetamol",
      "对乙酰氨基酚",
      ["ChP", "USP", "EP", "JP", "BP"], { epTitle: "Paracetamol" }),
    relatedImpurityIds: ["imp-paracetamol-4ap", "imp-methanol"],
    relatedRSIds: ["rs-usp-paracetamol", "rs-edqm-paracetamol", "rs-nifdc-paracetamol"],
    demoLabel: true,
  },
  {
    id: "sub-omeprazole",
    nameZh: "奥美拉唑",
    nameEn: "Omeprazole",
    inn: "Omeprazole",
    cas: "73590-58-6",
    unii: "KG60484QX9",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2016/1031",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_omeprazole_01_01",
    smiles: "CC1=CN=C(C(=C1OC)C)CS(=O)C2=NC3=C(N2)C=C(C=C3)OC",
    inchiKey: "SUBDBMMJDZJVOS-UHFFFAOYSA-N",
    aliases: ["洛赛克（商品名示例）", "Omeprazolum"],
    type: "API",
    summaryZh:
      "质子泵抑制剂。示例条目，关联砜类杂质等命名交叉演示。",
    summaryEn:
      "PPI demo entry with sulfone-related impurity crosswalk.",
    monographRefs: mkMonographs(
      "ome",
      "Omeprazole",
      "奥美拉唑",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-omeprazole-sulfone", "imp-dichloromethane"],
    relatedRSIds: ["rs-usp-omeprazole", "rs-edqm-omeprazole"],
    demoLabel: true,
  },
  {
    id: "sub-amoxicillin",
    nameZh: "阿莫西林",
    nameEn: "Amoxicillin",
    inn: "Amoxicillin",
    cas: "26787-78-0",
    unii: "9EM05410Q9",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2008/0260",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_amoxicillin_01_01",
    smiles: "CC1(C(N2C(S1)C(C2=O)NC(=O)C(C3=CC=C(C=C3)O)N)C(=O)O)C",
    inchiKey: "LQSIAERXEHWSBT-UHFFFAOYSA-N",
    aliases: ["羟氨苄青霉素", "Amoxycillin"],
    type: "API",
    summaryZh:
      "β-内酰胺类抗生素。示例索引；青霉噻唑酸等降解杂质演示。",
    summaryEn:
      "Beta-lactam antibiotic demo; penicilloic acid degradation impurity demo.",
    monographRefs: mkMonographs(
      "amx",
      "Amoxicillin",
      "阿莫西林",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-amoxicillin-penicilloic", "imp-benzene"],
    relatedRSIds: ["rs-usp-amoxicillin", "rs-edqm-amoxicillin", "rs-nifdc-amoxicillin"],
    demoLabel: true,
  },
  {
    id: "sub-metronidazole",
    nameZh: "甲硝唑",
    nameEn: "Metronidazole",
    inn: "Metronidazole",
    cas: "443-48-1",
    unii: "140QMO216E",
    smiles: "CC1=NC=C(N1CCO)[N+](=O)[O-]",
    inchiKey: "VAOCPAMSLUNLGC-UHFFFAOYSA-N",
    aliases: ["灭滴灵", "Flagyl（商品名示例）"],
    type: "API",
    summaryZh:
      "硝基咪唑类抗厌氧菌/抗原虫药。示例专论索引。",
    summaryEn:
      "Nitroimidazole antimicrobial demo monograph index.",
    monographRefs: mkMonographs(
      "mtz",
      "Metronidazole",
      "甲硝唑",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-metronidazole-rel", "imp-methanol"],
    relatedRSIds: ["rs-usp-metronidazole", "rs-edqm-metronidazole"],
    demoLabel: true,
  },
  {
    id: "sub-metformin",
    nameZh: "二甲双胍",
    nameEn: "Metformin",
    inn: "Metformin",
    cas: "657-24-9",
    unii: "9100L32L2N",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2017/0931",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_metformin_01_01",
    smiles: "CN(C)C(=N)N=C(N)N",
    inchiKey: "XZWYZXLIPXDOLR-UHFFFAOYSA-N",
    molecularFormula: "C4H11N5",
    aliases: ["甲福明", "Metformin hydrochloride（盐型示例）"],
    type: "API",
    summaryZh:
      "双胍类降糖药。示例索引；历史上曾关注亚硝胺相关风险控制（非本条法定限度）。",
    summaryEn:
      "Biguanide antidiabetic demo; historical nitrosamine control attention (not statutory limits here).",
    monographRefs: mkMonographs(
      "met",
      "Metformin",
      "二甲双胍",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-ndma-global", "imp-ndea", "imp-metformin-rel"],
    relatedRSIds: ["rs-usp-metformin", "rs-edqm-metformin", "rs-usp-ndma"],
    demoLabel: true,
  },
  {
    id: "sub-atorvastatin",
    nameZh: "阿托伐他汀",
    nameEn: "Atorvastatin",
    inn: "Atorvastatin",
    cas: "134523-00-5",
    unii: "A0JWA85V8F",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/04/2013/2191",
    smiles: "CC(C)C1=C(C(=C(N1CC[C@H](C[C@H](CC(=O)O)O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4",
    inchiKey: "XUKUURHRXDUEBC-UHFFFAOYSA-N",
    aliases: ["阿托伐他汀钙（盐型示例）", "Lipitor（商品名示例）"],
    type: "API",
    summaryZh:
      "HMG-CoA 还原酶抑制剂。示例多药典专论索引。",
    summaryEn:
      "Statin demo multi-pharmacopoeia index.",
    monographRefs: mkMonographs(
      "atv",
      "Atorvastatin",
      "阿托伐他汀",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-atorvastatin-rel", "imp-methanol"],
    relatedRSIds: ["rs-usp-atorvastatin", "rs-edqm-atorvastatin"],
    demoLabel: true,
  },
  {
    id: "sub-amlodipine",
    nameZh: "氨氯地平",
    nameEn: "Amlodipine",
    inn: "Amlodipine",
    cas: "88150-42-9",
    unii: "1J444QC288",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2017/1491",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_amlodipine_01_01",
    smiles: "CCOC(=O)C1=C(COCCN)NC(C)=C(C(=O)OC)C1C1=CC=CC=C1Cl",
    inchiKey: "HTIQEAQVCYTUBX-UHFFFAOYSA-N",
    aliases: ["络活喜（商品名示例）", "Amlodipine besilate（盐型示例）"],
    type: "API",
    summaryZh:
      "二氢吡啶类钙通道阻滞剂。示例专论索引。",
    summaryEn:
      "DHP calcium-channel blocker demo index.",
    monographRefs: mkMonographs(
      "aml",
      "Amlodipine",
      "氨氯地平",
      ["ChP", "USP", "EP", "BP", "JP"]
    ),
    relatedImpurityIds: ["imp-amlodipine-rel"],
    relatedRSIds: ["rs-usp-amlodipine", "rs-edqm-amlodipine"],
    demoLabel: true,
  },
  {
    id: "sub-losartan",
    nameZh: "氯沙坦",
    nameEn: "Losartan",
    inn: "Losartan",
    cas: "114798-26-4",
    unii: "JMS50MPO89",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_losartan_01_01",
    smiles: "CCCCC1=NC(Cl)=C(CO)N1CC1=CC=C(C=C1)C1=CC=CC=C1C1=NNN=N1",
    inchiKey: "PSIFNNKUMBGKDQ-UHFFFAOYSA-N",
    aliases: ["科素亚（商品名示例）", "Losartan potassium（盐型示例）"],
    type: "API",
    summaryZh:
      "ARB 类抗高血压药。示例索引；历史上曾有亚硝胺杂质召回相关关注（谨慎标注为示例）。",
    summaryEn:
      "ARB antihypertensive demo; historical nitrosamine recall attention (demo caution).",
    monographRefs: mkMonographs(
      "los",
      "Losartan",
      "氯沙坦",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-ndma-global", "imp-ndea", "imp-losartan-azide"],
    relatedRSIds: ["rs-usp-losartan", "rs-edqm-losartan", "rs-usp-ndma"],
    demoLabel: true,
  },
  {
    id: "sub-ranitidine",
    nameZh: "雷尼替丁",
    nameEn: "Ranitidine",
    inn: "Ranitidine",
    cas: "66357-35-5",
    unii: "884KT10YB7",
    smiles: "CNC(=C[N+](=O)[O-])NCCSCC1=CC=C(O1)CN(C)C",
    inchiKey: "VMXUWOKSQIAOTN-UHFFFAOYSA-N",
    aliases: ["呋喃硝胺", "Zantac（历史商品名示例）"],
    type: "API",
    summaryZh:
      "【历史/亚硝胺相关·谨慎标注】H2 受体拮抗剂。全球多地已因 NDMA 风险撤市或限制；本条仅为索引演示，不表示现行可供药用。",
    summaryEn:
      "[Historical / nitrosamine-related caution] H2 antagonist. Widely withdrawn/restricted due to NDMA risk; demo index only, not an endorsement of current medicinal use.",
    monographRefs: mkMonographs(
      "ran",
      "Ranitidine",
      "雷尼替丁",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-ndma-global", "imp-ndea", "imp-ranitidine-rel"],
    relatedRSIds: ["rs-usp-ndma", "rs-usp-ndea"],
    demoLabel: true,
  },
  {
    id: "sub-carbamazepine",
    nameZh: "卡马西平",
    nameEn: "Carbamazepine",
    inn: "Carbamazepine",
    cas: "298-46-4",
    unii: "33CM23913M",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2017/0542",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_carbamazepine_01_01",
    smiles: "NC(=O)N1C2=CC=CC=C2C=CC2=CC=CC=C12",
    inchiKey: "FFGPTBGBLSHEPO-UHFFFAOYSA-N",
    aliases: ["酰胺咪嗪", "Tegretol（商品名示例）"],
    type: "API",
    summaryZh:
      "抗癫痫/心境稳定剂。示例专论索引。",
    summaryEn:
      "Anticonvulsant / mood stabilizer demo index.",
    monographRefs: mkMonographs(
      "cbz",
      "Carbamazepine",
      "卡马西平",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-carbamazepine-rel", "imp-methanol"],
    relatedRSIds: ["rs-usp-carbamazepine", "rs-edqm-carbamazepine"],
    demoLabel: true,
  },
  {
    id: "sub-phenytoin",
    nameZh: "苯妥英",
    nameEn: "Phenytoin",
    inn: "Phenytoin",
    cas: "57-41-0",
    unii: "6158TKW0C5",
    smiles: "O=C1NC(=O)C(N1)(C1=CC=CC=C1)C1=CC=CC=C1",
    inchiKey: "CXOFVDLJLONNDW-UHFFFAOYSA-N",
    aliases: ["大仑丁", "Diphenylhydantoin"],
    type: "API",
    summaryZh:
      "抗癫痫药。示例专论索引与杂质对照演示。",
    summaryEn:
      "Anticonvulsant demo monograph and impurity crosswalk.",
    monographRefs: mkMonographs(
      "pht",
      "Phenytoin",
      "苯妥英",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-phenytoin-rel"],
    relatedRSIds: ["rs-usp-phenytoin", "rs-edqm-phenytoin"],
    demoLabel: true,
  },
  {
    id: "sub-dexamethasone",
    nameZh: "地塞米松",
    nameEn: "Dexamethasone",
    inn: "Dexamethasone",
    cas: "50-02-2",
    unii: "7S5I7G3JQL",
    smiles: "C[C@@H]1C[C@H]2[C@@H]3CCC4=CC(=O)C=C[C@]4(C)[C@@]3(F)[C@@H](O)C[C@]2(C)[C@]1(O)C(=O)CO",
    inchiKey: "UREBDLICKHMUEE-UHFFFAOYSA-N",
    aliases: ["氟美松", "Dexasone"],
    type: "API",
    summaryZh:
      "糖皮质激素。示例多药典专论索引。",
    summaryEn:
      "Glucocorticoid demo multi-pharmacopoeia index.",
    monographRefs: mkMonographs(
      "dex",
      "Dexamethasone",
      "地塞米松",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-dexamethasone-rel"],
    relatedRSIds: ["rs-usp-dexamethasone", "rs-edqm-dexamethasone", "rs-nifdc-dexamethasone"],
    demoLabel: true,
  },
  {
    id: "sub-hydrocortisone",
    nameZh: "氢化可的松",
    nameEn: "Hydrocortisone",
    inn: "Hydrocortisone",
    cas: "50-23-7",
    unii: "WI4X0X7BPJ",
    smiles: "C[C@]12CCC(=O)C=C1CC[C@@H]1[C@@H]2[C@@H](O)C[C@@]2(C)[C@H]1CC[C@]2(O)C(=O)CO",
    inchiKey: "JYGXADMDTFJGBT-UHFFFAOYSA-N",
    aliases: ["皮质醇", "Cortisol"],
    type: "API",
    summaryZh:
      "天然糖皮质激素。示例专论索引。",
    summaryEn:
      "Natural glucocorticoid demo monograph index.",
    monographRefs: mkMonographs(
      "hyc",
      "Hydrocortisone",
      "氢化可的松",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-hydrocortisone-rel"],
    relatedRSIds: ["rs-usp-hydrocortisone", "rs-edqm-hydrocortisone"],
    demoLabel: true,
  },
  {
    id: "sub-ascorbic-acid",
    nameZh: "维生素C",
    nameEn: "Ascorbic acid",
    inn: "Ascorbic acid",
    cas: "50-81-7",
    unii: "PQ6CK8PD0R",
    smiles: "OC[C@H](O)[C@H]1OC(=O)C(O)=C1O",
    inchiKey: "CIWBSHSKHKDKBQ-UHFFFAOYSA-N",
    aliases: ["抗坏血酸", "Vitamin C", "L-Ascorbic acid"],
    type: "API",
    summaryZh:
      "维生素类。亦常作辅料/抗氧剂；本条按 API 示例索引。",
    summaryEn:
      "Vitamin; also used as excipient/antioxidant. Indexed as API demo.",
    monographRefs: mkMonographs(
      "asc",
      "Ascorbic acid",
      "维生素C",
      ["ChP", "USP", "EP", "JP", "BP", "Ph.Int."]
    ),
    relatedImpurityIds: ["imp-ascorbic-oxalic"],
    relatedRSIds: ["rs-usp-ascorbic", "rs-edqm-ascorbic", "rs-nifdc-ascorbic"],
    demoLabel: true,
  },
  {
    id: "sub-caffeine",
    nameZh: "咖啡因",
    nameEn: "Caffeine",
    inn: "Caffeine",
    cas: "58-08-2",
    unii: "3G6A5W338E",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2017/0267",
    smiles: "CN1C=NC2=C1C(=O)N(C)C(=O)N2C",
    inchiKey: "RYYVLZVUVIJVGH-UHFFFAOYSA-N",
    aliases: ["咖啡碱", "1,3,7-Trimethylxanthine"],
    type: "API",
    summaryZh:
      "中枢兴奋药/复方常用成分。示例专论索引。",
    summaryEn:
      "CNS stimulant / combo ingredient demo index.",
    monographRefs: mkMonographs(
      "caf",
      "Caffeine",
      "咖啡因",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-theobromine", "imp-theophylline-rel"],
    relatedRSIds: ["rs-usp-caffeine", "rs-edqm-caffeine"],
    demoLabel: true,
  },
  {
    id: "sub-theophylline",
    nameZh: "茶碱",
    nameEn: "Theophylline",
    inn: "Theophylline",
    cas: "58-55-9",
    unii: "C137DTR5RG",
    smiles: "CN1C2=C(NC(=O)N(C)C2=O)N=C1",
    inchiKey: "ZFXYFBGIUFBOJW-UHFFFAOYSA-N",
    aliases: ["1,3-二甲基黄嘌呤", "Theophyllinum"],
    type: "API",
    summaryZh:
      "黄嘌呤类平喘药。示例专论索引。",
    summaryEn:
      "Xanthine bronchodilator demo index.",
    monographRefs: mkMonographs(
      "theo",
      "Theophylline",
      "茶碱",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-theophylline-rel", "imp-theobromine"],
    relatedRSIds: ["rs-usp-theophylline", "rs-edqm-theophylline"],
    demoLabel: true,
  },
  {
    id: "sub-levofloxacin",
    nameZh: "左氧氟沙星",
    nameEn: "Levofloxacin",
    inn: "Levofloxacin",
    cas: "100986-85-4",
    unii: "RIX4E89YQP",
    smiles: "C[C@H]1COC2=C3N1C=C(C(=O)C3=CC(=C2N4CCN(C)CC4)F)C(=O)O",
    inchiKey: "GSDSWSVVBLHKDQ-UHFFFAOYSA-N",
    aliases: ["左旋氧氟沙星", "Cravit（商品名示例）"],
    type: "API",
    summaryZh:
      "氟喹诺酮类抗菌药。示例专论索引。",
    summaryEn:
      "Fluoroquinolone antibacterial demo index.",
    monographRefs: mkMonographs(
      "lvx",
      "Levofloxacin",
      "左氧氟沙星",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-levofloxacin-rel", "imp-elemental-arsenic"],
    relatedRSIds: ["rs-usp-levofloxacin", "rs-edqm-levofloxacin", "rs-nifdc-levofloxacin"],
    demoLabel: true,
  },
  {
    id: "sub-cefalexin",
    nameZh: "头孢氨苄",
    nameEn: "Cefalexin",
    inn: "Cefalexin",
    cas: "15686-71-2",
    unii: "5S2CCF3J0F",
    smiles: "CC1=C(N2C(SC1)C(NC(=O)C(N)C1=CC=CC=C1)C2=O)C(=O)O",
    inchiKey: "ZAIPJRKZFDMVOU-UHFFFAOYSA-N",
    aliases: ["头孢力新", "Cephalexin"],
    type: "API",
    summaryZh:
      "第一代头孢菌素。示例专论索引。",
    summaryEn:
      "First-generation cephalosporin demo index.",
    monographRefs: mkMonographs(
      "cex",
      "Cefalexin",
      "头孢氨苄",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-cefalexin-rel"],
    relatedRSIds: ["rs-usp-cefalexin", "rs-edqm-cefalexin"],
    demoLabel: true,
  },
  {
    id: "sub-benzylpenicillin",
    nameZh: "青霉素G",
    nameEn: "Benzylpenicillin",
    inn: "Benzylpenicillin",
    cas: "61-33-6",
    unii: "Q42T66VG0C",
    smiles: "CC1(C)SC2C(NC(=O)CC3=CC=CC=C3)C(=O)N2C1C(=O)O",
    inchiKey: "JGSARLDLIJGVQD-UHFFFAOYSA-N",
    aliases: ["苄青霉素", "Penicillin G", "青霉素"],
    type: "API",
    summaryZh:
      "天然青霉素。示例专论索引；降解杂质演示。",
    summaryEn:
      "Natural penicillin demo index with degradation impurity demo.",
    monographRefs: mkMonographs(
      "png",
      "Benzylpenicillin",
      "青霉素G",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-amoxicillin-penicilloic", "imp-benzene"],
    relatedRSIds: ["rs-usp-benzylpenicillin", "rs-edqm-benzylpenicillin", "rs-nifdc-benzylpenicillin"],
    demoLabel: true,
  },
  {
    id: "sub-diclofenac",
    nameZh: "双氯芬酸",
    nameEn: "Diclofenac",
    inn: "Diclofenac",
    cas: "15307-86-5",
    unii: "144O8NH7AH",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2017/1002",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_diclofenac_01_01",
    smiles: "OC(=O)CC1=CC=CC=C1NC1=C(Cl)C=CC=C1Cl",
    inchiKey: "DCOPUUMXTXDBNB-UHFFFAOYSA-N",
    aliases: ["双氯灭痛", "Diclofenac sodium（盐型示例）"],
    type: "API",
    summaryZh:
      "NSAID。示例专论索引。",
    summaryEn:
      "NSAID demo monograph index.",
    monographRefs: mkMonographs(
      "dic",
      "Diclofenac",
      "双氯芬酸",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-diclofenac-rel", "imp-dichloromethane"],
    relatedRSIds: ["rs-usp-diclofenac", "rs-edqm-diclofenac"],
    demoLabel: true,
  },
  {
    id: "sub-simvastatin",
    nameZh: "辛伐他汀",
    nameEn: "Simvastatin",
    inn: "Simvastatin",
    cas: "79902-63-9",
    unii: "AGG2FN16EV",
    smiles: "CCC(C)(C)C(=O)OC1CC(C)C=C2C=CC(C)C(CCC3CC(O)CC(=O)O3)C12",
    inchiKey: "RYMZZMVNJRMUDD-UHFFFAOYSA-N",
    aliases: ["舒降之（商品名示例）"],
    type: "API",
    summaryZh:
      "他汀类降脂药。示例专论索引。",
    summaryEn:
      "Statin lipid-lowering demo index.",
    monographRefs: mkMonographs(
      "sim",
      "Simvastatin",
      "辛伐他汀",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-simvastatin-rel", "imp-methanol"],
    relatedRSIds: ["rs-usp-simvastatin", "rs-edqm-simvastatin"],
    demoLabel: true,
  },
  {
    id: "sub-ciprofloxacin",
    nameZh: "环丙沙星",
    nameEn: "Ciprofloxacin",
    inn: "Ciprofloxacin",
    cas: "85721-33-1",
    unii: "5E8JL8G54B",
    /** 示例编号需核对 — 可能 404，以官方为准 */
    epTextNumber: "demo/01/2011/1081",
    /** 示例 DOI，须核实；非真实 USP–NF 深链保证 */
    uspDoi: "10.31003/USPNF_MDEMO_ciprofloxacin_01_01",
    smiles: "O=C(O)C1=CN(C2CC2)C2=CC(N3CCNCC3)=C(F)C=C2C1=O",
    inchiKey: "MYSWGUAQZAJSOK-UHFFFAOYSA-N",
    aliases: ["环丙氟哌酸", "Cipro（商品名示例）"],
    type: "API",
    summaryZh:
      "氟喹诺酮类抗菌药。示例专论索引。",
    summaryEn:
      "Fluoroquinolone antibacterial demo index.",
    monographRefs: mkMonographs(
      "cip",
      "Ciprofloxacin",
      "环丙沙星",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-ciprofloxacin-rel", "imp-elemental-arsenic"],
    relatedRSIds: ["rs-usp-ciprofloxacin", "rs-edqm-ciprofloxacin"],
    demoLabel: true,
  },
  {
    id: "sub-warfarin",
    nameZh: "华法林",
    nameEn: "Warfarin",
    inn: "Warfarin",
    cas: "81-81-2",
    unii: "5Q7ZVV76EI",
    smiles: "CC(=O)CC(C1=CC=CC=C1)C1=C(O)C2=CC=CC=C2OC1=O",
    inchiKey: "PJVWKTKQMONHKJ-UHFFFAOYSA-N",
    aliases: ["丙酮苄羟香豆素", "Coumadin（商品名示例）"],
    type: "API",
    summaryZh:
      "口服抗凝药。示例专论索引。",
    summaryEn:
      "Oral anticoagulant demo index.",
    monographRefs: mkMonographs(
      "war",
      "Warfarin",
      "华法林",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-warfarin-rel"],
    relatedRSIds: ["rs-usp-warfarin", "rs-edqm-warfarin"],
    demoLabel: true,
  },
  {
    id: "sub-furosemide",
    nameZh: "呋塞米",
    nameEn: "Furosemide",
    inn: "Furosemide",
    cas: "54-31-9",
    unii: "7LXU5N7ZO5",
    smiles: "NS(=O)(=O)C1=CC(C(=O)O)=C(NCC2=CC=CO2)C=C1Cl",
    inchiKey: "ZZUFCTLCJUWOSV-UHFFFAOYSA-N",
    aliases: ["速尿", "Frusemide"],
    type: "API",
    summaryZh:
      "袢利尿剂。示例专论索引。",
    summaryEn:
      "Loop diuretic demo index.",
    monographRefs: mkMonographs(
      "fur",
      "Furosemide",
      "呋塞米",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-furosemide-rel"],
    relatedRSIds: ["rs-usp-furosemide", "rs-edqm-furosemide"],
    demoLabel: true,
  },
  {
    id: "sub-captopril",
    nameZh: "卡托普利",
    nameEn: "Captopril",
    inn: "Captopril",
    cas: "62571-86-2",
    unii: "9G64RSX1JT",
    smiles: "CC(CS)C(=O)N1CCCC1C(=O)O",
    inchiKey: "FAKRSMQSSFJEIM-UHFFFAOYSA-N",
    aliases: ["开博通（商品名示例）", "Captoprilum"],
    type: "API",
    summaryZh:
      "ACE 抑制剂。示例专论索引。",
    summaryEn:
      "ACE inhibitor demo index.",
    monographRefs: mkMonographs(
      "cap",
      "Captopril",
      "卡托普利",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: ["imp-captopril-rel", "imp-dichloromethane"],
    relatedRSIds: ["rs-usp-captopril", "rs-edqm-captopril"],
    demoLabel: true,
  },
  {
    id: "sub-heparin",
    nameZh: "肝素",
    nameEn: "Heparin",
    inn: "Heparin",
    cas: "9005-49-6",
    unii: "T2410KM04A",
    aliases: ["肝素钠（盐型示例）", "Unfractionated heparin"],
    type: "biological",
    summaryZh:
      "【简条】抗凝生物药/多糖混合物。生物大分子复杂，本条仅作索引级演示，不含结构与完整杂质谱。",
    summaryEn:
      "[Brief] Anticoagulant polysaccharide mixture. Complex biologic — brief index demo only.",
    monographRefs: mkMonographs(
      "hep",
      "Heparin",
      "肝素",
      ["ChP", "USP", "EP", "BP"]
    ),
    relatedImpurityIds: [],
    relatedRSIds: ["rs-usp-heparin"],
    demoLabel: true,
  },
  {
    id: "sub-sodium-chloride",
    nameZh: "氯化钠",
    nameEn: "Sodium chloride",
    inn: "Sodium chloride",
    cas: "7647-14-5",
    unii: "451W47IQ8X",
    smiles: "[Na+].[Cl-]",
    inchiKey: "FAPWRFPIFSIZLT-UHFFFAOYSA-M",
    aliases: ["食盐", "NaCl", "生理盐水用氯化钠"],
    type: "excipient",
    summaryZh:
      "常用辅料/渗透压调节剂。示例辅料专论索引。",
    summaryEn:
      "Common excipient / tonicity agent demo monograph index.",
    monographRefs: mkMonographs(
      "nacl",
      "Sodium chloride",
      "氯化钠",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: ["imp-elemental-arsenic", "imp-lead"],
    relatedRSIds: ["rs-usp-nacl"],
    demoLabel: true,
  },
  {
    id: "sub-lactose",
    nameZh: "乳糖",
    nameEn: "Lactose",
    inn: "Lactose",
    cas: "63-42-3",
    unii: "J2B2A4N98G",
    smiles: "C([C@@H]1[C@@H]([C@@H]([C@H]([C@@H](O1)O[C@@H]2[C@H](O)[C@@H](O)[C@H](O)[C@H](O)[C@H]2O)O)O)O)O",
    inchiKey: "GUBGYTABKSRVRQ-UHFFFAOYSA-N",
    aliases: ["乳糖一水合物（水合物示例）", "Milk sugar"],
    type: "excipient",
    summaryZh:
      "常用填充剂/辅料。示例辅料专论索引。",
    summaryEn:
      "Common filler/excipient demo monograph index.",
    monographRefs: mkMonographs(
      "lac",
      "Lactose",
      "乳糖",
      ["ChP", "USP", "EP", "JP", "BP"]
    ),
    relatedImpurityIds: [],
    relatedRSIds: ["rs-usp-lactose", "rs-edqm-lactose"],
    demoLabel: true,
  },
];
