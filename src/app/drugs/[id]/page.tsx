import Link from "next/link";
import { notFound } from "next/navigation";
import { openDrugProducts, getSubstance } from "@/data";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { EntityHubPanel } from "@/components/EntityHubPanel";
import { OfficialQueryLinks } from "@/components/OfficialQueryLinks";
import {
  buildSubstanceHubLinks,
  resolveDrugParentSubstanceId,
  findRelatedDrugsForSubstance,
  type HubLink,
} from "@/lib/entityAssociation";
import type { Metadata } from "next";

type Props = { params: { id: string } };

function getDrug(id: string) {
  return openDrugProducts.find((d) => d.id === id);
}

export function generateMetadata({ params }: Props): Metadata {
  const d = getDrug(params.id);
  if (!d) return { title: "成药未找到" };
  return { title: `${d.brandName} / ${d.genericName} · 成药` };
}

export default function DrugDetailPage({ params }: Props) {
  const d = getDrug(params.id);
  if (!d) notFound();

  const parentId = resolveDrugParentSubstanceId(d);
  const parent = parentId ? getSubstance(parentId) : undefined;
  const regions = Array.from(
    new Set([...(d.regionTags || []), ...(d.countryTags || [])])
  );

  const links: HubLink[] = [];
  if (parent) {
    links.push(
      {
        key: "parent",
        label: `原料药 · ${parent.nameZh}`,
        href: `/substances/${encodeURIComponent(parent.id)}`,
        note: parent.inn || parent.nameEn,
        tone: "sky",
      },
      {
        key: "compendial",
        label: "多药典对照",
        href: `/substances/${encodeURIComponent(parent.id)}/compendial`,
        tone: "sky",
      },
      ...buildSubstanceHubLinks(parent).filter(
        (l) => !["search", "drugs", "hhwyc", "watch", "notes", "parent"].includes(l.key)
      )
    );
  } else if (d.inn || d.genericName) {
    const q = encodeURIComponent(d.inn || d.genericName);
    links.push({
      key: "search-api",
      label: "检索原料药",
      href: `/search?q=${q}&type=API&tab=substance`,
      tone: "slate",
    });
  }
  links.push(
    {
      key: "search-drug",
      label: "同名成药检索",
      href: `/search?q=${encodeURIComponent(d.inn || d.genericName || d.brandName)}&type=drug&tab=drug`,
      tone: "indigo",
    },
    {
      key: "watch",
      label: "关注",
      href: parent
        ? `/watchlist?substance=${encodeURIComponent(parent.id)}`
        : `/watchlist?q=${encodeURIComponent(d.genericName || d.brandName)}`,
      tone: "teal",
    },
    {
      key: "notes",
      label: "备注",
      href: parent
        ? `/notes?substance=${encodeURIComponent(parent.id)}`
        : `/notes`,
      tone: "slate",
    }
  );

  const siblings = parentId
    ? findRelatedDrugsForSubstance(parentId, 6).filter((x) => x.id !== d.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <DemoBadge />
        <span className="text-xs rounded-md bg-indigo-50 text-indigo-900 px-2 py-0.5">
          成药身份卡
        </span>
      </div>

      <div className="ph-page-hero">
        <h1>
          {d.brandName}{" "}
          <span className="text-xl font-normal text-slate-500 font-latin">
            {d.genericName}
          </span>
        </h1>
        <p className="font-latin text-sm text-slate-500">
          Finished drug · identity only · no label full text
        </p>
      </div>

      <DisclaimerBanner compact />

      <p className="text-sm text-slate-600">
        本页仅成药身份与关联原料药索引，不含说明书/药典全文。
      </p>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm rounded-xl border border-slate-200 bg-white p-4">
        {d.inn ? (
          <div>
            <dt className="text-slate-500">INN</dt>
            <dd className="font-latin">{d.inn}</dd>
          </div>
        ) : null}
        {d.strength ? (
          <div>
            <dt className="text-slate-500">规格</dt>
            <dd className="font-latin">{d.strength}</dd>
          </div>
        ) : null}
        {d.dosageForm ? (
          <div>
            <dt className="text-slate-500">剂型</dt>
            <dd className="font-latin">{d.dosageForm}</dd>
          </div>
        ) : null}
        {d.route ? (
          <div>
            <dt className="text-slate-500">给药途径</dt>
            <dd className="font-latin">{d.route}</dd>
          </div>
        ) : null}
        {d.unii || d.parentUnii ? (
          <div>
            <dt className="text-slate-500">UNII</dt>
            <dd className="font-latin">{d.parentUnii || d.unii}</dd>
          </div>
        ) : null}
        {d.productNdc ? (
          <div>
            <dt className="text-slate-500">NDC</dt>
            <dd className="font-latin">{d.productNdc}</dd>
          </div>
        ) : null}
        {regions.length ? (
          <div>
            <dt className="text-slate-500">地区</dt>
            <dd className="font-latin">{regions.join(" · ")}</dd>
          </div>
        ) : null}
        {d.labelerName ? (
          <div>
            <dt className="text-slate-500">持有人/厂商</dt>
            <dd>{d.labelerName}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate-500">来源</dt>
          <dd className="font-latin text-xs">
            {d.provenance} · {d.source}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">ID</dt>
          <dd className="font-latin text-xs break-all">{d.id}</dd>
        </div>
      </dl>

      {d.synonyms?.length ? (
        <p className="text-xs text-slate-500">
          同义词：{d.synonyms.slice(0, 24).join(" · ")}
          {d.synonyms.length > 24 ? "…" : ""}
        </p>
      ) : null}

      {parent ? (
        <p
          role="status"
          className="rounded-lg border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-teal-950"
        >
          父原料药（精选）：
          <Link
            href={`/substances/${encodeURIComponent(parent.id)}`}
            className="mx-1 font-medium text-teal-900 underline"
          >
            {parent.nameZh}
          </Link>
          <span className="font-latin text-teal-800/80">
            {parent.inn || parent.nameEn}
          </span>
        </p>
      ) : parentId ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          父物质 ID：
          <Link
            href={`/substances/${encodeURIComponent(parentId)}`}
            className="ml-1 font-latin text-teal-800 underline"
          >
            {parentId}
          </Link>
          （开放/轻量身份）
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          暂无可靠精选父物质；可按 INN/通用名检索原料药。
        </p>
      )}

      <OfficialQueryLinks
        nameZh={d.brandName}
        nameEn={d.genericName || d.inn || d.brandName}
        unii={d.parentUnii || d.unii}
      />

      <EntityHubPanel
        title="关联模块 · 成药枢纽"
        subtitle="原料药 · 对照 · 杂质 · 预警（身份层）"
        links={links}
        relatedDrugs={siblings}
        entityIds={{ unii: d.parentUnii || d.unii, inn: d.inn }}
      />

      <p className="text-xs text-slate-400">
        <Link href="/search?type=drug&tab=drug" className="text-teal-700 hover:underline">
          ← 返回成药检索
        </Link>
      </p>
    </div>
  );
}
