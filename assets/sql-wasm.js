/* Offline fallback shim that mimics tiny subset of sql.js API used by this app. */
(function(g){
  class Database{
    constructor(bytes){this.rows=[];this.id=1;if(bytes){try{const o=JSON.parse(new TextDecoder().decode(bytes));this.rows=o.rows||[];this.id=o.id||1;}catch{}}}
    run(sql,params=[]){sql=sql.trim();
      if(sql.startsWith('CREATE TABLE')||sql.startsWith('CREATE TRIGGER')) return;
      if(sql.startsWith('INSERT INTO games')){const cols=sql.match(/\((.*?)\)/)[1].split(',');const r={id:this.id++};cols.forEach((c,i)=>r[c.trim()]=params[i]);const now=new Date().toISOString();r.created_at=now;r.updated_at=now;this.rows.push(r);return;}
      if(sql.startsWith('UPDATE games SET')){const id=params[params.length-1];const row=this.rows.find(x=>x.id===id);if(!row)return;const set=sql.slice('UPDATE games SET'.length,sql.indexOf('WHERE')).split(',').map(s=>s.split('=')[0].trim());set.forEach((k,i)=>row[k]=params[i]);row.updated_at=new Date().toISOString();return;}
      if(sql.startsWith('DELETE FROM games')){const id=params[0];this.rows=this.rows.filter(r=>r.id!==id);return;}
    }
    exec(sql,params=[]){sql=sql.trim();
      if(sql.startsWith('SELECT COUNT(*) c FROM games')) return [{columns:['c'],values:[[this.rows.length]]}];
      if(sql.startsWith('SELECT * FROM games WHERE id=?')){const r=this.rows.find(x=>x.id===params[0]);return r?[{columns:Object.keys(r),values:[Object.keys(r).map(k=>r[k])]}]:[];}
      if(sql.startsWith('SELECT * FROM games')){let rows=[...this.rows];if(sql.includes('ORDER BY updated_at DESC'))rows.sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||''));if(sql.includes('ORDER BY id'))rows.sort((a,b)=>a.id-b.id);return this.pack(rows);}
      if(sql.startsWith('SELECT genre,monetization_mix')){return this.pack(this.rows.map(r=>({genre:r.genre,monetization_mix:r.monetization_mix,iap_primary_1:r.iap_primary_1,liveops_cadence:r.liveops_cadence,art_style:r.art_style,music_style:r.music_style,key_mechanics:r.key_mechanics,event_type_1:r.event_type_1})))}
      return [];
    }
    pack(rows){if(!rows.length)return [];const cols=[...new Set(rows.flatMap(r=>Object.keys(r)))];return [{columns:cols,values:rows.map(r=>cols.map(c=>r[c]??null))}];}
    export(){return new TextEncoder().encode(JSON.stringify({rows:this.rows,id:this.id}));}
  }
  g.initSqlJs=async()=>({Database});
})(window);
