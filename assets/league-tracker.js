(() => {
  const API = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const config = window.LEAGUE_CONFIG || {};
  const LEAGUE = String(config.league || "YAMO");
  let rows = [];
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
  function profileHref(r){return "league-profile.html?league="+encodeURIComponent(LEAGUE)+"&id="+encodeURIComponent(r.user_id||"")}
  function visible(){const list=rows.slice();list.sort((a,b)=>compare(a,b,sortKey,sortAsc));return list}

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
      return '<tr><td class="rank">#'+esc(r.rank)+'</td><td><div class="player-cell"><a class="player-link" href="'+profileHref(r)+'">'+avatar(r)+'<span><span>'+esc(name)+'</span><div class="meta">'+esc(r.user_id)+'</div></span></a></div></td><td class="numeric" title="'+esc(fullNum(r.total_points))+'">'+esc(shortNum(r.total_points))+'</td><td class="numeric">'+delta(r.gain_5m)+'</td><td class="numeric">'+delta(r.gain_1h)+'</td><td class="numeric">'+delta(r.gain_6h)+'</td><td class="numeric">'+delta(r.gain_12h)+'</td><td class="numeric">'+delta(r.gain_24h)+'</td></tr>'
    }).join("")
  }

  function showError(msg){document.getElementById("members-tbody").innerHTML='<tr><td colspan="8" class="error">'+esc(msg)+'</td></tr>'}

  async function loadData(){
    if(loading)return;loading=true;
    try{
      const u=new URL(API+"/api/leagues/current");
      u.searchParams.set("league",LEAGUE);
      u.searchParams.set("v",Date.now());
      const r=await fetch(u,{cache:"no-store"});
      const data=await r.json();
      if(!r.ok||data.ok===false)throw new Error(data.message||"HTTP "+r.status);
      rows=data.rows||[];
      renderCards(data);
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