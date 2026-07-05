(() => {
  const API = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const TOP_LEAGUES_NAME = "GLOBAL_TOP_100_LEAGUES";
  const config = window.LEAGUE_CONFIG || {};
  const LEAGUE = String(config.league || "YAMO");
  const RUN_KEY = String(config.run || config.runKey || "active").trim();
  const TARGET_RANK = Number(config.targetRank || 60);
  const SHOW_RACE_SUMMARY = config.showRaceSummary === true || String(config.showRaceSummary || "").toLowerCase() === "true";
  const GAIN_WINDOWS = [
    { key: "gain_5m", label: "5m", minutes: 5 },
    { key: "gain_1h", label: "1 hour", minutes: 60 },
    { key: "gain_6h", label: "6 hours", minutes: 360 },
    { key: "gain_12h", label: "12 hours", minutes: 720 },
    { key: "gain_24h", label: "24 hours", minutes: 1440 }
  ];

  let rows = [];
  let currentData = null;
  let topLeagueRow = null;
  let targetRankRow = null;
  let leagueRankHistoryRows = [];
  let sortKey = "rank";
  let sortAsc = true;
  let loading = false;

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
  function shortNum(v){const n=Number(v);if(!Number.isFinite(n))return"—";const a=Math.abs(n);if(a>=1e12)return(n/1e12).toFixed(2).replace(/\.00$/,"")+"T";if(a>=1e9)return(n/1e9).toFixed(2).replace(/\.00$/,"")+"B";if(a>=1e6)return(n/1e6).toFixed(2).replace(/\.00$/,"")+"M";if(a>=1e3)return(n/1e3).toFixed(2).replace(/\.00$/,"")+"K";return n.toLocaleString("en-US")}
  function fullNum(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("en-US"):"—"}
  function dt(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?"—":d.toLocaleString()}
  function delta(v){if(v==null)return'<span class="unknown">—</span>';const n=Number(v);if(!Number.isFinite(n))return'<span class="unknown">—</span>';if(n>0)return'<span class="positive">+'+shortNum(n)+'</span>';if(n<0)return'<span class="negative">'+shortNum(n)+'</span>';return'<span class="zero">0</span>'}
  function initials(s){s=String(s||"?").trim();return s.slice(0,2).toUpperCase()}
  function iconUrl(icon){const t=String(icon||"").trim();if(!t)return"";if(/^https?:\/\//i.test(t)||t.startsWith("data:"))return t;const m=t.match(/rbxassetid:\/\/(\d+)/i);if(m)return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(m[1]);if(/^\d+$/.test(t))return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(t);return""}
  function avatar(r){const url=String(r.avatar_url||"").trim();return url?'<img class="avatar" src="'+esc(url)+'" alt="">':'<span class="avatar">'+esc(initials(r.username||r.display_name))+'</span>'}
  function compare(a,b,k,asc){const an=Number(a[k]),bn=Number(b[k]);let r=Number.isFinite(an)&&Number.isFinite(bn)?an-bn:String(a[k]||"").localeCompare(String(b[k]||""));return asc?r:-r}
  function addRunParam(url){if(RUN_KEY)url.searchParams.set("run",RUN_KEY);return url}
  function profileHref(r){
    let href="league-profile.html?league="+encodeURIComponent(LEAGUE)+"&id="+encodeURIComponent(r.user_id||"");
    if(RUN_KEY)href+="&run="+encodeURIComponent(RUN_KEY);
    return href;
  }
  function visible(){const list=rows.slice();list.sort((a,b)=>compare(a,b,sortKey,sortAsc));return list}
  function norm(v){return String(v||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"")}

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

  async function fetchTopLeagueContext(){
    const url=new URL(API+"/api/leagues/top-leagues");
    url.searchParams.set("limit","100");
    addRunParam(url);
    const data=await getJson(url);
    const targetName=norm(currentData?.league_name||LEAGUE);
    const targetId=String(currentData?.league_id||"").trim();
    const topRows=data.rows||[];
    targetRankRow=Number.isFinite(TARGET_RANK)
      ? topRows.find(r=>Number(r.rank)===TARGET_RANK) || topRows[TARGET_RANK-1] || null
      : null;
    return topRows.find(r =>
      (targetId && String(r.league_id||"").trim()===targetId) ||
      norm(r.league_name||r.display_name)===targetName
    ) || null;
  }

  function renderCards(data){
    const list=data.rows||[];
    const leagueName=data.league_name||LEAGUE;
    currentData=data;
    document.title=leagueName+" League Tracker";
    document.getElementById("league-points").textContent=shortNum(data.league_points);
    document.getElementById("league-points").title=fullNum(data.league_points);
    document.getElementById("last-db-update").textContent=data.snapshot_at?dt(data.snapshot_at):"—";
    document.getElementById("page-title").textContent=leagueName+" League Tracker";
    const currentRank=topLeagueRow?.rank||data.league_rank;
    const projectedRank=topLeagueRow?.projected_rank_1h;
    document.getElementById("league-rank").textContent=currentRank?"#"+currentRank:"—";
    document.getElementById("projected-rank").textContent=projectedRank?"#"+projectedRank:"—";
    const img=document.getElementById("league-icon"),src=iconUrl(data.league_icon);
    if(src){img.src=src;img.hidden=false}else img.hidden=true;
  }

  function numOrNull(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function teamPoints(){return numOrNull(currentData?.league_points) ?? numOrNull(topLeagueRow?.total_points)}
  function targetPoints(){return numOrNull(targetRankRow?.total_points ?? targetRankRow?.points)}
  function goalGap(){
    const team=teamPoints(),target=targetPoints();
    if(team==null||target==null)return null;
    return Math.max(0, Math.ceil(target-team+1));
  }
  function teamGain(key){
    let total=0,has=false;
    for(const r of rows){
      const n=numOrNull(r?.[key]);
      if(n==null)continue;
      total+=n;has=true;
    }
    return has?total:null;
  }
  function formatDuration(totalMinutes){
    if(!Number.isFinite(totalMinutes))return"&mdash;";
    if(totalMinutes<1)return"<1m";
    const minutes=Math.ceil(totalMinutes);
    if(minutes<60)return"~"+minutes+"m";
    if(minutes<1440){
      const h=Math.floor(minutes/60),m=minutes%60;
      return"~"+h+"h"+(m?" "+m+"m":"");
    }
    const d=Math.floor(minutes/1440),h=Math.round((minutes%1440)/60);
    return"~"+d+"d"+(h?" "+h+"h":"");
  }
  function ordinal(n){
    const value=Number(n);
    if(!Number.isFinite(value))return String(n||"");
    const mod100=value%100,mod10=value%10;
    const suffix=mod100>=11&&mod100<=13?"th":mod10===1?"st":mod10===2?"nd":mod10===3?"rd":"th";
    return value+suffix;
  }
  function raceBasis(){
    const preference=["gain_1h","gain_6h","gain_12h","gain_24h","gain_5m"];
    for(const key of preference){
      const win=GAIN_WINDOWS.find(w=>w.key===key);
      const targetGain=numOrNull(targetRankRow?.[key]);
      const currentGain=teamGain(key);
      if(win&&targetGain!=null&&currentGain!=null)return{...win,targetGain,currentGain};
    }
    return null;
  }
  function raceStats(){
    const gap=goalGap(),basis=raceBasis();
    if(gap==null||!basis)return{time:'&mdash;',hourly:'&mdash;',tone:'unknown',title:'Pace unavailable.'};
    const hours=basis.minutes/60;
    const targetHourly=basis.targetGain/hours;
    const currentHourly=basis.currentGain/hours;
    const basisLabel=basis.key==="gain_1h"?"1h":basis.label;
    const title="Uses "+basisLabel+" pace: YAMO "+fullNum(Math.round(currentHourly))+"/hr, #"+TARGET_RANK+" "+fullNum(Math.round(targetHourly))+"/hr.";
    if(gap<=0)return{time:'Passed',hourly:shortNum(currentHourly)+"/hr",tone:'met',title};
    const netHourly=currentHourly-targetHourly;
    return {
      time:netHourly>0?formatDuration(gap/(netHourly/60)):"Won't pass",
      hourly:shortNum(currentHourly)+"/hr",
      tone:netHourly>0?"met":"need",
      title:title+" Time is based on YAMO's net gain after #"+TARGET_RANK+"'s pace."
    };
  }
  function renderRaceSummary(){
    const box=document.getElementById("race-summary");
    if(!box)return;
    if(!SHOW_RACE_SUMMARY){box.hidden=true;return}
    box.hidden=false;
    if(!targetRankRow){
      box.innerHTML='<div class="race-summary-empty">#'+esc(TARGET_RANK)+' target unavailable until Top 100 league data updates.</div>';
      return;
    }
    const targetName=targetRankRow.league_name||targetRankRow.display_name||"Top "+TARGET_RANK;
    const actualRank=targetRankRow.rank||TARGET_RANK;
    const headers=['<th>'+esc(ordinal(actualRank))+'</th>','<th class="numeric">Total</th>'].concat(GAIN_WINDOWS.map(w=>'<th class="numeric">'+esc(w.key==="gain_1h"?"Hr":w.label)+'</th>')).join("");
    const targetCells=GAIN_WINDOWS.map(win=>'<td class="numeric">'+delta(targetRankRow?.[win.key])+'</td>').join("");
    const teamCells=GAIN_WINDOWS.map(win=>'<td class="numeric">'+delta(teamGain(win.key))+'</td>').join("");
    const stats=raceStats();
    box.innerHTML='<div class="race-summary-scroll"><table class="race-mini-table"><thead><tr>'+headers+'</tr></thead><tbody>'+
      '<tr><td class="race-name" title="'+esc(targetName)+'">'+esc(targetName)+'</td><td class="numeric" title="'+esc(fullNum(targetPoints()))+'">'+esc(shortNum(targetPoints()))+'</td>'+targetCells+'</tr>'+
      '<tr><td class="race-name" title="'+esc(currentData?.league_name||LEAGUE)+'">'+esc(currentData?.league_name||LEAGUE)+'</td><td class="numeric" title="'+esc(fullNum(teamPoints()))+'">'+esc(shortNum(teamPoints()))+'</td>'+teamCells+'</tr>'+
      '</tbody></table></div><div class="race-summary-stats">'+
      '<span title="'+esc(stats.title)+'">Time to Pass: <strong class="'+esc(stats.tone)+'">'+stats.time+'</strong> @ '+esc(stats.hourly)+'</span>'+
      '</div>';
  }

  function render(){
    const tbody=document.getElementById("members-tbody");
    renderRaceSummary();
    const list=visible();
    if(!list.length){tbody.innerHTML='<tr><td colspan="8" class="empty">No stored '+esc(LEAGUE)+' members found yet.</td></tr>';return}
    tbody.innerHTML=list.map(r=>{
      const name=r.username||r.display_name||r.user_id;
      return '<tr><td class="rank">#'+esc(r.rank)+'</td><td><div class="player-cell"><a class="player-link" href="'+profileHref(r)+'">'+avatar(r)+'<span><span>'+esc(name)+'</span><div class="meta">'+esc(r.user_id)+'</div></span></a></div></td><td class="numeric" title="'+esc(fullNum(r.total_points))+'">'+esc(shortNum(r.total_points))+'</td><td class="numeric">'+delta(r.gain_5m)+'</td><td class="numeric">'+delta(r.gain_1h)+'</td><td class="numeric">'+delta(r.gain_6h)+'</td><td class="numeric">'+delta(r.gain_12h)+'</td><td class="numeric">'+delta(r.gain_24h)+'</td></tr>'
    }).join("");
    renderLeagueRankLog();
  }

  function showError(msg){document.getElementById("members-tbody").innerHTML='<tr><td colspan="8" class="error">'+esc(msg)+'</td></tr>'}

  async function fetchLeagueRankHistory(){
    const stable=currentData?.league_id||currentData?.league_name||LEAGUE;
    const syntheticId=stableLeagueUserId(stable);
    const url=new URL(API+"/api/leagues/history");
    url.searchParams.set("league",TOP_LEAGUES_NAME);
    url.searchParams.set("user_id",String(syntheticId));
    url.searchParams.set("hours","all");
    url.searchParams.set("limit","50000");
    addRunParam(url);
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
        events.push({t:row.t,fetched_at:row.fetched_at,from:last.rank,to:row.rank,direction:row.rank<last.rank?"up":"down",points:Number.isFinite(row.points)?row.points:null});
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
    if(!events.length){box.innerHTML='<div class="rank-log-empty">No league rank up/down changes found yet. This depends on stored Top 100 League snapshots.</div>';return}
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
      addRunParam(currentUrl);
      const current=await getJson(currentUrl);
      rows=current.rows||[];
      currentData=current;
      topLeagueRow=await fetchTopLeagueContext().catch(err=>{console.warn("Projected rank unavailable",err);targetRankRow=null;return null});
      renderCards(current);
      leagueRankHistoryRows=await fetchLeagueRankHistory().catch(err=>{console.warn("League rank history unavailable",err);return []});
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
