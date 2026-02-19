const ENUMS = {
  eu_focus_market: ['EU','DE','FR','UK','IT','ES','NL','SE','NO','FI','DK','BE','AT','CH','PL','TR','RO','CZ','HU','GR','PT','IE','Other'],
  genre: ['SLG/4X','Shooter','RPG','ARPG','Card/TCG','Puzzle','Match-3','Sim/Builder','Idle','Party/Social','Sports','Racing','Casual','Hybridcasual','Hypercasual','Other'],
  hybrid_type: ['None','4X+TowerDefense','4X+Survival','Shooter+Extraction','Puzzle+Merge','Match-3+Meta','Idle+RPG','Other'],
  session_length: ['S(<3m)','M(3-10m)','L(>10m)'],
  social_competition: ['None','Guild/Clan','Alliance','PvP Rank','Guild War','Co-op','Cross-server','Multiple'],
  art_style: ['Realistic','Stylized','Cartoon','Anime','Low-poly','Pixel','Other','Unknown'],
  theme_setting: ['Medieval','Modern military','Post-apocalypse','Sci-fi','Fantasy','Urban/Crime','Sports','IP/Anime','Cozy/Cute','Other','Unknown'],
  music_style: ['Orchestral','Electronic','Rock','Lo-fi','Ambient','Pop','None/Minimal','Unknown'],
  monetization_mix: ['IAP','IAA','Hybrid','Subscription-led','Unknown'],
  ads_type: ['None','Rewarded','Interstitial','Banner','Offerwall','Mixed','Unknown'],
  iap: ['Battle Pass','Monthly Card','Subscription','Gacha','Skins/Cosmetics','Tier Packs','Starter Pack','Resource Packs','VIP','Convenience(energy/skip)','Other','Unknown'],
  liveops_cadence: ['Weekly','Biweekly','Monthly','Seasonal','Event-based','Unknown'],
  event: ['Ranked ladder','Guild/Alliance war','Limited-time dungeon','Collection event','Collab/IP','Holiday event','Tournament','Mini-game','Other','Unknown'],
  growth_type: ['DL','Rev','Both','Viral/UGC','Unknown']
};
const FIELDS = [
  'id','game','publisher','release_date','eu_focus_market','eu_markets_notes','genre','hybrid_type','session_length','social_competition','art_style','theme_setting','music_style','audio_feedback','core_loop','key_mechanics','meta_depth','monetization_mix','ads_type','iap_primary_1','iap_primary_2','max_price_tier_eur','liveops_cadence','event_type_1','event_type_2','event_type_3','growth_type','growth_signal','evidence_links','hook_strength','operability','differentiation','eu_risk','overall_potential','notes','created_at','updated_at'
];
const SCORE_FIELDS=['audio_feedback','meta_depth','hook_strength','operability','differentiation','eu_risk','overall_potential'];
let SQL, db, editingId = null;

const schema = `
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
 music_style TEXT,
 audio_feedback INTEGER,
 core_loop TEXT,
 key_mechanics TEXT,
 meta_depth INTEGER,
 monetization_mix TEXT NOT NULL,
 ads_type TEXT,
 iap_primary_1 TEXT,
 iap_primary_2 TEXT,
 max_price_tier_eur REAL,
 liveops_cadence TEXT,
 event_type_1 TEXT,
 event_type_2 TEXT,
 event_type_3 TEXT,
 growth_type TEXT,
 growth_signal TEXT,
 evidence_links TEXT,
 hook_strength INTEGER,
 operability INTEGER,
 differentiation INTEGER,
 eu_risk INTEGER,
 overall_potential INTEGER,
 notes TEXT,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TRIGGER IF NOT EXISTS trg_games_updated_at
AFTER UPDATE ON games
FOR EACH ROW
BEGIN
  UPDATE games SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id;
END;`;

