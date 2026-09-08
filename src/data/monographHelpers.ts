import type {
  CopyrightStatus,
  IdVerificationStatus,
  MonographRef,
  PharmacopoeiaCode,
} from "@/lib/types";

const PORTALS: Record<
  PharmacopoeiaCode,
  { url: string; copyright: CopyrightStatus; version: (y?: string) => string }
> = {
  ChP: {
    url: "https://ydz.chp.org.cn/",
    copyright: "link_only",
    version: () => "ChP 2020 二部",
  },
  USP: {
    url: "https://www.uspnf.com/",
    copyright: "needs_license",
    version: () => "USP–NF 2024",
  },
  EP: {
    url: "https://pheur-online.edqm.eu/",
    copyright: "needs_license",
    version: () => "Ph. Eur. 11.0",
  },
  JP: {
    url: "https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0009.html",
    copyright: "link_only",
    version: () => "JP 18",
  },
  BP: {
    url: "https://www.pharmacopoeia.com/",
    copyright: "needs_license",
    version: () => "BP 2024",
  },
  IP: {
    url: "https://www.ipc.gov.in/",
    copyright: "link_only",
    version: () => "IP 2022",
  },
  "Ph.Int.": {
    url: "https://digicollections.net/phint/",
    copyright: "usable",
    version: () => "Ph. Int. (demo)",
  },
};

/** Build demo monograph refs for a substance (索引级，非法定全文). */
export function mkMonographs(
  slug: string,
  titleEn: string,
  titleZh: string,
  codes: PharmacopoeiaCode[],
  opts?: {
    hasRS?: Partial<Record<PharmacopoeiaCode, boolean>>;
    epTitle?: string;
    idStatus?: Partial<Record<PharmacopoeiaCode, IdVerificationStatus>>;
    epTextNumber?: string;
    uspDoi?: string;
    phIntDocPath?: string;
  }
): MonographRef[] {
  return codes.map((code) => {
    const p = PORTALS[code];
    const hasRS =
      opts?.hasRS?.[code] ??
      (code === "ChP" || code === "USP" || code === "EP" || code === "BP");
    const monographTitle =
      code === "EP" && opts?.epTitle ? opts.epTitle : titleEn;
    const ref: MonographRef = {
      id: `mr-${slug}-${code.toLowerCase().replace(".", "")}`,
      pharmacopoeia: code,
      monographTitle,
      monographTitleZh: titleZh,
      version: p.version(),
      efficacy: code === "ChP" ? "现行（示例）" : "Official (demo)",
      officialUrl: p.url,
      copyrightStatus: p.copyright,
      hasRS,
      notes:
        code === "Ph.Int."
          ? "WHO 公开资源，摘要级索引可用"
          : code === "ChP"
            ? "官方深链至中国药典查询平台"
            : undefined,
    };
    if (code === "EP" && opts?.epTextNumber) {
      ref.epTextNumber = opts.epTextNumber;
      ref.idStatus = opts.idStatus?.EP ?? "demo";
    }
    if (code === "USP" && opts?.uspDoi) {
      ref.uspDoi = opts.uspDoi;
      ref.idStatus = opts.idStatus?.USP ?? "demo";
    }
    if (code === "Ph.Int." && opts?.phIntDocPath) {
      ref.phIntDocPath = opts.phIntDocPath;
      ref.idStatus = opts.idStatus?.["Ph.Int."] ?? "demo";
    }
    if (opts?.idStatus?.[code] && !ref.idStatus) {
      ref.idStatus = opts.idStatus[code];
    }
    return ref;
  });
}
