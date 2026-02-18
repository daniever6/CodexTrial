const STORAGE_KEY = 'gameMonetizationDeepDiveV1';

const OPTIONS = {
  monetizationModel: ['IAP', 'IAA', 'Hybrid', 'Subscription-led'],
  iapShare: ['高', '中', '低'],
  coreDriver: ['进度驱动', '收集驱动', '竞争驱动', '美术外观驱动', '社交身份驱动'],
  mainEngine: ['Gacha', 'Pass', 'Competitive', 'Progress', 'Cosmetic', 'Event-currency'],
  ladderCompleteness: ['完整', '不完整'],
  hasMonthlyCard: ['有', '无'],
  hasBattlePass: ['有', '无'],
  hasSubscription: ['有', '无'],
  microHook: ['强', '弱'],
  midStabilizer: ['有', '无'],
  whaleMechanism: ['强', '弱'],
  liveopsRhythm: ['周更', '双周', '月更', '赛季'],
  popupIntensity: ['低', '中', '高'],
  euRiskLevel: ['低', '中', '高'],
  euRiskTag: ['P2W高', '概率争议', '广告干扰', '低风险']
};

const COLUMNS = [
  { key: 'gameName', label: '游戏名' },
  { key: 'genre', label: '品类/赛道' },
  { key: 'regionFocus', label: '重点区域' },
  { key: 'monetizationModel', label: '变现模式', type: 'select', options: OPTIONS.monetizationModel },
  { key: 'iapShare', label: 'IAP占比推断', type: 'select', options: OPTIONS.iapShare },
  { key: 'adTypes', label: '广告类型(多选;分隔)' },
  { key: 'subscriptionShape', label: '订阅形态' },
  { key: 'coreDriver', label: '付费核心驱动', type: 'select', options: OPTIONS.coreDriver },
  { key: 'skuCountBand', label: 'SKU总量级别' },
  { key: 'iapCatalogTypes', label: 'IAP商品类型(多选;分隔)' },
  { key: 'triggerMechanisms', label: '商品触发机制(多选;分隔)' },
  { key: 'priceLadder', label: '价格梯度(文本)' },
  { key: 'ladderCompleteness', label: '梯度完整性', type: 'select', options: OPTIONS.ladderCompleteness },
  { key: 'highestPricePoint', label: '最高价位' },
  { key: 'discountMechanism', label: '折扣机制' },
  { key: 'regionalPricing', label: '区域定价策略' },
  { key: 'currencySystem', label: '货币系统' },
  { key: 'resourceBottleneck', label: '资源瓶颈' },
  { key: 'accelerationSystem', label: '加速系统' },
  { key: 'valuePerception', label: '价值感(战力/效率)' },
  { key: 'firstPurchaseHook', label: '首充钩子', type: 'select', options: OPTIONS.microHook },
  { key: 'hasMonthlyCard', label: '月卡', type: 'select', options: OPTIONS.hasMonthlyCard },
  { key: 'hasBattlePass', label: '战令', type: 'select', options: OPTIONS.hasBattlePass },
  { key: 'hasSubscription', label: '订阅', type: 'select', options: OPTIONS.hasSubscription },
  { key: 'midStabilizer', label: '中R稳定器', type: 'select', options: OPTIONS.midStabilizer },
  { key: 'whaleMechanism', label: '大R收割机制', type: 'select', options: OPTIONS.whaleMechanism },
  { key: 'mainEngine', label: '主引擎', type: 'select', options: OPTIONS.mainEngine },
  { key: 'secondaryEngine', label: '副引擎' },
  { key: 'liveopsRhythm', label: 'LiveOps节奏', type: 'select', options: OPTIONS.liveopsRhythm },
  { key: 'eventTypes', label: '活动类型(多选;分隔)' },
  { key: 'eventMonetization', label: '活动变现方式(礼包/活动币/门票/次数)' },
  { key: 'firstPaywallTiming', label: '首次付费点出现时间' },
  { key: 'popupIntensity', label: '弹窗强度', type: 'select', options: OPTIONS.popupIntensity },
  { key: 'storeVisibility', label: '商店入口可见性' },
  { key: 'paymentFriction', label: '支付摩擦' },
  { key: 'copyAngle', label: '引导文案角度(折扣/战力/效率)' },
  { key: 'euRiskLevel', label: '欧洲风险等级', type: 'select', options: OPTIONS.euRiskLevel },
  { key: 'euRiskTag', label: '欧洲风险标签', type: 'select', options: OPTIONS.euRiskTag },
  { key: 'euRiskReason', label: '欧洲风险原因', type: 'textarea' },
  { key: 'sourceNote', label: '数据来源备注', type: 'textarea' },
  { key: 'actions', label: '操作', readonly: true }
];