function initForm(){
  const form = document.getElementById('gameForm');
  const defs = [
    ['game','游戏名*'],['publisher','发行商'],['release_date','发布日期(YYYY-MM-DD)'],['eu_focus_market','EU Focus Market','sel',ENUMS.eu_focus_market],['eu_markets_notes','EU markets notes','ta'],
    ['genre','Genre*','sel',ENUMS.genre],['hybrid_type','Hybrid Type','sel',ENUMS.hybrid_type],['session_length','Session','sel',ENUMS.session_length],['social_competition','Social','sel',ENUMS.social_competition],['art_style','Art','sel',ENUMS.art_style],['theme_setting','Theme','sel',ENUMS.theme_setting],
    ['music_style','MusicStyle','sel',ENUMS.music_style],['audio_feedback','Audio Feedback(1-5)','score'],['core_loop','Core Loop'],['key_mechanics','Key Mechanics(多标签;分隔)','ta'],['meta_depth','Meta Depth(1-5)','score'],
    ['monetization_mix','Monetization Mix*','sel',ENUMS.monetization_mix],['ads_type','Ads Type','sel',ENUMS.ads_type],['iap_primary_1','IAP Primary 1','sel',ENUMS.iap],['iap_primary_2','IAP Primary 2','sel',ENUMS.iap],['max_price_tier_eur','Max Price Tier EUR'],
    ['liveops_cadence','LiveOps Cadence','sel',ENUMS.liveops_cadence],['event_type_1','Event Type 1','sel',ENUMS.event],['event_type_2','Event Type 2','sel',ENUMS.event],['event_type_3','Event Type 3','sel',ENUMS.event],
    ['growth_type','Growth Type','sel',ENUMS.growth_type],['growth_signal','Growth Signal'],['evidence_links','Evidence Links(多行)','ta'],
    ['hook_strength','Hook Strength(1-5)','score'],['operability','Operability(1-5)','score'],['differentiation','Differentiation(1-5)','score'],['eu_risk','EU Risk(1-5)','score'],['overall_potential','Overall Potential(1-5)','score'],['notes','Notes','ta']
  ];
  form.innerHTML = defs.map(([k,l,t,opts])=>{
    if(t==='sel')return `<label>${l}<select name='${k}'><option value=''></option>${opts.map(v=>`<option>${v}</option>`).join('')}</select></label>`;
    if(t==='ta')return `<label class='full'>${l}<textarea name='${k}'></textarea></label>`;
    if(t==='score')return `<label>${l}<select name='${k}'><option value=''></option>${[1,2,3,4,5].map(v=>`<option>${v}</option>`).join('')}</select></label>`;
    return `<label>${l}<input name='${k}' /></label>`;
  }).join('') + `<div class='actions'><button type='submit'>保存</button><button type='button' id='clearFormBtn'>清空表单</button></div>`;
  form.addEventListener('submit', onSave);
  document.getElementById('clearFormBtn').onclick=()=>{editingId=null;form.reset();};
}

function onSave(e){
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  if(!data.game || !data.genre || !data.monetization_mix){alert('必填字段: game, genre, monetization_mix');return;}
  SCORE_FIELDS.forEach(k=>data[k]=data[k]?Number(data[k]):null);
  const cols = FIELDS.filter(f=>!['id','created_at','updated_at'].includes(f));
  if(editingId){
    const set = cols.map(c=>`${c}=?`).join(',');
    db.run(`UPDATE games SET ${set} WHERE id=?`, [...cols.map(c=>data[c]||null), editingId]);
  }else{
    db.run(`INSERT INTO games (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`, cols.map(c=>data[c]||null));
  }
  refreshAll();
  e.target.reset();
  editingId=null;
}

function q(sql,params=[]){const r=db.exec(sql,params); if(!r[0])return []; const {columns,values}=r[0]; return values.map(v=>Object.fromEntries(columns.map((c,i)=>[c,v[i]])));}
function refreshAll(){renderList();renderStats();updateStatus();}

