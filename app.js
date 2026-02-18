const STORAGE_KEY = 'kolManagerDataV3';
const STATUSES = ['候选', '洽谈中', '报价确认', '合同中', '制作中', '已发布', '已验收', '已付款', '已复盘'];
const COUNTRY_OPTIONS = ['DE','FR','IT','ES','NL','BE','SE','NO','DK','FI','PL','PT','AT','CH','IE','CZ','HU','RO','GR','TR','GB','US'];
const LANGUAGE_OPTIONS = ['English','German','French','Italian','Spanish','Dutch','Portuguese','Polish','Swedish','Turkish','Greek','Czech','Romanian','Hungarian'];
const CURRENCY_OPTIONS = ['USD','EUR','GBP','TRY'];

const CORE_COLUMNS = [
  { key:'name', label:'名称' },
  { key:'platform', label:'平台', type:'select', options:['YouTube','TikTok','IG'] },
  { key:'country', label:'国家', type:'select', options:COUNTRY_OPTIONS },
  { key:'language', label:'语言', type:'select', options:LANGUAGE_OPTIONS },
  { key:'owner', label:'负责人', type:'ownerSelect' },
  { key:'tier', label:'层级', type:'select', options:['KOC','KOL'] },
  { key:'deliverableType', label:'交付类型', type:'select', options:['video','live','post'] },
  { key:'deliverableCount', label:'数量', type:'number' },
  { key:'price', label:'价格', type:'number' },
  { key:'currency', label:'币种', type:'select', options:CURRENCY_OPTIONS },
  { key:'likes', label:'点赞', type:'number' },
  { key:'status', label:'状态', type:'select', options:STATUSES },
  { key:'actions', label:'操作' }
];

const ASSET_COLUMNS = [
  { key:'name', label:'KOL' },
  { key:'briefLink', label:'Brief链接' },
  { key:'assetLink', label:'素材链接' },
  { key:'publishLinks', label:'视频链接(多条)', type:'textarea' },
  { key:'assetChecklist', label:'已添加素材', type:'select', options:['未齐','已齐'] },
  { key:'notes', label:'备注', type:'textarea' }
];

let state = loadState();
const els = {
  board: document.getElementById('board'), tableHead: document.getElementById('tableHead'), tableBody: document.getElementById('tableBody'),
  assetHead: document.getElementById('assetHead'), assetBody: document.getElementById('assetBody'), budgetStats: document.getElementById('budgetStats'),
  followupList: document.getElementById('followupList'), searchInput: document.getElementById('searchInput'), filterCountry: document.getElementById('filterCountry'),
  filterPlatform: document.getElementById('filterPlatform'), filterStatus: document.getElementById('filterStatus'), filterOwner: document.getElementById('filterOwner'),
  addBtn: document.getElementById('addBtn'), exportCsvBtn: document.getElementById('exportCsvBtn'), exportFollowupBtn: document.getElementById('exportFollowupBtn'),
  exportSummaryBtn: document.getElementById('exportSummaryBtn'), importCsvInput: document.getElementById('importCsvInput'), ownerInput: document.getElementById('ownerInput'),
  ownerCountryInput: document.getElementById('ownerCountryInput'), addOwnerBtn: document.getElementById('addOwnerBtn'), ownerList: document.getElementById('ownerList'),
  manualFollowupName: document.getElementById('manualFollowupName'), manualFollowupDate: document.getElementById('manualFollowupDate'), manualFollowupOwner: document.getElementById('manualFollowupOwner'),
  manualFollowupAction: document.getElementById('manualFollowupAction'), addFollowupBtn: document.getElementById('addFollowupBtn')
};
init();

function init() {
  els.ownerCountryInput.innerHTML = COUNTRY_OPTIONS.map(c => `<option value="${c}">${flagEmoji(c)} ${c}</option>`).join('');
  [els.searchInput, els.filterCountry, els.filterPlatform, els.filterStatus, els.filterOwner].forEach(el => el.addEventListener('input', render));
  els.addBtn.addEventListener('click', () => { state.items.unshift(makeItem()); persist(); render(); });
  els.addOwnerBtn.addEventListener('click', addOwner);
  els.addFollowupBtn.addEventListener('click', addManualFollowup);
  els.exportCsvBtn.addEventListener('click', () => exportCsv('kol_collaborations.csv', mapRows(filteredItems())));
  els.exportFollowupBtn.addEventListener('click', () => exportCsv('followups.csv', allFollowups()));
  els.exportSummaryBtn.addEventListener('click', () => exportCsv('expense_summary.csv', summaryRows()));
  els.importCsvInput.addEventListener('change', importCsv);
  render();
}

