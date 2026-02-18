const STORAGE_KEY = 'gameMonetizationDeepDiveV2';

const OPTIONS = {
  monetizationModel: ['IAP', 'IAA', 'Hybrid', 'Subscription-led'],
  iapShare: ['高', '中', '低'],
  coreDriver: ['进度驱动', '收集驱动', '竞争驱动', '美术外观驱动', '社交身份驱动'],
  mainEngine: ['Gacha', 'Pass', 'Competitive', 'Progress', 'Cosmetic', 'Event-currency'],
  ladderCompleteness: ['完整', '不完整'],
  yesNo: ['有', '无'],
  strongWeak: ['强', '弱'],
  liveopsRhythm: ['周更', '双周', '月更', '赛季'],
  popupIntensity: ['低', '中', '高'],
  euRiskLevel: ['低', '中', '高'],
  euRiskTag: ['P2W高', '概率争议', '广告干扰', '低风险']
};

const GROUPS = [
  {
    title: '0) 基础信息',
    fields: [
      ['gameName', '游戏名'], ['genre', '品类/赛道'], ['regionFocus', '重点区域'], ['sourceNote', '数据来源备注', 'textarea']
    ]
  },
  {
    title: '1) 变现结构（Monetization Mix）',
    fields: [
      ['monetizationModel', '变现模式', 'select', OPTIONS.monetizationModel],
      ['iapShare', 'IAP占比推断', 'select', OPTIONS.iapShare],
      ['adTypes', '广告类型（多选;分隔）'],
      ['subscriptionShape', '订阅形态'],
      ['coreDriver', '付费核心驱动', 'select', OPTIONS.coreDriver]
    ]
  },
  {
    title: '2) IAP 商品 / 价格 / 经济系统',
    fields: [
      ['skuCountBand', 'SKU总量级别'],
      ['iapCatalogTypes', 'IAP商品类型（多选;分隔）'],
      ['triggerMechanisms', '触发机制（多选;分隔）'],
      ['priceLadder', '价格梯度'],
      ['ladderCompleteness', '梯度完整性', 'select', OPTIONS.ladderCompleteness],
      ['highestPricePoint', '最高价位'],
      ['discountMechanism', '折扣机制'],
      ['regionalPricing', '区域定价策略'],
      ['currencySystem', '货币系统'],
      ['resourceBottleneck', '资源瓶颈'],
      ['accelerationSystem', '加速系统'],
      ['valuePerception', '付费价值感（战力/效率）']
    ]
  },
  {
    title: '3) 付费分层与核心引擎',
    fields: [
      ['firstPurchaseHook', '微付费抓手', 'select', OPTIONS.strongWeak],
      ['hasMonthlyCard', '月卡', 'select', OPTIONS.yesNo],
      ['hasBattlePass', '战令', 'select', OPTIONS.yesNo],
      ['hasSubscription', '订阅', 'select', OPTIONS.yesNo],
      ['midStabilizer', '中R稳定器', 'select', OPTIONS.yesNo],
      ['whaleMechanism', '大R收割机制', 'select', OPTIONS.strongWeak],
      ['mainEngine', '主引擎', 'select', OPTIONS.mainEngine],
      ['secondaryEngine', '副引擎']
    ]
  },
  {
    title: '4) LiveOps 与活动商业化',
    fields: [
      ['liveopsRhythm', 'LiveOps节奏', 'select', OPTIONS.liveopsRhythm],
      ['eventTypes', '活动类型（多选;分隔）'],
      ['eventMonetization', '活动变现方式（礼包/活动币/门票/次数）']
    ]
  },
  {
    title: '5) 付费漏斗与 EU 风险',
    fields: [
      ['firstPaywallTiming', '首次付费点出现时间'],
      ['popupIntensity', '弹窗强度', 'select', OPTIONS.popupIntensity],
      ['storeVisibility', '商店入口可见性'],
      ['paymentFriction', '支付摩擦'],
      ['copyAngle', '引导文案角度（折扣/战力/效率）'],
      ['euRiskLevel', '欧洲风险等级', 'select', OPTIONS.euRiskLevel],
      ['euRiskTag', '欧洲风险标签', 'select', OPTIONS.euRiskTag],
      ['euRiskReason', '欧洲风险原因', 'textarea']
    ]
  },
  {
    title: '标准化标签（用于共性统计）',
    fields: [
      ['monetizationModel', '1. 变现模式', 'select', OPTIONS.monetizationModel],
      ['mainEngine', '2. 主引擎', 'select', OPTIONS.mainEngine],
      ['ladderCompleteness', '3. 商品梯度完整性', 'select', OPTIONS.ladderCompleteness],
      ['firstPurchaseHook', '4. 微付费抓手', 'select', OPTIONS.strongWeak],
      ['midStabilizer', '5. 中R稳定器', 'select', OPTIONS.yesNo],
      ['whaleMechanism', '6. 大R收割机制', 'select', OPTIONS.strongWeak],
      ['liveopsRhythm', '7. LiveOps节奏', 'select', OPTIONS.liveopsRhythm],
      ['euRiskTag', '8. 欧洲风险', 'select', OPTIONS.euRiskTag]
    ]
  }
];

