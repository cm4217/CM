import { NextRequest, NextResponse } from "next/server";
import { formatAnswerZh, retrieveLocal } from "@/lib/retrieve";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { q?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const q = (body.q || req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ error: "请提供问题 q" }, { status: 400 });
  }

  const hits = retrieveLocal(q, 8);
  let answer = formatAnswerZh(q, hits);
  let phrasedBy: "local" | "openai" | "anthropic" = "local";

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const contextBlock = hits
    .map(
      (h, i) =>
        `[${i + 1}] (${h.kind}) ${h.titleZh} | ${h.snippetZh} | href=${h.href}`
    )
    .join("\n");

  const system =
    "你是药典索引助手。只能依据提供的检索片段用中文组织简洁回答，使用项目符号并给出站内路径。禁止编造药典限度数值；若片段不足请说明。结尾必须提醒：仅基于站内索引与公开监管表，不替代药典正文。";

  try {
    if (openaiKey && hits.length > 0) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: `问题：${q}\n\n检索片段：\n${contextBlock}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const j = await res.json();
        const text = j?.choices?.[0]?.message?.content;
        if (text) {
          answer = text;
          phrasedBy = "openai";
        }
      }
    } else if (anthropicKey && hits.length > 0) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
          max_tokens: 1024,
          system,
          messages: [
            {
              role: "user",
              content: `问题：${q}\n\n检索片段：\n${contextBlock}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const j = await res.json();
        const text = j?.content?.[0]?.text;
        if (text) {
          answer = text;
          phrasedBy = "anthropic";
        }
      }
    }
  } catch {
    // keep local answer
  }

  return NextResponse.json({
    q,
    answer,
    phrasedBy,
    hits,
    disclaimer: "仅基于站内索引与公开监管表，不替代药典正文",
  });
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ error: "请提供问题 q" }, { status: 400 });
  }
  const hits = retrieveLocal(q, 8);
  return NextResponse.json({
    q,
    answer: formatAnswerZh(q, hits),
    phrasedBy: "local",
    hits,
    disclaimer: "仅基于站内索引与公开监管表，不替代药典正文",
  });
}
