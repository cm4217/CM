"use client";

import { useEffect, useState } from "react";
import {
  buildWatchlistDigest,
  type DigestScope,
} from "@/lib/watchlistDigest";
import { loadWatchlist } from "@/lib/watchlistStorage";
import type { WatchlistItem } from "@/lib/watchlistStorage";
import {
  loadWebhookConfig,
  postWatchlistDigestWebhook,
  saveWebhookConfig,
  type WebhookType,
} from "@/lib/webhookDigest";

type Props = { items?: WatchlistItem[]; className?: string };

export function WebhookDigestPanel({ items, className }: Props) {
  const [url, setUrl] = useState("");
  const [type, setType] = useState<WebhookType>("generic");
  const [secret, setSecret] = useState("");
  const [scope, setScope] = useState<DigestScope>("all");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = loadWebhookConfig();
    setUrl(c.url);
    setType(c.type);
    setSecret(c.secret || "");
  }, []);

  function persist() {
    saveWebhookConfig({ url, type, secret });
    setStatus("已保存到本机 localStorage（不会提交到仓库）");
  }

  async function send() {
    setBusy(true);
    setStatus("");
    try {
      saveWebhookConfig({ url, type, secret });
      const list = items ?? loadWatchlist();
      const digest = buildWatchlistDigest(list, scope);
      const res = await postWatchlistDigestWebhook({
        config: { url, type, secret },
        markdown: digest.markdown,
        plain: digest.plain,
      });
      setStatus(
        res.ok
          ? `发送成功 HTTP ${res.status}`
          : `发送失败 HTTP ${res.status} ${res.body}`
      );
    } catch (e) {
      setStatus(`错误：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={`rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3 shadow-sm ${className || ""}`}
    >
      <h2 className="text-sm font-semibold text-indigo-950">关注摘要 Webhook</h2>
      <p className="text-xs text-slate-600">
        配置通用 JSON POST 或钉钉自定义机器人。URL / 加签密钥仅保存在浏览器 localStorage，
        <strong>切勿写入仓库</strong>。钉钉需在机器人安全设置中配置关键词（如「关注摘要」）或加签；
        若使用加签，请填写下方 secret（SEC…），将自动附加 timestamp+sign。
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-slate-700 sm:col-span-2">
          Webhook URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://oapi.dingtalk.com/robot/send?access_token=…"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-latin"
          />
        </label>
        <label className="text-xs text-slate-700">
          类型
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WebhookType)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="generic">通用 JSON</option>
            <option value="dingtalk">钉钉 markdown</option>
          </select>
        </label>
        <label className="text-xs text-slate-700">
          摘要范围
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as DigestScope)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">全部关注 × 通告库</option>
            <option value="week">本周</option>
          </select>
        </label>
        {type === "dingtalk" && (
          <label className="text-xs text-slate-700 sm:col-span-2">
            钉钉加签 Secret（可选）
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="SEC…（关键词机器人可留空）"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-latin"
              autoComplete="off"
            />
          </label>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={persist}
          className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-900 hover:bg-white"
        >
          保存配置
        </button>
        <button
          type="button"
          disabled={busy || !url.trim()}
          onClick={send}
          className="rounded-lg bg-indigo-700 px-3 py-1.5 text-sm text-white hover:bg-indigo-800 disabled:opacity-50"
        >
          发送关注摘要到 Webhook
        </button>
      </div>
      {status && <p className="text-xs text-slate-600 break-all">{status}</p>}
      <p className="text-[11px] text-slate-500">
        通用载荷：`{"{ text, markdown, generatedAt }"}` · 钉钉：`msgtype: markdown`。详见 README。
      </p>
    </section>
  );
}