function makeItem() {
  return { id:crypto.randomUUID(), name:'', platform:'YouTube', country:'DE', language:'English', owner:'', tier:'KOL', deliverableType:'video', deliverableCount:1, price:0, currency:'EUR', likes:0,
    status:'候选', briefLink:'', assetLink:'', publishLinks:'', assetChecklist:'未齐', notes:'', assetDueDate:'', publishStart:'', publishEnd:'', acceptanceDue:'' };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: sampleData(), owners: sampleOwners(), manualFollowups: [] };
  try {
    const p = JSON.parse(raw);
    return { items:(p.items||[]).map(i => ({...makeItem(), ...i, id:i.id||crypto.randomUUID()})), owners:p.owners||sampleOwners(), manualFollowups:p.manualFollowups||[] };
  } catch { return { items: sampleData(), owners: sampleOwners(), manualFollowups: [] }; }
}
function sampleOwners(){ return [{id:crypto.randomUUID(),name:'Lina',country:'TR'},{id:crypto.randomUUID(),name:'Ken',country:'DE'}]; }
function sampleData(){ return [{...makeItem(),name:'Aylin Studio',platform:'TikTok',country:'TR',language:'Turkish',owner:'Lina',deliverableCount:2,price:1200,currency:'USD',status:'制作中',assetDueDate:plusDays(2),publishStart:plusDays(3),assetChecklist:'未齐'},{...makeItem(),name:'Neo Gamer',platform:'YouTube',country:'DE',language:'German',owner:'Ken',deliverableCount:1,price:2300,currency:'EUR',status:'已发布',publishStart:today(),publishLinks:'https://example.com/live',likes:4500,assetChecklist:'已齐'}]; }
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function render(){ populateFilterOptions(); renderOwners(); renderBoard(); renderCoreTable(); renderAssetTable(); renderBudget(); renderFollowups(); }
function filteredItems(){
  const kw = els.searchInput.value.trim().toLowerCase();
  return state.items.filter(i => (!kw || [i.name,i.notes,i.owner].join(' ').toLowerCase().includes(kw))
    && (!els.filterCountry.value || i.country===els.filterCountry.value)
    && (!els.filterPlatform.value || i.platform===els.filterPlatform.value)
    && (!els.filterStatus.value || i.status===els.filterStatus.value)
    && (!els.filterOwner.value || i.owner===els.filterOwner.value));
}

function addOwner(){
  const name = els.ownerInput.value.trim(); const country = els.ownerCountryInput.value;
  if (!name || !country || state.owners.some(o => o.name===name)) return;
  state.owners.push({id:crypto.randomUUID(),name,country}); els.ownerInput.value=''; persist(); render();
}
function renderOwners(){
  els.ownerList.innerHTML = state.owners.map(o => `<div class="owner-chip"><span>${flagEmoji(o.country)} ${escapeHtml(o.name)} · ${o.country}</span><button class="del-btn" data-owner="${o.id}">删除</button></div>`).join('');
  els.ownerList.querySelectorAll('button[data-owner]').forEach(btn => btn.addEventListener('click', () => { const o=state.owners.find(x=>x.id===btn.dataset.owner); state.owners=state.owners.filter(x=>x.id!==btn.dataset.owner); state.items.forEach(i=>{if(i.owner===o?.name)i.owner='';}); persist(); render(); }));
}

