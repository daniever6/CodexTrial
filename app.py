import io
import sqlite3
from collections import Counter
from datetime import datetime

import pandas as pd
import streamlit as st

DB_PATH = "games_survey_eu.db"

YES_NO_UNKNOWN = ["Y", "N", "Unknown"]
SCORE_OPTIONS = [1, 2, 3, 4, 5]

OPTIONS = {
    "eu_markets": [
        "EU", "DE", "FR", "UK", "IT", "ES", "NL", "SE", "NO", "FI", "DK", "BE", "AT", "CH",
        "PL", "TR", "RO", "CZ", "HU", "GR", "PT", "IE", "Other",
    ],
    "genre": [
        "SLG/4X", "Shooter", "RPG", "ARPG", "Card/TCG", "Puzzle", "Match-3", "Sim/Builder", "Idle",
        "Party/Social", "Sports", "Racing", "Casual", "Hybridcasual", "Hypercasual", "Other",
    ],
    "hybrid_type": [
        "None", "4X+TowerDefense", "4X+Survival", "Shooter+Extraction", "Puzzle+Merge",
        "Match-3+Meta", "Idle+RPG", "Other",
    ],
    "session_length": ["S(<3m)", "M(3-10m)", "L(>10m)"],
    "social_competition": [
        "None", "Guild/Clan", "Alliance", "PvP Rank", "Guild War", "Co-op", "Cross-server", "Multiple",
    ],
    "art_style": ["Realistic", "Stylized", "Cartoon", "Anime", "Low-poly", "Pixel", "Other", "Unknown"],
    "theme_setting": [
        "Medieval", "Modern military", "Post-apocalypse", "Sci-fi", "Fantasy", "Urban/Crime", "Sports",
        "IP/Anime", "Cozy/Cute", "Other", "Unknown",
    ],
    "monetization_mix": ["IAP", "IAA", "Hybrid", "Subscription-led", "Unknown"],
    "ads_type": ["None", "Rewarded", "Interstitial", "Banner", "Offerwall", "Mixed", "Unknown"],
    "iap_type": [
        "Battle Pass", "Monthly Card", "Subscription", "Gacha", "Skins/Cosmetics", "Tier Packs", "Starter Pack",
        "Resource Packs", "VIP", "Convenience(energy/skip)", "Other", "Unknown",
    ],
    "offer_trigger": [
        "Progress milestone", "Failure/friction", "Event entry", "Social comparison", "Store entry", "Other", "Unknown",
    ],
    "liveops_cadence": ["Weekly", "Biweekly", "Monthly", "Seasonal", "Event-based", "Unknown"],
    "event_type": [
        "Ranked ladder", "Guild/Alliance war", "Limited-time dungeon", "Collection event", "Collab/IP",
        "Holiday event", "Tournament", "Mini-game", "Other", "Unknown",
    ],
    "growth_type": ["DL", "Rev", "Both", "Viral/UGC", "Unknown"],
}

COLUMNS = [
    "game", "publisher", "release_date", "eu_focus_market", "eu_markets_notes", "genre", "hybrid_type", "session_length",
    "social_competition", "art_style", "theme_setting", "monetization_mix", "ads_type", "iap_primary_1", "iap_primary_2",
    "iap_primary_3", "battle_pass", "monthly_card", "subscription", "gacha", "cosmetics_focus", "tier_packs", "vip",
    "dtc_webshop", "collab_events", "max_price_tier_eur", "starter_pack_price_eur", "battle_pass_price_eur", "offer_trigger_1",
    "offer_trigger_2", "liveops_cadence", "event_type_1", "event_type_2", "event_type_3", "growth_type", "growth_signal",
    "evidence_links", "micro_conversion", "mid_spender", "whale_depth", "liveops_monetization", "eu_risk", "overall_potential",
    "notes",
]


def get_conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)


