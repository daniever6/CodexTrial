const STORAGE_KEY = 'kolManagerDataV1';
const STATUSES = ['候选', '洽谈中', '报价确认', '合同中', '制作中', '已发布', '已验收', '已付款', '已复盘'];
const COLUMNS = [
  { key: 'name', label: '名称' },
  { key: 'platform', label: '平台', type: 'select', options: ['YouTube', 'TikTok', 'IG'] },
  { key: 'country', label: '国家' },
  { key: 'language', label: '语言' },
  { key: 'owner', label: '负责人' },
  { key: 'tier', label: '层级', type: 'select', options: ['KOC', 'KOL'] },
  { key: 'deliverableType', label: '交付类型', type: 'select', options: ['video', 'live', 'post'] },
  { key: 'deliverableCount', label: '数量', type: 'number' },
  { key: 'price', label: '价格', type: 'number' },
  { key: 'currency', label: '币种' },
  { key: 'taxIncluded', label: '含税', type: 'select', options: ['true', 'false'] },
  { key: 'briefDate', label: 'Brief日期', type: 'date' },
  { key: 'assetDueDate', label: '素材截止', type: 'date' },
  { key: 'publishStart', label: '发布开始', type: 'date' },
  { key: 'publishEnd', label: '发布结束', type: 'date' },
  { key: 'acceptanceDue', label: '验收截止', type: 'date' },
  { key: 'briefLink', label: 'Brief链接' },
  { key: 'assetLink', label: '素材链接' },
  { key: 'publishLink', label: '发布链接' },
  { key: 'views', label: '浏览', type: 'number' },
  { key: 'likes', label: '点赞', type: 'number' },
  { key: 'comments', label: '评论', type: 'number' },
  { key: 'clicks', label: '点击', type: 'number' },
  { key: 'installs', label: '安装', type: 'number' },
  { key: 'notes', label: '备注', type: 'textarea' },
  { key: 'status', label: '状态', type: 'select', options: STATUSES },
  { key: 'cpv', label: 'CPV', readonly: true },
  { key: 'cpc', label: 'CPC', readonly: true },
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
  importCsvInput: document.getElementById('importCsvInput')
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

  els.exportCsvBtn.addEventListener('click', () => exportCsv('kol_collaborations.csv', mapRows(filteredItems(), false)));
  els.exportFollowupBtn.addEventListener('click', () => exportCsv('followups.csv', followups().map(f => ({ date: f.date, priority: f.priority, owner: f.owner, name: f.name, status: f.status, action: f.action }))));
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
    briefLink: '', assetLink: '', publishLink: '', views: 0, likes: 0, comments: 0, clicks: 0, installs: 0,
    notes: '', status: '候选'
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: sampleData() };
  try {
    const parsed = JSON.parse(raw);
    parsed.items = (parsed.items || []).map(i => ({ ...makeItem(), ...i, id: i.id || crypto.randomUUID() }));
    return parsed;
  } catch {
    return { items: sampleData() };
  }
}