function renderBoard(){
  const items=filteredItems();
  els.board.innerHTML = STATUSES.map(s => `<section class="column" data-status="${s}"><h3>${s} (${items.filter(i=>i.status===s).length})</h3><div class="dropzone">${items.filter(i=>i.status===s).map(i=>`<article class="kol-card" draggable="true" data-id="${i.id}"><strong>${escapeHtml(i.name||'(未命名)')}</strong><div class="meta">${i.platform} · ${i.country} · ${i.owner||'-'}</div><div class="meta">${i.deliverableType} x${num(i.deliverableCount)} · ${money(i.price,i.currency)}</div><span class="badge">素材${i.assetChecklist}</span></article>`).join('')}</div></section>`).join('');
  els.board.querySelectorAll('.kol-card').forEach(c=>c.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',c.dataset.id)));
  els.board.querySelectorAll('.column').forEach(col=>{ col.addEventListener('dragover',e=>e.preventDefault()); col.addEventListener('drop',e=>{e.preventDefault(); const it=state.items.find(x=>x.id===e.dataTransfer.getData('text/plain')); if(!it)return; it.status=col.dataset.status; persist(); render();});});
}

function renderCoreTable(){
  const items=filteredItems();
  els.tableHead.innerHTML = CORE_COLUMNS.map(c=>`<th>${c.label}</th>`).join('');
  els.tableBody.innerHTML = items.map(i => `<tr>${CORE_COLUMNS.map(c => coreCell(i,c)).join('')}</tr>`).join('');
  bindEditors(els.tableBody);
  els.tableBody.querySelectorAll('button[data-del]').forEach(btn => btn.addEventListener('click', ()=>{ state.items=state.items.filter(i=>i.id!==btn.dataset.del); persist(); render(); }));
}
function coreCell(i,c){
  if(c.key==='actions') return `<td><button class="del-btn" data-del="${i.id}">删除</button></td>`;
  if(c.type==='ownerSelect') return `<td><select data-id="${i.id}" data-key="owner"><option value="">未分配</option>${state.owners.map(o=>`<option value="${escapeAttr(o.name)}" ${o.name===i.owner?'selected':''}>${escapeHtml(o.name)}</option>`).join('')}</select></td>`;
  if(c.type==='select') return `<td><select data-id="${i.id}" data-key="${c.key}">${c.options.map(op=>`<option value="${op}" ${String(i[c.key])===op?'selected':''}>${op}</option>`).join('')}</select></td>`;
  return `<td><input type="${c.type||'text'}" data-id="${i.id}" data-key="${c.key}" value="${escapeAttr(String(i[c.key]??''))}" /></td>`;
}

function renderAssetTable(){
  const items=filteredItems();
  els.assetHead.innerHTML = ASSET_COLUMNS.map(c=>`<th>${c.label}</th>`).join('');
  els.assetBody.innerHTML = items.map(i=>`<tr>${ASSET_COLUMNS.map(c=>assetCell(i,c)).join('')}</tr>`).join('');
  bindEditors(els.assetBody);
}
function assetCell(i,c){
  const v = i[c.key] ?? '';
  if(c.key==='name') return `<td>${escapeHtml(i.name||'(未命名)')}</td>`;
  if(c.type==='textarea') return `<td><textarea data-id="${i.id}" data-key="${c.key}">${escapeHtml(String(v))}</textarea></td>`;
  if(c.type==='select') return `<td><select data-id="${i.id}" data-key="${c.key}">${c.options.map(op=>`<option value="${op}" ${String(v)===op?'selected':''}>${op}</option>`).join('')}</select></td>`;
  return `<td><input type="text" data-id="${i.id}" data-key="${c.key}" value="${escapeAttr(String(v))}" /></td>`;
}

function bindEditors(root){
  root.querySelectorAll('input,select,textarea').forEach(el => el.addEventListener('change',()=>{
    const item=state.items.find(i=>i.id===el.dataset.id); if(!item)return; let v=el.value;
    if(['deliverableCount','price','likes'].includes(el.dataset.key)) v=Number(v||0);
    item[el.dataset.key]=v; persist(); render();
  }));
}

function renderBudget(){ const items=filteredItems(); const total=items.reduce((s,i)=>s+num(i.price),0); const spent=items.filter(i=>i.status==='已付款').reduce((s,i)=>s+num(i.price),0); els.budgetStats.textContent=`总预算: ${money(total)} ｜ 已花费: ${money(spent)} ｜ 待花费: ${money(total-spent)}`; }

function smartFollowups(){
  const now=new Date(); const list=[];
  state.items.forEach(i=>{
    if(i.assetChecklist!=='已齐' && ['合同中','制作中'].includes(i.status)) list.push(makeFollow(i, today(),'high','素材未齐，请补充到素材库','smart'));
    if(i.publishStart && isSameDay(new Date(i.publishStart),now) && ['制作中','已发布'].includes(i.status)) list.push(makeFollow(i, formatDate(i.publishStart),'high','发布窗口开始，确认发布','smart'));
    if(i.status==='已发布' && splitLinks(i.publishLinks).length < num(i.deliverableCount)) list.push(makeFollow(i,today(),'high','发布链接数量不足，需补齐','smart'));
  });
  return dedupFollowups(list);
}
function addManualFollowup(){ const name=els.manualFollowupName.value.trim(),date=els.manualFollowupDate.value,owner=els.manualFollowupOwner.value.trim(),action=els.manualFollowupAction.value.trim(); if(!name||!date||!action)return; state.manualFollowups.push({id:crypto.randomUUID(),name,date,owner,action,priority:'manual',status:'-',source:'manual'}); els.manualFollowupName.value=''; els.manualFollowupDate.value=''; els.manualFollowupOwner.value=''; els.manualFollowupAction.value=''; persist(); render(); }
function allFollowups(){ return [...smartFollowups(), ...state.manualFollowups].sort((a,b)=>new Date(a.date)-new Date(b.date)); }
function renderFollowups(){
  const list=allFollowups();
  els.followupList.innerHTML = list.length ? list.map(f=>`<li><strong>[${f.priority}]</strong> ${f.date} - ${escapeHtml(f.name)} (${escapeHtml(f.owner||'-')})：${escapeHtml(f.action)} ${f.source==='manual'?`<button class="del-btn" data-follow="${f.id}">删除</button>`:'<span class="badge">自动</span>'}</li>`).join('') : '<li>暂无待跟进事项</li>';
  els.followupList.querySelectorAll('button[data-follow]').forEach(btn=>btn.addEventListener('click',()=>{state.manualFollowups=state.manualFollowups.filter(f=>f.id!==btn.dataset.follow); persist(); render();}));
}

function populateFilterOptions(){ setSelect(els.filterCountry,COUNTRY_OPTIONS,'全部国家'); setSelect(els.filterOwner,uniq(state.owners.map(o=>o.name)),'全部负责人'); setSelect(els.filterStatus,STATUSES,'全部状态'); }
function setSelect(el,values,title){ const keep=el.value; el.innerHTML=`<option value="">${title}</option>`+values.map(v=>`<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`).join(''); el.value=values.includes(keep)?keep:''; }
function summaryRows(){ const by={}; state.items.forEach(i=>{const k=i.owner||'Unassigned'; by[k]=by[k]||{owner:k,total:0,paid:0,pending:0,count:0}; by[k].total+=num(i.price); by[k].count++; if(i.status==='已付款') by[k].paid+=num(i.price);}); return Object.values(by).map(r=>({...r,pending:r.total-r.paid})); }
function mapRows(items){ return items.map(i=>({name:i.name,platform:i.platform,country:i.country,language:i.language,owner:i.owner,tier:i.tier,deliverableType:i.deliverableType,deliverableCount:i.deliverableCount,price:i.price,currency:i.currency,likes:i.likes,status:i.status,briefLink:i.briefLink,assetLink:i.assetLink,publishLinks:i.publishLinks,assetChecklist:i.assetChecklist,notes:i.notes})); }
async function importCsv(e){ const f=e.target.files?.[0]; if(!f) return; const t=await f.text(); state.items=parseCsv(t).map(r=>({ ...makeItem(), ...r, id:crypto.randomUUID(), deliverableCount:num(r.deliverableCount), price:num(r.price), likes:num(r.likes) })); persist(); render(); e.target.value=''; }
function exportCsv(filename,rows){ if(!rows.length)return; const keys=Object.keys(rows[0]); const csv=[keys.join(','),...rows.map(r=>keys.map(k=>csvEscape(r[k])).join(','))].join('\n'); const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }
function parseCsv(text){ const lines=text.trim().split(/\r?\n/); const headers=splitCsvLine(lines[0]); return lines.slice(1).filter(Boolean).map(line=>{const vals=splitCsvLine(line),o={}; headers.forEach((h,i)=>o[h]=vals[i]??''); return o;}); }
function splitCsvLine(line){ const out=[]; let cur='',q=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'){ if(q&&line[i+1]==='"'){cur+='"';i++;} else q=!q; } else if(ch===','&&!q){out.push(cur); cur='';} else cur+=ch;} out.push(cur); return out; }
function makeFollow(i,date,priority,action,source){ return {id:`${i.id}-${date}-${action}`,date,priority,owner:i.owner||'',name:i.name||'(未命名)',status:i.status,action,source}; }
function dedupFollowups(list){ const m=new Map(); list.forEach(f=>m.set(`${f.name}|${f.date}|${f.action}`,f)); return [...m.values()]; }
function splitLinks(v){ return String(v||'').split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean); }
function today(){ return formatDate(new Date()); } function plusDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return formatDate(d);} function formatDate(d){const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;} function isSameDay(a,b){return a.toDateString()===b.toDateString();}
function flagEmoji(cc){ cc=String(cc||'').toUpperCase(); if(!/^[A-Z]{2}$/.test(cc)) return '🌐'; return String.fromCodePoint(...[...cc].map(c=>127397+c.charCodeAt())); }
function money(v,c='EUR'){ return `${num(v).toFixed(2)} ${c}`; } function num(v){ return Number(v)||0;} function uniq(a){return [...new Set(a)]}
function csvEscape(v){ const s=String(v??''); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); } function escapeAttr(s){return escapeHtml(s);}