def init_db():
    conn = get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game TEXT NOT NULL,
            publisher TEXT,
            release_date TEXT,
            eu_focus_market TEXT,
            eu_markets_notes TEXT,
            genre TEXT NOT NULL,
            hybrid_type TEXT,
            session_length TEXT,
            social_competition TEXT,
            art_style TEXT,
            theme_setting TEXT,
            monetization_mix TEXT NOT NULL,
            ads_type TEXT,
            iap_primary_1 TEXT,
            iap_primary_2 TEXT,
            iap_primary_3 TEXT,
            battle_pass TEXT,
            monthly_card TEXT,
            subscription TEXT,
            gacha TEXT,
            cosmetics_focus TEXT,
            tier_packs TEXT,
            vip TEXT,
            dtc_webshop TEXT,
            collab_events TEXT,
            max_price_tier_eur REAL,
            starter_pack_price_eur REAL,
            battle_pass_price_eur REAL,
            offer_trigger_1 TEXT,
            offer_trigger_2 TEXT,
            liveops_cadence TEXT,
            event_type_1 TEXT,
            event_type_2 TEXT,
            event_type_3 TEXT,
            growth_type TEXT,
            growth_signal TEXT,
            evidence_links TEXT,
            micro_conversion INTEGER,
            mid_spender INTEGER,
            whale_depth INTEGER,
            liveops_monetization INTEGER,
            eu_risk INTEGER,
            overall_potential INTEGER,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


def now_iso():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


def safe_float(value):
    if value in (None, ""):
        return None
    return float(value)


def join_multi(values):
    if not values:
        return ""
    return ";".join(values)


def split_multi(value):
    if not value:
        return []
    return [v.strip() for v in str(value).split(";") if v.strip()]


def insert_game(data):
    conn = get_conn()
    placeholders = ",".join(["?"] * (len(COLUMNS) + 2))
    sql = f"INSERT INTO games ({','.join(COLUMNS)},created_at,updated_at) VALUES ({placeholders})"
    conn.execute(sql, [data.get(c) for c in COLUMNS] + [now_iso(), now_iso()])
    conn.commit()
    conn.close()


def update_game(game_id, data):
    conn = get_conn()
    assignments = ",".join([f"{c}=?" for c in COLUMNS]) + ",updated_at=?"
    sql = f"UPDATE games SET {assignments} WHERE id=?"
    conn.execute(sql, [data.get(c) for c in COLUMNS] + [now_iso(), game_id])
    conn.commit()
    conn.close()


def delete_game(game_id):
    conn = get_conn()
    conn.execute("DELETE FROM games WHERE id=?", (game_id,))
    conn.commit()
    conn.close()


def fetch_games_df():
    conn = get_conn()
    df = pd.read_sql_query("SELECT * FROM games ORDER BY updated_at DESC", conn)
    conn.close()
    return df