function sampleData() {
  return [
    { ...makeItem(), name: 'Aylin Studio', platform: 'TikTok', country: 'TR', language: 'Turkish', owner: 'Lina', tier: 'KOL', deliverableType: 'video', deliverableCount: 2, price: 1200, currency: 'USD', assetDueDate: plusDays(2), publishStart: plusDays(3), publishEnd: plusDays(6), status: '制作中' },
    { ...makeItem(), name: 'Neo Gamer', platform: 'YouTube', country: 'US', language: 'English', owner: 'Ken', tier: 'KOL', deliverableType: 'live', deliverableCount: 1, price: 2300, currency: 'USD', publishStart: today(), publishEnd: plusDays(1), status: '已发布', publishLink: 'https://example.com/live', views: 15000, clicks: 520 }
  ];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  populateFilterOptions();
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

function renderBoard() {
  const items = filteredItems();
  els.board.innerHTML = STATUSES.map(status => {
    const cards = items.filter(i => i.status === status).map(item => `
      <article class="kol-card" draggable="true" data-id="${item.id}">
        <strong>${escapeHtml(item.name || '(未命名)')}</strong>
        <div class="meta">${item.platform} · ${item.country || '-'} · ${item.owner || '-'}</div>
        <div class="meta">${item.deliverableType} x${num(item.deliverableCount)} · ${money(item.price, item.currency)}</div>
        <span class="badge">CPV ${metric(calcRatio(item.price, item.views))}</span>
        <div class="card-actions">
          <button data-template="${item.id}">模板</button>
        </div>
      </article>`).join('');

    return `<section class="column" data-status="${status}"><h3>${status} (${items.filter(i => i.status === status).length})</h3><div class="dropzone">${cards}</div></section>`;
  }).join('');

  els.board.querySelectorAll('.kol-card').forEach(card => {
    card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', card.dataset.id));
  });
  els.board.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', e => e.preventDefault());
    col.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const item = state.items.find(x => x.id === id);
      if (!item) return;
      item.status = col.dataset.status;
      persist();
      render();
    });
  });
  els.board.querySelectorAll('button[data-template]').forEach(btn => {
    btn.addEventListener('click', () => showTemplates(btn.dataset.template));
  });
}

