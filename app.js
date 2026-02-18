const STORAGE_KEY = 'kolManagerDataV2';
const STATUSES = ['候选', '洽谈中', '报价确认', '合同中', '制作中', '已发布', '已验收', '已付款', '已复盘'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'TRY', 'CNY', 'JPY', 'IDR', 'VND', 'THB', 'SGD', 'MYR', 'PHP'];

const COLUMNS = [
  { key: 'name', label: '名称' },
  { key: 'platform', label: '平台', type: 'select', options: ['YouTube', 'TikTok', 'IG'] },
  { key: 'country', label: '国家(ISO2)' },
  { key: 'language', label: '语言' },
  { key: 'owner', label: '负责人', type: 'ownerSelect' },
  { key: 'tier', label: '层级', type: 'select', options: ['KOC', 'KOL'] },
  { key: 'deliverableType', label: '交付类型', type: 'select', options: ['video', 'live', 'post'] },
  { key: 'deliverableCount', label: '数量', type: 'number' },
  { key: 'price', label: '价格', type: 'number' },
  { key: 'currency', label: '币种', type: 'select', options: CURRENCY_OPTIONS },
  { key: 'taxIncluded', label: '含税', type: 'select', options: ['true', 'false'] },
  { key: 'briefDate', label: 'Brief日期', type: 'date' },
  { key: 'assetDueDate', label: '素材截止', type: 'date' },
  { key: 'publishStart', label: '发布开始', type: 'date' },
  { key: 'publishEnd', label: '发布结束', type: 'date' },
  { key: 'acceptanceDue', label: '验收截止', type: 'date' },
  { key: 'briefLink', label: 'Brief链接' },
  { key: 'assetLink', label: '素材链接' },
  { key: 'publishLinks', label: '视频链接(多条)', type: 'textarea' },
  { key: 'views', label: '浏览', type: 'number' },
  { key: 'likes', label: '点赞', type: 'number' },
  { key: 'comments', label: '评论', type: 'number' },
  { key: 'clicks', label: '点击', type: 'number' },
  { key: 'notes', label: '备注', type: 'textarea' },
  { key: 'status', label: '状态', type: 'select', options: STATUSES },
  { key: 'actions', label: '操作', readonly: true }
];

let state = loadState();
let sortState = { key: 'name', asc: true };

