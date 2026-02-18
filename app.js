const ENUMS = {
  eu_markets: ['EU', 'DE', 'FR', 'UK', 'IT', 'ES', 'NL', 'SE', 'NO', 'FI', 'DK', 'BE', 'AT', 'CH', 'PL', 'TR', 'RO', 'CZ', 'HU', 'GR', 'PT', 'IE', 'Other'],
  genre: ['SLG/4X', 'Shooter', 'RPG', 'ARPG', 'Card/TCG', 'Puzzle', 'Match-3', 'Sim/Builder', 'Idle', 'Party/Social', 'Sports', 'Racing', 'Casual', 'Hybridcasual', 'Hypercasual', 'Other'],
  hybrid_type: ['None', '4X+TowerDefense', '4X+Survival', 'Shooter+Extraction', 'Puzzle+Merge', 'Match-3+Meta', 'Idle+RPG', 'Other'],
  session_length: ['S(<3m)', 'M(3-10m)', 'L(>10m)'],
  social_competition: ['None', 'Guild/Clan', 'Alliance', 'PvP Rank', 'Guild War', 'Co-op', 'Cross-server', 'Multiple'],
  art_style: ['Realistic', 'Stylized', 'Cartoon', 'Anime', 'Low-poly', 'Pixel', 'Other', 'Unknown'],
  theme_setting: ['Medieval', 'Modern military', 'Post-apocalypse', 'Sci-fi', 'Fantasy', 'Urban/Crime', 'Sports', 'IP/Anime', 'Cozy/Cute', 'Other', 'Unknown'],
  monetization_mix: ['IAP', 'IAA', 'Hybrid', 'Subscription-led', 'Unknown'],
  ads_type: ['None', 'Rewarded', 'Interstitial', 'Banner', 'Offerwall', 'Mixed', 'Unknown'],
  iap_type: ['Battle Pass', 'Monthly Card', 'Subscription', 'Gacha', 'Skins/Cosmetics', 'Tier Packs', 'Starter Pack', 'Resource Packs', 'VIP', 'Convenience(energy/skip)', 'Other', 'Unknown'],
  offer_trigger: ['Progress milestone', 'Failure/friction', 'Event entry', 'Social comparison', 'Store entry', 'Other', 'Unknown'],
  liveops_cadence: ['Weekly', 'Biweekly', 'Monthly', 'Seasonal', 'Event-based', 'Unknown'],
  event_type: ['Ranked ladder', 'Guild/Alliance war', 'Limited-time dungeon', 'Collection event', 'Collab/IP', 'Holiday event', 'Tournament', 'Mini-game', 'Other', 'Unknown'],
  growth_type: ['DL', 'Rev', 'Both', 'Viral/UGC', 'Unknown'],
  yes_no: ['Y', 'N', 'Unknown'],
  scores: ['1', '2', '3', '4', '5']
};

const COLUMNS = [
  'id', 'game', 'publisher', 'release_date', 'eu_focus_market', 'eu_markets_notes', 'genre', 'hybrid_type', 'session_length', 'social_competition', 'art_style', 'theme_setting',
  'monetization_mix', 'ads_type', 'iap_primary_1', 'iap_primary_2', 'iap_primary_3', 'battle_pass', 'monthly_card', 'subscription', 'gacha', 'cosmetics_focus', 'tier_packs', 'vip', 'dtc_webshop', 'collab_events',
  'max_price_tier_eur', 'starter_pack_price_eur', 'battle_pass_price_eur', 'offer_trigger_1', 'offer_trigger_2', 'liveops_cadence', 'event_type_1', 'event_type_2', 'event_type_3',
  'growth_type', 'growth_signal', 'evidence_links', 'micro_conversion', 'mid_spender', 'whale_depth', 'liveops_monetization', 'eu_risk', 'overall_potential', 'notes', 'created_at', 'updated_at'
];

