# 移动游戏深度调查录入器（EU）

## 打开方式
1. 解压项目。
2. 直接双击 `index.html`（无需本地服务器、无需账号）。
3. 页面顶部显示“已加载，记录数: X”代表数据库已就绪。

## 数据库（games.db）使用
### 新建空数据库
- 点击顶部 **新建空数据库**。
- 系统会自动创建 `games` 表与 `updated_at` 自动更新时间机制。

### 加载本地 games.db
- 点击 **加载 games.db**，选择已有数据库文件。
- 导入后可继续新增/编辑/统计。

### 导出当前数据库（备份/迁移）
- 点击 **导出当前 games.db**。
- 浏览器会下载 `games.db`（建议按日期重命名，例如 `games-2026-02-19.db`）。

## 录入与编辑
- 在“新增调查”页录入。
- 必填：`game`、`genre`、`monetization_mix`。
- `evidence_links` 支持多行粘贴并原样保存。
- 在“游戏列表”点击行可回填编辑。
- 删除操作有二次确认。

## 列表检索与筛选
- 搜索：`game / publisher` 模糊匹配。
- 筛选：Genre、Monetization mix、LiveOps cadence、Overall potential>=X、EU focus market。

## 统计与导出
### 共性统计
- 频次榜：Genre、Monetization mix、IAP primary、LiveOps cadence、EventType、Art、MusicStyle、KeyMechanics。
- 交叉表：Genre × Monetization；IAP #1 × LiveOps。
- Top 组合：`Genre + iap_primary_1 + liveops_cadence`。
- 默认忽略空值/Unknown，可切换“包含 Unknown”。
- 可导出 `summary.csv`。

### 数据导出
- 导出全量 CSV。
- 导出筛选结果 CSV（依据“游戏列表”当前筛选）。
- 导出 Excel（单 Sheet）。
- CSV 编码为 UTF-8-SIG，中文可直接打开不乱码。

## games.db 备份建议
- 每次大批量录入后，立即点击“导出当前 games.db”做增量备份。
- 建议至少保留：
  - 当日结束快照（`games-YYYYMMDD.db`）
  - 里程碑版本（`games-v1.db`）

## 常见问题
1. **双击打开后无法选文件/下载？**
   - 检查浏览器是否拦截下载弹窗，允许当前文件页面下载。
2. **导入失败？**
   - 确认选择的是本工具导出的 `games.db`。
3. **本地 file:// 权限限制？**
   - 换用 Chrome/Edge 最新版；若企业策略限制 file 访问，请在个人环境打开。
