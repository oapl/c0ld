(() => {
  const API = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const TOP_LEAGUES_NAME = "GLOBAL_TOP_100_LEAGUES";
  const config = window.LEAGUE_CONFIG || {};
  const LEAGUE = String(config.league || "YAMO");

  let rows = [];
  let currentData = null;
  let leagueRankHistoryRows = [];
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
  function projectedHourly(r){const g5=num(r.gain_5m);if(g5!==null)return g5*12;const g1=num(r.gain_1h);if(g1!==null)return g1;const g6=num(r.gain_6h);if(g6!==null)return g6/6;const g12=num(r.gain_12h);if(g12!==null)return g12/12;const g24=num(r.gain_24h);if(g24!==null)return g24/24;return null}
  function avgPerHour(v,h){const n=num(v);return n===null?null:n/h}
  function enrichRow(r){return {...r,rate_1h:projectedHourly(r),avg_6h:avgPerHour(r.gain_6h,6),avg_12h:avgPerHour(r.gain_12h,12),avg_24h:avgPerHour(r.gain_24h,24)}}
  function visible(){const list=rows.map(enrichRow);list.sort((a,b)=>compare(a,b,sortKey,sortAsc));return list}

  function stableLeagueUserId(value){
    let h=2166136261;
    const text=String(value||"unknown");
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
    return 9000000000000+h;
  }

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
    currentData=data;
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
    renderLeagueRankLog();
  }

  function showError(msg){document.getElementById("members-tbody").innerHTML='<tr><td colspan="8" class="error">'+esc(msg)+'</td></tr>'}

  async function fetchLeagueRankHistory(leagueData){
    const stable=currentData?.league_id||currentData?.league_name||LEAGUE;
    const syntheticId=stableLeagueUserId(stable);
    const url=new URL(API+"/api/leagues/history");
    url.searchParams.set("league",TOP_LEAGUES_NAME);
    url.searchParams.set("user_id",String(syntheticId));
    url.searchParams.set("hours","all");
    url.searchParams.set("limit","50000");
    const data=await getJson(url);
    return data.rows||[];
  }

  function dedupeRankRows(rows){
    const byTime=new Map();
    for(const r of rows){
      if(!r || r.rank==null || !r.fetched_at)continue;
      const t=new Date(r.fetched_at).getTime();
      if(!Number.isFinite(t))continue;
      byTime.set(t,{t,fetched_at:r.fetched_at,rank:Number(r.rank),points:Number(r.points)});
    }
    return [...byTime.values()].sort((a,b)=>a.t-b.t);
  }

  function buildLeagueRankLog(){
    const clean=dedupeRankRows(leagueRankHistoryRows);
    const events=[];
    let last=null;
    for(const row of clean){
      if(!last){last=row;continue}
      if(row.rank!==last.rank){
        events.push({
          t:row.t,
          fetched_at:row.fetched_at,
          from:last.rank,
          to:row.rank,
          direction:row.rank<last.rank?"up":"down",
          points:Number.isFinite(row.points)?row.points:null
        });
      }
      last=row;
    }
    events.sort((a,b)=>b.t-a.t);
    return events;
  }

  function renderLeagueRankLog(){
    const box=document.getElementById("rank-log-list");
    const count=document.getElementById("rank-log-count");
    if(!box)return;

    const events=buildLeagueRankLog();
    if(count)count.textContent=events.length?events.length.toLocaleString("en-US")+" league rank changes":"No league rank changes";

    if(!events.length){
      box.innerHTML='<div class="rank-log-empty">No league rank up/down changes found yet. This depends on stored Top 100 League snapshots.</div>';
      return;
    }

    const name=currentData?.league_name||LEAGUE;
    box.innerHTML=events.slice(0,80).map(ev=>{
      const cls=ev.direction==="up"?"positive":"negative";
      const word=ev.direction==="up"?"ranked up":"ranked down";
      const arrow=ev.direction==="up"?"↑":"↓";
      return '<div class="rank-log-item '+cls+'"><span class="rank-log-time">'+esc(dt(ev.fetched_at))+'</span><span class="rank-log-main"><strong>'+esc(name)+'</strong> '+word+' <strong>#'+esc(ev.from)+' → #'+esc(ev.to)+'</strong> '+arrow+'</span><span class="rank-log-rank">'+esc(ev.points==null?"":shortNum(ev.points))+'</span></div>';
    }).join("");
  }

  async function loadData(){
    if(loading)return;loading=true;
    try{
      const currentUrl=new URL(API+"/api/leagues/current");
      currentUrl.searchParams.set("league",LEAGUE);
      const current=await getJson(currentUrl);
      rows=current.rows||[];
      renderCards(current);

      leagueRankHistoryRows=await fetchLeagueRankHistory(current).catch(err=>{
        console.warn("League rank history unavailable",err);
        return [];
      });

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