const SUMMARY_TAGS = [
  ['变现模式', 'monetizationModel'],
  ['主引擎', 'mainEngine'],
  ['梯度完整性', 'ladderCompleteness'],
  ['微付费抓手', 'firstPurchaseHook'],
  ['中R稳定器', 'midStabilizer'],
  ['大R收割机制', 'whaleMechanism'],
  ['LiveOps节奏', 'liveopsRhythm'],
  ['欧洲风险', 'euRiskTag']
];

const els = {
  statsPanel: document.getElementById('statsPanel'),
  searchInput: document.getElementById('searchInput'),
  filterModel: document.getElementById('filterModel'),
  filterEngine: document.getElementById('filterEngine'),
  filterRisk: document.getElementById('filterRisk'),
  addBtn: document.getElementById('addBtn'),
  duplicateBtn: document.getElementById('duplicateBtn'),
  exportBtn: document.getElementById('exportBtn'),
  exportTemplateBtn: document.getElementById('exportTemplateBtn'),
  importInput: document.getElementById('importInput'),
  clearBtn: document.getElementById('clearBtn'),
  sampleList: document.getElementById('sampleList'),
  emptyHint: document.getElementById('emptyHint'),
  editorForm: document.getElementById('editorForm'),
  insightPanel: document.getElementById('insightPanel'),
  commonTableBody: document.getElementById('commonTableBody')
};

let state = loadState();

init();

function init() {
  setSelectOptions(els.filterModel, OPTIONS.monetizationModel, '全部变现模式');
  setSelectOptions(els.filterEngine, OPTIONS.mainEngine, '全部主引擎');
  setSelectOptions(els.filterRisk, OPTIONS.euRiskLevel, '全部风险等级');

  [els.searchInput, els.filterModel, els.filterEngine, els.filterRisk].forEach(el => el.addEventListener('input', render));

  els.addBtn.addEventListener('click', () => {
    const item = makeItem();
    state.items.unshift(item);
    state.selectedId = item.id;
    persist();
    render();
  });

  els.duplicateBtn.addEventListener('click', () => {
    const current = currentItem();
    if (!current) return;
    const copy = { ...current, id: crypto.randomUUID(), gameName: `${current.gameName || '未命名'} (复制)` };
    state.items.unshift(copy);
    state.selectedId = copy.id;
    persist();
    render();
  });

  els.exportBtn.addEventListener('click', () => exportCsv('game_deepdive.csv', state.items.map(stripItemForExport)));
  els.exportTemplateBtn.addEventListener('click', () => exportCsv('game_deepdive_template.csv', [stripItemForExport(makeItem())]));

  els.importInput.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    state.items = parseCsv(text).map(normalizeImportedRow);
    state.selectedId = state.items[0]?.id || null;
    persist();
    render();
    e.target.value = '';
  });

  els.clearBtn.addEventListener('click', () => {
    if (!window.confirm('确认清空全部数据？')) return;
    state = { items: [], selectedId: null };
    persist();
    render();
  });

  render();
}