const FORM_FIELDS = [
  ['game', 'Game', 'text', null, true], ['publisher', 'Publisher', 'text'], ['release_date', 'Release date', 'date'], ['eu_focus_market', 'EU focus market', 'select', ENUMS.eu_markets], ['eu_markets_notes', 'EU markets notes', 'textarea'],
  ['genre', 'Genre', 'select', ENUMS.genre, true], ['hybrid_type', 'Hybrid type', 'select', ENUMS.hybrid_type], ['session_length', 'Session length', 'select', ENUMS.session_length], ['social_competition', 'Social competition', 'select', ENUMS.social_competition],
  ['art_style', 'Art style', 'select', ENUMS.art_style], ['theme_setting', 'Theme setting', 'select', ENUMS.theme_setting], ['monetization_mix', 'Monetization mix', 'select', ENUMS.monetization_mix, true], ['ads_type', 'Ads type', 'select', ENUMS.ads_type],
  ['iap_primary_1', 'IAP primary 1', 'select', ENUMS.iap_type], ['iap_primary_2', 'IAP primary 2', 'select', ENUMS.iap_type], ['iap_primary_3', 'IAP primary 3', 'select', ENUMS.iap_type],
  ['battle_pass', 'Battle pass', 'select', ENUMS.yes_no], ['monthly_card', 'Monthly card', 'select', ENUMS.yes_no], ['subscription', 'Subscription', 'select', ENUMS.yes_no], ['gacha', 'Gacha', 'select', ENUMS.yes_no], ['cosmetics_focus', 'Cosmetics focus', 'select', ENUMS.yes_no],
  ['tier_packs', 'Tier packs', 'select', ENUMS.yes_no], ['vip', 'VIP', 'select', ENUMS.yes_no], ['dtc_webshop', 'DTC webshop', 'select', ENUMS.yes_no], ['collab_events', 'Collab events', 'select', ENUMS.yes_no],
  ['max_price_tier_eur', 'Max price tier EUR', 'number'], ['starter_pack_price_eur', 'Starter pack price EUR', 'number'], ['battle_pass_price_eur', 'Battle pass price EUR', 'number'],
  ['offer_trigger_1', 'Offer trigger 1', 'select', ENUMS.offer_trigger], ['offer_trigger_2', 'Offer trigger 2', 'select', ENUMS.offer_trigger], ['liveops_cadence', 'LiveOps cadence', 'select', ENUMS.liveops_cadence],
  ['event_type_1', 'Event type 1', 'select', ENUMS.event_type], ['event_type_2', 'Event type 2', 'select', ENUMS.event_type], ['event_type_3', 'Event type 3', 'select', ENUMS.event_type], ['growth_type', 'Growth type', 'select', ENUMS.growth_type],
  ['growth_signal', 'Growth signal', 'text'], ['evidence_links', 'Evidence links (multi-line)', 'textarea'],
  ['micro_conversion', 'Micro conversion (1-5)', 'select', ENUMS.scores], ['mid_spender', 'Mid spender (1-5)', 'select', ENUMS.scores], ['whale_depth', 'Whale depth (1-5)', 'select', ENUMS.scores],
  ['liveops_monetization', 'LiveOps monetization (1-5)', 'select', ENUMS.scores], ['eu_risk', 'EU risk (1-5)', 'select', ENUMS.scores], ['overall_potential', 'Overall potential (1-5)', 'select', ENUMS.scores], ['notes', 'Notes', 'textarea']
];

const state = { db: null, SQL: null, currentEditId: null, filteredRows: [] };
const $ = (id) => document.getElementById(id);

function initTabs() {
  const tabs = [
    ['db', '数据库（导入/导出 db）'], ['add', '新增'], ['list', '列表'], ['stats', '统计'], ['export', '导出']
  ];
  const wrap = $('tabs');
  tabs.forEach(([id, label], idx) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = idx === 0 ? 'active' : '';
    btn.onclick = () => {
      document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      $(`tab-${id}`).classList.add('active');
    };
    wrap.appendChild(btn);
  });
}