function renderTable() {
  els.tableHead.innerHTML = COLUMNS.map(c => `<th data-sort="${c.key}">${c.label}</th>`).join('');
  els.tableHead.querySelectorAll('th').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      sortState = { key, asc: sortState.key === key ? !sortState.asc : true };
      renderTable();
    });
  });

  const rows = [...filteredItems()].sort((a, b) => sortCompare(a, b, sortState.key, sortState.asc));
  els.tableBody.innerHTML = rows.map(item => {
    const tds = COLUMNS.map(col => {
      if (col.key === 'actions') {
        return `<td><button data-template="${item.id}">模板</button> <button class="del-btn" data-del="${item.id}">删除</button></td>`;
      }
      if (col.key === 'cpv') return `<td>${metric(calcRatio(item.price, item.views))}</td>`;
      if (col.key === 'cpc') return `<td>${metric(calcRatio(item.price, item.clicks))}</td>`;
      const value = item[col.key] ?? '';
      if (col.readonly) return `<td>${escapeHtml(String(value))}</td>`;
      if (col.type === 'select') {
        return `<td><select data-id="${item.id}" data-key="${col.key}">${col.options.map(op => `<option ${String(value) === op ? 'selected' : ''}>${op}</option>`).join('')}</select></td>`;
      }
      if (col.type === 'textarea') {
        return `<td><textarea data-id="${item.id}" data-key="${col.key}">${escapeHtml(String(value))}</textarea></td>`;
      }
      return `<td><input type="${col.type || 'text'}" data-id="${item.id}" data-key="${col.key}" value="${escapeAttr(String(value))}" /></td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  els.tableBody.querySelectorAll('input,select,textarea').forEach(el => {
    el.addEventListener('change', () => {
      const item = state.items.find(i => i.id === el.dataset.id);
      if (!item) return;
      let v = el.value;
      if (['deliverableCount', 'price', 'views', 'likes', 'comments', 'clicks', 'installs'].includes(el.dataset.key)) v = Number(v || 0);
      if (el.dataset.key === 'taxIncluded') v = v === 'true';
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

  els.tableBody.querySelectorAll('button[data-template]').forEach(btn => {
    btn.addEventListener('click', () => showTemplates(btn.dataset.template));
  });
}

function renderBudget() {
  const items = filteredItems();
  const total = items.reduce((s, i) => s + num(i.price), 0);
  const spent = items.filter(i => ['已付款'].includes(i.status)).reduce((s, i) => s + num(i.price), 0);
  const pending = total - spent;
  els.budgetStats.textContent = `总预算: ${money(total)} ｜ 已花费: ${money(spent)} ｜ 待花费: ${money(pending)}`;
}

function followups() {
  const now = new Date();
  const list = [];
  state.items.forEach(i => {
    if (i.assetDueDate) {
      const d = new Date(i.assetDueDate);
      const diff = dayDiff(d, now);
      if (diff >= 0 && diff <= 2 && ['合同中', '制作中'].includes(i.status)) {
        list.push(makeFollow(i, formatDate(d), 'high', `素材截止前提醒（剩 ${diff} 天）`));
      }
    }
    if (i.publishStart) {
      const d = new Date(i.publishStart);
      if (isSameDay(d, now) && ['制作中', '已发布'].includes(i.status)) {
        list.push(makeFollow(i, formatDate(d), 'medium', '今日发布窗口开始，确认发布时间'));
      }
    }
    if (i.publishLink && ['已发布'].includes(i.status)) {
      const d = new Date(i.publishStart || i.publishEnd || today());
      const hours = (now - d) / 36e5;
      if (hours >= 24) {
        list.push(makeFollow(i, formatDate(now), 'medium', '发布后 24h，请索要数据回传'));
      }
    }
    if (i.acceptanceDue) {
      const d = new Date(i.acceptanceDue);
      const diff = dayDiff(d, now);
      if (diff >= 0 && diff <= 1 && ['已发布'].includes(i.status)) {
        list.push(makeFollow(i, formatDate(d), 'high', '验收截止临近，需确认结案'));
      }
    }
  });
  return list.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderFollowups() {
  const list = followups();
  els.followupList.innerHTML = list.length
    ? list.map(f => `<li><strong>[${f.priority}]</strong> ${f.date} - ${escapeHtml(f.name)} (${escapeHtml(f.owner || '-')})：${escapeHtml(f.action)}</li>`).join('')
    : '<li>暂无待跟进事项</li>';
}

function showTemplates(id) {
  const i = state.items.find(x => x.id === id);
  if (!i) return;
  const ctx = {
    name: i.name || 'KOL', date: i.publishStart || '日期待定', count: i.deliverableCount || 1,
    links: [i.briefLink, i.assetLink, i.publishLink].filter(Boolean).join(' | ') || 'N/A'
  };
  const pack = {
    zh: {
      初次邀约: `你好 ${ctx.name}，我们想邀请你合作，计划在 ${ctx.date} 前后发布 ${ctx.count} 条内容。方便沟通报价与档期吗？`,
      确认报价: `${ctx.name}，感谢报价，我们确认本次合作内容为 ${ctx.count} 条，请回复最终含税价格与交付时间。`,
      催素材: `${ctx.name}，提醒素材提交节点临近，请在截止日前上传素材。链接：${ctx.links}`,
      催发布: `${ctx.name}，今天进入发布窗口，请按计划完成发布并回传链接。`,
      索要数据: `${ctx.name}，发布已满24小时，请回传 views/likes/comments/clicks/installs 数据。`,
      验收确认: `${ctx.name}，内容已审核通过，我们将进入验收与结算流程。`,
      付款确认: `${ctx.name}，付款已安排，请留意收款并回复确认。`
    },
    en: {
      Initial_Outreach: `Hi ${ctx.name}, we'd love to collaborate with you. We plan ${ctx.count} deliverable(s) around ${ctx.date}. Could you share your rate and availability?`,
      Quote_Confirmation: `${ctx.name}, thanks for your quote. Please confirm final tax-included pricing and delivery timeline for ${ctx.count} deliverable(s).`,
      Asset_Reminder: `${ctx.name}, friendly reminder that asset deadline is approaching. Please upload assets before due date. Link: ${ctx.links}`,
      Publish_Reminder: `${ctx.name}, publishing window starts today. Please publish as scheduled and send us the live link.`,
      Data_Request: `${ctx.name}, it has been 24h after publishing. Please share views/likes/comments/clicks/installs metrics.`,
      Acceptance_Notice: `${ctx.name}, content has been accepted and we are moving to closeout.`,
      Payment_Confirmation: `${ctx.name}, payment has been arranged. Please confirm once received.`
    },
    tr: {
      Ilk_Davet: `Merhaba ${ctx.name}, sizinle iş birliği yapmak istiyoruz. ${ctx.date} civarında ${ctx.count} içerik planlıyoruz. Fiyat ve uygunluk paylaşabilir misiniz?`,
      Teklif_Onayi: `${ctx.name}, teklifiniz için teşekkürler. ${ctx.count} teslim için vergiler dahil nihai fiyat ve takvimi teyit eder misiniz?`,
      Icerik_Hatirlatma: `${ctx.name}, içerik teslim tarihi yaklaşıyor. Lütfen son tarihten önce yükleyin. Link: ${ctx.links}`,
      Yayin_Hatirlatma: `${ctx.name}, yayın penceresi bugün başlıyor. Lütfen planlandığı gibi paylaşın ve link gönderin.`,
      Veri_Talebi: `${ctx.name}, yayından 24 saat geçti. Lütfen views/likes/comments/clicks/installs verilerini paylaşın.`,
      Kabul_Onayi: `${ctx.name}, içerik onaylandı. Kapanış sürecine geçiyoruz.`,
      Odeme_Onayi: `${ctx.name}, ödeme planlandı. Hesabınıza geçince lütfen teyit edin.`
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
  setSelect(els.filterOwner, uniq(state.items.map(i => i.owner).filter(Boolean)), '全部负责人');
  setSelect(els.filterStatus, STATUSES, '全部状态');
}

function setSelect(select, values, placeholder) {
  const keep = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  select.value = values.includes(keep) ? keep : '';
}

function summaryRows() {
  const byOwner = {};
  state.items.forEach(i => {
    const k = i.owner || 'Unassigned';
    byOwner[k] = byOwner[k] || { owner: k, total: 0, paid: 0, pending: 0, count: 0 };
    byOwner[k].total += num(i.price);
    byOwner[k].count += 1;
    if (i.status === '已付款') byOwner[k].paid += num(i.price);
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
      publishLink: i.publishLink, views: i.views, likes: i.likes, comments: i.comments, clicks: i.clicks,
      installs: i.installs, notes: i.notes, status: i.status, cpv: metric(calcRatio(i.price, i.views)),
      cpc: metric(calcRatio(i.price, i.clicks))
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
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (ch === ',' && !q) {
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
  ['deliverableCount', 'price', 'views', 'likes', 'comments', 'clicks', 'installs'].forEach(k => item[k] = Number(item[k] || 0));
  item.taxIncluded = String(item.taxIncluded) === 'true';
  if (!STATUSES.includes(item.status)) item.status = '候选';
  return item;
}

function makeFollow(i, date, priority, action) {
  return { date, priority, owner: i.owner || '', name: i.name || '(未命名)', status: i.status, action };
}

function sortCompare(a, b, key, asc) {
  const av = a[key] ?? '';
  const bv = b[key] ?? '';
  const dir = asc ? 1 : -1;
  if (typeof av === 'number' || typeof bv === 'number') return (num(av) - num(bv)) * dir;
  return String(av).localeCompare(String(bv), 'zh') * dir;
}

function calcRatio(cost, denom) {
  const d = num(denom);
  if (!d) return null;
  return num(cost) / d;
}

function metric(v) {
  return v === null || Number.isNaN(v) ? 'N/A' : v.toFixed(4);
}

function money(v, c = 'USD') {
  return `${num(v).toFixed(2)} ${c}`;
}

function dayDiff(a, b) {
  const ms = 86400000;
  return Math.floor((new Date(a.toDateString()) - new Date(b.toDateString())) / ms);
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function today() {
  return formatDate(new Date());
}

function plusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

function formatDate(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function uniq(arr) { return [...new Set(arr)]; }
function num(v) { return Number(v) || 0; }
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
function escapeAttr(s) { return escapeHtml(s); }