const els = {
  board: document.getElementById('board'),
  tableHead: document.getElementById('tableHead'),
  tableBody: document.getElementById('tableBody'),
  budgetStats: document.getElementById('budgetStats'),
  followupList: document.getElementById('followupList'),
  templatePanel: document.getElementById('templatePanel'),
  searchInput: document.getElementById('searchInput'),
  filterCountry: document.getElementById('filterCountry'),
  filterPlatform: document.getElementById('filterPlatform'),
  filterStatus: document.getElementById('filterStatus'),
  filterOwner: document.getElementById('filterOwner'),
  addBtn: document.getElementById('addBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  exportFollowupBtn: document.getElementById('exportFollowupBtn'),
  exportSummaryBtn: document.getElementById('exportSummaryBtn'),
  importCsvInput: document.getElementById('importCsvInput'),
  ownerInput: document.getElementById('ownerInput'),
  ownerCountryInput: document.getElementById('ownerCountryInput'),
  addOwnerBtn: document.getElementById('addOwnerBtn'),
  ownerList: document.getElementById('ownerList'),
  manualFollowupName: document.getElementById('manualFollowupName'),
  manualFollowupDate: document.getElementById('manualFollowupDate'),
  manualFollowupOwner: document.getElementById('manualFollowupOwner'),
  manualFollowupAction: document.getElementById('manualFollowupAction'),
  addFollowupBtn: document.getElementById('addFollowupBtn')
};

init();

function init() {
  wireEvents();
  render();
}

function wireEvents() {
  [els.searchInput, els.filterCountry, els.filterPlatform, els.filterStatus, els.filterOwner]
    .forEach(el => el.addEventListener('input', render));

  els.addBtn.addEventListener('click', () => {
    state.items.unshift(makeItem());
    persist();
    render();
  });

  els.addOwnerBtn.addEventListener('click', () => {
    const name = els.ownerInput.value.trim();
    const country = els.ownerCountryInput.value.trim().toUpperCase();
    if (!name || !country) return;
    if (state.owners.some(o => o.name === name)) return;
    state.owners.push({ id: crypto.randomUUID(), name, country });
    els.ownerInput.value = '';
    els.ownerCountryInput.value = '';
    persist();
    render();
  });

  els.addFollowupBtn.addEventListener('click', () => {
    const name = els.manualFollowupName.value.trim();
    const date = els.manualFollowupDate.value;
    const owner = els.manualFollowupOwner.value.trim();
    const action = els.manualFollowupAction.value.trim();
    if (!name || !date || !action) return;
    state.manualFollowups.push({
      id: crypto.randomUUID(),
      date,
      priority: 'manual',
      owner,
      name,
      status: '-',
      action,
      source: 'manual'
    });
    els.manualFollowupName.value = '';
    els.manualFollowupDate.value = '';
    els.manualFollowupOwner.value = '';
    els.manualFollowupAction.value = '';
    persist();
    render();
  });

  els.exportCsvBtn.addEventListener('click', () => exportCsv('kol_collaborations.csv', mapRows(filteredItems(), false)));
  els.exportFollowupBtn.addEventListener('click', () => exportCsv('followups.csv', allFollowups().map(f => ({ date: f.date, priority: f.priority, owner: f.owner, name: f.name, status: f.status, action: f.action, source: f.source }))));
  els.exportSummaryBtn.addEventListener('click', () => exportCsv('expense_summary.csv', summaryRows()));

  els.importCsvInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    state.items = parseCsv(text).map(normalizeImportedRow);
    persist();
    render();
    e.target.value = '';
  });
}

function makeItem() {
  return {
    id: crypto.randomUUID(), name: '', platform: 'YouTube', country: '', language: '', owner: '', tier: 'KOL',
    deliverableType: 'video', deliverableCount: 1, price: 0, currency: 'USD', taxIncluded: false,
    briefDate: '', assetDueDate: '', publishStart: '', publishEnd: '', acceptanceDue: '',
    briefLink: '', assetLink: '', publishLinks: '', views: 0, likes: 0, comments: 0, clicks: 0,
    notes: '', status: '候选'
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: sampleData(), owners: sampleOwners(), manualFollowups: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      items: (parsed.items || []).map(i => ({ ...makeItem(), ...i, id: i.id || crypto.randomUUID() })),
      owners: (parsed.owners || sampleOwners()).map(o => ({ id: o.id || crypto.randomUUID(), name: o.name || '', country: (o.country || '').toUpperCase() })),
      manualFollowups: parsed.manualFollowups || []
    };
  } catch {
    return { items: sampleData(), owners: sampleOwners(), manualFollowups: [] };
  }
}

function sampleOwners() {
  return [
    { id: crypto.randomUUID(), name: 'Lina', country: 'TR' },
    { id: crypto.randomUUID(), name: 'Ken', country: 'US' }
  ];
}

function sampleData() {
  return [
    { ...makeItem(), name: 'Aylin Studio', platform: 'TikTok', country: 'TR', language: 'Turkish', owner: 'Lina', deliverableType: 'video', deliverableCount: 2, price: 1200, currency: 'USD', assetDueDate: plusDays(2), publishStart: plusDays(3), publishEnd: plusDays(6), status: '制作中' },
    { ...makeItem(), name: 'Neo Gamer', platform: 'YouTube', country: 'US', language: 'English', owner: 'Ken', deliverableType: 'live', deliverableCount: 1, price: 2300, currency: 'EUR', publishStart: today(), publishEnd: plusDays(1), status: '已发布', publishLinks: 'https://example.com/live', views: 15000, clicks: 520 }
  ];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  populateFilterOptions();
  renderOwners();
  renderBoard();
  renderTable();
  renderBudget();
  renderFollowups();
}