def build_payload(prefix="new"):
    return {
        "game": st.session_state.get(f"{prefix}_game", "").strip(),
        "publisher": st.session_state.get(f"{prefix}_publisher", "").strip(),
        "release_date": str(st.session_state.get(f"{prefix}_release_date", "")) if st.session_state.get(f"{prefix}_release_date") else "",
        "eu_focus_market": join_multi(st.session_state.get(f"{prefix}_eu_focus_market", [])),
        "eu_markets_notes": st.session_state.get(f"{prefix}_eu_markets_notes", "").strip(),
        "genre": st.session_state.get(f"{prefix}_genre", ""),
        "hybrid_type": st.session_state.get(f"{prefix}_hybrid_type", ""),
        "session_length": st.session_state.get(f"{prefix}_session_length", ""),
        "social_competition": st.session_state.get(f"{prefix}_social_competition", ""),
        "art_style": st.session_state.get(f"{prefix}_art_style", ""),
        "theme_setting": st.session_state.get(f"{prefix}_theme_setting", ""),
        "monetization_mix": st.session_state.get(f"{prefix}_monetization_mix", ""),
        "ads_type": st.session_state.get(f"{prefix}_ads_type", ""),
        "iap_primary_1": st.session_state.get(f"{prefix}_iap_primary_1", ""),
        "iap_primary_2": st.session_state.get(f"{prefix}_iap_primary_2", ""),
        "iap_primary_3": st.session_state.get(f"{prefix}_iap_primary_3", ""),
        "battle_pass": st.session_state.get(f"{prefix}_battle_pass", "Unknown"),
        "monthly_card": st.session_state.get(f"{prefix}_monthly_card", "Unknown"),
        "subscription": st.session_state.get(f"{prefix}_subscription", "Unknown"),
        "gacha": st.session_state.get(f"{prefix}_gacha", "Unknown"),
        "cosmetics_focus": st.session_state.get(f"{prefix}_cosmetics_focus", "Unknown"),
        "tier_packs": st.session_state.get(f"{prefix}_tier_packs", "Unknown"),
        "vip": st.session_state.get(f"{prefix}_vip", "Unknown"),
        "dtc_webshop": st.session_state.get(f"{prefix}_dtc_webshop", "Unknown"),
        "collab_events": st.session_state.get(f"{prefix}_collab_events", "Unknown"),
        "max_price_tier_eur": safe_float(st.session_state.get(f"{prefix}_max_price_tier_eur")),
        "starter_pack_price_eur": safe_float(st.session_state.get(f"{prefix}_starter_pack_price_eur")),
        "battle_pass_price_eur": safe_float(st.session_state.get(f"{prefix}_battle_pass_price_eur")),
        "offer_trigger_1": st.session_state.get(f"{prefix}_offer_trigger_1", ""),
        "offer_trigger_2": st.session_state.get(f"{prefix}_offer_trigger_2", ""),
        "liveops_cadence": st.session_state.get(f"{prefix}_liveops_cadence", ""),
        "event_type_1": st.session_state.get(f"{prefix}_event_type_1", ""),
        "event_type_2": st.session_state.get(f"{prefix}_event_type_2", ""),
        "event_type_3": st.session_state.get(f"{prefix}_event_type_3", ""),
        "growth_type": st.session_state.get(f"{prefix}_growth_type", ""),
        "growth_signal": st.session_state.get(f"{prefix}_growth_signal", "").strip(),
        "evidence_links": st.session_state.get(f"{prefix}_evidence_links", "").strip(),
        "micro_conversion": int(st.session_state.get(f"{prefix}_micro_conversion", 3)),
        "mid_spender": int(st.session_state.get(f"{prefix}_mid_spender", 3)),
        "whale_depth": int(st.session_state.get(f"{prefix}_whale_depth", 3)),
        "liveops_monetization": int(st.session_state.get(f"{prefix}_liveops_monetization", 3)),
        "eu_risk": int(st.session_state.get(f"{prefix}_eu_risk", 3)),
        "overall_potential": int(st.session_state.get(f"{prefix}_overall_potential", 3)),
        "notes": st.session_state.get(f"{prefix}_notes", "").strip(),
    }