function buildForm() {
  const form = $('surveyForm');
  form.innerHTML = '';
  FORM_FIELDS.forEach(([name, label, type, options, required]) => {
    const field = document.createElement('div');
    field.className = `field ${type === 'textarea' ? 'full' : ''}`;
    const l = document.createElement('label');
    l.textContent = label;
    if (required) l.classList.add('required');
    let input;
    if (type === 'select') {
      input = document.createElement('select');
      input.innerHTML = '<option value="">--</option>' + options.map((v) => `<option value="${v}">${v}</option>`).join('');
    } else if (type === 'textarea') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = type === 'number' ? 'number' : type;
      if (type === 'number') input.step = '0.01';
    }
    input.id = `f_${name}`;
    field.append(l, input);
    form.appendChild(field);
  });
}

function createTableIfNeeded() {
  state.db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT, publisher TEXT, release_date TEXT, eu_focus_market TEXT, eu_markets_notes TEXT,
    genre TEXT, hybrid_type TEXT, session_length TEXT, social_competition TEXT, art_style TEXT, theme_setting TEXT,
    monetization_mix TEXT, ads_type TEXT,
    iap_primary_1 TEXT, iap_primary_2 TEXT, iap_primary_3 TEXT,
    battle_pass TEXT, monthly_card TEXT, subscription TEXT, gacha TEXT, cosmetics_focus TEXT, tier_packs TEXT, vip TEXT, dtc_webshop TEXT, collab_events TEXT,
    max_price_tier_eur REAL, starter_pack_price_eur REAL, battle_pass_price_eur REAL,
    offer_trigger_1 TEXT, offer_trigger_2 TEXT,
    liveops_cadence TEXT, event_type_1 TEXT, event_type_2 TEXT, event_type_3 TEXT,
    growth_type TEXT, growth_signal TEXT, evidence_links TEXT,
    micro_conversion INTEGER, mid_spender INTEGER, whale_depth INTEGER, liveops_monetization INTEGER, eu_risk INTEGER, overall_potential INTEGER,
    notes TEXT,
    created_at TEXT, updated_at TEXT
  )`);
}

function migrateColumns() {
  const existing = new Set(state.db.exec('PRAGMA table_info(games)')[0]?.values.map((r) => r[1]) || []);
  const defs = {
    created_at: 'TEXT', updated_at: 'TEXT', notes: 'TEXT', evidence_links: 'TEXT'
  };
  COLUMNS.forEach((col) => {
    if (!existing.has(col)) {
      const d = defs[col] || 'TEXT';
      if (col !== 'id') state.db.run(`ALTER TABLE games ADD COLUMN ${col} ${d}`);
    }
  });
}

async function initSqlEngine() {
  if (typeof initSqlJs !== 'function') throw new Error('未检测到 sql.js。请先放置 assets/sql-wasm.js');
  state.SQL = await initSqlJs({ locateFile: () => 'assets/sql-wasm.wasm' });
}

function newDb() {
  state.db = new state.SQL.Database();
  createTableIfNeeded();
  $('dbStatus').textContent = '数据库已创建（内存中）';
  state.currentEditId = null;
  clearForm();
  refreshAll();
}

function readRows(sql, params = []) {
  const stmt = state.db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function loadDbFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    state.db = new state.SQL.Database(new Uint8Array(reader.result));
    createTableIfNeeded();
    migrateColumns();
    $('dbStatus').textContent = `已加载数据库：${file.name}`;
    state.currentEditId = null;
    clearForm();
    refreshAll();
  };
  reader.readAsArrayBuffer(file);
}

function saveDbFile() {
  ensureDb();
  const data = state.db.export();
  downloadBlob(new Blob([data], { type: 'application/octet-stream' }), 'games.db');
}

function ensureDb() {
  if (!state.db) throw new Error('请先点击“新建空库”或“加载 games.db”。');
}

function getFormData() {
  const obj = {};
  for (const [name, , type] of FORM_FIELDS) {
    const v = $(`f_${name}`).value;
    obj[name] = type === 'number' ? (v === '' ? null : Number(v)) : v;
  }
  return obj;
}

function validateRequired(data) {
  const missing = [];
  if (!data.game) missing.push('game');
  if (!data.genre) missing.push('genre');
  if (!data.monetization_mix) missing.push('monetization_mix');
  return missing;
}

function saveRecord() {
  ensureDb();
  const data = getFormData();
  const missing = validateRequired(data);
  if (missing.length) {
    alert(`必填字段缺失：${missing.join(', ')}`);
    return;
  }
  const now = new Date().toISOString();
  if (state.currentEditId) {
    data.updated_at = now;
    const setSql = COLUMNS.filter((c) => c !== 'id' && c !== 'created_at').map((c) => `${c} = ?`).join(', ');
    const values = COLUMNS.filter((c) => c !== 'id' && c !== 'created_at').map((c) => data[c] ?? null);
    state.db.run(`UPDATE games SET ${setSql} WHERE id = ?`, [...values, state.currentEditId]);
  } else {
    data.created_at = now;
    data.updated_at = now;
    const cols = COLUMNS.filter((c) => c !== 'id');
    const placeholders = cols.map(() => '?').join(', ');
    state.db.run(`INSERT INTO games (${cols.join(', ')}) VALUES (${placeholders})`, cols.map((c) => data[c] ?? null));
  }
  state.currentEditId = null;
  $('editHint').textContent = '已保存';
  clearForm();
  refreshAll();
}

function clearForm() {
  FORM_FIELDS.forEach(([name]) => { $(`f_${name}`).value = ''; });
  $('editHint').textContent = '';
}

function loadToForm(row) {
  FORM_FIELDS.forEach(([name]) => {
    const v = row[name];
    $(`f_${name}`).value = v == null ? '' : String(v);
  });
  state.currentEditId = row.id;
  $('editHint').textContent = `编辑中：ID ${row.id}`;
}

function getFilters() {
  return {
    q: $('searchInput').value.trim().toLowerCase(),
    genre: $('filterGenre').value,
    monet: $('filterMonetization').value,
    liveops: $('filterLiveops').value,
    potential: $('filterPotential').value,
    market: $('filterMarket').value
  };
}

function queryFilteredRows() {
  ensureDb();
  let rows = readRows('SELECT * FROM games ORDER BY updated_at DESC, id DESC');
  const f = getFilters();
  rows = rows.filter((r) => {
    const hit = !f.q || `${r.game || ''} ${r.publisher || ''}`.toLowerCase().includes(f.q);
    return hit
      && (!f.genre || r.genre === f.genre)
      && (!f.monet || r.monetization_mix === f.monet)
      && (!f.liveops || r.liveops_cadence === f.liveops)
      && (!f.market || r.eu_focus_market === f.market)
      && (!f.potential || Number(r.overall_potential || 0) >= Number(f.potential));
  });
  return rows;
}

function renderList() {
  const tbody = $('gamesTbody');
  tbody.innerHTML = '';
  if (!state.db) return;
  state.filteredRows = queryFilteredRows();
  state.filteredRows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${escapeHtml(r.game)}</td><td>${escapeHtml(r.publisher)}</td><td>${escapeHtml(r.genre)}</td><td>${escapeHtml(r.monetization_mix)}</td><td>${escapeHtml(r.liveops_cadence)}</td><td>${escapeHtml(r.overall_potential)}</td><td>${escapeHtml(r.eu_focus_market)}</td><td>${escapeHtml(r.updated_at)}</td><td><button class="action-btn" data-act="edit" data-id="${r.id}">编辑</button><button class="action-btn" data-act="del" data-id="${r.id}">删除</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button').forEach((btn) => {
    const id = Number(btn.dataset.id);
    if (btn.dataset.act === 'edit') {
      btn.onclick = () => {
        const row = readRows('SELECT * FROM games WHERE id=?', [id])[0];
        loadToForm(row);
        document.querySelector('.tabs button:nth-child(2)').click();
      };
    } else {
      btn.onclick = () => {
        if (confirm(`确认删除 ID ${id} 吗？`)) {
          state.db.run('DELETE FROM games WHERE id=?', [id]);
          refreshAll();
        }
      };
    }
  });
}

function summarizeFreq(rows, keys, label) {
  const map = new Map();
  rows.forEach((r) => {
    keys.forEach((k) => {
      const val = (r[k] || '').trim();
      if (val) map.set(val, (map.get(val) || 0) + 1);
    });
  });
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return { label, sorted };
}

function renderSummary() {
  const rows = state.filteredRows || [];
  const blocks = [
    summarizeFreq(rows, ['genre'], 'Genre'),
    summarizeFreq(rows, ['monetization_mix'], 'Monetization mix'),
    summarizeFreq(rows, ['iap_primary_1', 'iap_primary_2', 'iap_primary_3'], 'IAP primary (1-3合并)'),
    summarizeFreq(rows, ['liveops_cadence'], 'LiveOps cadence'),
    summarizeFreq(rows, ['event_type_1', 'event_type_2', 'event_type_3'], 'EventType (1-3合并)')
  ];
  $('summaryBlocks').innerHTML = blocks.map((b) => `<div class="summary-card"><h3>${b.label}</h3><ul>${(b.sorted.slice(0, 10).map(([k, v]) => `<li>${escapeHtml(k)}: ${v}</li>`).join('') || '<li>无数据</li>')}</ul></div>`).join('');
  renderCrossTable('crossGenreMonetTable', rows, 'genre', 'monetization_mix');
  renderCrossTable('crossIapLiveopsTable', rows, 'iap_primary_1', 'liveops_cadence');
  renderTopCombos(rows);
}

function renderCrossTable(tableId, rows, rowKey, colKey) {
  const rowVals = [...new Set(rows.map((r) => r[rowKey]).filter(Boolean))];
  const colVals = [...new Set(rows.map((r) => r[colKey]).filter(Boolean))];
  const html = [];
  html.push(`<thead><tr><th>${rowKey} \\ ${colKey}</th>${colVals.map((v) => `<th>${escapeHtml(v)}</th>`).join('')}</tr></thead><tbody>`);
  rowVals.forEach((rv) => {
    html.push(`<tr><th>${escapeHtml(rv)}</th>`);
    colVals.forEach((cv) => {
      const c = rows.filter((r) => r[rowKey] === rv && r[colKey] === cv).length;
      html.push(`<td>${c}</td>`);
    });
    html.push('</tr>');
  });
  html.push('</tbody>');
  $(tableId).innerHTML = html.join('');
}

function renderTopCombos(rows) {
  const n = Number($('topNInput').value || 10);
  const map = new Map();
  rows.forEach((r) => {
    const combo = `${r.genre || '-'} + ${r.iap_primary_1 || '-'} + ${r.liveops_cadence || '-'}`;
    map.set(combo, (map.get(combo) || 0) + 1);
  });
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  $('topComboBody').innerHTML = sorted.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`).join('') || '<tr><td colspan="2">无数据</td></tr>';
}