function filteredItems() {
  const kw = els.searchInput.value.trim().toLowerCase();
  const country = els.filterCountry.value;
  const platform = els.filterPlatform.value;
  const status = els.filterStatus.value;
  const owner = els.filterOwner.value;

  return state.items.filter(i => {
    const hitKw = !kw || [i.name, i.notes, i.language, i.owner].join(' ').toLowerCase().includes(kw);
    return hitKw
      && (!country || i.country === country)
      && (!platform || i.platform === platform)
      && (!status || i.status === status)
      && (!owner || i.owner === owner);
  });
}

function renderOwners() {
  els.ownerList.innerHTML = state.owners.map(o => `
    <div class="owner-chip">
      <span>${flagEmoji(o.country)} ${escapeHtml(o.name)} · ${escapeHtml(o.country)}</span>
      <button data-del-owner="${o.id}">删除</button>
    </div>
  `).join('');

  els.ownerList.querySelectorAll('button[data-del-owner]').forEach(btn => {
    btn.addEventListener('click', () => {
      const owner = state.owners.find(o => o.id === btn.dataset.delOwner);
      if (!owner) return;
      state.owners = state.owners.filter(o => o.id !== btn.dataset.delOwner);
      state.items.forEach(i => { if (i.owner === owner.name) i.owner = ''; });
      persist();
      render();
    });
  });
}

function renderBoard() {
  const items = filteredItems();
  els.board.innerHTML = STATUSES.map(status => {
    const statusItems = items.filter(i => i.status === status);
    const cards = statusItems.map(item => {
      const owner = state.owners.find(o => o.name === item.owner);
      return `
      <article class="kol-card" draggable="true" data-id="${item.id}">
        <strong>${escapeHtml(item.name || '(未命名)')}</strong>
        <div class="meta">${item.platform} · ${item.country || '-'} · ${flagEmoji(owner?.country)} ${item.owner || '-'}</div>
        <div class="meta">${item.deliverableType} x${num(item.deliverableCount)} · ${money(item.price, item.currency)}</div>
        <span class="badge">视频链接 ${splitLinks(item.publishLinks).length}</span>
        <div class="card-actions"><button data-template="${item.id}">模板</button></div>
      </article>`;
    }).join('');

    return `<section class="column" data-status="${status}"><h3>${status} (${statusItems.length})</h3><div class="dropzone">${cards}</div></section>`;
  }).join('');

  els.board.querySelectorAll('.kol-card').forEach(card => card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', card.dataset.id)));
  els.board.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', e => e.preventDefault());
    col.addEventListener('drop', e => {
      e.preventDefault();
      const item = state.items.find(x => x.id === e.dataTransfer.getData('text/plain'));
      if (!item) return;
      item.status = col.dataset.status;
      persist();
      render();
    });
  });
  bindTemplateButtons(els.board);
}