function renderList(){
  const s=document.getElementById('searchInput').value.toLowerCase();
  const fg=val('filterGenre'), fm=val('filterMonetization'), fl=val('filterLiveOps'), fe=val('filterEu'), fp=Number(val('filterPotential')||0);
  const rows=q('SELECT * FROM games ORDER BY updated_at DESC').filter(r=>(!s||`${r.game||''} ${r.publisher||''}`.toLowerCase().includes(s))&&(!fg||r.genre===fg)&&(!fm||r.monetization_mix===fm)&&(!fl||r.liveops_cadence===fl)&&(!fe||r.eu_focus_market===fe)&&(!fp||Number(r.overall_potential||0)>=fp));
  window.filteredRows=rows;
  const t=document.getElementById('listTable');
  t.innerHTML='<tr><th>ID</th><th>Game</th><th>Publisher</th><th>Genre</th><th>Monetization</th><th>LiveOps</th><th>Potential</th><th>操作</th></tr>'+rows.map(r=>`<tr data-id='${r.id}'><td>${r.id}</td><td>${esc(r.game)}</td><td>${esc(r.publisher||'')}</td><td>${esc(r.genre||'')}</td><td>${esc(r.monetization_mix||'')}</td><td>${esc(r.liveops_cadence||'')}</td><td>${esc(r.overall_potential||'')}</td><td><button data-del='${r.id}'>删除</button></td></tr>`).join('');
  t.onclick=(e)=>{
    const del=e.target.dataset.del;
    if(del){ if(confirm('确认删除?')){db.run('DELETE FROM games WHERE id=?',[Number(del)]);refreshAll();} return; }
    const tr=e.target.closest('tr[data-id]'); if(!tr) return;
    const item=q('SELECT * FROM games WHERE id=?',[Number(tr.dataset.id)])[0]; editingId=item.id;
    const f=document.getElementById('gameForm'); FIELDS.forEach(k=>{if(f.elements[k])f.elements[k].value=item[k]??'';}); switchTab('form');
  };
}

function renderStats(){
  const rows=q('SELECT * FROM games');
  const includeUnknown=document.getElementById('includeUnknown').checked;
  const valid=v=>v!==null&&v!==''&&(includeUnknown||v!=='Unknown');
  const splitTags=s=>(s||'').split(/[;,\n]/).map(x=>x.trim()).filter(Boolean);
  const freqDefs=[['Genre','genre'],['Monetization mix','monetization_mix'],['IAP primary','iap_primary_1'],['LiveOps cadence','liveops_cadence'],['EventType','event_type_1'],['Art','art_style'],['MusicStyle','music_style']];
  const cards=[];
  freqDefs.forEach(([title,key])=>{const m={};rows.forEach(r=>{const v=r[key];if(valid(v))m[v]=(m[v]||0)+1;});cards.push(cardHtml(title,m));});
  const mTag={}; rows.forEach(r=>splitTags(r.key_mechanics).forEach(t=>{if(valid(t))mTag[t]=(mTag[t]||0)+1;})); cards.push(cardHtml('KeyMechanics 标签',mTag));
  document.getElementById('freqCards').innerHTML=cards.join('');
  document.getElementById('crossGenreMonetization').innerHTML=cross(rows,'genre','monetization_mix',valid);
  document.getElementById('crossIapLiveops').innerHTML=cross(rows,'iap_primary_1','liveops_cadence',valid);
  const n=Number(document.getElementById('topN').value||10), combo={};
  rows.forEach(r=>{if(valid(r.genre)&&valid(r.iap_primary_1)&&valid(r.liveops_cadence)){const k=`${r.genre} + ${r.iap_primary_1} + ${r.liveops_cadence}`;combo[k]=(combo[k]||0)+1;}});
  document.getElementById('topCombos').innerHTML='<ol>'+Object.entries(combo).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`<li>${esc(k)} (${v})</li>`).join('')+'</ol>';
}
function cardHtml(title,map){const arr=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10);return `<div class='card'><b>${title}</b><ul>${arr.map(([k,v])=>`<li>${esc(k)}: ${v}</li>`).join('')||'<li>无</li>'}</ul></div>`;}
function cross(rows,a,b,valid){const ra=[...new Set(rows.map(r=>r[a]).filter(valid))], cb=[...new Set(rows.map(r=>r[b]).filter(valid))]; let h='<table><tr><th></th>'+cb.map(c=>`<th>${esc(c)}</th>`).join('')+'</tr>'; ra.forEach(rk=>{h+=`<tr><th>${esc(rk)}</th>`+cb.map(ck=>`<td>${rows.filter(r=>r[a]===rk&&r[b]===ck).length}</td>`).join('')+'</tr>';}); return h+'</table>';}