let state = loadState();
let sortState = { key: 'gameName', asc: true };

const els = {
  statsPanel: document.getElementById('statsPanel'),
  insightPanel: document.getElementById('insightPanel'),
  searchInput: document.getElementById('searchInput'),
  filterModel: document.getElementById('filterModel'),
  filterEngine: document.getElementById('filterEngine'),
  filterRhythm: document.getElementById('filterRhythm'),
  filterRisk: document.getElementById('filterRisk'),
  addBtn: document.getElementById('addBtn'),
  exportBtn: document.getElementById('exportBtn'),
  exportTemplateBtn: document.getElementById('exportTemplateBtn'),
  importInput: document.getElementById('importInput'),
  clearBtn: document.getElementById('clearBtn'),
  tableHead: document.getElementById('tableHead'),
  tableBody: document.getElementById('tableBody')
};

init();

function init() {
  wireEvents();
  render();
}

function wireEvents() {
  [els.searchInput, els.filterModel, els.filterEngine, els.filterRhythm, els.filterRisk]
    .forEach(el => el.addEventListener('input', render));

  els.addBtn.addEventListener('click', () => {
    state.items.unshift(makeItem());
    persist();
    render();
  });

  els.exportBtn.addEventListener('click', () => exportCsv('game_monetization_deepdive.csv', mapRows(filteredItems(), false)));
  els.exportTemplateBtn.addEventListener('click', () => exportCsv('deepdive_template.csv', [mapRows([makeItem()], false)[0]]));

  els.importInput.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    state.items = parseCsv(text).map(normalizeImportedRow);
    persist();
    render();
    e.target.value = '';
  });

  els.clearBtn.addEventListener('click', () => {
    if (!window.confirm('确认清空全部 DeepDive 数据？')) return;
    state.items = [];
    persist();
    render();
  });
}

function makeItem() {
  return {
    id: crypto.randomUUID(),
    gameName: '', genre: '', regionFocus: '', monetizationModel: 'Hybrid', iapShare: '中', adTypes: '',
    subscriptionShape: '', coreDriver: '进度驱动', skuCountBand: '', iapCatalogTypes: '', triggerMechanisms: '',
    priceLadder: '0.99/1.99/4.99/9.99/19.99/49.99/99.99', ladderCompleteness: '完整', highestPricePoint: '',
    discountMechanism: '', regionalPricing: '', currencySystem: '', resourceBottleneck: '', accelerationSystem: '',
    valuePerception: '效率', firstPurchaseHook: '弱', hasMonthlyCard: '无', hasBattlePass: '无', hasSubscription: '无',
    midStabilizer: '无', whaleMechanism: '弱', mainEngine: 'Progress', secondaryEngine: '', liveopsRhythm: '双周',
    eventTypes: '', eventMonetization: '', firstPaywallTiming: '', popupIntensity: '中', storeVisibility: '',
    paymentFriction: '', copyAngle: '', euRiskLevel: '中', euRiskTag: '低风险', euRiskReason: '', sourceNote: ''
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: sampleData() };
  try {
    const parsed = JSON.parse(raw);
    return { items: (parsed.items || []).map(i => ({ ...makeItem(), ...i, id: i.id || crypto.randomUUID() })) };
  } catch {
    return { items: sampleData() };
  }
}