function renderTable() {
  els.tableHead.innerHTML = COLUMNS.map(c => `<th data-sort="${c.key}">${c.label}</th>`).join('');
  els.tableHead.querySelectorAll('th').forEach(th => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    sortState = { key, asc: sortState.key === key ? !sortState.asc : true };
    renderTable();
  }));

  const rows = [...filteredItems()].sort((a, b) => sortCompare(a, b, sortState.key, sortState.asc));
  els.tableBody.innerHTML = rows.map(item => {
    const tds = COLUMNS.map(col => {
      if (col.key === 'actions') return `<td><button data-template="${item.id}">模板</button> <button class="del-btn" data-del="${item.id}">删除</button></td>`;
      const value = item[col.key] ?? '';
      if (col.type === 'ownerSelect') {
        const options = ['<option value="">未分配</option>', ...state.owners.map(o => `<option value="${escapeAttr(o.name)}" ${o.name === value ? 'selected' : ''}>${flagEmoji(o.country)} ${escapeHtml(o.name)}</option>`)].join('');
        return `<td><select data-id="${item.id}" data-key="owner">${options}</select></td>`;
      }
      if (col.type === 'select') return `<td><select data-id="${item.id}" data-key="${col.key}">${col.options.map(op => `<option value="${escapeAttr(op)}" ${String(value) === op ? 'selected' : ''}>${op}</option>`).join('')}</select></td>`;
      if (col.type === 'textarea') return `<td><textarea data-id="${item.id}" data-key="${col.key}">${escapeHtml(String(value))}</textarea></td>`;
      return `<td><input type="${col.type || 'text'}" data-id="${item.id}" data-key="${col.key}" value="${escapeAttr(String(value))}" /></td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  els.tableBody.querySelectorAll('input,select,textarea').forEach(el => {
    el.addEventListener('change', () => {
      const item = state.items.find(i => i.id === el.dataset.id);
      if (!item) return;
      let v = el.value;
      if (['deliverableCount', 'price', 'views', 'likes', 'comments', 'clicks'].includes(el.dataset.key)) v = Number(v || 0);
      if (el.dataset.key === 'taxIncluded') v = v === 'true';
      if (el.dataset.key === 'country') v = String(v).toUpperCase();
      item[el.dataset.key] = v;
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

  bindTemplateButtons(els.tableBody);
}

function bindTemplateButtons(root) {
  root.querySelectorAll('button[data-template]').forEach(btn => btn.addEventListener('click', () => showTemplates(btn.dataset.template)));
}

function renderBudget() {
  const items = filteredItems();
  const total = items.reduce((s, i) => s + num(i.price), 0);
  const spent = items.filter(i => i.status === '已付款').reduce((s, i) => s + num(i.price), 0);
  const pending = total - spent;
  els.budgetStats.textContent = `总预算: ${money(total)} ｜ 已花费: ${money(spent)} ｜ 待花费: ${money(pending)}`;
}

function smartFollowups() {
  const now = new Date();
  const list = [];
  state.items.forEach(i => {
    if (i.assetDueDate) {
      const d = new Date(i.assetDueDate);
      const diff = dayDiff(d, now);
      if (diff >= 0 && diff <= 2 && ['合同中', '制作中'].includes(i.status)) {
        list.push(makeFollow(i, formatDate(d), diff === 0 ? 'high' : 'medium', `素材截止提醒（剩 ${diff} 天）`, 'smart'));
      }
    }
    if (i.publishStart) {
      const d = new Date(i.publishStart);
      if (isSameDay(d, now) && ['制作中', '已发布'].includes(i.status)) {
        list.push(makeFollow(i, formatDate(d), 'high', '今日发布窗口开始，确认发布时间', 'smart'));
      }
    }
    if (i.publishLinks && i.status === '已发布') {
      const d = new Date(i.publishStart || i.publishEnd || today());
      if ((now - d) / 36e5 >= 24) list.push(makeFollow(i, formatDate(now), 'medium', '发布后24h，索要数据回传', 'smart'));
    }
    if (i.acceptanceDue) {
      const d = new Date(i.acceptanceDue);
      const diff = dayDiff(d, now);
      if (diff >= 0 && diff <= 1 && ['已发布', '已验收'].includes(i.status)) {
        list.push(makeFollow(i, formatDate(d), 'high', '验收截止临近，检查全部视频链接并确认', 'smart'));
      }
    }
    if (i.status === '已发布' && splitLinks(i.publishLinks).length < num(i.deliverableCount)) {
      list.push(makeFollow(i, formatDate(now), 'high', '发布链接数量少于交付数量，需补齐链接', 'smart'));
    }
  });
  return dedupFollowups(list).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function allFollowups() {
  return [...smartFollowups(), ...state.manualFollowups].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderFollowups() {
  const list = allFollowups();
  els.followupList.innerHTML = list.length ? list.map(f => `
    <li>
      <strong>[${f.priority}]</strong> ${f.date} - ${escapeHtml(f.name)} (${escapeHtml(f.owner || '-')})：${escapeHtml(f.action)}
      ${f.source === 'manual' ? `<button class="del-btn" data-del-followup="${f.id}">删除</button>` : '<span class="badge">自动</span>'}
    </li>
  `).join('') : '<li>暂无待跟进事项</li>';

  els.followupList.querySelectorAll('button[data-del-followup]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.manualFollowups = state.manualFollowups.filter(f => f.id !== btn.dataset.delFollowup);
      persist();
      render();
    });
  });
}

function showTemplates(id) {
  const i = state.items.find(x => x.id === id);
  if (!i) return;
  const links = splitLinks(i.publishLinks).join(' | ') || 'N/A';
  const ctx = { name: i.name || 'KOL', date: i.publishStart || '日期待定', count: i.deliverableCount || 1, links };
  const pack = {
    zh: {
      初次邀约: `你好 ${ctx.name}，我们计划在 ${ctx.date} 前后发布 ${ctx.count} 条内容，方便沟通报价与档期吗？`,
      确认报价: `${ctx.name}，请确认 ${ctx.count} 条交付的最终报价（含税/不含税）与时间。`,
      催素材: `${ctx.name}，素材节点临近，请按时提交素材。链接：${ctx.links}`,
      催发布: `${ctx.name}，今天进入发布窗口，请完成发布并同步每条视频链接。`,
      索要数据: `${ctx.name}，发布后已24小时，请回传 views/likes/comments/clicks 数据。`,
      验收确认: `${ctx.name}，我们将按以下视频链接进行验收：${ctx.links}`,
      付款确认: `${ctx.name}，验收完成后我们将安排付款，请确认收款信息。`
    },
    en: {
      Initial_Outreach: `Hi ${ctx.name}, we plan ${ctx.count} deliverable(s) around ${ctx.date}. Could you share rate and availability?`,
      Quote_Confirmation: `${ctx.name}, please confirm final pricing and timeline for ${ctx.count} deliverable(s).`,
      Asset_Reminder: `${ctx.name}, asset deadline is approaching. Please submit on time. Links: ${ctx.links}`,
      Publish_Reminder: `${ctx.name}, publishing window starts today. Please send each live video link after posting.`,
      Data_Request: `${ctx.name}, 24h passed after publishing. Please share views/likes/comments/clicks metrics.`,
      Acceptance_Notice: `${ctx.name}, we will run acceptance based on these links: ${ctx.links}`,
      Payment_Confirmation: `${ctx.name}, payment will be arranged after acceptance. Please confirm payment details.`
    },
    tr: {
      Ilk_Davet: `Merhaba ${ctx.name}, ${ctx.date} civarında ${ctx.count} içerik planlıyoruz. Fiyat ve uygunluk paylaşabilir misiniz?`,
      Teklif_Onayi: `${ctx.name}, ${ctx.count} teslim için nihai fiyat ve takvimi teyit eder misiniz?`,
      Icerik_Hatirlatma: `${ctx.name}, içerik teslim tarihi yaklaşıyor. Linkler: ${ctx.links}`,
      Yayin_Hatirlatma: `${ctx.name}, yayın penceresi bugün başlıyor. Her video linkini paylaşır mısınız?`,
      Veri_Talebi: `${ctx.name}, yayından 24 saat geçti. views/likes/comments/clicks verilerini paylaşın lütfen.`,
      Kabul_Onayi: `${ctx.name}, kabul sürecini şu linklerle yapacağız: ${ctx.links}`,
      Odeme_Onayi: `${ctx.name}, kabul sonrası ödeme planlanacak. Ödeme bilgilerini teyit eder misiniz?`
    }
  };
  els.templatePanel.textContent = [
    '【中文】', ...Object.entries(pack.zh).map(([k, v]) => `${k}: ${v}`),
    '\n【English】', ...Object.entries(pack.en).map(([k, v]) => `${k}: ${v}`),
    '\n【Türkçe】', ...Object.entries(pack.tr).map(([k, v]) => `${k}: ${v}`)
  ].join('\n');
}

function populateFilterOptions() {
  setSelect(els.filterCountry, uniq(state.items.map(i => i.country).filter(Boolean)), '全部国家');
  setSelect(els.filterOwner, uniq(state.owners.map(o => o.name).filter(Boolean)), '全部负责人');
  setSelect(els.filterStatus, STATUSES, '全部状态');
}

function setSelect(select, values, placeholder) {
  const keep = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`).join('');
  select.value = values.includes(keep) ? keep : '';
}

function summaryRows() {
  const byOwner = {};
  state.items.forEach(i => {
    const key = i.owner || 'Unassigned';
    byOwner[key] = byOwner[key] || { owner: key, total: 0, paid: 0, pending: 0, count: 0, currencies: '' };
    byOwner[key].total += num(i.price);
    byOwner[key].count += 1;
    if (i.status === '已付款') byOwner[key].paid += num(i.price);
  });
  return Object.values(byOwner).map(r => ({ ...r, pending: r.total - r.paid }));
}

function mapRows(items, withId = true) {
  return items.map(i => {
    const row = {
      name: i.name, platform: i.platform, country: i.country, language: i.language, owner: i.owner, tier: i.tier,
      deliverableType: i.deliverableType, deliverableCount: i.deliverableCount, price: i.price, currency: i.currency,
      taxIncluded: i.taxIncluded, briefDate: i.briefDate, assetDueDate: i.assetDueDate, publishStart: i.publishStart,
      publishEnd: i.publishEnd, acceptanceDue: i.acceptanceDue, briefLink: i.briefLink, assetLink: i.assetLink,
      publishLinks: i.publishLinks, views: i.views, likes: i.likes, comments: i.comments, clicks: i.clicks,
      notes: i.notes, status: i.status
    };
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
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; } else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
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
  const item = { ...makeItem(), ...raw };
  item.id = raw.id || crypto.randomUUID();
  ['deliverableCount', 'price', 'views', 'likes', 'comments', 'clicks'].forEach(k => item[k] = Number(item[k] || 0));
  item.taxIncluded = String(item.taxIncluded) === 'true';
  item.country = String(item.country || '').toUpperCase();
  if (!STATUSES.includes(item.status)) item.status = '候选';
  return item;
}

function makeFollow(i, date, priority, action, source) {
  return { id: `${i.id}-${date}-${action}`, date, priority, owner: i.owner || '', name: i.name || '(未命名)', status: i.status, action, source };
}

function dedupFollowups(list) {
  const map = new Map();
  list.forEach(f => map.set(`${f.name}|${f.date}|${f.action}`, f));
  return [...map.values()];
}

function splitLinks(v) {
  return String(v || '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
}

function sortCompare(a, b, key, asc) {
  const av = a[key] ?? '';
  const bv = b[key] ?? '';
  const dir = asc ? 1 : -1;
  if (typeof av === 'number' || typeof bv === 'number') return (num(av) - num(bv)) * dir;
  return String(av).localeCompare(String(bv), 'zh') * dir;
}

function money(v, c = 'USD') { return `${num(v).toFixed(2)} ${c}`; }
function dayDiff(a, b) { return Math.floor((new Date(a.toDateString()) - new Date(b.toDateString())) / 86400000); }
function isSameDay(a, b) { return a.toDateString() === b.toDateString(); }
function today() { return formatDate(new Date()); }
function plusDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return formatDate(d); }
function formatDate(d) { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
function flagEmoji(iso2) {
  const cc = String(iso2 || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '🌐';
  return String.fromCodePoint(...[...cc].map(c => 127397 + c.charCodeAt()));
}

function uniq(arr) { return [...new Set(arr)]; }
function num(v) { return Number(v) || 0; }
function csvEscape(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function escapeHtml(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function escapeAttr(s) { return escapeHtml(s); }