function exportCsv(rows,name){
  const bom='\uFEFF';
  const line=v=>`"${String(v??'').replaceAll('"','""')}"`;
  const csv=bom+[FIELDS.join(','),...rows.map(r=>FIELDS.map(f=>line(r[f])).join(','))].join('\n');
  download(name,new Blob([csv],{type:'text/csv;charset=utf-8;'}));
}
function exportSummary(){
  const rows=q('SELECT genre,monetization_mix,iap_primary_1,liveops_cadence,art_style,music_style,key_mechanics,event_type_1 FROM games');
  const out=[['metric','value','count']];
  const add=(m)=>Object.entries(m).forEach(([k,v])=>out.push([m._name,k,v]));
  ['genre','monetization_mix','iap_primary_1','liveops_cadence','art_style','music_style','event_type_1'].forEach(k=>{const m={_name:k};rows.forEach(r=>{if(r[k]&&r[k]!=='Unknown')m[r[k]]=(m[r[k]]||0)+1;});add(m);});
  const mt={_name:'key_mechanics'}; rows.forEach(r=>(r.key_mechanics||'').split(/[;,\n]/).map(x=>x.trim()).filter(Boolean).forEach(t=>mt[t]=(mt[t]||0)+1)); add(mt);
  const bom='\uFEFF'; const csv=bom+out.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  download('summary.csv',new Blob([csv],{type:'text/csv;charset=utf-8;'}));
}

function bind(){
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  ['searchInput','filterGenre','filterMonetization','filterLiveOps','filterEu','filterPotential'].forEach(id=>document.getElementById(id).oninput=renderList);
  document.getElementById('resetFiltersBtn').onclick=()=>{['searchInput','filterGenre','filterMonetization','filterLiveOps','filterEu','filterPotential'].forEach(id=>document.getElementById(id).value='');renderList();};
  document.getElementById('newDbBtn').onclick=()=>{db=new SQL.Database();db.run(schema);refreshAll();};
  document.getElementById('loadDbInput').onchange=async(e)=>{const f=e.target.files[0];if(!f)return;const buf=await f.arrayBuffer();db=new SQL.Database(new Uint8Array(buf));db.run(schema);refreshAll();};
  document.getElementById('exportDbBtn').onclick=()=>download('games.db',new Blob([db.export()],{type:'application/octet-stream'}));
  document.getElementById('exportAllCsvBtn').onclick=()=>exportCsv(q('SELECT * FROM games ORDER BY id'),'games_all.csv');
  document.getElementById('exportFilteredCsvBtn').onclick=()=>exportCsv(window.filteredRows||[],'games_filtered.csv');
  document.getElementById('exportExcelBtn').onclick=()=>{const ws=XLSX.utils.json_to_sheet(q('SELECT * FROM games ORDER BY id'));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'games');XLSX.writeFile(wb,'games.xlsx');};
  document.getElementById('exportSummaryBtn').onclick=exportSummary;
  document.getElementById('includeUnknown').onchange=renderStats;
  document.getElementById('topN').oninput=renderStats;
}
function switchTab(tab){document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));document.querySelectorAll('.tab-page').forEach(p=>p.classList.toggle('active',p.id===`tab-${tab}`));}
function fillFilters(){
  fill('filterGenre',ENUMS.genre,'全部 Genre');fill('filterMonetization',ENUMS.monetization_mix,'全部 Monetization');fill('filterLiveOps',ENUMS.liveops_cadence,'全部 LiveOps');fill('filterEu',ENUMS.eu_focus_market,'全部 EU Market');
  document.getElementById('filterPotential').innerHTML='<option value="">Overall potential>=X</option>'+[1,2,3,4,5].map(v=>`<option>${v}</option>`).join('');
}
function fill(id,arr,label){document.getElementById(id).innerHTML=`<option value=''>${label}</option>`+arr.map(v=>`<option>${v}</option>`).join('');}
function updateStatus(){const c=q('SELECT COUNT(*) c FROM games')[0]?.c||0;document.getElementById('dbStatus').textContent=`已加载，记录数: ${c}`;}
const esc=s=>String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
const val=id=>document.getElementById(id).value;
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

(async function(){
  if(typeof initSqlJs!=='function'){alert('缺少 assets/sql-wasm.js');return;}
  SQL = await initSqlJs({locateFile: f => `assets/${f}`});
  db = new SQL.Database(); db.run(schema);
  initForm(); fillFilters(); bind(); refreshAll();
})();
