(() => {
  const API = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const config = window.LEAGUE_CONFIG || {};
  const LEAGUE = String(config.league || "YAMO");

  let rows = [];
  let historyRows = [];
  let rankLog = [];
  let sortKey = "rank";
  let sortAsc = true;
  let loading = false;

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function shortNum(v){const n=Number(v);if(!Number.isFinite(n))return"—";const a=Math.abs(n);if(a>=1e12)return(n/1e12).toFixed(2).replace(/\.00$/,"")+"T";if(a>=1e9)return(n/1e9).toFixed(2).replace(/\.00$/,"")+"B";if(a>=1e6)return(n/1e6).toFixed(2).replace(/\.00$/,"")+"M";if(a>=1e3)return(n/1e3).toFixed(2).replace(/\.00$/,"")+"K";return Number.isInteger(n)?n.toLocaleString("en-US"):n.toFixed(1)}
  function fullNum(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("en-US"):"—"}
  function dt(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?"—":d.toLocaleString()}
  function delta(v){if(v==null)return'<span class="unknown">—</span>';const n=Number(v);if(!Number.isFinite(n))return'<span class="unknown">—</span>';if(n>0)return'<span class="positive">+'+shortNum(n)+'</span>';if(n<0)return'<span class="negative">'+shortNum(n)+'</span>';return'<span class="zero">0</span>'}
  function rate(v){if(v==null)return'<span class="unknown">—</span>';const n=Number(v);if(!Number.isFinite(n))return'<span class="unknown">—</span>';if(n>0)return'<span class="positive">+'+shortNum(n)+'/hr</span>';if(n<0)return'<span class="negative">'+shortNum(n)+'/hr</span>';return'<span class="zero">0/hr</span>'}
  function initials(s){s=String(s||"?").trim();return s.slice(0,2).toUpperCase()}
  function iconUrl(icon){const t=String(icon||"").trim();if(!t)return"";if(/^https?:\/\//i.test(t)||t.startsWith("data:"))return t;const m=t.match(/rbxassetid:\/\/(\d+)/i);if(m)return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(m[1]);if(/^\d+$/.test(t))return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(t);return""}
  function avatar(r){const url=String(r.avatar_url||"").trim();return url?'<img class="avatar" src="'+esc(url)+'" alt="">':'<span class="avatar">'+esc(initials(r.username||r.display_name))+'</span>'}
  function compare(a,b,k,asc){const an=Number(a[k]),bn=Number(b[k]);let r=Number.isFinite(an)&&Number.isFinite(bn)?an-bn:String(a[k]||"").localeCompare(String(b[k]||""));return asc?r:-r}
  function profileHref(r){return "league-profile.html?league="+encodeURIComponent(LEAGUE)+"&id="+encodeURIComponent(r.user_id||"")}
  function nameForUser(userId, fallback){const cur=rows.find(r=>String(r.user_id)===String(userId));return cur?.username||cur?.display_name||fallback||userId}
  function projectedHourly(r){
    const g5=num(r.gain_5m); if(g5!==null)return g5*12;
    const g1=num(r.gain_1h); if(g1!==null)return g1;
    const g6=num(r.gain_6h); if(g6!==null)return g6/6;
    const g12=num(r.gain_12h); if(g12!==null)return g12/12;
    const g24=num(r.gain_24h); if(g24!==null)return g24/24;
    return null;
  }
  function avgPerHour(v,h){const n=num(v);return n===null?null:n/h}
  function enrichRow(r){return {...r,rate_1h:projectedHourly(r),avg_6h:avgPerHour(r.gain_6h,6),avg_12h:avgPerHour(r.gain_12h,12),avg_24h:avgPerHour(r.gain_24h,24)}}
  function visible(){const list=rows.map(enrichRow);list.sort((a,b)=>compare(a,b,sortKey,sortAsc));return list}

  async function getJson(url){
    url.searchParams.set("v",Date.now());
    const r=await fetch(url,{cache:"no-store"});
    const data=await r.json();
    if(!r.ok||data.ok===false)throw new Error(data.message||"HTTP "+r.status);
    return data;
  }

  function renderCards(data){
    const list=data.rows||[];
    const leagueName=data.league_name||LEAGUE;
    document.title=leagueName+" League Tracker";
    document.getElementById("league-points").textContent=shortNum(data.league_points);
    document.getElementById("league-points").title=fullNum(data.league_points);
    document.getElementById("member-count").textContent=list.length+"/"+(data.member_capacity||"—");
    document.getElementById("last-db-update").textContent=data.snapshot_at?dt(data.snapshot_at):"—";
    document.getElementById("page-title").textContent=leagueName+" League Tracker";
    document.getElementById("league-rank").textContent=data.league_rank?"#"+data.league_rank:"—";
    const img=document.getElementById("league-icon"),src=iconUrl(data.league_icon);
    if(src){img.src=src;img.hidden=false}else img.hidden=true;
  }

  function render(){
    const tbody=document.getElementById("members-tbody");
    const list=visible();
    if(!list.length){tbody.innerHTML='<tr><td colspan="8" class="empty">No stored '+esc(LEAGUE)+' members found yet.</td></tr>';return}
    tbody.innerHTML=list.map(r=>{
      const name=r.username||r.display_name||r.user_id;
      return '<tr><td class="rank">#'+esc(r.rank)+'</td><td><div class="player-cell"><a class="player-link" href="'+profileHref(r)+'">'+avatar(r)+'<span><span>'+esc(name)+'</span><div class="meta">'+esc(r.user_id)+'</div></span></a></div></td><td class="numeric" title="'+esc(fullNum(r.total_points))+'">'+esc(shortNum(r.total_points))+'</td><td class="numeric">'+delta(r.gain_5m)+'</td><td class="numeric">'+rate(r.rate_1h)+'</td><td class="numeric">'+rate(r.avg_6h)+'</td><td class="numeric">'+rate(r.avg_12h)+'</td><td class="numeric">'+rate(r.avg_24h)+'</td></tr>'
    }).join("");
    renderRankLog();
  }

  function showError(msg){document.getElementById("members-tbody").innerHTML='<tr><td colspan="8" class="error">'+esc(msg)+'</td></tr>'}

  function buildRankLog(){
    const byUser=new Map();
    for(const r of historyRows){
      if(!r || r.user_id==null || r.rank==null || !r.fetched_at)continue;
      const t=new Date(r.fetched_at).getTime();
      if(!Number.isFinite(t))continue;
      const key=String(r.user_id);
      if(!byUser.has(key))byUser.set(key,[]);
      byUser.get(key).push({t,fetched_at:r.fetched_at,user_id:key,rank:Number(r.rank),points:Number(r.points),display_name:r.display_name});
    }

    const events=[];
    for(const [userId,list] of byUser){
      list.sort((a,b)=>a.t-b.t);
      let last=null;
      for(const item of list){
        if(!last){last=item;continue}
        if(item.rank!==last.rank){
          const direction=item.rank<last.rank?"up":"down";
          events.push({t:item.t,fetched_at:item.fetched_at,user_id:userId,display_name:nameForUser(userId,item.display_name),from:last.rank,to:item.rank,direction,points:Number.isFinite(item.points)?item.points:null});
        }
        last=item;
      }
    }
    events.sort((a,b)=>b.t-a.t);
    return events;
  }

  function renderRankLog(){
    const box=document.getElementById("rank-log-list");
    const count=document.getElementById("rank-log-count");
    if(!box)return;
    rankLog=buildRankLog();
    if(count)count.textContent=rankLog.length?rankLog.length.toLocaleString("en-US")+" rank changes":"No rank changes";
    if(!rankLog.length){box.innerHTML='<div class="rank-log-empty">No rank up/down changes found in stored history yet.</div>';return}
    box.innerHTML=rankLog.slice(0,80).map(ev=>{
      const cls=ev.direction==="up"?"positive":"negative";
      const word=ev.direction==="up"?"moved up":"moved down";
      const arrow=ev.direction==="up"?"↑":"↓";
      return '<div class="rank-log-item '+cls+'"><span class="rank-log-time">'+esc(dt(ev.fetched_at))+'</span><span class="rank-log-main"><strong>'+esc(ev.display_name)+'</strong> '+word+' <strong>#'+esc(ev.from)+' → #'+esc(ev.to)+'</strong> '+arrow+'</span><span class="rank-log-points">'+esc(ev.points==null?"":shortNum(ev.points))+'</span></div>';
    }).join("");
  }

  async function loadData(){
    if(loading)return;loading=true;
    try{
      const currentUrl=new URL(API+"/api/leagues/current");
      currentUrl.searchParams.set("league",LEAGUE);
      const historyUrl=new URL(API+"/api/leagues/history");
      historyUrl.searchParams.set("league",LEAGUE);
      historyUrl.searchParams.set("hours","all");
      historyUrl.searchParams.set("limit","50000");
      const [current,history]=await Promise.all([getJson(currentUrl),getJson(historyUrl)]);
      rows=current.rows||[];
      historyRows=history.rows||[];
      renderCards(current);
      render();
    }catch(e){console.error(e);showError(e.message||String(e))}
    finally{loading=false}
  }

  document.getElementById("refresh-btn").addEventListener("click",loadData);
  document.querySelectorAll("th[data-sort]").forEach(th=>th.addEventListener("click",()=>{
    const k=th.dataset.sort;
    if(sortKey===k)sortAsc=!sortAsc;
    else{sortKey=k;sortAsc=k==="rank"||k==="display_name"}
    render();
  }));
  loadData();
  setInterval(loadData,60000);
})();