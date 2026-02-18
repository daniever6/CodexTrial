# 移动游戏商业化深度调查助手（欧洲市场 / 2025）

本工具用于批量抓取 Google Play / App Store 商店页信息，并生成：

1. `CandidatePool.csv`
2. `DeepDive.csv`
3. `evidence.json`
4. `manual_todo.md`

并支持：并发抓取、失败重试、限速（重试退避）、增量更新（默认跳过已成功抓取 URL，`--refresh` 强制重抓）。

---

## 安装

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 运行

```bash
python main.py --input examples/games_sample.csv --out ./out --region EU --year 2025 --workers 4 --summary
```

可选参数：

- `--refresh`：忽略缓存，全部重抓
- `--ocr`：开启轻量 OCR 线索模式（URL token 近似，不是完整 OCR）
- `--summary`：输出 `summary.md`
- `--log-level DEBUG|INFO|WARNING|ERROR`

输入 CSV 支持列名：
- `game_name,store_url`（推荐）
- 或 `Game,URL`

---

## 项目结构

- `fetchers/store_fetcher.py`：Google Play / App Store 抓取
- `parsers/inference.py`：规则推断（类型、题材、商业化、Session）
- `parsers/ocr_helper.py`：可选 OCR 线索
- `exporters/csv_exporter.py`：CandidatePool / DeepDive / evidence / manual_todo 输出
- `exporters/summary_exporter.py`：简单聚类统计
- `main.py`：CLI 与增量执行流程

---

## 字段推断规则（不可编造）

所有推断字段均输出 `value + confidence(0-1) + evidence_snippet`（或 Unknown/TODO）。

### 1) Genre 推断
关键词映射（命中最多者优先）：

- `SLG/4X`: strategy, alliance, kingdom, empire, 4x
- `Shooter`: shooter, gun, sniper, fps, tps
- `RPG`: rpg, role playing, hero, quest, gacha
- `Puzzle`: puzzle, match, tile, brain
- `Sim`: simulation, simulator, tycoon, build
- `Party`: party, multiplayer mini, social
- `Casual`: casual, relax, idle, merge

置信度：`0.45 + 0.15 * 命中数`（上限 0.95）。

### 2) Art style 推断
- `Realistic`: realistic, high-fidelity...
- `Stylized`: stylized, vibrant...
- `Cartoon`: cartoon, cute, chibi...
- `Anime`: anime, manga...
- 无命中：`Unknown`

### 3) Theme 推断
- Medieval / Modern military / Post-apocalypse / Sci-fi / Fantasy / Urban/Crime / IP/Anime
- 基于题材关键词命中

### 4) Monetization mix 推断
- `Hybrid`: 同时存在 IAP + Ads 标识
- `IAP`: 有 IAP（且可参考 IAP primary）
- `IAA`: 有 Ads
- 否则 `Unknown`

### 5) IAP primary type 推断
关键词可多选：
- Battle Pass, Monthly card, Gacha, Skins, Tier packs, Starter pack, VIP

### 6) Session length 推断（必须有规则依据）
规则来源：行业常见品类会话长度先验 + 文本关键词。
- `L`（长）：strategy/slg/4x/rpg/raid/guild war
- `M`（中）：simulation/sim/midcore/coop/adventure
- `S`（短）：casual/puzzle/merge/idle/hypercasual

输出 evidence 中包含 `session_rules:...; genre=...`。

---

## 必填 TODO（人工确认）
`DeepDive.csv` 以下字段固定输出 TODO，避免模型臆断：
- Core loop
- Social/Competition
- Pricing/Offers（部分）
- LiveOps cadence
- Key events
- Differentiator
- Risks
- Potential score

`manual_todo.md` 会逐游戏生成核查清单与“怎么查”。

---

## evidence.json 说明
每个游戏 URL 记录：
- `source_url`
- `record`（抓取到的结构化字段）
- `field_mapping`（字段来源映射）
- `snippets`（证据片段）
- `status`（ok/fetch_failed/unsupported）

用于审计“为什么这么判断”。

---

## 注意事项

- 商店页面结构会变化，某些字段可能抓不到，程序会继续下一个并保留证据状态。
- 若只给 game name 未给 URL，本版本未内置搜索引擎抓取（可扩展）。
- OCR 为可选轻量近似实现，不替代真正图像 OCR 引擎。