function makeItem() {
  return {
    id: crypto.randomUUID(),
    gameName: '', genre: '', regionFocus: '', sourceNote: '',
    monetizationModel: 'Hybrid', iapShare: '中', adTypes: '', subscriptionShape: '', coreDriver: '进度驱动',
    skuCountBand: '', iapCatalogTypes: '', triggerMechanisms: '', priceLadder: '0.99/1.99/4.99/9.99/19.99/49.99/99.99',
    ladderCompleteness: '完整', highestPricePoint: '', discountMechanism: '', regionalPricing: '',
    currencySystem: '', resourceBottleneck: '', accelerationSystem: '', valuePerception: '效率',
    firstPurchaseHook: '弱', hasMonthlyCard: '无', hasBattlePass: '无', hasSubscription: '无', midStabilizer: '无',
    whaleMechanism: '弱', mainEngine: 'Progress', secondaryEngine: '', liveopsRhythm: '双周',
    eventTypes: '', eventMonetization: '', firstPaywallTiming: '', popupIntensity: '中', storeVisibility: '',
    paymentFriction: '', copyAngle: '', euRiskLevel: '中', euRiskTag: '低风险', euRiskReason: ''
  };
}

function sampleData() {
  return [
    {
      ...makeItem(),
      gameName: 'Sample Strategy',
      genre: 'SLG',
      regionFocus: 'EU',
      monetizationModel: 'Hybrid',
      mainEngine: 'Competitive',
      liveopsRhythm: '周更',
      hasBattlePass: '有',
      midStabilizer: '有',
      whaleMechanism: '强',
      euRiskTag: 'P2W高',
      euRiskLevel: '高'
    }
  ];
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const items = sampleData();
    return { items, selectedId: items[0].id };
  }
  try {
    const parsed = JSON.parse(raw);
    const items = (parsed.items || []).map(i => ({ ...makeItem(), ...i, id: i.id || crypto.randomUUID() }));
    const selectedId = items.some(i => i.id === parsed.selectedId) ? parsed.selectedId : (items[0]?.id || null);
    return { items, selectedId };
  } catch {
    const items = sampleData();
    return { items, selectedId: items[0].id };
  }
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
      && (!els.filterRisk.value || i.euRiskLevel === els.filterRisk.value);
  });
}

function currentItem() {
  return state.items.find(i => i.id === state.selectedId) || null;
}

function render() {
  const visible = filteredItems();
  if (!visible.some(i => i.id === state.selectedId)) state.selectedId = visible[0]?.id || null;

  renderStats(visible);
  renderList(visible);
  renderEditor();
  renderSummary(visible);
  persist();
}

function renderStats(visible) {
  els.statsPanel.textContent = `筛选后: ${visible.length} ｜ 总样本: ${state.items.length}`;
}

function renderList(visible) {
  els.sampleList.innerHTML = visible.length ? visible.map(item => {
    const active = item.id === state.selectedId ? 'active' : '';
    return `
      <article class="sample-item ${active}" data-select="${item.id}">
        <h3>${escapeHtml(item.gameName || '未命名游戏')}</h3>
        <p>${escapeHtml(item.genre || '-')} · ${escapeHtml(item.monetizationModel || '-')} · ${escapeHtml(item.mainEngine || '-')}</p>
        <div class="sample-tags">
          <span>${escapeHtml(item.liveopsRhythm || '-')}</span>
          <span>${escapeHtml(item.euRiskTag || '-')}</span>
        </div>
        <button class="del-btn" data-del="${item.id}">删除</button>
      </article>
    `;
  }).join('') : '<div class="empty-hint">当前筛选条件下没有样本。</div>';

  els.sampleList.querySelectorAll('[data-select]').forEach(el => {
    el.addEventListener('click', evt => {
      if (evt.target.closest('[data-del]')) return;
      state.selectedId = el.dataset.select;
      render();
    });
  });

  els.sampleList.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.items = state.items.filter(i => i.id !== btn.dataset.del);
      if (state.selectedId === btn.dataset.del) state.selectedId = state.items[0]?.id || null;
      render();
    });
  });
}