def render_form(prefix="new", initial=None):
    initial = initial or {}
    c1, c2 = st.columns(2)
    c1.text_input("游戏名 *", value=initial.get("game", ""), key=f"{prefix}_game")
    c2.text_input("发行商", value=initial.get("publisher", ""), key=f"{prefix}_publisher")

    c1, c2 = st.columns(2)
    rd = initial.get("release_date") or None
    c1.date_input("发布日期", value=pd.to_datetime(rd).date() if rd else None, key=f"{prefix}_release_date")
    c2.multiselect("EU focus market", options=OPTIONS["eu_markets"], default=split_multi(initial.get("eu_focus_market", "")), key=f"{prefix}_eu_focus_market")

    st.text_input("EU markets notes", value=initial.get("eu_markets_notes", ""), key=f"{prefix}_eu_markets_notes")

    st.markdown("### 分类玩法")
    cols = st.columns(3)
    cols[0].selectbox("Genre *", OPTIONS["genre"], index=max(0, OPTIONS["genre"].index(initial.get("genre")) if initial.get("genre") in OPTIONS["genre"] else 0), key=f"{prefix}_genre")
    cols[1].selectbox("Hybrid type", OPTIONS["hybrid_type"], index=OPTIONS["hybrid_type"].index(initial.get("hybrid_type")) if initial.get("hybrid_type") in OPTIONS["hybrid_type"] else 0, key=f"{prefix}_hybrid_type")
    cols[2].selectbox("Session length", OPTIONS["session_length"], index=OPTIONS["session_length"].index(initial.get("session_length")) if initial.get("session_length") in OPTIONS["session_length"] else 0, key=f"{prefix}_session_length")

    cols = st.columns(3)
    cols[0].selectbox("Social competition", OPTIONS["social_competition"], index=OPTIONS["social_competition"].index(initial.get("social_competition")) if initial.get("social_competition") in OPTIONS["social_competition"] else 0, key=f"{prefix}_social_competition")
    cols[1].selectbox("Art style", OPTIONS["art_style"], index=OPTIONS["art_style"].index(initial.get("art_style")) if initial.get("art_style") in OPTIONS["art_style"] else 0, key=f"{prefix}_art_style")
    cols[2].selectbox("Theme setting", OPTIONS["theme_setting"], index=OPTIONS["theme_setting"].index(initial.get("theme_setting")) if initial.get("theme_setting") in OPTIONS["theme_setting"] else 0, key=f"{prefix}_theme_setting")

    st.markdown("### 商业化")
    cols = st.columns(3)
    cols[0].selectbox("Monetization mix *", OPTIONS["monetization_mix"], index=OPTIONS["monetization_mix"].index(initial.get("monetization_mix")) if initial.get("monetization_mix") in OPTIONS["monetization_mix"] else 0, key=f"{prefix}_monetization_mix")
    cols[1].selectbox("Ads type", OPTIONS["ads_type"], index=OPTIONS["ads_type"].index(initial.get("ads_type")) if initial.get("ads_type") in OPTIONS["ads_type"] else 0, key=f"{prefix}_ads_type")
    cols[2].selectbox("IAP primary #1", OPTIONS["iap_type"], index=OPTIONS["iap_type"].index(initial.get("iap_primary_1")) if initial.get("iap_primary_1") in OPTIONS["iap_type"] else 0, key=f"{prefix}_iap_primary_1")

    cols = st.columns(3)
    cols[0].selectbox("IAP primary #2", OPTIONS["iap_type"], index=OPTIONS["iap_type"].index(initial.get("iap_primary_2")) if initial.get("iap_primary_2") in OPTIONS["iap_type"] else 0, key=f"{prefix}_iap_primary_2")
    cols[1].selectbox("IAP primary #3", OPTIONS["iap_type"], index=OPTIONS["iap_type"].index(initial.get("iap_primary_3")) if initial.get("iap_primary_3") in OPTIONS["iap_type"] else 0, key=f"{prefix}_iap_primary_3")
    cols[2].selectbox("Offer trigger #1", OPTIONS["offer_trigger"], index=OPTIONS["offer_trigger"].index(initial.get("offer_trigger_1")) if initial.get("offer_trigger_1") in OPTIONS["offer_trigger"] else 0, key=f"{prefix}_offer_trigger_1")

    cols = st.columns(3)
    cols[0].selectbox("Offer trigger #2", OPTIONS["offer_trigger"], index=OPTIONS["offer_trigger"].index(initial.get("offer_trigger_2")) if initial.get("offer_trigger_2") in OPTIONS["offer_trigger"] else 0, key=f"{prefix}_offer_trigger_2")
    cols[1].text_input("Max price tier (EUR)", value=initial.get("max_price_tier_eur", ""), key=f"{prefix}_max_price_tier_eur")
    cols[2].text_input("Starter pack price (EUR)", value=initial.get("starter_pack_price_eur", ""), key=f"{prefix}_starter_pack_price_eur")

    st.text_input("Battle pass price (EUR)", value=initial.get("battle_pass_price_eur", ""), key=f"{prefix}_battle_pass_price_eur")

    st.markdown("### 开关项")
    toggles = ["battle_pass", "monthly_card", "subscription", "gacha", "cosmetics_focus", "tier_packs", "vip", "dtc_webshop", "collab_events"]
    cols = st.columns(3)
    for i, field in enumerate(toggles):
        label = field.replace("_", " ").title()
        cols[i % 3].selectbox(label, YES_NO_UNKNOWN, index=YES_NO_UNKNOWN.index(initial.get(field, "Unknown")) if initial.get(field, "Unknown") in YES_NO_UNKNOWN else 2, key=f"{prefix}_{field}")

    st.markdown("### LiveOps")
    cols = st.columns(4)
    cols[0].selectbox("LiveOps cadence", OPTIONS["liveops_cadence"], index=OPTIONS["liveops_cadence"].index(initial.get("liveops_cadence")) if initial.get("liveops_cadence") in OPTIONS["liveops_cadence"] else 0, key=f"{prefix}_liveops_cadence")
    cols[1].selectbox("Event type #1", OPTIONS["event_type"], index=OPTIONS["event_type"].index(initial.get("event_type_1")) if initial.get("event_type_1") in OPTIONS["event_type"] else 0, key=f"{prefix}_event_type_1")
    cols[2].selectbox("Event type #2", OPTIONS["event_type"], index=OPTIONS["event_type"].index(initial.get("event_type_2")) if initial.get("event_type_2") in OPTIONS["event_type"] else 0, key=f"{prefix}_event_type_2")
    cols[3].selectbox("Event type #3", OPTIONS["event_type"], index=OPTIONS["event_type"].index(initial.get("event_type_3")) if initial.get("event_type_3") in OPTIONS["event_type"] else 0, key=f"{prefix}_event_type_3")

    st.markdown("### 增长证据")
    cols = st.columns(2)
    cols[0].selectbox("Growth type", OPTIONS["growth_type"], index=OPTIONS["growth_type"].index(initial.get("growth_type")) if initial.get("growth_type") in OPTIONS["growth_type"] else 0, key=f"{prefix}_growth_type")
    cols[1].text_input("Growth signal", value=initial.get("growth_signal", ""), key=f"{prefix}_growth_signal")
    st.text_area("Evidence links（支持多行）", value=initial.get("evidence_links", ""), key=f"{prefix}_evidence_links", height=100)

    st.markdown("### 打分与备注")
    cols = st.columns(3)
    cols[0].selectbox("Micro conversion", SCORE_OPTIONS, index=SCORE_OPTIONS.index(int(initial.get("micro_conversion", 3))), key=f"{prefix}_micro_conversion")
    cols[1].selectbox("Mid spender", SCORE_OPTIONS, index=SCORE_OPTIONS.index(int(initial.get("mid_spender", 3))), key=f"{prefix}_mid_spender")
    cols[2].selectbox("Whale depth", SCORE_OPTIONS, index=SCORE_OPTIONS.index(int(initial.get("whale_depth", 3))), key=f"{prefix}_whale_depth")

    cols = st.columns(3)
    cols[0].selectbox("LiveOps monetization", SCORE_OPTIONS, index=SCORE_OPTIONS.index(int(initial.get("liveops_monetization", 3))), key=f"{prefix}_liveops_monetization")
    cols[1].selectbox("EU risk", SCORE_OPTIONS, index=SCORE_OPTIONS.index(int(initial.get("eu_risk", 3))), key=f"{prefix}_eu_risk")
    cols[2].selectbox("Overall potential", SCORE_OPTIONS, index=SCORE_OPTIONS.index(int(initial.get("overall_potential", 3))), key=f"{prefix}_overall_potential")

    st.text_area("Notes", value=initial.get("notes", ""), key=f"{prefix}_notes", height=120)


