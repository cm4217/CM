# 匿名检索事件日志

服务端 JSONL：data/search-events.jsonl（已 gitignore）。仅匿名会话 cookie pharm_anon_sid，无 IP / 邮箱 / UA。

## 写入

- 页面：SearchLogBeacon（search）+ logSearchClick（相关条 / 点击）
- API：POST /api/search-log
  - type search: q, hitCount?
  - type click: entityId, kind?, q?
  - 或 entries 数组

## 检查

```bash
curl -s http://localhost:3000/api/search-log
curl -s "http://localhost:3000/api/search-log?sample=1&limit=20"
```

## 清空

```bash
curl -X DELETE "http://localhost:3000/api/search-log?confirm=1"
```

## 相关推荐

GET /api/related?id=<entityId>&kind=substance|impurity|rs&q=
优先服务端共点击 / 同会话；不足时冷启动（种子关联杂质、覆盖相近物质）。