function refreshAll() {
  renderList();
  renderSummary();
}

function fillFilterOptions() {
  function setSelect(id, title, options, includeNum = false) {
    $(id).innerHTML = `<option value="">${title}</option>` + options.map((v) => `<option value="${v}">${v}</option>`).join('');
    if (includeNum) $(id).innerHTML = `<option value="">${title}</option>` + ['1', '2', '3', '4', '5'].map((v) => `<option value="${v}">>=${v}</option>`).join('');
  }
  setSelect('filterGenre', 'Genre', ENUMS.genre);
  setSelect('filterMonetization', 'Monetization mix', ENUMS.monetization_mix);
  setSelect('filterLiveops', 'LiveOps cadence', ENUMS.liveops_cadence);
  setSelect('filterMarket', 'EU focus market', ENUMS.eu_markets);
  setSelect('filterPotential', 'Overall potential >= X', [], true);
}

function rowsToCsv(rows) {
  const header = COLUMNS.join(',');
  const lines = rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(','));
  return '\uFEFF' + [header, ...lines].join('\n');
}

function csvCell(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

function exportAllCsv() {
  ensureDb();
  const rows = readRows('SELECT * FROM games ORDER BY id');
  downloadBlob(new Blob([rowsToCsv(rows)], { type: 'text/csv;charset=utf-8;' }), 'games_all.csv');
}

function exportFilteredCsv() {
  ensureDb();
  downloadBlob(new Blob([rowsToCsv(state.filteredRows)], { type: 'text/csv;charset=utf-8;' }), 'games_filtered.csv');
}

function exportSummaryCsv() {
  const rows = state.filteredRows || [];
  const sections = [
    summarizeFreq(rows, ['genre'], 'Genre'),
    summarizeFreq(rows, ['monetization_mix'], 'Monetization mix'),
    summarizeFreq(rows, ['iap_primary_1', 'iap_primary_2', 'iap_primary_3'], 'IAP primary merged'),
    summarizeFreq(rows, ['liveops_cadence'], 'LiveOps cadence'),
    summarizeFreq(rows, ['event_type_1', 'event_type_2', 'event_type_3'], 'EventType merged')
  ];
  const lines = ['\uFEFFsection,value,count'];
  sections.forEach((s) => s.sorted.forEach(([v, c]) => lines.push([csvCell(s.label), csvCell(v), c].join(','))));
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'summary.csv');
}