def validate_required(payload):
    return bool(payload["game"] and payload["genre"] and payload["monetization_mix"])


def get_filtered_df(df, keyword, genre, mix, cadence, overall_min, market):
    out = df.copy()
    if keyword:
        low = keyword.lower()
        out = out[out["game"].str.lower().str.contains(low, na=False) | out["publisher"].str.lower().str.contains(low, na=False)]
    if genre != "All":
        out = out[out["genre"] == genre]
    if mix != "All":
        out = out[out["monetization_mix"] == mix]
    if cadence != "All":
        out = out[out["liveops_cadence"] == cadence]
    out = out[out["overall_potential"].fillna(0) >= overall_min]
    if market != "All":
        out = out[out["eu_focus_market"].str.contains(market, na=False)]
    return out


def counter_from_columns(df, cols, split=False):
    c = Counter()
    for col in cols:
        for v in df[col].fillna(""):
            if not v:
                continue
            if split:
                for item in split_multi(v):
                    c[item] += 1
            else:
                c[v] += 1
    return pd.DataFrame(c.most_common(), columns=["value", "count"])


def summary_csv(df):
    freq_genre = counter_from_columns(df, ["genre"])
    freq_mix = counter_from_columns(df, ["monetization_mix"])
    freq_iap = counter_from_columns(df, ["iap_primary_1", "iap_primary_2", "iap_primary_3"])
    freq_cadence = counter_from_columns(df, ["liveops_cadence"])
    freq_event = counter_from_columns(df, ["event_type_1", "event_type_2", "event_type_3"])

    frames = []
    for name, part in {
        "genre": freq_genre,
        "monetization_mix": freq_mix,
        "iap_primary": freq_iap,
        "liveops_cadence": freq_cadence,
        "event_type": freq_event,
    }.items():
        if not part.empty:
            tmp = part.copy()
            tmp.insert(0, "metric", name)
            frames.append(tmp)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["metric", "value", "count"])


