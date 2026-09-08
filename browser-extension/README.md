# 浏览器扩展（Manifest V3）

选中药名 / CAS / UNII → 右键或弹窗查询药典对照层**索引元数据**（不抓取专论全文）。

## 加载未打包（load unpacked）

1. Chrome / Edge 打开 `chrome://extensions`（或 `edge://extensions`）
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本目录 `browser-extension/`
4. 选项页设置 API 根地址（默认 `http://localhost:3000`）

## 功能

- 工具栏弹窗：查询 `/api/lookup` 或打开 `/search`
- 右键菜单：用选区打开检索页
- 快捷键：`Alt+Shift+L`
- 内容脚本：选区提示条（可选点击跳转）

站内说明：`/tools/bookmarklet`