function renderEditor() {
  const item = currentItem();
  if (!item) {
    els.emptyHint.classList.remove('hidden');
    els.editorForm.classList.add('hidden');
    return;
  }

  els.emptyHint.classList.add('hidden');
  els.editorForm.classList.remove('hidden');
  els.editorForm.innerHTML = GROUPS.map(group => {
    const fields = group.fields.map(([key, label, type = 'text', options = []]) => {
      const value = item[key] ?? '';
      if (type === 'select') {
        const opts = options.map(op => `<option value="${escapeAttr(op)}" ${op === value ? 'selected' : ''}>${escapeHtml(op)}</option>`).join('');
        return `<label><span>${label}</span><select data-key="${key}">${opts}</select></label>`;
      }
      if (type === 'textarea') {
        return `<label class="full"><span>${label}</span><textarea data-key="${key}">${escapeHtml(String(value))}</textarea></label>`;
      }
      return `<label><span>${label}</span><input data-key="${key}" value="${escapeAttr(String(value))}" /></label>`;
    }).join('');

    return `<fieldset><legend>${group.title}</legend><div class="grid">${fields}</div></fieldset>`;
  }).join('');

  els.editorForm.querySelectorAll('input,select,textarea').forEach(el => {
    el.addEventListener('change', () => {
      const current = currentItem();
      if (!current) return;
      current[el.dataset.key] = el.value;
      render();
    });
  });
}

function renderSummary(items) {
  els.insightPanel.innerHTML = SUMMARY_TAGS.map(([title, key]) => {
    const counts = countBy(items, key);
    const entries = sortedEntries(counts);
    const top = entries[0];
    return `
      <article class="insight-card">
        <h3>${title}</h3>
        <p class="insight-main">${top ? `${escapeHtml(top[0])} (${top[1]})` : '暂无数据'}</p>
        <ul>${entries.slice(0, 4).map(([k, v]) => `<li>${escapeHtml(k)}: ${v}</li>`).join('') || '<li>-</li>'}</ul>
      </article>
    `;
  }).join('');

  els.commonTableBody.innerHTML = SUMMARY_TAGS.map(([title, key]) => {
    const counts = countBy(items, key);
    const entries = sortedEntries(counts);
    const total = items.length || 1;
    const top = entries[0] || ['-', 0];
    const ratio = ((top[1] / total) * 100).toFixed(1);
    const dist = entries.map(([k, v]) => `${k}:${v}`).join(' ｜ ') || '-';
    return `<tr><td>${title}</td><td>${escapeHtml(dist)}</td><td>${escapeHtml(top[0])}</td><td>${ratio}%</td></tr>`;
  }).join('');
}

function countBy(items, key) {
  return items.reduce((acc, cur) => {
    const k = cur[key] || '(空)';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function sortedEntries(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function stripItemForExport(item) {
  const out = { ...item };
  delete out.id;
  return out;
}

function exportCsv(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(row => keys.map(k => csvEscape(row[k])).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map(line => {
    const values = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? '';
    });
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
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function normalizeImportedRow(raw) {
  return { ...makeItem(), ...raw, id: crypto.randomUUID() };
}

function setSelectOptions(select, values, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option>${escapeHtml(v)}</option>`).join('');
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
