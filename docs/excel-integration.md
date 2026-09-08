# Excel / Power Query 集成

本站提供查找 API，便于 Excel「数据 → 从 Web」或 Power Query 拉取索引级元数据（非法定全文）。

## 单条查询（JSON）

```
GET /api/lookup?q=阿司匹林
```

## 批量查询（JSON）

```
POST /api/lookup
Content-Type: application/json

{ "queries": ["阿司匹林", "50-78-2", "ibuprofen"] }
```

## CSV（适合 Power Query）

```
GET /api/lookup.csv?q=阿司匹林
GET /api/lookup.csv?q=阿司匹林,布洛芬,对乙酰氨基酚
```

返回列：query, found, nameZh, nameEn, cas, unii, pharmacopoeias, impurityCount, urls。

## Excel 步骤（简要）

1. 打开 Excel → 数据 → 从 Web
2. 粘贴：`https://<你的域名>/api/lookup.csv?q=阿司匹林`
3. 转换数据后加载到工作表

批量：用逗号分隔多个 q，或对 POST 使用 Power Query 的 Web.Contents。

本地模板：`/templates/watchlist-import.csv`

说明页：`/tools/sheets`

## Office Excel add-in (sideload)

- Source: `excel-addin/` (mirrored at `public/excel-addin/`)
- Steps: `excel-addin/SIDELOAD.txt`
- Task pane calls `GET /api/lookup` and can write the selection
- UI summary: `/tools/sheets`
