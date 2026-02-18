# 移动游戏深度调查录入器（EU）

一个本地可运行的小工具：按问卷方式录入 1 款游戏，保存到 SQLite，支持列表管理、共性统计、CSV/Excel 导出。

## 功能

- **新增调查**：分区表单录入，必填校验（`game`、`genre`、`monetization_mix`）。
- **本地数据库**：自动创建 SQLite 单文件 `games_survey_eu.db`。
- **列表管理**：搜索（`game/publisher`）、多条件筛选、编辑、删除。
- **共性统计**：
  - 频次榜：Genre、Monetization mix、IAP primary（1-3 合并）、LiveOps cadence、EventType。
  - 交叉表：Genre x Monetization mix；IAP primary #1 x LiveOps cadence。
  - Top 组合：`Genre + IAP primary #1 + LiveOps cadence`。
  - 可导出 `summary.csv`。
- **导出**：全量 CSV、筛选结果 CSV、可选 Excel（单 sheet）。

## 运行方式（本地）

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

浏览器打开 Streamlit 给出的本地地址（默认 `http://localhost:8501`）。

## 数据库与备份

- 数据库文件：`games_survey_eu.db`（与 `app.py` 同目录）。
- 备份方式：直接复制这个 `.db` 文件。
- 恢复方式：把备份文件放回项目目录，覆盖同名文件。

## Windows 可执行建议（可选）

如果需要 `.exe`，可用 PyInstaller 打包：

```bash
pip install pyinstaller
pyinstaller --onefile --name eu_survey_app app.py
```

> 注：Streamlit 打包为单文件 exe 在不同机器上可能需要额外调整；更稳妥的是保留 Python 环境并运行 `streamlit run app.py`。

## 字段说明

应用已覆盖你提供的 `games` 表字段（含 `created_at/updated_at` 自动维护）。

- `evidence_links` 支持多行粘贴，保存时原样存储（换行保留）。
- 多选字段（如 `eu_focus_market`）以分号 `;` 拼接保存。
