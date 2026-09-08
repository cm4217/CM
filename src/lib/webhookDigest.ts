import { LS_WEBHOOK_SECRET, LS_WEBHOOK_TYPE, LS_WEBHOOK_URL } from "@/lib/storageKeys";

export type WebhookType = "generic" | "dingtalk";

export type WebhookConfig = {
  url: string;
  type: WebhookType;
  /** DingTalk 加签 secret（SEC…），仅存 localStorage，勿提交 */
  secret?: string;
};

export function loadWebhookConfig(): WebhookConfig {
  if (typeof window === "undefined") return { url: "", type: "generic" };
  try {
    return {
      url: localStorage.getItem(LS_WEBHOOK_URL) || "",
      type: (localStorage.getItem(LS_WEBHOOK_TYPE) as WebhookType) || "generic",
      secret: localStorage.getItem(LS_WEBHOOK_SECRET) || "",
    };
  } catch {
    return { url: "", type: "generic" };
  }
}

export function saveWebhookConfig(cfg: WebhookConfig) {
  localStorage.setItem(LS_WEBHOOK_URL, cfg.url.trim());
  localStorage.setItem(LS_WEBHOOK_TYPE, cfg.type);
  if (cfg.secret) localStorage.setItem(LS_WEBHOOK_SECRET, cfg.secret.trim());
  else localStorage.removeItem(LS_WEBHOOK_SECRET);
}

/** DingTalk custom robot signed URL: timestamp + sign (HmacSHA256 → base64 → urlencode) */
export async function signDingTalkUrl(webhookUrl: string, secret: string): Promise<string> {
  const timestamp = String(Date.now());
  const stringToSign = timestamp + "\n" + secret;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(stringToSign));
  const bytes = new Uint8Array(sigBuf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const sign = encodeURIComponent(btoa(bin));
  const u = new URL(webhookUrl);
  u.searchParams.set("timestamp", timestamp);
  u.searchParams.set("sign", sign);
  return u.toString();
}

export function buildGenericPayload(markdown: string, plain: string) {
  return {
    text: plain,
    markdown,
    generatedAt: new Date().toISOString(),
  };
}

export function buildDingTalkPayload(markdown: string, title = "药典对照层 · 关注摘要") {
  // DingTalk markdown: title + text; keep under size limits best-effort
  const text = markdown.length > 18000 ? markdown.slice(0, 18000) + "\n\n…(截断)" : markdown;
  return {
    msgtype: "markdown" as const,
    markdown: {
      title,
      text,
    },
  };
}

export async function postWatchlistDigestWebhook(opts: {
  config: WebhookConfig;
  markdown: string;
  plain: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const { config, markdown, plain } = opts;
  if (!config.url.trim()) throw new Error("未配置 Webhook URL");

  let url = config.url.trim();
  let body: unknown;
  if (config.type === "dingtalk") {
    if (config.secret && config.secret.trim()) {
      url = await signDingTalkUrl(url, config.secret.trim());
    }
    body = buildDingTalkPayload(markdown);
  } else {
    body = buildGenericPayload(markdown, plain);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body: text.slice(0, 500) };
}