function exportXlsx() {
  ensureDb();
  if (typeof XLSX === 'undefined') throw new Error('未检测到 SheetJS，请检查 assets/xlsx.full.min.js');
  const ws = XLSX.utils.json_to_sheet(state.filteredRows.length ? state.filteredRows : readRows('SELECT * FROM games ORDER BY id'));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'games');
  XLSX.writeFile(wb, 'games.xlsx');
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function bindEvents() {
  $('newDbBtn').onclick = () => {
    try { newDb(); } catch (e) { alert(e.message); }
  };
  $('loadDbInput').onchange = (e) => {
    const f = e.target.files[0];
    if (f) loadDbFile(f);
    e.target.value = '';
  };
  $('saveDbBtn').onclick = () => { try { saveDbFile(); } catch (e) { alert(e.message); } };
  $('saveRecordBtn').onclick = () => { try { saveRecord(); } catch (e) { alert(e.message); } };
  $('resetFormBtn').onclick = clearForm;
  $('applyFilterBtn').onclick = refreshAll;
  $('clearFilterBtn').onclick = () => {
    ['searchInput', 'filterGenre', 'filterMonetization', 'filterLiveops', 'filterPotential', 'filterMarket'].forEach((id) => $(id).value = '');
    refreshAll();
  };
  $('refreshStatsBtn').onclick = refreshAll;
  $('exportAllCsvBtn').onclick = () => { try { exportAllCsv(); } catch (e) { alert(e.message); } };
  $('exportFilteredCsvBtn').onclick = () => { try { exportFilteredCsv(); } catch (e) { alert(e.message); } };
  $('exportSummaryBtn').onclick = exportSummaryCsv;
  $('exportXlsxBtn').onclick = () => { try { exportXlsx(); } catch (e) { alert(e.message); } };
}

(async function bootstrap() {
  initTabs();
  buildForm();
  fillFilterOptions();
  bindEvents();
  try {
    await initSqlEngine();
    $('dbStatus').textContent = 'SQLite 引擎已就绪，请新建空库或加载 games.db';
  } catch (err) {
    $('dbStatus').textContent = `SQLite 初始化失败：${err.message}`;
  }
})();