function sampleData() {
  return [
    {
      ...makeItem(),
      gameName: 'Sample RPG',
      genre: 'RPG',
      regionFocus: 'EU/US',
      monetizationModel: 'Hybrid',
      adTypes: 'Rewarded',
      iapCatalogTypes: 'Starter Pack;Battle Pass;Resource Packs',
      triggerMechanisms: '章节节点触发;活动入口触发',
      hasBattlePass: '有',
      midStabilizer: '有',
      whaleMechanism: '强',
      mainEngine: 'Gacha',
      secondaryEngine: 'Pass',
      liveopsRhythm: '周更',
      eventMonetization: '礼包;活动币',
      euRiskLevel: '中',
      euRiskTag: '概率争议'
    }
  ];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function filteredItems() {
  const kw = els.searchInput.value.trim().toLowerCase();
  return state.items.filter(i => {
    const hitKw = !kw || [i.gameName, i.genre, i.mainEngine, i.euRiskReason, i.sourceNote].join(' ').toLowerCase().includes(kw);
    return hitKw
      && (!els.filterModel.value || i.monetizationModel === els.filterModel.value)
      && (!els.filterEngine.value || i.mainEngine === els.filterEngine.value)
      && (!els.filterRhythm.value || i.liveopsRhythm === els.filterRhythm.value)
      && (!els.filterRisk.value || i.euRiskLevel === els.filterRisk.value);
  });
}

function render() {
  populateFilters();
  renderStats();
  renderInsights();
  renderTable();
}

function populateFilters() {
  setSelect(els.filterModel, OPTIONS.monetizationModel, '全部变现模式');
  setSelect(els.filterEngine, OPTIONS.mainEngine, '全部主引擎');
  setSelect(els.filterRhythm, OPTIONS.liveopsRhythm, '全部 LiveOps 节奏');
  setSelect(els.filterRisk, OPTIONS.euRiskLevel, '全部欧洲风险等级');
}

function setSelect(select, values, placeholder) {
  const keep = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  select.value = values.includes(keep) ? keep : '';
}

function renderStats() {
  const items = filteredItems();
  els.statsPanel.textContent = `当前游戏: ${items.length} ｜ 总样本: ${state.items.length}`;
}

function renderInsights() {
  const items = filteredItems();
  const groups = [
    ['变现模式', 'monetizationModel'],
    ['主引擎', 'mainEngine'],
    ['梯度完整性', 'ladderCompleteness'],
    ['微付费抓手', 'firstPurchaseHook'],
    ['中R稳定器', 'midStabilizer'],
    ['大R收割机制', 'whaleMechanism'],
    ['LiveOps节奏', 'liveopsRhythm'],
    ['欧洲风险标签', 'euRiskTag']
  ];

  els.insightPanel.innerHTML = groups.map(([title, key]) => {
    const count = countBy(items, key);
    const rows = Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li>${escapeHtml(k || '(空)')}: ${v}</li>`).join('');
    return `<article class="insight-card"><h3>${title}</h3><ul>${rows || '<li>暂无数据</li>'}</ul></article>`;
  }).join('');
}

function renderTable() {
  els.tableHead.innerHTML = COLUMNS.map(c => `<th data-key="${c.key}">${c.label}</th>`).join('');
  els.tableHead.querySelectorAll('th').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      sortState = { key, asc: sortState.key === key ? !sortState.asc : true };
      renderTable();
    });
  });

  const rows = [...filteredItems()].sort((a, b) => sortCompare(a, b, sortState.key, sortState.asc));
  els.tableBody.innerHTML = rows.map(item => {
    const tds = COLUMNS.map(col => {
      if (col.key === 'actions') return `<td><button class="del-btn" data-del="${item.id}">删除</button></td>`;
      const value = item[col.key] ?? '';
      if (col.type === 'select') {
        const options = col.options.map(op => `<option value="${escapeAttr(op)}" ${op === value ? 'selected' : ''}>${escapeHtml(op)}</option>`).join('');
        return `<td><select data-id="${item.id}" data-key="${col.key}">${options}</select></td>`;
      }
      if (col.type === 'textarea') return `<td><textarea data-id="${item.id}" data-key="${col.key}">${escapeHtml(String(value))}</textarea></td>`;
      return `<td><input data-id="${item.id}" data-key="${col.key}" value="${escapeAttr(String(value))}" /></td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  els.tableBody.querySelectorAll('input,select,textarea').forEach(el => {
    el.addEventListener('change', () => {
      const item = state.items.find(i => i.id === el.dataset.id);
      if (!item) return;
      item[el.dataset.key] = el.value;
      persist();
      render();
    });
  });

  els.tableBody.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.items = state.items.filter(i => i.id !== btn.dataset.del);
      persist();
      render();
    });
  });
}

function countBy(items, key) {
  return items.reduce((acc, cur) => {
    const k = cur[key] || '(空)';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function sortCompare(a, b, key, asc) {
  const av = String(a[key] ?? '');
  const bv = String(b[key] ?? '');
  return av.localeCompare(bv, 'zh') * (asc ? 1 : -1);
}

function mapRows(items, withId = true) {
  return items.map(i => {
    const row = {};
    COLUMNS.filter(c => c.key !== 'actions').forEach(c => row[c.key] = i[c.key] ?? '');
    return withId ? { id: i.id, ...row } : row;
  });
}

function exportCsv(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => csvEscape(r[k])).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map(line => {
    const values = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] ?? '');
    return obj;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function normalizeImportedRow(raw) {
  const item = { ...makeItem(), ...raw };
  item.id = raw.id || crypto.randomUUID();
  return item;
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}