def main():
    st.set_page_config(page_title="移动游戏深度调查录入器（EU）", layout="wide")
    init_db()

    st.title("移动游戏深度调查录入器（EU）")
    st.caption("本地 SQLite 单文件数据库，聚焦快速录入 + 可筛选管理 + 共性统计 + 导出。")

    df = fetch_games_df()

    tab_new, tab_list, tab_stats, tab_export = st.tabs(["新增调查", "游戏列表", "共性统计", "导出"])

    with tab_new:
        st.subheader("新增调查（每次录入 1 款游戏）")
        with st.form("new_form"):
            render_form("new")
            saved = st.form_submit_button("保存")
            if saved:
                payload = build_payload("new")
                if not validate_required(payload):
                    st.error("必填项缺失：game、genre、monetization_mix")
                else:
                    try:
                        insert_game(payload)
                        st.success("保存成功。")
                        st.rerun()
                    except ValueError:
                        st.error("价格字段请输入数字（可留空）。")

    with tab_list:
        st.subheader("游戏列表（搜索 / 筛选 / 编辑 / 删除）")
        c1, c2, c3, c4, c5 = st.columns(5)
        keyword = c1.text_input("搜索 game/publisher")
        genre_filter = c2.selectbox("Genre", ["All"] + OPTIONS["genre"])
        mix_filter = c3.selectbox("Monetization mix", ["All"] + OPTIONS["monetization_mix"])
        cadence_filter = c4.selectbox("LiveOps cadence", ["All"] + OPTIONS["liveops_cadence"])
        market_filter = c5.selectbox("EU focus market", ["All"] + OPTIONS["eu_markets"])
        overall_min = st.slider("Overall potential >= X", 1, 5, 1)

        filtered = get_filtered_df(df, keyword, genre_filter, mix_filter, cadence_filter, overall_min, market_filter)
        st.dataframe(filtered[["id", "game", "publisher", "genre", "monetization_mix", "liveops_cadence", "overall_potential", "updated_at"]], use_container_width=True)

        if filtered.empty:
            st.info("暂无匹配数据。")
        else:
            options = {f"#{int(row.id)} | {row.game}": int(row.id) for row in filtered.itertuples()}
            pick = st.selectbox("选择一条记录进行编辑", list(options.keys()))
            game_id = options[pick]
            row = df[df["id"] == game_id].iloc[0].to_dict()

            with st.form("edit_form"):
                render_form("edit", row)
                col_save, col_del = st.columns([1, 1])
                update_clicked = col_save.form_submit_button("更新")
                delete_clicked = col_del.form_submit_button("删除")

                if update_clicked:
                    payload = build_payload("edit")
                    if not validate_required(payload):
                        st.error("必填项缺失：game、genre、monetization_mix")
                    else:
                        try:
                            update_game(game_id, payload)
                            st.success("更新成功。")
                            st.rerun()
                        except ValueError:
                            st.error("价格字段请输入数字（可留空）。")
                if delete_clicked:
                    delete_game(game_id)
                    st.warning("已删除。")
                    st.rerun()

    with tab_stats:
        st.subheader("共性统计")
        if df.empty:
            st.info("暂无数据，先去“新增调查”录入。")
        else:
            col1, col2, col3 = st.columns(3)
            col1.metric("总游戏数", len(df))
            col2.metric("平均整体潜力", round(df["overall_potential"].astype(float).mean(), 2))
            col3.metric("平均 EU 风险", round(df["eu_risk"].astype(float).mean(), 2))

            st.markdown("#### 频次榜")
            fg = counter_from_columns(df, ["genre"])
            fm = counter_from_columns(df, ["monetization_mix"])
            fi = counter_from_columns(df, ["iap_primary_1", "iap_primary_2", "iap_primary_3"])
            fl = counter_from_columns(df, ["liveops_cadence"])
            fe = counter_from_columns(df, ["event_type_1", "event_type_2", "event_type_3"])

            a, b = st.columns(2)
            a.dataframe(fg, use_container_width=True, hide_index=True)
            b.dataframe(fm, use_container_width=True, hide_index=True)
            a.dataframe(fi, use_container_width=True, hide_index=True)
            b.dataframe(fl, use_container_width=True, hide_index=True)
            st.dataframe(fe, use_container_width=True, hide_index=True)

            st.markdown("#### 交叉表")
            cross1 = pd.crosstab(df["genre"], df["monetization_mix"])
            cross2 = pd.crosstab(df["iap_primary_1"], df["liveops_cadence"])
            c1, c2 = st.columns(2)
            c1.write("Genre x Monetization mix")
            c1.dataframe(cross1, use_container_width=True)
            c2.write("IAP primary #1 x LiveOps cadence")
            c2.dataframe(cross2, use_container_width=True)

            st.markdown("#### Top 组合")
            combo = (
                df.groupby(["genre", "iap_primary_1", "liveops_cadence"]).size().reset_index(name="count")
                .sort_values("count", ascending=False)
                .head(20)
            )
            st.dataframe(combo, use_container_width=True, hide_index=True)

            summary_df = summary_csv(df)
            st.download_button(
                "导出 summary.csv",
                data=summary_df.to_csv(index=False).encode("utf-8-sig"),
                file_name="summary.csv",
                mime="text/csv",
            )

    with tab_export:
        st.subheader("导出")
        if df.empty:
            st.info("暂无数据可导出。")
        else:
            st.download_button(
                "导出全量 CSV",
                data=df.to_csv(index=False).encode("utf-8-sig"),
                file_name="games_all.csv",
                mime="text/csv",
            )

            c1, c2, c3 = st.columns(3)
            f_genre = c1.selectbox("筛选 Genre", ["All"] + OPTIONS["genre"], key="exp_g")
            f_mix = c2.selectbox("筛选 Monetization mix", ["All"] + OPTIONS["monetization_mix"], key="exp_m")
            f_p = c3.slider("筛选 Overall potential >=", 1, 5, 1, key="exp_p")

            f_df = get_filtered_df(df, "", f_genre, f_mix, "All", f_p, "All")
            st.write(f"筛选结果：{len(f_df)} 条")
            st.download_button(
                "导出筛选结果 CSV",
                data=f_df.to_csv(index=False).encode("utf-8-sig"),
                file_name="games_filtered.csv",
                mime="text/csv",
            )

            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
                f_df.to_excel(writer, sheet_name="games", index=False)
            st.download_button(
                "导出 Excel（可选）",
                data=excel_buffer.getvalue(),
                file_name="games_export.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )


if __name__ == "__main__":
    main()
